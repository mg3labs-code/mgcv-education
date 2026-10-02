import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Assignment row claimed by this request; removed again if generation fails,
  // so a failed attempt never leaves an empty draft blocking a retry.
  let claimedId: string | null = null;
  let releaseClient: any = null;
  const release = async () => {
    if (claimedId && releaseClient) {
      await releaseClient.from("assignments").delete().eq("id", claimedId);
      claimedId = null;
    }
  };

  try {
    const { class_name, subject, board, section, schedule_date, teacher_id, topic_key, topic_title, chapter_name } = await req.json();

    if (!class_name || !topic_title || !teacher_id) {
      return new Response(JSON.stringify({ error: "Missing required fields: class_name, topic_title, teacher_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Only a signed-in teacher who covers this class + subject may draft homework.
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user: caller } } = token
      ? await supabaseAdmin.auth.getUser(token)
      : { data: { user: null } };
    if (!caller || caller.id !== teacher_id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const gradeNum = parseInt(String(class_name).replace(/\D/g, ""), 10);
    let coverQuery = supabaseAdmin
      .from("teacher_teaching_map").select("id")
      .eq("teacher_id", caller.id).eq("grade", gradeNum)
      .ilike("subject", subject || "Mathematics");
    if (board) coverQuery = coverQuery.eq("board", board);
    if (section) coverQuery = coverQuery.eq("section", section);
    const { data: covers } = await coverQuery.limit(1);
    if (!covers || covers.length === 0) {
      return new Response(JSON.stringify({ error: "You don't teach this class and subject" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prefer the teacher's local date (sent by the app) over server UTC.
    const today = typeof schedule_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(schedule_date)
      ? schedule_date
      : new Date().toISOString().split("T")[0];

    const subjectName = subject || "Mathematics";
    const topicKey = topic_key || topic_title;

    // Claim the homework slot FIRST. A unique index on
    // (teacher, board, class, section, subject, topic key, date) for auto_homework
    // guarantees only one request wins; the rest reuse the winner's assignment.
    const findExisting = async () => {
      let q = supabaseAdmin.from("assignments").select("id, title, is_published")
        .eq("teacher_id", caller.id).eq("class_name", class_name).eq("subject", subjectName)
        .eq("schedule_date", today).eq("source", "auto_homework").eq("schedule_topic_key", topicKey);
      q = board ? q.eq("board", board) : q.is("board", null);
      q = section ? q.eq("section", section) : q.is("section", null);
      const { data } = await q.limit(1);
      return data?.[0] ?? null;
    };
    const reuse = (row: { id: string; title: string; is_published: boolean }) =>
      new Response(JSON.stringify({ skipped: true, reused: true, assignment_id: row.id, title: row.title, is_published: row.is_published, message: "Homework already exists for this topic today" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const existingRow = await findExisting();
    if (existingRow) return reuse(existingRow);

    const { data: claimed, error: claimErr } = await supabaseAdmin
      .from("assignments")
      .insert({
        teacher_id: caller.id,
        title: `${topic_title} — Daily Practice (drafting…)`,
        class_name,
        subject: subjectName,
        board: board || null,
        section: section || null,
        source: "auto_homework",
        schedule_topic_key: topicKey,
        schedule_date: today,
        is_published: false,
      })
      .select("id")
      .single();
    if (claimErr) {
      if ((claimErr as any).code === "23505") {
        const winner = await findExisting();
        if (winner) return reuse(winner);
      }
      throw claimErr;
    }
    claimedId = claimed.id;

    // Get student progress context for this class (aggregate)
    const { data: progressData } = await supabaseAdmin
      .from("episode_progress")
      .select("completion_pct, layer_scores")
      .like("chapter_id", `%${(chapter_name || "").toLowerCase().replace(/\s+/g, "-")}%`)
      .limit(20);

    const avgCompletion = progressData && progressData.length > 0
      ? Math.round(progressData.reduce((s, p) => s + (p.completion_pct || 0), 0) / progressData.length)
      : 0;

    // Determine difficulty from progress
    let difficultyHint = "basic recall and simple application";
    if (avgCompletion > 70) {
      difficultyHint = "moderate application with one logical twist";
    } else if (avgCompletion > 40) {
      difficultyHint = "simple application connecting the concept to a real scenario";
    }

    // Generate questions via AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      await release();
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a smart homework generator for ${class_name} ${subjectName} students studying under Indian curriculum (CBSE/ICSE/Telangana board).

RULES:
- Generate exactly 5 questions based on the topic taught today. All 5 are mandatory — no optional or bonus extras.
- Follow this fixed progression, one question each, in this order:
  Q1 Definition — state or recognise the idea and distinguish it from a nearby misconception. Short, a confident start.
  Q2 Mechanism — show how it works: the sequence, the steps, or the cause.
  Q3 Reasoning — explain why, or predict an outcome, supported by evidence given in the question.
  Q4 Application — use the concept in a new everyday situation: a small case or a little data to interpret.
  Q5 Assumption Check — give a plausible-sounding but mistaken claim about the topic, ask the student to judge it and say exactly what is wrong with it. Easy-looking but tricky: it tests instinct, not recall.
- Questions must stay at ${class_name} textbook level, NOT competitive exam level
- Use simple English (Grade 4-5 reading level)
- Whole set should take about 15-20 minutes and total roughly 12-15 marks
- Marks: Q1 smallest (1-2), Q2 and Q3 moderate (2-3 each), Q4 and Q5 a little more (3-4 each)
- Make questions feel rewarding — not intimidating

Student progress hint: ${difficultyHint}
Average class completion on this chapter: ${avgCompletion}%

Return as JSON with this exact structure — no markdown, just raw JSON:
{
  "questions": [
    { "question_text": "...", "max_score": 2, "layer": "Definition", "type": "recall", "hint": "..." },
    { "question_text": "...", "max_score": 2, "layer": "Mechanism", "type": "recall", "hint": "..." },
    { "question_text": "...", "max_score": 3, "layer": "Reasoning", "type": "application", "hint": "..." },
    { "question_text": "...", "max_score": 3, "layer": "Application", "type": "application", "hint": "..." },
    { "question_text": "...", "max_score": 3, "layer": "Assumption Check", "type": "application", "hint": "..." }
  ],
  "title_emoji": "📐"
}`
          },
          {
            role: "user",
            content: `Topic taught today: "${topic_title}" from chapter "${chapter_name || subjectName}".
Generate exactly 5 smart, simple homework questions for this topic, one per layer in the fixed order: Definition, Mechanism, Reasoning, Application, Assumption Check.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_homework",
              description: "Generate homework questions for students",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question_text: { type: "string" },
                        max_score: { type: "number" },
                        layer: {
                          type: "string",
                          enum: ["Definition", "Mechanism", "Reasoning", "Application", "Assumption Check"],
                        },
                        type: { type: "string", enum: ["recall", "application"] },
                        hint: { type: "string" },
                      },
                      required: ["question_text", "max_score", "layer", "type"],
                      additionalProperties: false,
                    },
                  },
                  title_emoji: { type: "string" },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_homework" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        await release();
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        await release();
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const parsed = JSON.parse(toolCall.function.arguments);
    const questions = parsed.questions || [];
    const emoji = parsed.title_emoji || "📝";

    if (questions.length === 0) throw new Error("AI generated no questions");

    // Calculate next school day for due date (skip weekends)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);
    while (dueDate.getDay() === 0 || dueDate.getDay() === 6) {
      dueDate.setDate(dueDate.getDate() + 1);
    }

    // Fill in the claimed assignment (only the winning request reaches here).
    const assignmentTitle = `${emoji} ${topic_title} — Daily Practice`;
    const { data: assignment, error: aErr } = await supabaseAdmin
      .from("assignments")
      .update({
        title: assignmentTitle,
        description: `Auto-generated homework for "${topic_title}". Smart practice to reinforce today's learning.`,
        instructions: "Answer each question in your own words. Show your thinking!",
        max_total_score: questions.reduce((s: number, q: any) => s + (q.max_score || 3), 0),
        due_date: dueDate.toISOString(),
        // Drafted for teacher review — never visible to students until she approves it.
        is_published: false,
      })
      .eq("id", claimedId)
      .select()
      .single();

    if (aErr) throw aErr;

    // Insert questions
    const questionRows = questions.map((q: any, i: number) => ({
      assignment_id: assignment.id,
      question_number: i + 1,
      question_text: q.question_text,
      max_score: q.max_score || 3,
      rubric: { layer: q.layer || null },
      expected_answer_hints: q.hint || null,
    }));

    const { error: qErr } = await supabaseAdmin
      .from("assignment_questions")
      .insert(questionRows);

    if (qErr) throw qErr;
    claimedId = null; // success — keep the row

    console.log(`✅ Generated homework: "${assignmentTitle}" for ${class_name} (${questions.length} questions)`);

    return new Response(JSON.stringify({
      success: true,
      assignment_id: assignment.id,
      title: assignmentTitle,
      question_count: questions.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("generate-daily-homework error:", e);
    await release();
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
