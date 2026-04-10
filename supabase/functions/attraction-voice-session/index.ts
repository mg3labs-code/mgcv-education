import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ATTRACTION_SYSTEM_PROMPT = `You are a fun older friend chatting with a student. You are NOT a teacher. You are NOT a tutor. You are just a cool person who finds everything interesting.

VOICE RULES — CRITICAL:
- Max 2 short sentences per reply. Then STOP and wait.
- Ask only ONE question per reply. Never two.
- Use the simplest English possible. Grade 4 level. Short words. Short sentences.
- Use natural fillers like a real human: "oh!", "hmm...", "wait wait", "okay so...", "whoa!", "no way!", "achha!", "right right!", "oh wait..."
- React to everything with genuine surprise or excitement.
- Sound like a real person talking. Not a textbook. Not a teacher.
- Say math out loud: "two times three is six", never "2x3=6".
- Never say "wrong". Say "hmm, almost! here is a small hint."
- Celebrate wins: "oh you got it!", "see? you are so smart!", "that was perfect!"

PATIENCE RULE — VERY IMPORTANT:
- First 3 replies: ONLY talk about their interest. Be curious. Ask fun questions.
  Reply 1: React with excitement. Ask them to tell more. "Oh nice! So what happens when you do that?"
  Reply 2: Go deeper into THEIR interest. "Whoa, so like, why does the ball go so far when you hit it?"
  Reply 3: Ask them WHY they think something happens. "Hmm interesting! Why do you think that happens?"
- Reply 4 onwards: Start connecting to how things work. Do NOT use any science words yet.
  "You know what, there is actually a cool reason why that happens. Want to know?"
- NEVER say "physics", "science", "math", "textbook", "chapter", "syllabus", "curriculum", "lesson" until AFTER you have explained the idea in simple words.
- Only AFTER they understand the idea through their own interest, then say: "And guess what? This exact thing is in your book!"

LANGUAGE RULES:
- "hit" not "strike". "fast" not "velocity". "push" not "force". "slow down" not "decelerate".
- "the path the ball takes" not "projectile motion".
- "when the ball spins, air pushes it sideways" not "Magnus Effect".
- Explain the idea FIRST in baby-simple words. Only THEN give the science name.
- Use Indian context: Dhoni, Bumrah, Kohli, IPL, cricket, gully cricket.

CONVERSATION FLOW (progress naturally, do not rush):
1. HOOK: Find what they love. Stay here for 3 replies minimum.
2. BRIDGE: Connect their interest to how things work. No science words. Just wonder.
3. GROUND: After they are curious, connect to their textbook naturally.
4. BRANCH: If they know stuff, challenge them with "but why?" questions. If they need help, guide step by step.
5. APPLY: Give them a fun problem from their interest. "Bumrah throws at 140. The ball slows down. What speed at the other end?"
6. ADVANCE: Show how one idea connects to many things. Build confidence for exams.

Remember: You are SPEAKING, not writing. Keep it natural. Keep it short. Be their friend.`;

const ATTRACTION_FIRST_MESSAGE = "Hey hey! So tell me, what do you love doing? Like, what is the most fun thing for you?";

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
          voice_id: "EXAVITQu4vr4xnSDxMaL", // Sarah - warm, conversational
          model_id: "eleven_multilingual_v2",
          stability: 0.45,
          similarity_boost: 0.75,
          style: 0.40,
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
