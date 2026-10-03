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
  // On failure the reservation is marked "failed" — but only if this attempt
  // still owns it, so a stale attempt can never touch a newer attempt's work.
  let claimedId: string | null = null;
  let attempt: string | null = null;
  let releaseClient: any = null;
  const release = async () => {
    if (claimedId && attempt && releaseClient) {
      await releaseClient.from("assignments")
        .update({ generation_status: "failed", generation_expires_at: null })
        .eq("id", claimedId).eq("generation_attempt", attempt).eq("generation_status", "generating");
      claimedId = null;
    }
  };

  try {
    const { class_name, subject, board, section, schedule_date, teacher_id, topic_key, topic_title, chapter_name, qa_fault, qa_delay_ms, qa_reservation_seconds } = await req.json();

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
    const json = (status: number, body: unknown) => new Response(JSON.stringify(body), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    // QA-only controls: allowlisted QA teachers + app_config flag. Never active otherwise.
    const QA_TEACHERS = ["584d68ef-c42f-4b53-9ffa-bdce38622355", "74accab5-d420-46a6-97ac-de6a5fdae9d8"];
    let qaOn = false;
    if (QA_TEACHERS.includes(caller.id) && (qa_fault || qa_delay_ms || qa_reservation_seconds)) {
      const { data: flag } = await supabaseAdmin.from("app_config").select("value").eq("key", "qa_fault_injection_enabled").maybeSingle();
      qaOn = flag?.value === "true";
    }
    const qaFault: string | null = qaOn && typeof qa_fault === "string" ? qa_fault : null;
    const qaDelay = qaOn ? Math.min(Number(qa_delay_ms) || 0, 120_000) : 0;

    const AI_TIMEOUT_MS = 45_000;
    // Reservation lifetime must outlast the AI timeout so a live attempt is never stolen.
    const RESERVATION_S = qaOn && Number(qa_reservation_seconds) > 0 ? Number(qa_reservation_seconds) : 90;

    // One row per (teacher, board, class, section, subject, topic, date) — enforced by a unique index.
    const findExisting = async () => {
      let q = supabaseAdmin.from("assignments")
        .select("id, title, is_published, generation_status, generation_attempt, generation_expires_at")
        .eq("teacher_id", caller.id).eq("class_name", class_name).eq("subject", subjectName)
        .eq("schedule_date", today).eq("source", "auto_homework").eq("schedule_topic_key", topicKey);
      q = board ? q.eq("board", board) : q.is("board", null);
      q = section ? q.eq("section", section) : q.is("section", null);
      const { data } = await q.limit(1);
      return data?.[0] ?? null;
    };
    const reuse = (row: any) => json(200, { skipped: true, reused: true, assignment_id: row.id, title: row.title, is_published: row.is_published, message: "Homework already exists for this topic today" });
    const inProgress = (row: any) => json(409, { error: "Homework is still being generated — try again shortly", retryable: true, assignment_id: row.id, generation_status: "generating" });

    const myAttempt = crypto.randomUUID();
    const expiresAt = () => new Date(Date.now() + RESERVATION_S * 1000).toISOString();
    let existing = await findExisting();
    if (!existing) {
      const { data: ins, error: insErr } = await supabaseAdmin.from("assignments").insert({
        teacher_id: caller.id, title: `${topic_title} — Daily Practice (drafting…)`, class_name,
        subject: subjectName, board: board || null, section: section || null, source: "auto_homework",
        schedule_topic_key: topicKey, schedule_date: today, is_published: false,
        generation_status: "generating", generation_attempt: myAttempt, generation_expires_at: expiresAt(),
      }).select("id").single();
      if (!insErr) { claimedId = ins.id; }
      else if ((insErr as any).code === "23505") existing = await findExisting();
      else throw insErr;
    }
    if (!claimedId) {
      if (!existing) throw new Error("Could not reserve homework slot");
      if (existing.generation_status === "complete") return reuse(existing);
      const expired = existing.generation_status === "failed" ||
        !existing.generation_expires_at || new Date(existing.generation_expires_at).getTime() < Date.now();
      if (!expired) return inProgress(existing);
      // Atomic takeover: only succeeds if nobody else took it since we read it.
      let take = supabaseAdmin.from("assignments")
        .update({ generation_status: "generating", generation_attempt: myAttempt, generation_expires_at: expiresAt(), is_published: false })
        .eq("id", existing.id).neq("generation_status", "complete");
      take = existing.generation_attempt ? take.eq("generation_attempt", existing.generation_attempt) : take.is("generation_attempt", null);
      const { data: took } = await take.select("id");
      if (!took || took.length === 0) {
        const now = await findExisting();
        return now?.generation_status === "complete" ? reuse(now) : inProgress(now ?? existing);
      }
      claimedId = existing.id;
    }
    attempt = myAttempt;
    releaseClient = supabaseAdmin;

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      await release();
      return json(500, { error: "AI not configured" });
    }

    const fakeTool = (args: unknown) => new Response(JSON.stringify({ choices: [{ message: { tool_calls: [{ function: { arguments: typeof args === "string" ? args : JSON.stringify(args) } }] } }] }), { status: 200 });
    const L = ["Definition", "Mechanism", "Reasoning", "Application", "Assumption Check"];
    const qs = (n: number, f: (i: number) => any = () => ({})) => Array.from({ length: n }, (_, i) => ({ question_text: `QA Q${i + 1} (${L[i % 5]})`, max_score: 2, layer: L[i % 5], type: "recall", hint: "QA hint", ...f(i) }));
    const sleep = (ms: number, signal: AbortSignal) => new Promise<void>((res, rej) => {
      const t = setTimeout(res, ms);
      signal.addEventListener("abort", () => { clearTimeout(t); rej(new DOMException("timeout", "TimeoutError")); });
    });

    const signal = AbortSignal.timeout(AI_TIMEOUT_MS);
    let aiResponse: Response;
    try {
      if (qaDelay) await sleep(qaDelay, signal);
      aiResponse = qaFault === "timeout" ? (await sleep(AI_TIMEOUT_MS + 60_000, signal), new Response("{}"))
        : qaFault === "rate_limit" ? new Response("rate limited", { status: 429 })
        : qaFault === "credits" ? new Response("no credits", { status: 402 })
        : qaFault === "malformed_json" ? fakeTool("{not json")
        : qaFault === "wrong_count" ? fakeTool({ questions: qs(3) })
        : qaFault === "missing_layers" ? fakeTool({ questions: qs(5, () => ({ layer: undefined })) })
        : qaFault === "invalid_marks" ? fakeTool({ questions: qs(5, (i) => ({ max_score: i === 0 ? -2 : i === 1 ? 0 : 2.5 })) })
        : qaFault === "valid" ? fakeTool({ questions: qs(5), title_emoji: "🧪" })
        : await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal,
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
    } catch (err) {
      if ((err as any)?.name === "TimeoutError" || (err as any)?.name === "AbortError") {
        await release();
        return json(504, { error: "The AI took too long to write this homework. Please try again.", retryable: true });
      }
      throw err;
    }

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      await release();
      if (aiResponse.status === 429) return json(429, { error: "Rate limited, please try again later", retryable: true });
      if (aiResponse.status === 402) return json(402, { error: "AI credits exhausted", retryable: false });
      return json(502, { error: `AI service error (${aiResponse.status}). Please try again.`, retryable: aiResponse.status >= 500 });
    }

    // Validate before anything is saved. No defaults are filled in for generated questions.
    const invalid = async (reason: string) => {
      console.error("Invalid AI homework:", reason);
      await release();
      return json(502, { error: `The AI returned unusable homework (${reason}). Please try again.`, retryable: true });
    };
    let parsed: any;
    try {
      const aiResult = await aiResponse.json();
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) return await invalid("no structured answer");
      parsed = JSON.parse(toolCall.function.arguments);
    } catch { return await invalid("malformed output"); }
    const questions = Array.isArray(parsed?.questions) ? parsed.questions : null;
    if (!questions || questions.length !== 5) return await invalid(`expected 5 questions, got ${questions?.length ?? 0}`);
    for (let i = 0; i < 5; i++) {
      const q = questions[i];
      if (!q || typeof q.question_text !== "string" || !q.question_text.trim()) return await invalid(`Q${i + 1} has no wording`);
      if (q.layer !== L[i]) return await invalid(`Q${i + 1} layer should be ${L[i]}`);
      if (!Number.isInteger(q.max_score) || q.max_score < 1 || q.max_score > 5) return await invalid(`Q${i + 1} marks must be a whole number 1-5`);
    }
    const emoji = typeof parsed.title_emoji === "string" && parsed.title_emoji ? parsed.title_emoji : "📝";

    // Due date: next school day after the homework's own date, per the school calendar.
    const { data: due, error: dueErr } = await supabaseAdmin.rpc("next_school_day", {
      _teacher: caller.id, _class: class_name, _board: board || null, _section: section || null, _from: today,
    });
    if (dueErr || !due) throw dueErr ?? new Error("Could not work out due date");
    const dueIso = `${due}T23:59:00+05:30`;

    const assignmentTitle = `${emoji} ${topic_title} — Daily Practice`;
    const { data: committed, error: cErr } = await supabaseAdmin.rpc("complete_homework_generation", {
      _id: claimedId, _attempt: attempt, _title: assignmentTitle,
      _description: `Auto-generated homework for "${topic_title}". Smart practice to reinforce today's learning.`,
      _due: dueIso,
      _questions: questions.map((q: any, i: number) => ({ n: i + 1, text: q.question_text.trim(), marks: q.max_score, layer: q.layer, hint: typeof q.hint === "string" ? q.hint : "" })),
    });
    if (cErr) throw cErr;
    const id = claimedId;
    claimedId = null;
    if (!committed) {
      // A newer attempt took over this slot; leave its work untouched.
      return json(409, { error: "A newer attempt replaced this one", stale: true, assignment_id: id });
    }

    console.log(`✅ Generated homework: "${assignmentTitle}" for ${class_name}`);
    return json(200, { success: true, assignment_id: id, title: assignmentTitle, question_count: 5, due_date: due });

  } catch (e) {
    console.error("generate-daily-homework error:", e);
    await release();
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
