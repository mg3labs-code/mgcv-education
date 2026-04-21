import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Volume2,
  X,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  Star,
  CloudMoon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
} from "lucide-react";

const GREETING_KEY = "voice-greeting-shown-v3";

// Warm, friendly voice — Lily (pFZP5JQG7iQjIQuC4Bku). Single voice channel.
const WARM_VOICE_ID = "pFZP5JQG7iQjIQuC4Bku";

// ---- Weather types ----
type WeatherKind =
  | "clear"
  | "cloudy"
  | "rain"
  | "thunder"
  | "snow"
  | "fog"
  | "unknown";

type Slot = {
  /** Base time-of-day nickname, e.g. "Night Owl" */
  baseNickname: string;
  emoji: string;
  Icon: typeof Sun;
  /** Tagline written as if speaking *to* the student (no name baked in) */
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
  if (h < 5)
    return {
      baseNickname: "Night Owl",
      emoji: "🦉",
      Icon: Moon,
      tagline: "the world is quiet — perfect time to think.",
      from: "from-indigo-500/15",
      to: "to-violet-500/15",
      text: "text-indigo-700 dark:text-indigo-300",
    };
  // Early morning 5 – 7:59am
  if (h < 8)
    return {
      baseNickname: "Early Bird",
      emoji: "🌅",
      Icon: Sunrise,
      tagline: "you beat the sun — gold star already.",
      from: "from-amber-400/15",
      to: "to-rose-400/15",
      text: "text-amber-700 dark:text-amber-300",
    };
  // Morning 8 – 11:59am
  if (h < 12)
    return {
      baseNickname: "Morning Spark",
      emoji: "✨",
      Icon: Sun,
      tagline: "fresh brain, fresh start.",
      from: "from-yellow-400/15",
      to: "to-orange-400/15",
      text: "text-amber-700 dark:text-amber-300",
    };
  // Noon 12 – 2:59pm
  if (h < 15)
    return {
      baseNickname: "Sunny Star",
      emoji: "☀️",
      Icon: Sun,
      tagline: "bright minds shine brighter.",
      from: "from-orange-400/15",
      to: "to-yellow-400/15",
      text: "text-orange-700 dark:text-orange-300",
    };
  // Afternoon 3 – 5:59pm
  if (h < 18)
    return {
      baseNickname: "Golden Hour",
      emoji: "🌻",
      Icon: Sun,
      tagline: "afternoon glow looks good on you.",
      from: "from-amber-400/15",
      to: "to-orange-500/15",
      text: "text-amber-700 dark:text-amber-300",
    };
  // Evening 6 – 8:59pm
  if (h < 21)
    return {
      baseNickname: "Sunset Scholar",
      emoji: "🌇",
      Icon: Sunset,
      tagline: "winding down? a few minutes goes a long way.",
      from: "from-rose-400/15",
      to: "to-purple-400/15",
      text: "text-rose-700 dark:text-rose-300",
    };
  // Night 9 – 11:59pm
  if (h < 24)
    return {
      baseNickname: "Stargazer",
      emoji: "🌙",
      Icon: CloudMoon,
      tagline: "calm night vibes — let curiosity be your nightlight.",
      from: "from-indigo-500/15",
      to: "to-blue-500/15",
      text: "text-indigo-700 dark:text-indigo-300",
    };
  // Fallback (should never hit)
  return {
    baseNickname: "Friend",
    emoji: "🌟",
    Icon: Star,
    tagline: "good to see you again.",
    from: "from-primary/15",
    to: "to-accent/15",
    text: "text-primary",
  };
}

// ---- Open-Meteo WMO weather code → simple bucket ----
function classifyWeather(code: number | null | undefined): WeatherKind {
  if (code == null) return "unknown";
  if (code === 0) return "clear";
  if ([1, 2, 3].includes(code)) return "cloudy";
  if ([45, 48].includes(code)) return "fog";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "thunder";
  return "unknown";
}

/**
 * Blend weather + time slot to produce a final nickname (with name baked in)
 * and a short spoken line (~ ≤ 6 seconds when read aloud).
 */
function buildPersona(
  slot: Slot,
  weather: WeatherKind,
  isDay: boolean,
  fullName: string,
  role: string,
) {
  const first = (fullName.split(" ")[0] || "there").trim();
  const isStudent = role !== "teacher";

  // Weather can override time-of-day for daytime hours when it's striking
  let nickname = slot.baseNickname;
  let emoji = slot.emoji;
  let Icon = slot.Icon;
  let tagline = slot.tagline;
  let from = slot.from;
  let to = slot.to;
  let text = slot.text;

  if (isDay) {
    if (weather === "rain") {
      nickname = "Rainy Thinker";
      emoji = "🌧️";
      Icon = CloudRain;
      tagline = "rain outside, ideas inside — let's go.";
      from = "from-sky-500/15";
      to = "to-blue-500/15";
      text = "text-sky-700 dark:text-sky-300";
    } else if (weather === "thunder") {
      nickname = "Storm Scholar";
      emoji = "⛈️";
      Icon = CloudLightning;
      tagline = "thunder out there, lightning in your head.";
      from = "from-indigo-500/15";
      to = "to-violet-500/15";
      text = "text-indigo-700 dark:text-indigo-300";
    } else if (weather === "snow") {
      nickname = "Snow Day Star";
      emoji = "❄️";
      Icon = CloudSnow;
      tagline = "cosy day — perfect for a calm warm-up.";
      from = "from-cyan-400/15";
      to = "to-blue-400/15";
      text = "text-sky-700 dark:text-sky-300";
    } else if (weather === "fog") {
      nickname = "Misty Mind";
      emoji = "🌫️";
      Icon = CloudFog;
      tagline = "foggy outside — let's clear things up inside.";
      from = "from-slate-400/15";
      to = "to-zinc-400/15";
      text = "text-slate-700 dark:text-slate-300";
    } else if (weather === "cloudy") {
      nickname = "Cloud Cruiser";
      emoji = "☁️";
      Icon = Cloud;
      tagline = "cloudy and chill — easy pace, sharp mind.";
      from = "from-slate-400/15";
      to = "to-blue-300/15";
      text = "text-slate-700 dark:text-slate-300";
    }
    // clear / unknown → keep original time-of-day persona
  }

  // Spoken line — short, friendly, under ~6 seconds.
  // Aim for ~16-22 syllables: "Hey {name} — true {nickname}. {short tagline}"
  const teacherPrefix = isStudent ? "" : "you're a ";
  const spoken = isStudent
    ? `Hey ${first} — ${nickname}, ${first}. ${tagline}`
    : `Hey ${first} — ${teacherPrefix}${nickname.toLowerCase()} today. ${tagline}`;

  // Final display nickname includes name, Claude-style
  const displayNickname = `${nickname}, ${first}`;

  return {
    nickname,
    displayNickname,
    emoji,
    Icon,
    tagline,
    from,
    to,
    text,
    spoken,
    first,
  };
}

// ---- Geolocation + weather fetch (best-effort, all optional) ----
async function getCoords(): Promise<{ lat: number; lon: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 2500);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 2500, maximumAge: 30 * 60 * 1000 },
    );
  });
}

async function getWeather(): Promise<{ kind: WeatherKind; isDay: boolean }> {
  try {
    const coords = await getCoords();
    if (!coords) return { kind: "unknown", isDay: true };
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=weather_code,is_day`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return { kind: "unknown", isDay: true };
    const json = await res.json();
    const code = json?.current?.weather_code;
    const isDay = json?.current?.is_day === 1;
    return { kind: classifyWeather(code), isDay };
  } catch {
    return { kind: "unknown", isDay: true };
  }
}

const VoiceGreeting = () => {
  const { user, role } = useAuth();
  const [show, setShow] = useState(false);
  const [persona, setPersona] = useState<ReturnType<typeof buildPersona> | null>(
    null,
  );
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
      // Fetch profile + weather in parallel
      const [profileRes, weatherRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .maybeSingle(),
        getWeather(),
      ]);

      const fullName =
        profileRes.data?.full_name || user.email?.split("@")[0] || "there";
      const slot = pickSlot(new Date());
      const built = buildPersona(
        slot,
        weatherRes.kind,
        weatherRes.isDay,
        fullName,
        role,
      );

      setPersona(built);
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
            body: JSON.stringify({ text: built.spoken, voiceId: WARM_VOICE_ID }),
          },
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

  if (!show || !persona) return null;
  const Icon = persona.Icon;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] animate-fade-in max-w-md w-[92vw]">
      <div
        className={`relative bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden`}
      >
        {/* soft tinted backdrop matching the time slot + weather */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${persona.from} ${persona.to} pointer-events-none`}
          aria-hidden
        />

        <div className="relative px-4 py-3.5 flex items-start gap-3">
          {/* animated emoji + small weather/time icon */}
          <div className="relative shrink-0">
            <div
              className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${persona.from} ${persona.to} flex items-center justify-center text-2xl shadow-inner`}
              style={{ animation: "scale-in 0.3s ease-out" }}
            >
              {persona.emoji}
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-card border border-border flex items-center justify-center shadow">
              <Icon className={`h-3 w-3 ${persona.text}`} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Hey {persona.first} —
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${persona.from} ${persona.to} ${persona.text}`}
              >
                {persona.emoji} {persona.displayNickname}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground leading-snug mt-1">
              {persona.tagline}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
              <Volume2 className="h-3 w-3 animate-pulse" />
              <span className="truncate">{persona.spoken}</span>
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
