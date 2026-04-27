import { z } from "https://esm.sh/zod@3.23.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const BodySchema = z.object({
  query: z.string().max(1000).optional(),
  topic: z.string().max(1000).optional(),
  type: z.enum(["image", "video"]).default("image"),
  subject: z.string().max(100).optional(),
  searchTerms: z.string().max(1000).optional(),
  caption: z.string().max(1000).optional(),
  alt: z.string().max(500).optional(),
});
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Build a deterministic safe filename prefix from a query string */
function safeName(query: string): string {
  return query.slice(0, 60).replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
}

/** Check if an image already exists in storage for this query */
async function findExistingImage(query: string): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return null;

    const supabase = createClient(supabaseUrl, serviceKey);
    const prefix = safeName(query);

    const { data: files, error } = await supabase.storage
      .from("visual-aids")
      .list("", { limit: 5, search: prefix });

    if (error || !files?.length) return null;

    // Return the first matching file's public URL
    const match = files.find((f) => f.name.startsWith(prefix));
    if (!match) return null;

    const { data: urlData } = supabase.storage.from("visual-aids").getPublicUrl(match.name);
    console.log(`[Cache HIT] Found existing image: ${match.name}`);
    return urlData?.publicUrl || null;
  } catch {
    return null;
  }
}

// Verify a URL actually serves an image (HEAD check with timeout)
async function verifyImageUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!resp.ok) return false;
    const ct = resp.headers.get("content-type") || "";
    if (ct.startsWith("image/")) return true;
    const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "svg", "webp", "gif"].includes(ext || "");
  } catch {
    return false;
  }
}

// Upload base64 image to Supabase storage and return public URL
async function uploadToStorage(base64Data: string, query: string): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return null;

    const supabase = createClient(supabaseUrl, serviceKey);

    // Extract base64 content
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Content), (c) => c.charCodeAt(0));

    const fileName = `${safeName(query)}_${Date.now()}.png`;

    const { error } = await supabase.storage
      .from("visual-aids")
      .upload(fileName, binaryData, { contentType: "image/png", upsert: false });

    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage.from("visual-aids").getPublicUrl(fileName);
    return urlData?.publicUrl || null;
  } catch (e) {
    console.error("Upload to storage failed:", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { query, topic, type, subject, searchTerms, caption, alt } = parsed.data;
    const searchQuery = query || searchTerms || topic || caption || alt || "";
    if (!searchQuery) {
      return new Response(JSON.stringify({ error: "Either query or topic is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // ═══════════════════════════════════════════
    // IMAGE RESOLUTION — THREE-TIER STRATEGY
    // ═══════════════════════════════════════════
    if (type === "image") {
      // ── TIER 0: Check storage for previously generated image ──
      const existing = await findExistingImage(searchQuery);
      if (existing) {
        return new Response(
          JSON.stringify({ url: existing, type: "image", source: "cached" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── TIER 1: Web image lookup ──
      console.log(`[Tier 1] Searching web for: ${searchQuery}`);
      try {
        const webSearchResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "user",
                content: `Find ONE high-quality, publicly accessible educational image URL for this topic: "${searchQuery}"
${subject ? `Subject: ${subject}` : ""}

Search these sources in order of preference:
1. Wikimedia Commons (upload.wikimedia.org/wikipedia/commons/...)
2. NCERT textbook diagrams (ncert.nic.in)
3. Khan Academy or OpenStax diagrams
4. Any .edu or .gov educational site
5. Other reputable educational sources

REQUIREMENTS:
- The URL MUST be a DIRECT link to an image file (ending in .jpg, .png, .svg, .webp, or .gif)
- NOT an HTML page, NOT a thumbnail, NOT a search results page
- The image must be a clear, labeled, educational diagram or illustration
- Prefer diagrams with labels, arrows, and clear explanations over photographs
- For Indian curriculum topics, prefer NCERT or Indian educational source images

Return ONLY a JSON object with no markdown:
{"url": "https://...", "source": "wikimedia|ncert|khan|other", "description": "what the image shows"}`,
              },
            ],
            temperature: 0.2,
          }),
        });

        if (webSearchResp.ok) {
          const webData = await webSearchResp.json();
          let rawText = webData.choices?.[0]?.message?.content || "";
          rawText = rawText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

          try {
            const parsedUrl = JSON.parse(rawText);
            if (parsedUrl.url && typeof parsedUrl.url === "string" && parsedUrl.url.startsWith("http")) {
              console.log(`[Tier 1] AI suggested URL: ${parsedUrl.url}`);
              const isValid = await verifyImageUrl(parsedUrl.url);
              if (isValid) {
                console.log(`[Tier 1] ✅ URL verified as valid image`);
                return new Response(
                  JSON.stringify({
                    url: parsedUrl.url,
                    type: "image",
                    source: "web",
                    sourceDetail: parsedUrl.source || "web",
                    description: parsedUrl.description,
                  }),
                  { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
              } else {
                console.log(`[Tier 1] ❌ URL failed verification, falling through to Tier 2`);
              }
            }
          } catch {
            console.log(`[Tier 1] Could not parse AI response, falling through to Tier 2`);
          }
        }
      } catch (e) {
        console.error("[Tier 1] Web search error:", e);
      }

      // ── TIER 2: AI image generation fallback → upload to storage ──
      console.log(`[Tier 2] Generating AI image for: ${searchQuery}`);
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: `Create a clear, educational diagram or illustration for a 10th grade student about: ${searchQuery}. 
The image should be clean, labeled, colorful, and easy to understand. Use a white background. 
Make it look like a professional textbook illustration.`,
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("AI image generation failed:", response.status, errText);
        return new Response(
          JSON.stringify({ error: `Image generation failed: ${response.status}`, fallback: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      const base64Url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!base64Url) {
        return new Response(
          JSON.stringify({ error: "No image generated", fallback: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Upload to storage for a permanent URL instead of returning huge base64
      const permanentUrl = await uploadToStorage(base64Url, searchQuery);

      return new Response(
        JSON.stringify({
          url: permanentUrl || base64Url,
          type: "image",
          source: "generated",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ═══════════════════════════════════════════
    // VIDEO RESOLUTION
    // ═══════════════════════════════════════════
    if (type === "video") {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: `Suggest ONE specific YouTube video ID (just the 11-character ID) for a short educational video (under 2 minutes) about: ${searchQuery}. 
The video should be suitable for 10th grade Indian students. 
Return ONLY a JSON object: {"videoId": "...", "title": "...", "channel": "..."}`,
            },
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: "Video suggestion failed", fallback: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      let rawText = data.choices?.[0]?.message?.content || "";
      rawText = rawText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

      try {
        const parsedVideo = JSON.parse(rawText);
        return new Response(
          JSON.stringify({ url: `https://youtube.com/watch?v=${parsedVideo.videoId}`, type: "video", title: parsedVideo.title }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch {
        return new Response(
          JSON.stringify({ error: "Could not parse video suggestion", fallback: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(JSON.stringify({ error: "Invalid type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("resolve-visual-aid error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
