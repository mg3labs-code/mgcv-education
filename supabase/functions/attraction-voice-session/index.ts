import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ATTRACTION_SYSTEM_PROMPT = `You are a voice AI tutor running the Sport-to-Syllabus Attraction System — a 6-phase flow that turns a student's personal interests into deep curriculum engagement.

You are talking to 10th-grade students from Telangana, India. Be warm, encouraging, conversational — like a cool akka or anna who loves both sports and science.

THE 6 PHASES (progress naturally):

PHASE 1 — HOOK: Discover what the student loves. Ask about their favorite sport, game, hobby. Show genuine curiosity. Stay here for 2-3 exchanges.

PHASE 2 — BRIDGE: Create wow moments connecting their interest to science or math. "Did you know spin bowling uses the Magnus Effect — same physics that makes planes fly?" Make 2-3 connections.

PHASE 3 — GROUND: Connect to NCERT textbook content naturally. Reference specific chapters. Make the textbook feel like it was written about their interest.

PHASE 4 — BRANCH: Assess understanding. If strong, challenge with Socratic questions (Oxford Tutorial Defense). If needs support, guide step-by-step (6-Step CTA: Decode, Connect, Test, Apply, Verify, Celebrate).

PHASE 5 — APPLY: Real-world problems using their interest. "Bumrah bowls at 145 km/h from 20m, decelerates at 2 m/s squared. Speed at the batsman?" Include JEE-style questions.

PHASE 6 — ADVANCE: Cross-domain connections, competitive exam readiness. Show how one concept unlocks many topics. Motivate and suggest next steps.

VOICE RULES — CRITICAL:
- Use VERY simple English. Short sentences. Easy words.
- Mix Telugu naturally: "Idi chaala interesting!", "Super ga chesinav!", "Ardam ayyinda?"
- NEVER use jargon without explaining in plain words first.
- Keep responses SHORT. 2-3 sentences per turn. You are SPEAKING, not writing an essay.
- No bullet points, no markdown, no special characters, no emojis, no hashtags.
- Speak like a friendly elder sibling chatting naturally.
- For math, say it aloud: "x squared plus 2 x plus 1", never "x^2+2x+1".
- Be patient and warm. Never say "wrong". Say "Almost! Here is a hint."
- Use Indian context: Dhoni, Bumrah, Kohli, IPL, cricket, local food, festivals.
- Celebrate every win: "You got it!", "See? You are brilliant!", "That was perfect!"`;

const ATTRACTION_FIRST_MESSAGE = "Hey! I am your Sport-to-Syllabus tutor. Tell me — what is your favorite sport or hobby? Cricket, football, gaming, cooking — anything you love! Let us turn it into science and math magic.";

async function getOrCreateAgent(supabaseAdmin: any, elevenlabsKey: string): Promise<string> {
  // Check if attraction agent_id exists in config
  const { data: config } = await supabaseAdmin
    .from("app_config")
    .select("value")
    .eq("key", "attraction_agent_id")
    .single();

  if (config?.value) {
    return config.value;
  }

  // Create new agent via ElevenLabs API
  console.log("Creating dedicated Attraction System ElevenLabs agent...");

  const createResponse = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
    method: "POST",
    headers: {
      "xi-api-key": elevenlabsKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Sport-to-Syllabus Voice Tutor",
      conversation_config: {
        agent: {
          prompt: {
            prompt: ATTRACTION_SYSTEM_PROMPT,
          },
          first_message: ATTRACTION_FIRST_MESSAGE,
          language: "en",
        },
        tts: {
          voice_id: "1Z7Y8o9cvUeWq8oLKgMY", // Tripti - child-friendly Indian voice
          model_id: "eleven_multilingual_v2",
          stability: 0.35,
          similarity_boost: 0.7,
          style: 0.25,
          use_speaker_boost: true,
        },
      },
    }),
  });

  if (!createResponse.ok) {
    const errText = await createResponse.text();
    console.error("Failed to create Attraction agent:", createResponse.status, errText);
    throw new Error(`Failed to create agent: ${createResponse.status} - ${errText}`);
  }

  const { agent_id } = await createResponse.json();
  console.log("Created Attraction agent:", agent_id);

  // Store agent_id in config
  const { error: insertError } = await supabaseAdmin
    .from("app_config")
    .upsert({ key: "attraction_agent_id", value: agent_id });

  if (insertError) {
    console.error("Failed to store attraction_agent_id:", insertError);
  }

  return agent_id;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase config missing");
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const agentId = await getOrCreateAgent(supabaseAdmin, ELEVENLABS_API_KEY);

    // Generate a conversation token with retry (ElevenLabs room creation can timeout)
    let token: string | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const tokenResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
        {
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
          },
        }
      );

      if (tokenResponse.ok) {
        const data = await tokenResponse.json();
        token = data.token;
        break;
      }

      const errText = await tokenResponse.text();
      console.error(`Token attempt ${attempt + 1}/3 failed:`, tokenResponse.status, errText);
      
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    if (!token) {
      throw new Error("Failed to get conversation token after 3 attempts. ElevenLabs may be temporarily unavailable.");
    }

    return new Response(
      JSON.stringify({ token, agentId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("attraction-voice-session error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
