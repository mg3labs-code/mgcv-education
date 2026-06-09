// Generates a "Know Your World" digest for teachers: 5 fresh, curious real-world
// updates per subject + class. Cached in `teacher_world_digests` for 7 days.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

interface Body {
  subject: string;
  class_name: string;
  board?: string;
  force_refresh?: boolean;
}

const SYSTEM = `You are a curriculum-aware editor who writes a weekly "Know Your World" digest for school teachers in India.
For the given subject, class, and board, produce 5 short, classroom-ready items that connect the syllabus to:
- a recent real-world advancement, news, discovery, or curious phenomenon (last 6-18 months when possible)
- everyday life examples students will recognise
- a 1-line "classroom hook" the teacher can open the period with
Avoid politics, religion, and adult content. Keep language simple and engaging for Indian school context.`;

const schemaPrompt = `Return STRICT JSON with shape:
{
  "headlines": [
    {
      "title": "string (<=90 chars)",
      "topic": "string (which chapter/topic this maps to)",
      "what_happened": "string (2-3 sentences, plain English)",
      "why_curious": "string (1 sentence, why it surprises or matters)",
      "classroom_hook": "string (1 question or 1-line opener the teacher can read aloud)",
      "real_world_link": "string (everyday example)",
      "search_query": "string (4-7 words a teacher could google to learn more)"
    }
  ]
}
No prose outside the JSON.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    const subject = (body.subject || "").trim();
    const class_name = (body.class_name || "").trim();
    const board = (body.board || "CBSE").trim();
    if (!subject || !class_name) {
      return new Response(JSON.stringify({ error: "subject and class_name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Cache lookup
    if (!body.force_refresh) {
      const { data: cached } = await admin
        .from("teacher_world_digests")
        .select("payload, generated_at, expires_at")
        .eq("subject", subject)
        .eq("class_name", class_name)
        .eq("board", board)
        .maybeSingle();
      if (cached && new Date(cached.expires_at) > new Date()) {
        return new Response(
          JSON.stringify({ ...cached.payload, generated_at: cached.generated_at, cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // 2. Generate via Lovable AI Gateway
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Subject: ${subject}
Class: ${class_name}
Board: ${board}
Country: India

Write the digest now. ${schemaPrompt}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      const status = aiRes.status === 429 ? 429 : aiRes.status === 402 ? 402 : 502;
      return new Response(JSON.stringify({ error: "ai_gateway_failed", detail: text }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let payload: any;
    try {
      payload = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      payload = { headlines: [] };
    }
    if (!payload.headlines || !Array.isArray(payload.headlines)) payload.headlines = [];

    // 3. Upsert cache
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await admin
      .from("teacher_world_digests")
      .upsert(
        { subject, class_name, board, payload, generated_at: new Date().toISOString(), expires_at },
        { onConflict: "subject,class_name,board" },
      );

    return new Response(
      JSON.stringify({ ...payload, generated_at: new Date().toISOString(), cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
