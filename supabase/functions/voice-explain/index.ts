import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";

const BodySchema = z.object({
  transcript: z.string().min(1).max(10000),
  topic: z.string().min(1).max(500),
  prompt: z.string().max(2000).optional(),
  guidePoints: z.array(z.string().max(500)).max(20).optional(),
});
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { transcript, topic, prompt, guidePoints } = parsed.data;

    const systemPrompt = `You are a warm, encouraging math tutor for 10th grade students studying Real Numbers (Telangana State Board). 
Your job is to analyze what a student said about a concept and give them constructive, positive feedback.

Rules:
- Always start with something positive about their explanation
- Identify key concepts they got right
- Gently point out any gaps or misconceptions without being discouraging
- Give a score from 1-10 on their understanding
- Suggest one specific thing they could add to make their explanation even better
- Keep your tone friendly, like a supportive older sibling
- Use simple language, avoid jargon
- If they explained well, celebrate it enthusiastically!
- Response should be concise (max 150 words)`;

    const userPrompt = `Topic: ${topic}
${prompt ? `The student was asked: ${prompt}` : ""}
${guidePoints?.length ? `Guide points they should cover: ${guidePoints.join(", ")}` : ""}

Student's spoken explanation (transcribed from voice):
"${transcript}"

Give positive, constructive feedback on their understanding.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_feedback",
              description: "Provide structured feedback on the student's explanation",
              parameters: {
                type: "object",
                properties: {
                  score: { type: "number", description: "Understanding score 1-10" },
                  positives: {
                    type: "array",
                    items: { type: "string" },
                    description: "Things the student explained well (2-3 points)",
                  },
                  feedback: { type: "string", description: "Encouraging overall feedback message (2-3 sentences)" },
                  suggestion: { type: "string", description: "One specific improvement suggestion" },
                  emoji: { type: "string", description: "A single emoji that captures the mood (e.g. 🌟, 💪, 🎯)" },
                },
                required: ["score", "positives", "feedback", "suggestion", "emoji"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_feedback" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    
    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let feedback;
    
    if (toolCall?.function?.arguments) {
      feedback = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback to content
      feedback = {
        score: 7,
        positives: ["You attempted to explain the concept"],
        feedback: data.choices?.[0]?.message?.content || "Good effort! Keep practicing.",
        suggestion: "Try to include more specific examples.",
        emoji: "👍",
      };
    }

    return new Response(JSON.stringify(feedback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("voice-explain error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
