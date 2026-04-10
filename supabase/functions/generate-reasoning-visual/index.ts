import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReasoningStep {
  step_number: number;
  title: string;
  subtitle: string;
  explanation: string;
  visual_prompt: string;
  key_labels: string[];
  image_url?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, subject, grade } = await req.json();
    if (!topic) {
      return new Response(JSON.stringify({ error: "topic is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const subj = subject || "Science";
    const gr = grade || "Grade 10";
    const slug = `${subj.toLowerCase()}_${topic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 60)}`;

    // 1. Check exact slug match in DB
    const { data: exactMatch } = await supabase
      .from("reasoning_visuals")
      .select("*")
      .eq("slug", slug)
      .limit(1)
      .maybeSingle();

    if (exactMatch) {
      console.log("Exact match found for:", slug);
      return new Response(
        JSON.stringify({ steps: exactMatch.steps, cached: true, match: "exact" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check full-text search for related topics
    const searchTerms = topic
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w: string) => w.length > 2)
      .join(" & ");

    if (searchTerms) {
      const { data: relatedMatches } = await supabase
        .from("reasoning_visuals")
        .select("*")
        .eq("subject", subj)
        .textSearch("search_tokens", searchTerms, { type: "plain" })
        .limit(3);

      if (relatedMatches && relatedMatches.length > 0) {
        // Return the best match
        console.log("Related match found:", relatedMatches[0].topic);
        return new Response(
          JSON.stringify({
            steps: relatedMatches[0].steps,
            cached: true,
            match: "related",
            original_topic: relatedMatches[0].topic,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 3. No match — generate new content
    console.log("No cache hit, generating for:", topic);

    // Step 1: Decompose topic into 4 reasoning steps
    const decomposeResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
              content: `You are an expert educational content designer. Break down any topic into exactly 4 active reasoning steps for ${gr} ${subj} students. Return ONLY valid JSON.`,
            },
            {
              role: "user",
              content: `Break down this topic into 4 reasoning steps: "${topic}"

Return JSON array with exactly 4 objects:
[
  {
    "step_number": 1,
    "title": "Understand the Problem",
    "subtitle": "short catchy subtitle",
    "explanation": "2-3 sentence explanation for students",
    "visual_prompt": "detailed prompt for generating an educational illustration for this step - include specific visual elements, labels, arrows, colors. Style: flat design, educational infographic, labeled diagram, school poster style, clean white background",
    "key_labels": ["label1", "label2", "label3"]
  },
  { "step_number": 2, "title": "Break It Into Parts", ... },
  { "step_number": 3, "title": "Explore Possibilities", ... },
  { "step_number": 4, "title": "Logical Conclusion", ... }
]

Make visual_prompt very specific with labeled elements, arrows, colors. Think like a textbook illustrator.`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "reasoning_steps",
                description: "Return 4 reasoning steps for the topic",
                parameters: {
                  type: "object",
                  properties: {
                    steps: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          step_number: { type: "number" },
                          title: { type: "string" },
                          subtitle: { type: "string" },
                          explanation: { type: "string" },
                          visual_prompt: { type: "string" },
                          key_labels: {
                            type: "array",
                            items: { type: "string" },
                          },
                        },
                        required: [
                          "step_number",
                          "title",
                          "subtitle",
                          "explanation",
                          "visual_prompt",
                          "key_labels",
                        ],
                      },
                    },
                  },
                  required: ["steps"],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "reasoning_steps" },
          },
        }),
      }
    );

    if (!decomposeResp.ok) {
      const errText = await decomposeResp.text();
      console.error("Decompose error:", decomposeResp.status, errText);
      if (decomposeResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (decomposeResp.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Failed to decompose topic" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const decomposeData = await decomposeResp.json();
    const toolCall = decomposeData.choices?.[0]?.message?.tool_calls?.[0];
    let steps: ReasoningStep[];

    if (toolCall) {
      const parsed = JSON.parse(toolCall.function.arguments);
      steps = parsed.steps;
    } else {
      const content = decomposeData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("Could not parse reasoning steps");
      steps = JSON.parse(jsonMatch[0]);
    }

    // Step 2: Generate images for each step
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      console.log(`Generating image for step ${i + 1}: ${step.title}`);

      try {
        const imgResp = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3.1-flash-image-preview",
              messages: [
                {
                  role: "user",
                  content: `Create an educational infographic illustration: ${step.visual_prompt}. 
                  
Style requirements:
- Flat design, clean, modern educational poster style
- Bright colors on clean white background  
- Large clear labels and text annotations
- Numbered elements with arrows showing flow/process
- Suitable for Grade 10 students
- NO photorealistic style, use illustrated/diagram style
- Include these labels prominently: ${step.key_labels.join(", ")}`,
                },
              ],
              modalities: ["image", "text"],
            }),
          }
        );

        if (!imgResp.ok) {
          console.error(`Image gen failed for step ${i + 1}:`, imgResp.status);
          await imgResp.text();
          continue;
        }

        const imgData = await imgResp.json();
        const imageB64 =
          imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (imageB64) {
          const b64Data = imageB64.replace(/^data:image\/\w+;base64,/, "");
          const bytes = Uint8Array.from(atob(b64Data), (c) => c.charCodeAt(0));

          const filePath = `${slug}/step-${i + 1}.png`;
          const { error: uploadErr } = await supabase.storage
            .from("reasoning-visuals")
            .upload(filePath, bytes, {
              contentType: "image/png",
              upsert: true,
            });

          if (uploadErr) {
            console.error(`Upload failed for step ${i + 1}:`, uploadErr);
          } else {
            step.image_url = `${supabaseUrl}/storage/v1/object/public/reasoning-visuals/${filePath}`;
          }
        }

        if (i < steps.length - 1) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      } catch (imgErr) {
        console.error(`Image generation error step ${i + 1}:`, imgErr);
      }
    }

    // Step 3: Persist to DB for future searches
    const { error: insertErr } = await supabase
      .from("reasoning_visuals")
      .insert({
        topic,
        subject: subj,
        grade: gr,
        slug,
        steps,
      });

    if (insertErr) {
      console.error("Failed to persist visual:", insertErr);
    } else {
      console.log("Persisted reasoning visual for:", topic);
    }

    return new Response(
      JSON.stringify({ steps, cached: false, match: "new" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-reasoning-visual error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
