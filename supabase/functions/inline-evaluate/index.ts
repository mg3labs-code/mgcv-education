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
    const { topic, prompt, answer } = await req.json();

    if (!answer || answer.trim().length < 3) {
      return new Response(JSON.stringify({ feedback: "Write a bit more so I can give you proper feedback! ✍️" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a warm, encouraging academic coach for a Grade 10 student.
The student is working on: "${topic}"
The task was: "${prompt}"

EVALUATE their answer and give feedback in this format:
1. Start with genuine praise for what they got right (1 sentence)
2. If something is wrong or missing, gently correct it (1 sentence)  
3. One tip to think deeper (1 sentence)
4. End with an encouraging emoji

RULES:
- Max 4 sentences total
- Grade 5-6 language level
- Be specific about what was good/wrong
- Never be harsh or discouraging
- Use 1-2 emojis`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Student's answer: "${answer}"` },
        ],
        temperature: 0.6,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ feedback: "Too many requests — try again in a moment! ⏳" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Gateway error ${status}`);
    }

    const data = await response.json();
    const feedback = data.choices?.[0]?.message?.content || "Good effort! Keep thinking deeper. 💪";

    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("inline-evaluate error:", error);
    return new Response(JSON.stringify({ feedback: "Nice try! Keep exploring and thinking critically. 💡" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
