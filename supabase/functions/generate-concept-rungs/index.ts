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

const SYSTEM_PROMPT = `You write tiny, friendly learning prompts for Indian Class 9-10 students.

Your job: produce a 5-rung Confidence Ladder for ONE concept. The 5 rungs are the visible spine that maps onto our 7-layer pedagogy (Definition → Mechanism → Reasoning → Assumptions → Connections → Applications → Implications). The student should feel "I already know this" on rung 1 and "I can use this anywhere" by rung 5.

Rules — each rung exercises the named layer:
- Rung 1 DEFINITION: a yes/no or simple MCQ that pins down what the concept IS, answerable in under 10 seconds with an everyday Indian object (phone, school bag, cricket, snacks, currency).
- Rung 2 MECHANISM: same idea, ask HOW it works in one tiny step. MCQ or yesno preferred.
- Rung 3 REASONING: ask them to explain WHY it works in their own words (shortText). One sentence is fine.
- Rung 4 CONNECTIONS: a friend says something wrong OR show them the same idea in a new place — ask them to bridge it (shortText). This is where assumptions get tested.
- Rung 5 IMPLICATIONS: open prompt — what FOLLOWS from this idea, or where could they use it next (openText).

Tone: warm, simple, never patronising. No jargon. Reading level: 13 year old.
Do NOT mention the words "rung", "layer", "level", "ladder", "easy", "hard" in the prompts themselves.
Each "reveal" is 1-2 sentences that affirm the student and bridge to the underlying concept — naming the layer in plain words (e.g. "That's the mechanism — …", "Nice — that's the reasoning behind it.").
The prompt must be specific to the concept_key the user gives you. Never produce generic filler.`;

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
          source: "ai-generated",
        },
        { onConflict: "chapter_id,episode_id,concept_key" },
      );

    return new Response(
      JSON.stringify({ rungs: parsed.rungs, source: "ai-generated", cached: false }),
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
