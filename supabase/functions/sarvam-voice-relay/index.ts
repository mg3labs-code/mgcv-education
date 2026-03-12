import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ATTRACTION_SYSTEM_PROMPT = `You are a fun older friend chatting with a student. You are NOT a teacher or tutor. You are a cool person who finds everything interesting and loves figuring out how things work.

You are talking to students from India, grades 6 to 10.

HOW TO TALK:
- Talk like a fun older friend. Warm. Casual. Excited.
- Use natural fillers: "oh!", "hmm...", "wait wait", "okay so...", "whoa!", "no way!", "achha!", "right right!"
- Max 2-3 SHORT sentences per reply. Then STOP. This is a voice call — keep it brief!
- Ask only ONE question per reply. Never two.
- Simplest English possible. Grade 4 level. Short words. Short sentences.
- "hit" not "strike". "fast" not "velocity". "push" not "force".
- Explain ideas FIRST in simple words. Only THEN give the science name.
- Use Indian context: Dhoni, Bumrah, Kohli, IPL, cricket, gully cricket.
- Never say "wrong". Say "hmm, almost! here is a small hint."
- Celebrate wins: "oh you got it!", "see? you are so smart!"

CONVERSATION LENGTH: 8-12 exchanges total. Be efficient. Every reply moves forward.

SMART SHORTCUTS:
- Detailed/knowledgeable answer? Skip ahead phases.
- Bored or short answers? Compress and wrap up faster.
- Curious and engaged? Spend a bit more time but stay within 8-12 exchanges.
- Student deviates? Steer back once, then pivot to their new interest.
- After 12+ exchanges, start wrapping up.

CONVERSATION FLOW (4 phases):

PHASE 1 CONNECT (1-2 replies max): Find what they love. React with excitement. One curious follow-up. Move on quickly.

PHASE 2 BRIDGE (1-2 replies): Connect their interest to how things work. Explain in simple words using their interest. Immediately reveal the textbook link and science term together.

PHASE 3 EXPLORE (2-3 replies): Check understanding and give a fun problem. Challenge strong students to explain WHY. Guide beginners step by step with tiny pieces.

PHASE 4 WOW (1 reply): One mind-blown cross-domain connection. Clear takeaway: "Today you figured out [concept] through [their interest]!" Suggest what to explore next.

IMPORTANT: Keep responses VERY short for voice. 2-3 sentences max. This is a spoken conversation.
Do NOT use markdown formatting, bullet points, or numbered lists — this will be spoken aloud.`;

// Sanitize text for TTS
function cleanForTTS(text: string): string {
  return text
    .replace(/\[PHASE:\d\]\s*/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^[•\-]\s*/gm, "")
    .replace(/^\d+\.\s*/gm, "")
    .replace(/#{1,6}\s*/g, "")
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "")
    .trim()
    .slice(0, 3000);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SARVAM_API_KEY = Deno.env.get("SARVAM_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!SARVAM_API_KEY) throw new Error("SARVAM_API_KEY is not configured");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { audioBase64, mimeType, conversationHistory } = await req.json();

    if (!audioBase64) {
      return new Response(
        JSON.stringify({ error: "audioBase64 is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- STEP 1: Sarvam STT (Speech-to-Text) ----
    const audioBytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
    // Sarvam API rejects codec-specific MIME types like "audio/webm;codecs=opus"
    // Normalize to base MIME type that Sarvam accepts
    const rawMime = (mimeType || "audio/webm").split(";")[0].trim();
    const ext = rawMime.includes("wav") ? "wav" : "webm";
    const formData = new FormData();
    formData.append("file", new Blob([audioBytes], { type: rawMime }), `audio.${ext}`);
    formData.append("model", "saaras:v3");
    formData.append("mode", "transcribe");

    console.log("Calling Sarvam STT...");
    const sttResp = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: { "api-subscription-key": SARVAM_API_KEY },
      body: formData,
    });

    if (!sttResp.ok) {
      const errText = await sttResp.text();
      console.error("Sarvam STT error:", sttResp.status, errText);
      return new Response(
        JSON.stringify({ error: "Speech recognition failed. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sttData = await sttResp.json();
    const userTranscript = sttData.transcript?.trim();
    console.log("STT transcript:", userTranscript);

    if (!userTranscript || userTranscript.length < 2) {
      return new Response(
        JSON.stringify({ error: "silence", userTranscript: "" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- STEP 2: AI Response (Lovable AI gateway) ----
    const messages = [
      { role: "system", content: ATTRACTION_SYSTEM_PROMPT },
      ...(conversationHistory || []),
      { role: "user", content: userTranscript },
    ];

    console.log("Calling AI gateway...");
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        max_tokens: 300,
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Wait a moment! 😅" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "AI response failed. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResp.json();
    const aiResponse = aiData.choices?.[0]?.message?.content || "Sorry, I didn't catch that. Can you say that again?";
    console.log("AI response:", aiResponse.slice(0, 100));

    // ---- STEP 3: Sarvam TTS (Text-to-Speech) ----
    const ttsText = cleanForTTS(aiResponse);
    console.log("Calling Sarvam TTS...");
    const ttsResp = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: ttsText,
        target_language_code: "en-IN",
        model: "bulbul:v3",
        speaker: "kavya",
        pace: 0.95,
        temperature: 0.8,
        enable_preprocessing: true,
        sample_rate: 24000,
      }),
    });

    if (!ttsResp.ok) {
      const errText = await ttsResp.text();
      console.error("Sarvam TTS error:", ttsResp.status, errText);
      // Return AI response without audio
      return new Response(
        JSON.stringify({ userTranscript, aiResponse, audioBase64: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ttsData = await ttsResp.json();
    const responseAudio = ttsData.audios?.[0] || null;

    return new Response(
      JSON.stringify({ userTranscript, aiResponse, audioBase64: responseAudio }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("sarvam-voice-relay error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
