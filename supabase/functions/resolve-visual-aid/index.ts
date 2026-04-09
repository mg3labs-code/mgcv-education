import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";

const BodySchema = z.object({
  query: z.string().max(1000).optional(),
  topic: z.string().max(1000).optional(),
  type: z.enum(["image", "video"]).default("image"),
  subject: z.string().max(100).optional(),
});
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    // Also accept if URL ends with common image extension
    const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "svg", "webp", "gif"].includes(ext || "");
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { query, topic, type, subject } = parsed.data;
    const searchQuery = query || topic;
    if (!searchQuery) {
      return new Response(JSON.stringify({ error: "Either query or topic is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // ═══════════════════════════════════════════
    // IMAGE RESOLUTION — TWO-TIER STRATEGY
    // ═══════════════════════════════════════════
    if (type === "image") {
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
          let raw = webData.choices?.[0]?.message?.content || "";
          raw = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

          try {
            const parsed = JSON.parse(raw);
            if (parsed.url && typeof parsed.url === "string" && parsed.url.startsWith("http")) {
              console.log(`[Tier 1] AI suggested URL: ${parsed.url}`);
              const isValid = await verifyImageUrl(parsed.url);
              if (isValid) {
                console.log(`[Tier 1] ✅ URL verified as valid image`);
                return new Response(
                  JSON.stringify({
                    url: parsed.url,
                    type: "image",
                    source: "web",
                    sourceDetail: parsed.source || "web",
                    description: parsed.description,
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

      // ── TIER 2: AI image generation fallback ──
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
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageUrl) {
        return new Response(
          JSON.stringify({ error: "No image generated", fallback: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ url: imageUrl, type: "image", source: "generated" }),
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
      let raw = data.choices?.[0]?.message?.content || "";
      raw = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

      try {
        const parsed = JSON.parse(raw);
        return new Response(
          JSON.stringify({ url: `https://youtube.com/watch?v=${parsed.videoId}`, type: "video", title: parsed.title }),
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
