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

/* ─── Subject-specific visual vocabulary for decomposition ─── */
function getSubjectGuidance(subject: string): string {
  const s = subject.toLowerCase();
  if (s.includes("chem"))
    return `You are creating visuals for CHEMISTRY. For each step's visual_prompt you MUST include:
- Exact chemical formulas & equations (e.g. 2H₂ + O₂ → 2H₂O)
- Color-coded atoms: O=red, H=white, C=black/grey, N=blue, Cl=green, S=yellow
- Molecular structure diagrams with bond angles
- Curly arrows for electron movement in mechanisms
- Reaction flask/beaker apparatus when relevant
- Before→After molecular comparison
- Numbered callout boxes pointing to each molecule/bond`;

  if (s.includes("phys"))
    return `You are creating visuals for PHYSICS. For each step's visual_prompt you MUST include:
- Free-body diagrams with force vectors showing direction AND magnitude (e.g. F=10N ↑)
- Circuit diagrams with labeled components (battery, resistor Ω, ammeter A, voltmeter V)
- Ray diagrams with angles of incidence/reflection/refraction labeled
- Energy bar charts showing before→after transformation
- Numbered measurement labels with SI units
- Color-coded arrows: red=force, blue=velocity, green=acceleration, yellow=energy`;

  if (s.includes("bio"))
    return `You are creating visuals for BIOLOGY. For each step's visual_prompt you MUST include:
- Anatomical cross-section/cutaway views (e.g. leaf cross-section showing mesophyll, stomata)
- Organelle diagrams with numbered callouts (①②③)
- Process flow arrows showing input→process→output
- Color-coded systems: green=chloroplast/plant, red=blood/oxygen, blue=water, yellow=energy/ATP
- Cute mascot character (cartoon cell/plant/animal) explaining a key point
- Size/scale indicators where relevant`;

  if (s.includes("math"))
    return `You are creating visuals for MATHEMATICS. For each step's visual_prompt you MUST include:
- Geometric constructions with compass arcs visible, labeled angles and sides
- Coordinate planes with plotted points, labeled axes, intercepts marked
- Step-by-step algebraic working shown as connected boxes
- Number lines with intervals and key values marked
- Color-coded terms: red=given, blue=to find, green=solution
- Visual proof elements (shaded areas, congruent marks)`;

  return `You are creating educational visuals. For each step's visual_prompt include specific labeled elements, numbered callouts, color-coded arrows, and exact terminology.`;
}

/* ─── Elite image generation prompt builder ─── */
function buildImagePrompt(step: ReasoningStep, subject: string, grade: string): string {
  const s = subject.toLowerCase();
  let styleHints = "";
  
  if (s.includes("chem"))
    styleHints = "Show molecular structures with ball-and-stick models, chemical equations with proper subscripts, reaction arrows, color-coded atoms (O=red, H=white, C=grey, N=blue). Include laboratory apparatus if relevant.";
  else if (s.includes("phys"))
    styleHints = "Show force vectors with arrowheads and magnitude labels, circuit symbols, ray paths with angle markers, energy diagrams. Use red for forces, blue for velocity, yellow for energy.";
  else if (s.includes("bio"))
    styleHints = "Show anatomical cross-sections, organelle cutaways, process flow with colored arrows. Use green for plant systems, red for animal/blood, blue for water, yellow for energy/ATP.";
  else if (s.includes("math"))
    styleHints = "Show geometric figures with labeled angles/sides, coordinate grids with plotted points, algebraic steps in connected boxes, compass construction arcs.";

  return `NCERT/CBSE textbook-quality educational diagram for ${grade} ${subject}:

${step.visual_prompt}

${styleHints}

MANDATORY visual elements:
1. All text labels and formulas written clearly and prominently in English
2. Color-coded arrows with a consistent color legend
3. Numbered callout boxes (①②③) with connecting lines to diagram parts
4. A cute cartoon mascot character (young scientist/student) pointing at the key element
5. Color legend box in bottom-right corner
6. Clean cross-section or cutaway view where applicable
7. Before → After comparison panels if showing a process or transformation

Include these labels prominently: ${step.key_labels.join(", ")}

Style: Indian NCERT educational textbook illustration, flat vector design, bright pastel palette on clean white background, large clear text annotations, hand-drawn but professional feel, infographic poster layout. NOT photorealistic.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { topic, subject, grade, action, slug: repairSlug, step_index } = body;

    // ── Repair single broken image ──
    if (action === "repair-image" && repairSlug && typeof step_index === "number") {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceKey);

      const { data: row } = await supabase
        .from("reasoning_visuals")
        .select("*")
        .eq("slug", repairSlug)
        .maybeSingle();

      if (!row) {
        return new Response(JSON.stringify({ error: "Visual not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const stepsArr = row.steps as any[];
      const step = stepsArr[step_index];
      if (!step) {
        return new Response(JSON.stringify({ error: "Step not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const elitePrompt = buildImagePrompt(step, row.subject, row.grade);
      const imgResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [{ role: "user", content: elitePrompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!imgResp.ok) {
        const status = imgResp.status;
        await imgResp.text();
        return new Response(JSON.stringify({ error: status === 402 ? "Credits exhausted" : "Image generation failed" }), {
          status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const imgText = await imgResp.text();
      let imgData: any;
      try {
        imgData = JSON.parse(imgText);
      } catch {
        console.error("Repair: AI returned non-JSON response:", imgText.slice(0, 300));
        return new Response(JSON.stringify({ error: "IMAGE_GENERATION_FAILED", fallback: true, message: "AI returned an invalid response — try again" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const imageB64 = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!imageB64) {
        console.error("Repair: AI returned 200 but no image in response", JSON.stringify(imgData).slice(0, 500));
        return new Response(JSON.stringify({ error: "IMAGE_GENERATION_FAILED", fallback: true, message: "AI did not return an image — try again in a moment" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const b64Data = imageB64.replace(/^data:image\/\w+;base64,/, "");
      const bytes = Uint8Array.from(atob(b64Data), (c) => c.charCodeAt(0));
      const filePath = `${repairSlug}/step-${step_index + 1}.png`;
      const { error: uploadErr } = await supabase.storage
        .from("reasoning-visuals")
        .upload(filePath, bytes, { contentType: "image/png", upsert: true });

      if (uploadErr) {
        return new Response(JSON.stringify({ error: "Upload failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newUrl = `${supabaseUrl}/storage/v1/object/public/reasoning-visuals/${filePath}`;
      stepsArr[step_index].image_url = newUrl;

      await supabase.from("reasoning_visuals").update({ steps: stepsArr }).eq("id", row.id);

      return new Response(JSON.stringify({ image_url: newUrl, repaired: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      const cachedSteps = exactMatch.steps as any[];
      const hasAllImages = cachedSteps.length > 0 && cachedSteps.every((s: any) => s.image_url);
      if (hasAllImages) {
        console.log("Exact match found with images for:", slug);
        return new Response(
          JSON.stringify({ steps: exactMatch.steps, cached: true, match: "exact" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Images still generating — return what we have without re-triggering generation
      const hasSomeImages = cachedSteps.some((s: any) => s.image_url);
      console.log("Exact match found, images pending:", slug, "some:", hasSomeImages);
      return new Response(
        JSON.stringify({ steps: cachedSteps, cached: true, match: "partial", images_generating: !hasAllImages }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Full-text search for related topics
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

    // 3. No match — generate new content with elite prompts
    console.log("No cache hit, generating for:", topic);
    const subjectGuidance = getSubjectGuidance(subj);

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
              content: `You are an elite educational content designer who creates NCERT/CBSE textbook-quality visual breakdowns. You specialize in creating hyper-specific visual prompts that produce professional educational infographics with maximum student retention.

${subjectGuidance}

Break down any topic into exactly 4 active reasoning steps for ${gr} ${subj} students. Return ONLY valid JSON.

CRITICAL RULES for visual_prompt:
- Be EXTREMELY specific — name exact molecules, forces, structures, equations
- Specify exact colors for each element (e.g. "red arrow for force F₁=10N pointing right")
- Describe the LAYOUT: "left panel shows X, right panel shows Y, arrow connecting them"
- Include a cartoon mascot character in at least 2 of the 4 steps
- Specify numbered callouts: "callout ① points to electrode, callout ② points to electrolyte"
- Include specific scientific notation, formulas, and units
- Describe cross-sections, cutaways, or exploded views when applicable`,
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
    "explanation": "2-3 sentence explanation for students using simple Grade 4-5 English",
    "visual_prompt": "EXTREMELY detailed and specific prompt for generating a labeled educational diagram — include exact chemical formulas OR force magnitudes OR anatomical structures OR geometric measurements. Specify colors for each element. Describe layout (left/right panels, top/bottom flow). Include numbered callouts ①②③. Mention a cute cartoon mascot character. Describe arrows with colors and labels.",
    "key_labels": ["label1", "label2", "label3", "label4"]
  },
  { "step_number": 2, "title": "Break It Into Parts", ... },
  { "step_number": 3, "title": "Explore Possibilities", ... },
  { "step_number": 4, "title": "Logical Conclusion", ... }
]`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "reasoning_steps",
                description: "Return 4 reasoning steps with elite-level visual prompts",
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

    // Background image generation function
    const generateImagesInBackground = async () => {
      const generateImage = async (step: ReasoningStep, index: number) => {
        console.log(`Generating elite image for step ${index + 1}: ${step.title}`);
        try {
          const elitePrompt = buildImagePrompt(step, subj, gr);

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
                messages: [{ role: "user", content: elitePrompt }],
                modalities: ["image", "text"],
              }),
            }
          );

          if (!imgResp.ok) {
            console.error(`Image gen failed for step ${index + 1}:`, imgResp.status);
            await imgResp.text();
            return;
          }

          let imgData;
          try {
            imgData = await imgResp.json();
          } catch (parseErr) {
            console.error(`Image JSON parse failed for step ${index + 1}:`, parseErr);
            return;
          }

          const imageB64 = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (imageB64) {
            const b64Data = imageB64.replace(/^data:image\/\w+;base64,/, "");
            const bytes = Uint8Array.from(atob(b64Data), (c) => c.charCodeAt(0));
            const filePath = `${slug}/step-${index + 1}.png`;
            const { error: uploadErr } = await supabase.storage
              .from("reasoning-visuals")
              .upload(filePath, bytes, { contentType: "image/png", upsert: true });

            if (uploadErr) {
              console.error(`Upload failed for step ${index + 1}:`, uploadErr);
            } else {
              step.image_url = `${supabaseUrl}/storage/v1/object/public/reasoning-visuals/${filePath}`;
              console.log(`Image saved for step ${index + 1}`);
            }
          }
        } catch (imgErr) {
          console.error(`Image generation error step ${index + 1}:`, imgErr);
        }
      };

      // Generate images sequentially to avoid rate limits
      for (let i = 0; i < steps.length; i++) {
        await generateImage(steps[i], i);
        // Update DB row after each image so polls see progress
        await supabase.from("reasoning_visuals").update({ steps }).eq("slug", slug);
        if (i < steps.length - 1) {
          await new Promise(r => setTimeout(r, 3000));
        }
      }
      console.log("All images generated for:", topic);
    };

    // Persist text-only steps to DB immediately so polls return cached data
    const { error: insertErr } = await supabase
      .from("reasoning_visuals")
      .insert({ topic, subject: subj, grade: gr, slug, steps });

    if (insertErr) {
      console.error("Failed to persist initial visual:", insertErr);
    }

    // Generate images in the background
    // @ts-ignore - EdgeRuntime is available in Deno edge runtime
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(generateImagesInBackground());
    } else {
      generateImagesInBackground().catch(console.error);
    }

    return new Response(
      JSON.stringify({ steps, cached: false, match: "new", images_generating: true }),
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
