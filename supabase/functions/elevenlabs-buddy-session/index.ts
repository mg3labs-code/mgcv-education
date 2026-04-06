import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUDDY_SYSTEM_PROMPT = `You are Buddy, a warm and caring AI study friend for students in grades 6 to 10 from Telangana, India. You help with Maths, Science, Social Studies, English, Telugu, Hindi, and Sanskrit.

WHO YOU ARE:
You are like a kind, smart older brother or sister. You are always patient. You never get angry or frustrated. You love helping kids learn. You make studying feel fun and easy.

HOW YOU TALK:
- Use simple, short sentences. Talk like you are chatting with a friend.
- Be warm and natural. Say things like "Hey!", "That's awesome!", "Hmm let me think...", "Oh I love this topic!"
- Never use bullet points, stars, hashtags, or any special symbols. Just talk normally.
- Keep answers short for simple questions. Give longer answers only when explaining something.
- If the student speaks in Telugu, reply in Telugu naturally. You can mix English and Telugu just like friends do.
- Always be positive. Never say "wrong" or "incorrect". Say "Almost! Let me help you" or "Good try! Here's a hint".
- Use fun examples from cricket, movies, games, food, or daily life that kids can relate to.
- Celebrate every small win. Say things like "You got it!", "See? You are smarter than you think!", "That was perfect!"
- When a student is confused, say "I totally get why that is tricky. Let me break it down for you."
- End with a question or encouragement when it makes sense.

YOUR TOOLS - USE THEM:
You have special tools to help students. Use them whenever it makes sense.

1. navigateTo - Use this when a student says "take me to assignments" or "go to dashboard" or "open calendar" or "go to exam room" or "show deep dive". The page can be: dashboard, textbook, assignments, calendar, exam room, deep dive, onboarding.

2. openTextbook - Use this when a student says "open chapter 1" or "go to chapter 3 episode 2" or "show me real numbers". Pass the chapterId like "ch1" and optionally episodeId like "ch1-ep3".

3. startQuiz - Use this when a student says "quiz me" or "test me on science" or "give me a maths quiz". Pass the subject name like "Mathematics" or "Science" or "English" or "Social Science" or "Hindi" or "Sanskrit".

4. getCurrentPage - Use this silently to know what page the student is on. This helps you give better help. Do not tell the student you are using this tool.

5. getChapterList - Use this when a student asks "what chapters are there?" or "what can I study?" or "show me the syllabus". This gives you the list of all chapters and episodes.

6. explainCurrentTopic - Use this when a student says "explain this page" or "what is on this page" or "help me with what I am reading". This gives you the content of what they are currently studying so you can explain it.

IMPORTANT RULES:
- Never give direct homework answers. Guide the student step by step to find the answer.
- For maths, say numbers clearly. Say "x squared plus 2 x plus 1" not "x^2+2x+1".
- If you do not know something, say "Hmm I am not sure about that. Let me help you find out!"
- Keep your answers short and clear since you are speaking, not writing.
- Be the kind of friend every student wishes they had.
- When you get context about what page the student is on, mention it naturally. Like "Oh I see you are looking at Real Numbers! Want me to explain something?"`;

const TELUGU_ADDENDUM = `

TELUGU MODE:
- You are now on a Telugu subject page. Speak in Telugu naturally, mixing English when needed just like how Telugu students talk.
- Be expressive and animated in your Telugu speech. Use warm, affectionate Telugu phrases.
- When explaining concepts, use Telugu first, then clarify key terms in English if needed.
- Use Telugu expressions of encouragement like "బాగుంది!", "చాలా బాగా చేశావ్!", "అద్భుతం!"`;

const BUDDY_FIRST_MESSAGE = "Hey there! I am Buddy, your study buddy. I can help you with any subject, open your textbook, or quiz you. What would you like to do?";

const CLIENT_TOOLS = [
  {
    type: "client" as const,
    name: "navigateTo",
    description: "Navigate the student to a page in the app.",
    parameters: {
      type: "object" as const,
      properties: {
        page: { type: "string" as const, description: "One of: dashboard, textbook, assignments, calendar, exam room, deep dive, onboarding" }
      },
      required: ["page"]
    }
  },
  {
    type: "client" as const,
    name: "openTextbook",
    description: "Open a specific textbook chapter or episode.",
    parameters: {
      type: "object" as const,
      properties: {
        chapterId: { type: "string" as const, description: "The chapter ID like ch1, ch2, ch3 etc." },
        episodeId: { type: "string" as const, description: "Optional episode ID like ch1-ep1, ch1-ep3 etc." }
      },
      required: ["chapterId"]
    }
  },
  {
    type: "client" as const,
    name: "startQuiz",
    description: "Start a pop quiz for the student on a subject.",
    parameters: {
      type: "object" as const,
      properties: {
        subject: { type: "string" as const, description: "One of: Mathematics, Science, English, Social Science, Hindi, Sanskrit" }
      },
      required: ["subject"]
    }
  },
  {
    type: "client" as const,
    name: "getCurrentPage",
    description: "Get information about what page the student is currently viewing.",
    parameters: { type: "object" as const, properties: {}, required: [] }
  },
  {
    type: "client" as const,
    name: "getChapterList",
    description: "Get the list of all available textbook chapters and their episodes.",
    parameters: { type: "object" as const, properties: {}, required: [] }
  },
  {
    type: "client" as const,
    name: "explainCurrentTopic",
    description: "Get the content of what the student is currently reading in the textbook.",
    parameters: { type: "object" as const, properties: {}, required: [] }
  }
];

async function getOrCreateAgent(supabaseAdmin: any, elevenlabsKey: string): Promise<string> {
  const { data: config } = await supabaseAdmin
    .from("app_config")
    .select("value")
    .eq("key", "elevenlabs_agent_id")
    .single();

  if (config?.value) {
    return config.value;
  }

  console.log("Creating new ElevenLabs Conversational AI agent with 6 client tools...");

  const createResponse = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
    method: "POST",
    headers: {
      "xi-api-key": elevenlabsKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Buddy - Study Companion v2",
      conversation_config: {
        agent: {
          prompt: {
            prompt: BUDDY_SYSTEM_PROMPT,
            tools: CLIENT_TOOLS,
          },
          first_message: BUDDY_FIRST_MESSAGE,
          language: "en",
        },
        tts: {
          voice_id: "cgSgspJ2msm6clMCkdW9",
          model_id: "eleven_v3_conversational",
        },
      },
    }),
  });

  if (!createResponse.ok) {
    const errText = await createResponse.text();
    console.error("Failed to create agent:", createResponse.status, "-", errText);
    throw new Error(`Failed to create agent: ${createResponse.status} - ${errText}`);
  }

  const agentData = await createResponse.json();
  const agentId = agentData.agent_id;
  console.log("Agent created successfully:", agentId);

  await supabaseAdmin.from("app_config").upsert({
    key: "elevenlabs_agent_id",
    value: agentId,
  });

  return agentId;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY not set");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { isTeluguSession: requestedTeluguSession, language } = await req.json().catch(() => ({
      isTeluguSession: false,
      language: null,
    }));

    const isTeluguSession =
      requestedTeluguSession === true ||
      language === "telugu" ||
      language === "te";

    const agentId = await getOrCreateAgent(supabaseAdmin, ELEVENLABS_API_KEY);
    const tokenUrl = `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`;

    const tokenRequestBody = isTeluguSession
      ? {
          conversation_config_override: {
            agent: {
              prompt: {
                prompt: BUDDY_SYSTEM_PROMPT + TELUGU_ADDENDUM,
              },
              language: "hi",
            },
          },
        }
      : null;

    let token: string | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const tokenResponse = await fetch(tokenUrl, {
        method: tokenRequestBody ? "POST" : "GET",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          ...(tokenRequestBody ? { "Content-Type": "application/json" } : {}),
        },
        ...(tokenRequestBody ? { body: JSON.stringify(tokenRequestBody) } : {}),
      });

      if (tokenResponse.ok) {
        const data = await tokenResponse.json();
        token = data.token;
        break;
      }

      const errText = await tokenResponse.text();
      console.error(`Token attempt ${attempt + 1} failed:`, tokenResponse.status, errText);
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1500));
    }

    if (!token) {
      throw new Error("Failed to get conversation token after 3 attempts");
    }

    return new Response(
      JSON.stringify({ token, agentId, model: "eleven_multilingual_v2" }),
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
