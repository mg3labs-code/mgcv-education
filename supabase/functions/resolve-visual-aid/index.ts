import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, topic, type = "image" } = await req.json();
    const searchQuery = query || topic;
    if (!searchQuery) {
      return new Response(JSON.stringify({ error: "Missing query" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (type === "image") {
      // Use AI to generate an educational diagram/illustration
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
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
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageUrl) {
        return new Response(
          JSON.stringify({ error: "No image generated", fallback: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ url: imageUrl, type: "image", generated: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For video type, use AI to suggest a YouTube search query
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
