// "Never say no" bridge function.
// Takes a student's raw answer and returns ONE warm sentence that
// reasons forward from their words. Never uses no / wrong / try again.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface BridgeBody {
  conceptKey?: string;
  step?: string;
  studentText?: string;
  interestTag?: string;
}

const SYSTEM_PROMPT = `You are a warm Class 10 teacher who never says "no", "wrong", "try again", or "incorrect".
You receive whatever the student typed. You return EXACTLY ONE short sentence (max 28 words) that:
- Reflects back something real in their words (quote a short phrase if you can).
- Reasons FORWARD from their thought toward the concept — even if their answer is silly or off-topic.
- Sounds like a real human teacher, not a chatbot. No emojis. No exclamation marks.
Return ONLY the sentence. No preface, no quotes around the whole thing.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as BridgeBody;
    const studentText = (body.studentText ?? "").toString().slice(0, 600).trim();
    const step = (body.step ?? "unknown").toString().slice(0, 64);
    const conceptKey = (body.conceptKey ?? "unknown").toString().slice(0, 64);
    const interestTag = (body.interestTag ?? "").toString().slice(0, 32);

    if (!studentText) {
      return new Response(
        JSON.stringify({ line: "That's a real thought — say a little more about what you mean." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ line: `"${studentText}" — that's a real noticing. Let's see where it leads.` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userMsg = `Concept: ${conceptKey}\nStep: ${step}\nStudent interest: ${interestTag || "unknown"}\nStudent said: """${studentText}"""\n\nWrite the one bridging sentence.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
        temperature: 0.6,
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("arc-bridge AI error", aiRes.status, txt);
      return new Response(
        JSON.stringify({ line: `"${studentText}" — that's a real noticing. Let's see where it leads.` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const json = await aiRes.json();
    const line = (json?.choices?.[0]?.message?.content ?? "").toString().trim().replace(/^"|"$/g, "");
    const safe = line && line.length <= 280
      ? line
      : `"${studentText}" — that's a real noticing. Let's see where it leads.`;

    return new Response(JSON.stringify({ line: safe }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("arc-bridge error", err);
    return new Response(
      JSON.stringify({ line: "That's a real thought — let's walk one more step together." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
