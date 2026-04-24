import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  mode: z.enum(["narrate", "feedback"]),
  subject: z.string().max(50),
  questionText: z.string().max(2000),
  expectedHint: z.string().max(2000).optional(),
  studentAnswer: z.string().max(4000).optional(),
  language: z.enum(["english", "telugu", "bilingual"]).optional().default("bilingual"),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const { mode, subject, questionText, expectedHint, studentAnswer, language } = parsed.data;

    const langInstruction =
      language === "telugu"
        ? "Reply ONLY in simple Telugu. Use very simple, warm words a Class 10 student would use."
        : language === "english"
        ? "Reply ONLY in simple, warm English a Class 10 student would understand."
        : "Reply in a warm bilingual mix: 70% simple English with 1-2 short Telugu phrases sprinkled in (like 'chala bagundi', 'sare', 'ardham aindha?'). Keep Telugu in Roman script (transliteration) so TTS can pronounce it.";

    const systemPrompt =
      mode === "narrate"
        ? `You are Buddy, a warm, kind AI study companion for a Class 10 ${subject} student in Telangana, India.
Your job: read the question on screen aloud in a friendly, encouraging way — like an older sibling helping with homework.
${langInstruction}
RULES:
- Maximum 2 short sentences (under 35 words total).
- Start with a warm hook ("Okay let's see…", "Chinna question…", "Try this one…").
- Read the question naturally — don't say "the question is" robotically.
- End by inviting the student to answer ("What do you think?", "Cheppu…", "Tell me your guess").
- NO markdown, NO emojis, NO lists.`
        : `You are Buddy, a warm, kind AI study companion for a Class 10 ${subject} student in Telangana, India.
A student just answered a question. Give warm, brief, supportive feedback.
${langInstruction}
RULES:
- Maximum 3 short sentences (under 50 words total).
- ALWAYS start with something positive about their effort or thinking.
- If correct: celebrate warmly + add 1 tiny insight.
- If partly right: acknowledge the good part + gently nudge what's missing.
- If wrong: never shame. Say "Close…" or "Almost…", then explain the right idea simply.
- End with encouragement ("You're getting it!", "Bagundi!", "Keep going…").
- NO markdown, NO emojis, NO lists, NO scores.`;

    const userContent =
      mode === "narrate"
        ? `Question on screen: "${questionText}"`
        : `Question: "${questionText}"
${expectedHint ? `Expected key idea: "${expectedHint}"` : ""}
Student's answer: "${studentAnswer || "(no answer)"}"

Give warm voice feedback now.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      throw new Error("AI generation failed");
    }

    const data = await aiResp.json();
    const text =
      data.choices?.[0]?.message?.content?.trim() ||
      (mode === "narrate" ? "Okay, take a look at this one and tell me what you think." : "Nice try! Keep going.");

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("demo-buddy-feedback error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
