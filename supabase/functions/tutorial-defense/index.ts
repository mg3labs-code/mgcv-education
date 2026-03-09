import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, episodeTitle, action, history } = await req.json();

    const systemPrompt = `You are an Oxford Tutorial tutor conducting a "Tutorial Defense" with a Grade 10 student studying mathematics.

TOPIC: ${topic}
EPISODE: ${episodeTitle}

YOUR ROLE:
- You are kind but rigorous. You challenge the student's understanding with Socratic questions.
- Keep language simple — suitable for Grades 6-10.
- Each response: 2-3 short sentences MAX. Ask ONE follow-up question.
- Start by asking the student to explain what they learned.
- Then challenge with "Why?", "How do you know?", "What if...?", "Can you prove it?"
- If the student gives a good answer, acknowledge it and go deeper.
- If the student struggles, give a small hint, don't give the answer.
- After 5-6 exchanges, wrap up with encouragement and a summary of what they defended well.
- Use emojis sparingly to keep it friendly.

RULES:
- Never lecture. Only ask questions and respond to answers.
- Never give away answers directly.
- Keep total defense to 6-8 exchanges.
- Be encouraging but don't accept vague answers — push for clarity.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []),
    ];

    if (action === "start") {
      messages.push({ role: "user", content: "I'm ready for my Tutorial Defense." });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: messages.map(m => ({
            role: m.role === "system" ? "user" : m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
          },
        }),
      }
    );

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Tell me what you learned about this topic.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ reply: "Let's begin. What did you learn about this topic? Explain in your own words." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
