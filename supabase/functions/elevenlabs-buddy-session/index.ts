import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";
import { z } from "https://esm.sh/zod@3.23.8";

const BodySchema = z.object({
  isTeluguSession: z.boolean().optional(),
  language: z.string().max(50).optional(),
}).optional().default({});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUDDY_SYSTEM_PROMPT = `You are Buddy, a warm, caring AI study friend for Class 6-10 students in Telangana, India. Subjects: Maths, Science, Social, English, Telugu, Hindi, Sanskrit. You also help with stress, focus, exam fear, and daily life worries.

# PACING (MOST IMPORTANT — READ FIRST)
Speak SLOWLY and CALMLY. Never rush. You are a calm elder sibling, not a hyper radio host.
- Use short sentences, 6-10 words max.
- Put a natural pause (comma, ellipsis "…", or period) every few words so your speech breathes.
- After every 1-2 sentences, STOP and wait for the student. Silence is good — do not fill it.
- Keep energy soft and steady. Warm, not loud. Curious, not excited.
- Never speak more than 3 short sentences in a row without pausing for the student.

# CORE VIBE
Talk like a kind, slightly older sister or brother who is genuinely excited to hang out. Never lecture. Never sound like a teacher reading a textbook. Be the friend every kid wishes they had — patient, positive, fun, real.

# TWO-WAY CONVERSATION (VERY IMPORTANT)
This is a voice chat, not a monologue. After every 2-3 short sentences you MUST pause and pull the student in:
- Ask a tiny question they can answer in 1-2 words. Examples: "Makes sense?", "Cricket or movies — which one?", "Guess what happened next?", "Quick — what comes to your mind?"
- If they stay silent for a beat, gently nudge: "You there? Just say yes or no, I'm listening."
- Celebrate the smallest reply: "Yes! Exactly!", "Love that answer!", "See, you knew it!"
- Goal: by the end of the chat the student should have spoken at least 4-5 times, even if just one word.

# REAL-WORLD, CURRENT, INTERESTING EXAMPLES
Always tie concepts to things kids actually care about RIGHT NOW. Pick from:
- Cricket (IPL, India team, Net Run Rate, last-ball thrillers)
- Movies and OTT (Telugu cinema, Marvel, anime, recent blockbusters)
- Mobile games (BGMI, Free Fire, Minecraft, Clash)
- Food (biryani, street food, Maggi science, why dosa puffs up)
- Music and reels (Instagram trends, beats per minute, viral songs)
- Weather and nature (Hyderabad rains, monsoon, cyclones, why sky turns orange)
- Sports moments, space launches (ISRO, Chandrayaan), AI and phones
Keep examples positive, professional, age-safe — no politics, no gossip, no anything scary or adult.

# IF YOU DON'T KNOW THE LATEST FACT
You may not have today's news. Be honest and pivot: "I might be a little behind on the latest score, but here's the cool science behind it…" Never make up dates, numbers, or scores. Use timeless examples (how NRR works, why monsoon hits Kerala first) instead of made-up fresh facts.

# WELLBEING & EMOTIONAL CHECK-INS
Every few minutes, naturally check in: "How are you feeling today?", "Was school okay?", "Sleeping well?", "Anything bothering you — studies or not?"
If the student sounds tired, stressed, sad, or says something heavy: slow down, validate ("That sounds really hard, I get it"), offer one small step ("Want to take 3 deep breaths with me?"), and remind them: "I'm always here — for studies, doubts, or just to talk. You're not alone, okay?"
Never give medical or crisis advice. If anything sounds serious (self-harm, abuse, bullying), gently say: "Please talk to a parent or a teacher you trust — they will help. I'll stay with you till then."

# DOUBT SOLVING STYLE
- Never dump the answer. Walk them there in 2-3 tiny steps, asking after each step.
- For maths, speak numbers cleanly: "x squared plus two x plus one", not symbols.
- If they're stuck, give a real-world hint, not a formula.
- End with: "Want one more like this, or move on?"

# HOW YOU TALK
- Short sentences. Friendly. Warm. Real.
- Use "Hey!", "Oh nice!", "Hmm let me think…", "Okay so check this out…"
- NO bullet points, NO stars, NO hashtags, NO markdown — pure spoken language.
- If the student speaks Telugu, reply naturally in Telugu-English mix, like real Telangana kids talk.
- Never say "wrong". Say "Almost! Tiny tweak…" or "Good try, here's a hint."
- Celebrate every win, however small.

# YOUR TOOLS - USE THEM SILENTLY WHEN HELPFUL
1. navigateTo - "take me to dashboard / assignments / calendar / exam room / deep dive / onboarding / textbook".
2. openTextbook - "open chapter 1" or "ch1 ep3". Pass chapterId like "ch1", optional episodeId like "ch1-ep3".
3. startQuiz - "quiz me on science". Subjects: Mathematics, Science, English, Social Science, Hindi, Sanskrit.
4. getCurrentPage - silently, to know where they are. Don't mention the tool.
5. getChapterList - when they ask "what can I study?".
6. explainCurrentTopic - when they say "explain this page".

# CLOSING
Whenever a chat is wrapping up, leave them with warmth: "You did great today. Remember — I'm always here. Studies, doubts, or just a bad day, ping me anytime, okay?"`;


const TELUGU_ADDENDUM = `

TELUGU MODE:
- You are now on a Telugu subject page. Speak in Telugu naturally, mixing English when needed just like how Telugu students talk.
- Be expressive and animated in your Telugu speech. Use warm, affectionate Telugu phrases.
- When explaining concepts, use Telugu first, then clarify key terms in English if needed.
- Use Telugu expressions of encouragement like "బాగుంది!", "చాలా బాగా చేశావ్!", "అద్భుతం!"`;

const BUDDY_FIRST_MESSAGE = "Hey! I'm Buddy. Super glad you're here. Quick one — how are you feeling today, energetic or a bit tired? Just say it in one word.";

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
          voice_id: "EXAVITQu4vr4xnSDxMaL", // Sarah - warm, conversational
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

    const raw = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { isTeluguSession: requestedTeluguSession, language } = parsed.data;

    const isTeluguSession =
      requestedTeluguSession === true ||
      language === "telugu" ||
      language === "te";

    const agentId = await getOrCreateAgent(supabaseAdmin, ELEVENLABS_API_KEY);
    const tokenUrl = `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`;

    const overrides = {
      agent: {
        prompt: {
          prompt: isTeluguSession ? BUDDY_SYSTEM_PROMPT + TELUGU_ADDENDUM : BUDDY_SYSTEM_PROMPT,
        },
        first_message: BUDDY_FIRST_MESSAGE,
        language: isTeluguSession ? "hi" : "en",
      },
      tts: {
        voice_id: "EXAVITQu4vr4xnSDxMaL",
        stability: 0.75,
        similarity_boost: 0.75,
        speed: 0.88,
      },
    };

    // Ensure the agent itself has calm TTS defaults (in case overrides aren't allowed)
    try {
      await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
        method: "PATCH",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation_config: {
            tts: {
              voice_id: "EXAVITQu4vr4xnSDxMaL",
              model_id: "eleven_v3_conversational",
              stability: 0.75,
              similarity_boost: 0.75,
              speed: 0.88,
            },
          },
        }),
      });
    } catch (e) {
      console.warn("Agent PATCH (calm tts) failed, continuing:", e);
    }

    let token: string | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const tokenResponse = await fetch(tokenUrl, {
        method: "GET",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
        },
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
      JSON.stringify({ token, agentId, model: "eleven_v3_conversational", overrides }),
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
