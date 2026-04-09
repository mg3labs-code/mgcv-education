import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "https://esm.sh/zod@3.23.8";

const BodySchema = z.object({
  topic: z.string().min(1).max(500),
  episodeTitle: z.string().max(500).optional(),
  subject: z.string().max(100).optional(),
  action: z.enum(["start", "respond", "hint"]).optional(),
  history: z.array(z.object({ role: z.string(), content: z.string().max(10000) })).max(50).optional(),
  exchangeCount: z.number().int().min(0).max(20).optional(),
});
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { topic, episodeTitle, subject, action, history, exchangeCount } = parsed.data;

    const roundInfo = exchangeCount !== undefined ? `This is round ${exchangeCount + 1} of 6.` : "";
    const isNearEnd = exchangeCount >= 4;

    const systemPrompt = `You are a warm, encouraging Oxford Tutorial tutor conducting a "Tutorial Defense" brainstorming session with a Grade 10 student.

SUBJECT: ${subject || "General"}
TOPIC: ${topic}
EPISODE: ${episodeTitle}
${roundInfo}

YOUR STYLE — BRAINSTORMING COACH:
- You're like a friendly senior who genuinely finds the topic fascinating
- Celebrate every good insight: "Ooh, that's a sharp observation!" or "Yes! You're onto something big here"
- Build on what the student says: "You said X — what if we take that further?"
- Use small confidence-building cross-questions: "Achha, but what happens if we flip that?"
- Keep language VERY simple — Grade 6-8 level, conversational Hindi-English mix is OK
- Each response: 2-3 short sentences MAX. Ask ONE follow-up question.
- Never lecture. Never give answers. Only question and celebrate.

FLOW:
- Round 1-2: Warm up. Ask them to explain basics. Celebrate any correct idea.
- Round 3-4: Go deeper. "Why?" "How do you know?" "What if the opposite were true?"
- Round 5-6: Challenge with real-world twist. "Where would this break down?"
${isNearEnd ? `- THIS IS NEAR THE END. Start wrapping up. Summarize what the student defended well in 2-3 bullet points. Give them a confidence rating out of 5 stars. Be generous but honest.` : ""}

HINT MODE: If the student says "hint" or seems stuck (very short/confused answer), give a TINY nudge — just enough to unstick them, never the full answer. Like "Think about what happens when you multiply both sides..."

RULES:
- Never give away answers directly
- Maximum enthusiasm for effort, not just correctness
- Use 1-2 emojis per message to keep it friendly
- If wrapping up, format summary as: "🏆 Defense Summary:\\n⭐ [strength 1]\\n⭐ [strength 2]\\n\\nConfidence: [X/5] stars"`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []),
    ];

    if (action === "start") {
      messages.push({ role: "user", content: "I'm ready for my Tutorial Defense." });
    }

    if (action === "hint") {
      messages.push({ role: "user", content: "I'm stuck, can you give me a small hint?" });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        temperature: 0.75,
        max_tokens: 250,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const errText = await response.text();
      console.error("AI gateway error:", status, errText);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Gateway error ${status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Tell me what you learned about this topic! 🎯";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("tutorial-defense error:", error);
    return new Response(JSON.stringify({ reply: "Let's begin! What did you learn about this topic? Explain in your own words 🎯" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
