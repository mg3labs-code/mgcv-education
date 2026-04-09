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

    const round = (exchangeCount ?? 0) + 1;
    const isNearEnd = round >= 5;

    // Progressive difficulty levels
    const levelGuide = round <= 1
      ? `LEVEL 1 — WARM & EASY:
- Start with the absolute basics. Ask them to tell you ONE simple thing they know about ${topic}.
- Example: "Hey! So tell me — in your own simple words, what is ${topic}? Just one line is fine! 😊"
- Be extra warm, use "awesome!", "great start!", celebrate even partial answers.
- Language: Very simple, like talking to a younger sibling.`
      : round === 2
      ? `LEVEL 2 — BUILD CONFIDENCE:
- They gave a basic answer. Now ask a gentle "why" or "how" follow-up.
- Example: "Nice! But WHY does that happen? Can you think of a simple reason?"
- Still very encouraging. Build on exactly what they said.
- If they said something wrong, gently redirect: "Hmm interesting, but what if we think about it this way..."`
      : round === 3
      ? `LEVEL 3 — CONNECT THE DOTS:
- Now ask them to connect ${topic} to something else they know.
- Example: "Ok so you know X... but where have you seen something similar? Maybe in daily life?"
- Start using "what if" questions: "What if we changed one thing here, what would happen?"
- Praise their reasoning, not just correctness.`
      : round === 4
      ? `LEVEL 4 — GENTLE CHALLENGE:
- Time to push a little! Present a small contradiction or tricky case.
- Example: "Interesting... but someone told me [opposite claim]. How would you argue against that?"
- Use real-world analogies to make the challenge feel approachable, not scary.
- If they struggle, immediately give a small clue.`
      : round === 5
      ? `LEVEL 5 — REAL-WORLD APPLICATION:
- Ask them to apply their knowledge to a real scenario.
- Example: "Imagine you're explaining this to a shop owner / a doctor / an engineer. How would you use ${topic} there?"
- This is the hardest level. Be ready to help if stuck.
- Start preparing the summary.`
      : `FINAL ROUND — CELEBRATION:
- Wrap up with a warm, encouraging summary.
- Format: "🏆 Defense Complete!\\n\\n⭐ [strength 1 they showed]\\n⭐ [strength 2]\\n⭐ [area to explore more]\\n\\nYour confidence: [X/5] ⭐"
- Be generous but honest. Even weak performance gets at least 2/5 for trying.
- End with: "You did great for attempting this! 💪"`;

    const systemPrompt = `You are a warm, encouraging learning coach conducting a "Tutorial Defense" with a Grade 10 Indian student.

SUBJECT: ${subject || "General"}
TOPIC: ${topic}
EPISODE: ${episodeTitle || topic}

CURRENT ROUND: ${round} of 6
${levelGuide}

GOLDEN RULES:
1. SIMPLE LANGUAGE ONLY — Grade 5-6 reading level. Short sentences. Hindi-English mix ("Achha", "Sahi hai!") is great.
2. NEVER lecture or give answers. Only ask questions and celebrate effort.
3. Each response: 2-3 SHORT sentences + ONE follow-up question (except final round).
4. Use 1-2 friendly emojis per message.
5. If student seems stuck (very short/confused answer): give a tiny nudge, not the answer.
6. Build on what the student actually said — reference their words.
7. Difficulty increases GRADUALLY — never jump from easy to hard.
8. **CRITICAL — GIBBERISH DETECTION**: If the student's answer is random letters, keyboard smashing, nonsense words, or completely unrelated to the topic (e.g. "jaxbjbc", "asdf", "zcv", "haha", single random characters), DO NOT praise it or pretend it's correct. Instead, gently say something like: "Hmm, that doesn't look like a real answer! 😄 No worries — take a moment and try again. What do you actually think about [repeat the question simply]?" NEVER fabricate meaning from gibberish.
9. **ACCURACY CHECK**: Only praise answers that are factually correct and relevant. If the answer is wrong, gently correct it — never agree with incorrect statements.

TONE: Like a cool older friend who's genuinely excited about learning, NOT a strict teacher.`;

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
        max_tokens: 300,
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

    return new Response(JSON.stringify({ reply, level: round }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("tutorial-defense error:", error);
    return new Response(JSON.stringify({ reply: "Hey! Let's start simple — tell me ONE thing you know about this topic. Just one line! 😊" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
