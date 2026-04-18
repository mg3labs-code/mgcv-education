// Simplify a content block to Explorer + Builder versions, with prompts tailored
// to the block type (concept vs reasoning). Caches results back into
// content_blocks.content.simplified. Idempotent unless force=true.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/* ── Payload shapes per block type ──────────────────────────── */

interface ConceptSimplified {
  explorer: { oneLiner: string; emoji: string };
  builder: { story: string };
}

interface ReasoningSimplified {
  explorer: {
    centralQuestion: string; // re-worded simpler
    emoji: string;
    whyQuestions: { question: string; hint: string }[]; // simpler, kid-friendly
  };
  builder: {
    centralQuestion: string;
    whyQuestions: { question: string; hint: string }[];
  };
}

type SimplifiedPayload = ConceptSimplified | ReasoningSimplified;

/* ── Tool schemas per block type ────────────────────────────── */

const CONCEPT_TOOL = {
  type: "function",
  function: {
    name: "emit_simplified",
    description: "Return Explorer + Builder versions of a concept block",
    parameters: {
      type: "object",
      properties: {
        explorer: {
          type: "object",
          properties: {
            oneLiner: {
              type: "string",
              description:
                "One short sentence a 10-year-old understands. Use an everyday object as an analogy. Max 18 words.",
            },
            emoji: { type: "string", description: "Single emoji that captures the idea" },
          },
          required: ["oneLiner", "emoji"],
          additionalProperties: false,
        },
        builder: {
          type: "object",
          properties: {
            story: {
              type: "string",
              description:
                "2-4 sentence 'imagine you are...' story that makes the mechanism intuitive. Conversational tone.",
            },
          },
          required: ["story"],
          additionalProperties: false,
        },
      },
      required: ["explorer", "builder"],
      additionalProperties: false,
    },
  },
};

const REASONING_TOOL = {
  type: "function",
  function: {
    name: "emit_simplified",
    description: "Return Explorer + Builder versions of a reasoning block",
    parameters: {
      type: "object",
      properties: {
        explorer: {
          type: "object",
          properties: {
            centralQuestion: {
              type: "string",
              description:
                "The central reasoning question rewritten in playful, super-simple language a 10-year-old asks themselves. Max 16 words.",
            },
            emoji: { type: "string", description: "Single emoji capturing the curiosity" },
            whyQuestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: {
                    type: "string",
                    description: "Same 'why' question, rewritten in Grade-4 English. Max 14 words.",
                  },
                  hint: {
                    type: "string",
                    description:
                      "1-sentence everyday-life analogy hint that nudges thinking. No jargon.",
                  },
                },
                required: ["question", "hint"],
                additionalProperties: false,
              },
            },
          },
          required: ["centralQuestion", "emoji", "whyQuestions"],
          additionalProperties: false,
        },
        builder: {
          type: "object",
          properties: {
            centralQuestion: {
              type: "string",
              description: "Central question rewritten conversationally for a curious 13-year-old.",
            },
            whyQuestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  hint: {
                    type: "string",
                    description:
                      "2-3 sentence guided-thinking hint with a real-world example, no answers given.",
                  },
                },
                required: ["question", "hint"],
                additionalProperties: false,
              },
            },
          },
          required: ["centralQuestion", "whyQuestions"],
          additionalProperties: false,
        },
      },
      required: ["explorer", "builder"],
      additionalProperties: false,
    },
  },
};

/* ── Handler ────────────────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { blockId, force = false } = await req.json();
    if (!blockId) {
      return new Response(JSON.stringify({ error: "blockId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1) Fetch block
    const { data: block, error: fetchErr } = await supabase
      .from("content_blocks")
      .select("id, block_type, title, content")
      .eq("id", blockId)
      .single();

    if (fetchErr || !block) {
      return new Response(JSON.stringify({ error: "Block not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const existing = (block.content as any)?.simplified as SimplifiedPayload | undefined;
    if (existing && !force) {
      return new Response(
        JSON.stringify({ source: "cache", blockType: block.block_type, simplified: existing }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2) Pick prompt + tool by block type
    const isReasoning = block.block_type === "reasoning";
    const tool = isReasoning ? REASONING_TOOL : CONCEPT_TOOL;

    const systemMsg = isReasoning
      ? "You simplify school reasoning prompts for Class 6 students. Always return tool-call JSON. Preserve the original question's intent while using Grade-4 English, playful tone, and everyday-life hints. Never give away the answer in the hint."
      : "You simplify school science content for Class 6 students. Always return tool-call JSON. Use Grade-4 English, everyday analogies, no jargon.";

    const sourceText = JSON.stringify(block.content).slice(0, 4000);
    const blockTitle = block.title || block.block_type;

    const userMsg = isReasoning
      ? `Reasoning block title: ${blockTitle}\nOriginal JSON: ${sourceText}\n\nProduce Explorer (super-simple, max 16 words per question) and Builder (story-format, conversational) versions of the central question and EVERY whyQuestion. Match the count of whyQuestions exactly.`
      : `Concept block title: ${blockTitle}\nBlock JSON: ${sourceText}\n\nProduce two simplified versions of the SAME concept.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: userMsg },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "emit_simplified" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again shortly" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI credits exhausted. Add credits in Settings → Workspace → Usage.",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      throw new Error(`AI gateway ${aiResp.status}`);
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");
    const simplified: SimplifiedPayload = JSON.parse(toolCall.function.arguments);

    // 3) Cache to DB
    const updatedContent = { ...(block.content as Record<string, unknown>), simplified };
    const { error: updErr } = await supabase
      .from("content_blocks")
      .update({ content: updatedContent })
      .eq("id", blockId);
    if (updErr) console.error("Cache write failed:", updErr);

    return new Response(
      JSON.stringify({ source: "ai", blockType: block.block_type, simplified }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("simplify-block error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
