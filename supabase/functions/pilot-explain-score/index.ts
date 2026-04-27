import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  episodeTitle: z.string().min(1).max(300),
  day: z.number().int().min(1).max(3),
  prompt: z.string().min(1).max(1200),
  answer: z.string().min(5).max(3000),
});

const fallback = {
  score: 68,
  band: "Needs one clearer reason",
  feedback: "Good effort. Add one clear real-life example and say why it proves your idea.",
  next_step: "Use: idea → example → why it matters.",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function unauthorized(message = "Please sign in to score your answer.") {
  return json({ error: message }, 401);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return unauthorized();

    const token = authHeader.slice("Bearer ".length).trim();
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) return unauthorized();

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }, 400);
    }

    const { episodeTitle, day, prompt, answer } = parsed.data;
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI scoring is not available right now." }, 500);

    const systemPrompt = `You are a warm pilot-learning evaluator for Indian school students.
Score an explain-back answer for quality of understanding, not grammar.

Return ONLY by calling the score_explain_back tool.

Scoring guide out of 100:
- 85-100: clear idea, correct reasoning, relevant example
- 70-84: mostly correct, one missing link or unclear example
- 50-69: partial understanding, needs correction
- 0-49: unrelated, copied, gibberish, or major misconception

Rules:
- Be constructive, never harsh.
- Grade 5-6 English.
- Feedback max 18 words.
- Next step max 14 words.
- If gibberish/unrelated, score below 40 and ask them to write a real answer.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Episode: ${episodeTitle}\nDay: ${day}\nTask: ${prompt}\nStudent answer: ${answer}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "score_explain_back",
              description: "Score the student's explain-back answer and give brief feedback.",
              parameters: {
                type: "object",
                properties: {
                  score: { type: "number", minimum: 0, maximum: 100 },
                  band: { type: "string", maxLength: 40 },
                  feedback: { type: "string", maxLength: 140 },
                  next_step: { type: "string", maxLength: 120 },
                },
                required: ["score", "band", "feedback", "next_step"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "score_explain_back" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return json({ error: "AI scoring is busy. Try again in a moment." }, 429);
      if (response.status === 402) return json({ error: "AI scoring needs workspace credits." }, 402);
      console.error("pilot-explain-score gateway error", response.status, await response.text());
      return json(fallback);
    }

    const data = await response.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const result = args ? JSON.parse(args) : fallback;
    const score = Math.max(0, Math.min(100, Math.round(Number(result.score) || fallback.score)));

    return json({
      score,
      band: String(result.band || fallback.band).slice(0, 40),
      feedback: String(result.feedback || fallback.feedback).slice(0, 140),
      next_step: String(result.next_step || fallback.next_step).slice(0, 120),
    });
  } catch (error) {
    console.error("pilot-explain-score error", error);
    return json(fallback);
  }
});
