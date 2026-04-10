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

    // Check cache
    const slug = `${(subject || "general").toLowerCase()}_${topic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 60)}`;

    const { data: cached } = await supabase.storage
      .from("reasoning-visuals")
      .list(slug);

    if (cached && cached.length >= 5) {
      // 4 images + 1 metadata json
      const metaUrl = `${supabaseUrl}/storage/v1/object/public/reasoning-visuals/${slug}/meta.json`;
      const metaResp = await fetch(metaUrl);
      if (metaResp.ok) {
        const steps = await metaResp.json();
        return new Response(JSON.stringify({ steps, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

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
              content: `You are an expert educational content designer. Break down any topic into exactly 4 active reasoning steps for ${grade || "Grade 10"} ${subject || "Science"} students. Return ONLY valid JSON.`,
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
      return new Response(
        JSON.stringify({ error: "Failed to decompose topic" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const decomposeData = await decomposeResp.json();
    const toolCall = decomposeData.choices?.[0]?.message?.tool_calls?.[0];
    let steps: ReasoningStep[];

    if (toolCall) {
      const parsed = JSON.parse(toolCall.function.arguments);
      steps = parsed.steps;
    } else {
      // Fallback: try to parse from content
      const content = decomposeData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("Could not parse reasoning steps");
      steps = JSON.parse(jsonMatch[0]);
    }

    // Step 2: Generate images for each step (sequentially to avoid rate limits)
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
          continue;
        }

        const imgData = await imgResp.json();
        const imageB64 =
          imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (imageB64) {
          // Extract base64 data
          const b64Data = imageB64.replace(/^data:image\/\w+;base64,/, "");
          const bytes = Uint8Array.from(atob(b64Data), (c) => c.charCodeAt(0));

          // Upload to storage
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

        // Small delay between image generations
        if (i < steps.length - 1) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      } catch (imgErr) {
        console.error(`Image generation error step ${i + 1}:`, imgErr);
      }
    }

    // Save metadata
    const metaBytes = new TextEncoder().encode(JSON.stringify(steps));
    await supabase.storage
      .from("reasoning-visuals")
      .upload(`${slug}/meta.json`, metaBytes, {
        contentType: "application/json",
        upsert: true,
      });

    return new Response(JSON.stringify({ steps, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
