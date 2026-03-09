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
    const { topic, episodeTitle, step, studentAnswer, previousAnswers } = await req.json();

    const stepInstructions: Record<string, string> = {
      strip: `The student is trying to break down "${topic}" into its most basic fundamental parts. Evaluate their answer: Did they identify the core building blocks? Are there fundamentals they missed? Give brief, encouraging feedback (2-3 sentences) and suggest one thing they might have missed.`,
      question: `The student is questioning the fundamentals of "${topic}". They previously identified these fundamentals: ${previousAnswers?.[0] || "not provided"}. Now they're questioning WHY each part is true. Evaluate: Are they asking deep enough questions? Give brief feedback and suggest a deeper question they could ask.`,
      rebuild: `The student is rebuilding their understanding of "${topic}" from scratch. Their fundamentals: ${previousAnswers?.[0] || "not provided"}. Their questions: ${previousAnswers?.[1] || "not provided"}. Now they're rebuilding. Evaluate: Is their rebuilt explanation clearer and deeper than a textbook definition? Give encouraging feedback on their thinking process.`,
    };

    const prompt = `You are a Feynman Method coach for a Grade 10 math student.
    
TOPIC: ${topic}
EPISODE: ${episodeTitle}
CURRENT STEP: ${step}

${stepInstructions[step] || "Give brief, encouraging feedback."}

STUDENT'S ANSWER: "${studentAnswer}"

RULES:
- Keep feedback to 2-3 sentences. Simple language for Grades 6-10.
- Be encouraging but honest. Point out what's good AND what could be better.
- Use one emoji max.
- Don't lecture — just guide.`;

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 150,
          },
        }),
      }
    );

    const data = await response.json();
    const feedback = data.candidates?.[0]?.content?.parts?.[0]?.text || "Good thinking! Keep going deeper.";

    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ feedback: "Good effort! Try to dig even deeper into the fundamentals." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
