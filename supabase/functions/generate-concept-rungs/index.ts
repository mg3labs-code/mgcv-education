import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Body {
  chapterId?: string;
  episodeId?: string;
  conceptKey?: string;
  subject?: string;
  region?: string | null;
}

const RUNG_SOURCE = "ai-generated-7layer-v2";

const SYSTEM_PROMPT = `You are an expert Indian school curriculum designer for Classes 6-10 across Telangana and CBSE boards.

Your job: produce a 5-step student interaction ladder for ONE exact concept. The steps are a compact visible spine for our 7-layer pedagogy: Definition → Mechanism → Reasoning → Assumptions → Connections → Applications → Implications. The student should feel, "I can see it, test it, explain it, question it, and use it."

Rules — each step must exercise the named layers:
- Step 1 DEFINITION: pin down what the concept IS using one concrete, local example. Prefer MCQ/yes-no answerable in under 10 seconds.
- Step 2 MECHANISM: ask HOW it works in one tiny observable step. Use a familiar object, classroom moment, home example, money, map, phone, food, weather, sport, or story.
- Step 3 REASONING: ask WHY it works in the student's own words. Keep it one sentence, but require cause-effect thinking.
- Step 4 ASSUMPTIONS + CONNECTIONS: challenge one tempting misconception or move the idea into a new subject/place. Ask the student to bridge the gap.
- Step 5 APPLICATIONS + IMPLICATIONS: ask where this idea helps next, what decision it improves, or what would break if we did not know it.

Quality bar:
- Must be specific to subject + concept_key. Never generic filler like "useful in daily life" without an example.
- Match Class 6-10 level: simple words, accurate science/math/social/language meaning, no college terminology unless explained.
- Use richer examples than "phone/cricket" when the concept demands it: shop bill, ration scale, bus route, crop, medicine label, monsoon, kitchen, game score, poem line, local map, electricity bill.
- Include one misconception/trap and one practical use.
- Keep prompts short; reveals can be 1-2 sentences and must teach a next idea.
- Do NOT mention the words "rung", "layer", "level", "ladder", "easy", "hard" in the prompts themselves.
- Avoid weak phrases: "built by many mathematicians", "helps solve daily problems", "good thinking grows step by step". Name the useful idea directly.

Reveal style: affirm the answer, then explain the thinking skill in plain words, e.g. "Yes — that is the mechanism: the current needs a closed path."`;

async function callLovableAI(payload: object): Promise<unknown> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`AI gateway ${resp.status}: ${text.slice(0, 200)}`);
  }
  return resp.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    const { chapterId, episodeId, conceptKey, subject, region } = body;
    if (!chapterId || !episodeId || !conceptKey || !subject) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Cache check
    const { data: existing } = await supabaseAdmin
      .from("concept_rungs")
      .select("id, rung_1, rung_2, rung_3, rung_4, rung_5, source")
      .eq("chapter_id", chapterId)
      .eq("episode_id", episodeId)
      .eq("concept_key", conceptKey)
      .maybeSingle();

    // Only serve from cache if it was produced with the current 7-layer prompt
    // (source === "ai-generated-7layer"). Older rows are regenerated on demand.
    if (
      existing &&
      existing.rung_1 &&
      (existing.rung_1 as { prompt?: string }).prompt &&
      existing.source === "ai-generated-7layer"
    ) {
      return new Response(
        JSON.stringify({
          rungs: [existing.rung_1, existing.rung_2, existing.rung_3, existing.rung_4, existing.rung_5],
          source: existing.source,
          cached: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userPrompt = `Subject: ${subject}
Concept key: ${conceptKey}
Region flavor (only for rungs 1-2, optional): ${region ?? "none"}

Produce the 5-rung ladder for this concept.`;

    const aiResp = await callLovableAI({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "emit_rungs",
            description: "Return the 5-rung Confidence Ladder.",
            parameters: {
              type: "object",
              properties: {
                rungs: {
                  type: "array",
                  minItems: 5,
                  maxItems: 5,
                  items: {
                    type: "object",
                    properties: {
                      prompt: { type: "string" },
                      type: { type: "string", enum: ["yesno", "mcq", "shortText", "openText"] },
                      options: { type: "array", items: { type: "string" } },
                      correctIndex: { type: "number" },
                      reveal: { type: "string" },
                      clothing: { type: "string", enum: ["familiarity", "stakes", "social", "difficulty"] },
                    },
                    required: ["prompt", "type", "reveal", "clothing"],
                  },
                },
              },
              required: ["rungs"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "emit_rungs" } },
    }) as {
      choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }>;
    };

    const argsStr = aiResp.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argsStr) throw new Error("AI returned no tool call");
    const parsed = JSON.parse(argsStr) as { rungs: unknown[] };
    if (!Array.isArray(parsed.rungs) || parsed.rungs.length !== 5) {
      throw new Error("AI did not return 5 rungs");
    }

    const [r1, r2, r3, r4, r5] = parsed.rungs;
    await supabaseAdmin
      .from("concept_rungs")
      .upsert(
        {
          chapter_id: chapterId,
          episode_id: episodeId,
          concept_key: conceptKey,
          subject,
          region: region ?? null,
          rung_1: r1,
          rung_2: r2,
          rung_3: r3,
          rung_4: r4,
          rung_5: r5,
          source: "ai-generated-7layer",
        },
        { onConflict: "chapter_id,episode_id,concept_key" },
      );

    return new Response(
      JSON.stringify({ rungs: parsed.rungs, source: "ai-generated-7layer", cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("generate-concept-rungs error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
