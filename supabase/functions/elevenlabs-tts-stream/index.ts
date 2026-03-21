import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Detect if text contains Telugu Unicode characters (0C00-0C7F)
function containsTelugu(text: string): boolean {
  return /[\u0C00-\u0C7F]/.test(text);
}

// Detect if text contains Hindi/Devanagari Unicode characters (0900-097F)
function containsHindi(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId, language } = await req.json();

    // Aggressive sanitization: strip emojis, surrogates, control chars, non-BMP
    const sanitized = (text || "")
      .replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{2300}-\u{23FF}\u{2B50}-\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/gu, "")
      .replace(/[\uD800-\uDFFF]/g, "")
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      .replace(/\[PHASE:\d\]\s*/g, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .replace(/#{1,6}\s*/g, "")
      .trim()
      .slice(0, 4500);

    console.log("TTS sanitized text length:", sanitized.length);

    if (!sanitized || sanitized.length < 3) {
      return new Response(
        JSON.stringify({ error: "text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Route Telugu text through Sarvam AI (Kavya voice, Bulbul v3)
    const isTeluguText = language === "telugu" || containsTelugu(sanitized);
    const isHindiText = language === "hindi" || containsHindi(sanitized);

    if (isTeluguText || isHindiText) {
      const SARVAM_API_KEY = Deno.env.get("SARVAM_API_KEY");
      if (!SARVAM_API_KEY) {
        console.warn("SARVAM_API_KEY not set, falling back to ElevenLabs");
      } else {
        const langCode = isTeluguText ? "te-IN" : "hi-IN";
        console.log(`Routing TTS through Sarvam AI (${langCode})...`);

        const ttsResp = await fetch("https://api.sarvam.ai/text-to-speech", {
          method: "POST",
          headers: {
            "api-subscription-key": SARVAM_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: sanitized.slice(0, 3000),
            target_language_code: langCode,
            model: "bulbul:v3",
            speaker: "kavya",
            pace: 0.9,
            temperature: 0.8,
            enable_preprocessing: true,
            sample_rate: 24000,
          }),
        });

        if (ttsResp.ok) {
          const ttsData = await ttsResp.json();
          const audioBase64 = ttsData.audios?.[0];
          if (audioBase64) {
            // Convert base64 to binary for streaming response
            const audioBytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
            return new Response(audioBytes, {
              headers: {
                ...corsHeaders,
                "Content-Type": "audio/mpeg",
              },
            });
          }
        } else {
          const errText = await ttsResp.text();
          console.error("Sarvam TTS error:", ttsResp.status, errText);
          // Fall through to ElevenLabs
        }
      }
    }

    // Default: ElevenLabs TTS (English)
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    const voice = voiceId || "cgSgspJ2msm6clMCkdW9"; // Jessica

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}/stream?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: sanitized,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.75,
            style: 0.40,
            use_speaker_boost: true,
            speed: 0.92,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `ElevenLabs API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (e) {
    console.error("elevenlabs-tts-stream error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
