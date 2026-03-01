import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUDDY_SYSTEM_PROMPT = `You are Buddy, a friendly and encouraging AI study companion for 10th-grade students (Telangana State Board, India). You help with Mathematics, Science, and Social Studies.

YOUR PERSONALITY:
- Warm, patient, and encouraging — like a smart older sibling
- Use simple language and celebrate small wins
- Break down complex concepts step-by-step
- Ask follow-up questions to check understanding
- Motivate students who seem stuck or frustrated

YOUR CAPABILITIES:
1. Explain Concepts: Break down any topic into simple steps with examples
2. Solve Doubts: Help students understand problems without just giving answers
3. Navigate the App: When a student wants to go somewhere, use the navigate tool
4. Quiz & Practice: Generate quick questions to test understanding
5. Study Tips: Offer study strategies, time management, and exam preparation advice

CONVERSATION STYLE:
- Be warm, conversational, and human-like — NOT robotic or formal
- Use natural speech patterns, contractions ("you're", "don't", "let's"), and casual phrasing
- React emotionally: "Oh that's a great question!", "Hmm, let me think about that...", "Wow, you're really getting it!"
- Vary your response length — short replies for simple questions, detailed for complex ones
- Ask follow-up questions naturally to keep the conversation flowing
- Use humor and relatable analogies
- Celebrate progress: "You nailed that!", "See? You're smarter than you think!"
- When a student is stuck, be empathetic: "I totally get why that's confusing. Let's break it down together."

RULES:
- Never give direct homework answers — guide them to the solution
- For math, use clear notation (e.g., "x squared plus 2x plus 1")
- If you don't know something, say so honestly
- Always end with encouragement or a follow-up question when appropriate
- Keep the vibe like chatting with a cool, smart friend — NOT a textbook
- Keep responses concise for voice — aim for 2-3 sentences unless explaining a concept`;

const BUDDY_FIRST_MESSAGE = "Hey! I'm Buddy, your study companion. What would you like to learn about today?";

async function getOrCreateAgent(supabaseAdmin: any, elevenlabsKey: string): Promise<string> {
  // Check if agent_id exists in config
  const { data: config } = await supabaseAdmin
    .from("app_config")
    .select("value")
    .eq("key", "elevenlabs_agent_id")
    .single();

  if (config?.value) {
    return config.value;
  }

  // Create new agent via ElevenLabs API
  console.log("Creating new ElevenLabs Conversational AI agent...");

  const createResponse = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
    method: "POST",
    headers: {
      "xi-api-key": elevenlabsKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Buddy - Study Companion",
      conversation_config: {
        agent: {
          prompt: {
            prompt: BUDDY_SYSTEM_PROMPT,
          },
          first_message: BUDDY_FIRST_MESSAGE,
          language: "en",
        },
        tts: {
          voice_id: "EXAVITQu4vr4xnSDxMaL", // Sarah voice
        },
      },
    }),
  });

  if (!createResponse.ok) {
    const errText = await createResponse.text();
    console.error("Failed to create ElevenLabs agent:", createResponse.status, errText);
    throw new Error(`Failed to create agent: ${createResponse.status} - ${errText}`);
  }

  const { agent_id } = await createResponse.json();
  console.log("Created ElevenLabs agent:", agent_id);

  // Store agent_id in config using service role (bypasses RLS)
  const { error: insertError } = await supabaseAdmin
    .from("app_config")
    .upsert({ key: "elevenlabs_agent_id", value: agent_id });

  if (insertError) {
    console.error("Failed to store agent_id:", insertError);
    // Still return the agent_id even if we couldn't store it
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

    // Get or create the agent
    const agentId = await getOrCreateAgent(supabaseAdmin, ELEVENLABS_API_KEY);

    // Generate a conversation token
    const tokenResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
      {
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
        },
      }
    );

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("Failed to get conversation token:", tokenResponse.status, errText);
      throw new Error(`Failed to get token: ${tokenResponse.status}`);
    }

    const { token } = await tokenResponse.json();

    return new Response(
      JSON.stringify({ token, agentId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("elevenlabs-buddy-session error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
