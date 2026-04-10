import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { class_name, subject, teacher_id, topic_key, topic_title, chapter_name } = await req.json();

    if (!class_name || !topic_title || !teacher_id) {
      return new Response(JSON.stringify({ error: "Missing required fields: class_name, topic_title, teacher_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date().toISOString().split("T")[0];

    // Check if homework already exists for this topic + date + class
    const { data: existing } = await supabaseAdmin
      .from("assignments")
      .select("id")
      .eq("class_name", class_name)
      .eq("schedule_date", today)
      .eq("source", "auto_homework")
      .eq("schedule_topic_key", topic_key || topic_title)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ skipped: true, message: "Homework already exists for this topic today" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const subjectName = subject || "Mathematics";

    // Generate questions via AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
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
            content: `You are a smart homework generator for Class 10 ${subjectName} students studying under Indian curriculum (CBSE/ICSE/Telangana board).

RULES:
- Generate exactly 2 questions based on the topic taught today
- Question 1: Quick recall or conceptual check (1-2 marks level). Should feel satisfying to answer correctly.
- Question 2: Smart application question — tactical, logical, makes the student think "oh that's clever!" Not JEE-level reasoning. Simple but insightful.
- Questions should be at textbook level, NOT competitive exam level
- Use simple English (Grade 4-5 reading level)
- If the student has low completion (basic level), focus on fundamental understanding
- If moderate completion, add a real-world connection
- If high completion, add a logical twist or "what-if" scenario
- Make questions feel rewarding — not intimidating

Student progress hint: ${difficultyHint}
Average class completion on this chapter: ${avgCompletion}%

Return as JSON with this exact structure — no markdown, just raw JSON:
{
  "questions": [
    { "question_text": "...", "max_score": 5, "type": "recall", "hint": "..." },
    { "question_text": "...", "max_score": 5, "type": "application", "hint": "..." }
  ],
  "title_emoji": "📐"
}`
          },
          {
            role: "user",
            content: `Topic taught today: "${topic_title}" from chapter "${chapter_name || subjectName}".
Generate 2 smart, simple homework questions for this topic.`
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
                        type: { type: "string", enum: ["recall", "application"] },
                        hint: { type: "string" },
                      },
                      required: ["question_text", "max_score", "type"],
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
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
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

    // Create the assignment
    const assignmentTitle = `${emoji} ${topic_title} — Daily Practice`;
    const { data: assignment, error: aErr } = await supabaseAdmin
      .from("assignments")
      .insert({
        teacher_id,
        title: assignmentTitle,
        description: `Auto-generated homework for "${topic_title}". Smart practice to reinforce today's learning.`,
        instructions: "Answer each question in your own words. Show your thinking!",
        class_name,
        subject: subjectName,
        source: "auto_homework",
        schedule_topic_key: topic_key || topic_title,
        schedule_date: today,
        max_total_score: questions.reduce((s: number, q: any) => s + (q.max_score || 5), 0),
        due_date: dueDate.toISOString(),
        is_published: true,
      })
      .select()
      .single();

    if (aErr) throw aErr;

    // Insert questions
    const questionRows = questions.map((q: any, i: number) => ({
      assignment_id: assignment.id,
      question_number: i + 1,
      question_text: q.question_text,
      max_score: q.max_score || 5,
      rubric: [],
      expected_answer_hints: q.hint || null,
    }));

    const { error: qErr } = await supabaseAdmin
      .from("assignment_questions")
      .insert(questionRows);

    if (qErr) throw qErr;

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
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
