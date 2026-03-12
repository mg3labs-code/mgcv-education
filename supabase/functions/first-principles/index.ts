import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, episodeTitle, subject, step, studentAnswer, previousAnswers } = await req.json();

    const encouragements: Record<string, string> = {
      strip: "You're thinking like a scientist now! 🔬",
      question: "Great questioning — that's how breakthroughs happen! 💡",
      rebuild: "You're building understanding from scratch — that's real mastery! 🏗️",
    };

    const stepInstructions: Record<string, string> = {
      strip: `The student is breaking down "${topic}" into basic building blocks. 
Evaluate: Did they find the REAL fundamentals? Not definitions — the actual core truths.
Give 2 sentences of warm feedback. Then ask ONE tiny cross-question like "Achha, but is [X] really fundamental, or is it built from something even simpler?" 
Keep it Grade 5 simple. Celebrate effort.`,
      question: `The student is questioning the fundamentals of "${topic}". 
Their fundamentals were: ${previousAnswers?.[0] || "not yet provided"}. 
Now they're asking WHY each part is true.
Evaluate: Are they questioning deep enough? 
Give 2 sentences. Then nudge: "What if someone said [opposite] — how would you prove them wrong?"
Be encouraging. Simple language.`,
      rebuild: `The student is rebuilding their understanding of "${topic}" from scratch.
Fundamentals: ${previousAnswers?.[0] || "not provided"}
Questions: ${previousAnswers?.[1] || "not provided"}
Now rebuilding.
Evaluate: Is their rebuilt explanation clearer than a textbook? Does it show UNDERSTANDING not memorization?
Give 2-3 sentences of genuine celebration. Rate their rebuilt understanding: ⭐ to ⭐⭐⭐⭐⭐.
Format: "Your rebuilt understanding: [rating]\\n[brief praise of what was strongest]"`,
    };

    const prompt = `You are a Feynman Method coach for a Grade 10 ${subject || "science"} student. You make complex things feel SIMPLE and EXCITING.

TOPIC: ${topic}
EPISODE: ${episodeTitle}
STEP: ${step} — ${encouragements[step] || "Keep going!"}

${stepInstructions[step] || "Give brief, warm feedback."}

STUDENT'S ANSWER: "${studentAnswer}"

RULES:
- Max 3 sentences. Grade 4-5 language. 
- Be genuinely enthusiastic — like a cool older sibling who loves this stuff
- One cross-question to make them think just a TINY bit deeper
- Use 1 emoji max
- Never lecture. Never give the answer. Just nudge and celebrate.`;

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
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 180,
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
    const feedback = data.choices?.[0]?.message?.content || "Good thinking! Keep going deeper. 💪";

    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("first-principles error:", error);
    return new Response(JSON.stringify({ feedback: "Good effort! Try to dig even deeper into the fundamentals. 💪" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
