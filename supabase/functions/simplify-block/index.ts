// Simplify a content block to Explorer (1-line + emoji + analogy) and Builder (story-format)
// versions, then cache them back into content_blocks.content. Idempotent: if cached versions
// already exist, returns them without re-calling AI.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SimplifiedPayload {
  explorer: { oneLiner: string; emoji: string };
  builder: { story: string };
}

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

    // 1) Fetch the block
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

    const existing = block.content?.simplified as SimplifiedPayload | undefined;
    if (existing && !force) {
      return new Response(JSON.stringify({ source: "cache", simplified: existing }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Build a compact prompt from whatever shape the block has
    const sourceText = JSON.stringify(block.content).slice(0, 4000);
    const blockTitle = block.title || block.block_type;

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
          {
            role: "system",
            content:
              "You simplify school science content for Class 6 students. Always return tool-call JSON. Use Grade-4 English, everyday analogies, no jargon.",
          },
          {
            role: "user",
            content: `Block title: ${blockTitle}\nBlock JSON: ${sourceText}\n\nProduce two simplified versions of the SAME concept.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "emit_simplified",
              description: "Return Explorer + Builder versions",
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
          },
        ],
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
          JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }),
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

    // 3) Cache back to DB
    const updatedContent = { ...block.content, simplified };
    const { error: updErr } = await supabase
      .from("content_blocks")
      .update({ content: updatedContent })
      .eq("id", blockId);
    if (updErr) console.error("Cache write failed:", updErr);

    return new Response(JSON.stringify({ source: "ai", simplified }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("simplify-block error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
