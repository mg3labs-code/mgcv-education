import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Volume2, X, Moon, Sun, Sunrise, Sunset, Star, CloudMoon } from "lucide-react";

const GREETING_KEY = "voice-greeting-shown";

// Warm, friendly voice — Lily (pFZP5JQG7iQjIQuC4Bku). Single voice channel.
const WARM_VOICE_ID = "pFZP5JQG7iQjIQuC4Bku";

type Slot = {
  nickname: string;
  emoji: string;
  Icon: typeof Sun;
  tagline: string;
  // soft pastel pair → rendered as a gradient pill
  from: string;
  to: string;
  text: string;
};

/**
 * Pick a Claude-style time-aware nickname.
 * Cute, kind, short — meant to "connect" with the user before any other UI.
 */
function pickSlot(date: Date): Slot {
  const h = date.getHours();

  // Late night 12am – 4:59am
  if (h < 5) return {
    nickname: "Night Owl",
    emoji: "🦉",
    Icon: Moon,
    tagline: "the world is quiet — perfect time to think.",
    from: "from-indigo-500/15",
    to: "to-violet-500/15",
    text: "text-indigo-700 dark:text-indigo-300",
  };
  // Early morning 5 – 7:59am
  if (h < 8) return {
    nickname: "Early Bird",
    emoji: "🌅",
    Icon: Sunrise,
    tagline: "you beat the sun — gold star already.",
    from: "from-amber-400/15",
    to: "to-rose-400/15",
    text: "text-amber-700 dark:text-amber-300",
  };
  // Morning 8 – 11:59am
  if (h < 12) return {
    nickname: "Morning Spark",
    emoji: "✨",
    Icon: Sun,
    tagline: "fresh brain, fresh start — let's make it count.",
    from: "from-yellow-400/15",
    to: "to-orange-400/15",
    text: "text-amber-700 dark:text-amber-300",
  };
  // Noon 12 – 2:59pm
  if (h < 15) return {
    nickname: "Sunny Star",
    emoji: "☀️",
    Icon: Sun,
    tagline: "oh, it's sunny — bright minds shine brighter.",
    from: "from-orange-400/15",
    to: "to-yellow-400/15",
    text: "text-orange-700 dark:text-orange-300",
  };
  // Afternoon 3 – 5:59pm
  if (h < 18) return {
    nickname: "Golden Hour",
    emoji: "🌻",
    Icon: Sun,
    tagline: "afternoon glow looks good on you.",
    from: "from-amber-400/15",
    to: "to-orange-500/15",
    text: "text-amber-700 dark:text-amber-300",
  };
  // Evening 6 – 8:59pm
  if (h < 21) return {
    nickname: "Sunset Scholar",
    emoji: "🌇",
    Icon: Sunset,
    tagline: "winding down? a few minutes goes a long way.",
    from: "from-rose-400/15",
    to: "to-purple-400/15",
    text: "text-rose-700 dark:text-rose-300",
  };
  // Night 9 – 11:59pm
  if (h < 24) return {
    nickname: "Stargazer",
    emoji: "🌙",
    Icon: CloudMoon,
    tagline: "calm night vibes — let curiosity be your nightlight.",
    from: "from-indigo-500/15",
    to: "to-blue-500/15",
    text: "text-indigo-700 dark:text-indigo-300",
  };
  // Fallback (should never hit)
  return {
    nickname: "Friend",
    emoji: "🌟",
    Icon: Star,
    tagline: "good to see you again.",
    from: "from-primary/15",
    to: "to-accent/15",
    text: "text-primary",
  };
}

const buildLine = (slot: Slot, name: string, role: string) => {
  const first = name.split(" ")[0] || "there";
  if (role === "teacher") {
    return `Hey ${first} — looks like you're a ${slot.nickname.toLowerCase()} today. ${slot.tagline}`;
  }
  return `Hey ${first} — you're a true ${slot.nickname}. ${slot.tagline}`;
};

const VoiceGreeting = () => {
  const { user, role } = useAuth();
  const [show, setShow] = useState(false);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [line, setLine] = useState("");
  const [name, setName] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasStartedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !role) return;

    const todayKey = new Date().toISOString().split("T")[0];
    const guardKey = `${user.id}:${todayKey}`;

    if (hasStartedRef.current === guardKey) return;
    hasStartedRef.current = guardKey;

    const stored = localStorage.getItem(GREETING_KEY);
    if (stored === guardKey) return;

    const run = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      const fullName = data?.full_name || user.email?.split("@")[0] || "there";
      const s = pickSlot(new Date());
      const text = buildLine(s, fullName, role);

      setName(fullName);
      setSlot(s);
      setLine(text);
      setShow(true);
      localStorage.setItem(GREETING_KEY, guardKey);

      // Single voice — ElevenLabs only. No browser TTS fallback (avoids clash).
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts-stream`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ text, voiceId: WARM_VOICE_ID }),
          }
        );

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => {
            setTimeout(() => setShow(false), 2200);
            URL.revokeObjectURL(url);
          };
          audio.onerror = () => {
            setTimeout(() => setShow(false), 5500);
            URL.revokeObjectURL(url);
          };
          await audio.play();
          return;
        }
      } catch (e) {
        console.warn("ElevenLabs greeting TTS failed:", e);
      }

      // Visual-only fallback — no second voice
      setTimeout(() => setShow(false), 6500);
    };

    run();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [user, role]);

  const dismiss = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setShow(false);
  };

  if (!show || !slot) return null;
  const Icon = slot.Icon;
  const first = name.split(" ")[0] || "there";

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] animate-fade-in max-w-md w-[92vw]">
      <div
        className={`relative bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden`}
      >
        {/* soft tinted backdrop matching the time slot */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${slot.from} ${slot.to} pointer-events-none`}
          aria-hidden
        />

        <div className="relative px-4 py-3.5 flex items-start gap-3">
          {/* animated emoji + small clock-time icon */}
          <div className="relative shrink-0">
            <div
              className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${slot.from} ${slot.to} flex items-center justify-center text-2xl shadow-inner`}
              style={{ animation: "scale-in 0.3s ease-out" }}
            >
              {slot.emoji}
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-card border border-border flex items-center justify-center shadow">
              <Icon className={`h-3 w-3 ${slot.text}`} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Hey {first} —
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${slot.from} ${slot.to} ${slot.text}`}
              >
                {slot.emoji} {slot.nickname}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground leading-snug mt-1">
              {slot.tagline}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
              <Volume2 className="h-3 w-3 animate-pulse" />
              <span className="truncate">{line}</span>
            </p>
          </div>

          <button
            onClick={dismiss}
            className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="Dismiss greeting"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceGreeting;
