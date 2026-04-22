import { useEffect, useState } from "react";
import {
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

type WeatherKind =
  | "clear"
  | "cloudy"
  | "rain"
  | "thunder"
  | "snow"
  | "fog"
  | "unknown";

type Slot = {
  baseNickname: string;
  emoji: string;
  Icon: typeof Sun;
  tagline: string;
  from: string;
  to: string;
  text: string;
};

function pickSlot(date: Date): Slot {
  const h = date.getHours();
  if (h < 5)
    return { baseNickname: "Night Owl", emoji: "🦉", Icon: Moon, tagline: "the world is quiet — perfect time to think.", from: "from-indigo-500/15", to: "to-violet-500/15", text: "text-indigo-700" };
  if (h < 8)
    return { baseNickname: "Early Bird", emoji: "🌅", Icon: Sunrise, tagline: "you beat the sun — gold star already.", from: "from-amber-400/15", to: "to-rose-400/15", text: "text-amber-700" };
  if (h < 12)
    return { baseNickname: "Morning Spark", emoji: "✨", Icon: Sun, tagline: "fresh brain, fresh start.", from: "from-yellow-400/15", to: "to-orange-400/15", text: "text-amber-700" };
  if (h < 15)
    return { baseNickname: "Sunny Star", emoji: "☀️", Icon: Sun, tagline: "bright minds shine brighter.", from: "from-orange-400/15", to: "to-yellow-400/15", text: "text-orange-700" };
  if (h < 18)
    return { baseNickname: "Golden Hour", emoji: "🌻", Icon: Sun, tagline: "afternoon glow looks good on you.", from: "from-amber-400/15", to: "to-orange-500/15", text: "text-amber-700" };
  if (h < 21)
    return { baseNickname: "Sunset Scholar", emoji: "🌇", Icon: Sunset, tagline: "winding down? a few minutes goes a long way.", from: "from-rose-400/15", to: "to-purple-400/15", text: "text-rose-700" };
  if (h < 24)
    return { baseNickname: "Stargazer", emoji: "🌙", Icon: CloudMoon, tagline: "calm night vibes — let curiosity be your nightlight.", from: "from-indigo-500/15", to: "to-blue-500/15", text: "text-indigo-700" };
  return { baseNickname: "Friend", emoji: "🌟", Icon: Star, tagline: "good to see you again.", from: "from-primary/15", to: "to-accent/15", text: "text-primary" };
}

function classifyWeather(code: number | null | undefined): WeatherKind {
  if (code == null) return "unknown";
  if (code === 0) return "clear";
  if ([1, 2, 3].includes(code)) return "cloudy";
  if ([45, 48].includes(code)) return "fog";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "thunder";
  return "unknown";
}

function applyWeather(slot: Slot, weather: WeatherKind, isDay: boolean): Slot {
  if (!isDay) return slot;
  if (weather === "rain")
    return { ...slot, baseNickname: "Rainy Thinker", emoji: "🌧️", Icon: CloudRain, tagline: "rain outside, ideas inside — let's go.", from: "from-sky-500/15", to: "to-blue-500/15", text: "text-sky-700" };
  if (weather === "thunder")
    return { ...slot, baseNickname: "Storm Scholar", emoji: "⛈️", Icon: CloudLightning, tagline: "thunder out there, lightning in your head.", from: "from-indigo-500/15", to: "to-violet-500/15", text: "text-indigo-700" };
  if (weather === "snow")
    return { ...slot, baseNickname: "Snow Day Star", emoji: "❄️", Icon: CloudSnow, tagline: "cosy day — perfect for a calm warm-up.", from: "from-cyan-400/15", to: "to-blue-400/15", text: "text-sky-700" };
  if (weather === "fog")
    return { ...slot, baseNickname: "Misty Mind", emoji: "🌫️", Icon: CloudFog, tagline: "foggy outside — let's clear things up inside.", from: "from-slate-400/15", to: "to-zinc-400/15", text: "text-slate-700" };
  if (weather === "cloudy")
    return { ...slot, baseNickname: "Cloud Cruiser", emoji: "☁️", Icon: Cloud, tagline: "cloudy and chill — easy pace, sharp mind.", from: "from-slate-400/15", to: "to-blue-300/15", text: "text-slate-700" };
  return slot;
}

async function getCoords(): Promise<{ lat: number; lon: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 2500);
    navigator.geolocation.getCurrentPosition(
      (pos) => { clearTimeout(timer); resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }); },
      () => { clearTimeout(timer); resolve(null); },
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
    return { kind: classifyWeather(json?.current?.weather_code), isDay: json?.current?.is_day === 1 };
  } catch {
    return { kind: "unknown", isDay: true };
  }
}

interface DashboardGreetingProps {
  firstName: string;
  subline?: string;
}

const DashboardGreeting = ({ firstName, subline }: DashboardGreetingProps) => {
  const [slot, setSlot] = useState<Slot>(() => pickSlot(new Date()));

  useEffect(() => {
    let mounted = true;
    getWeather().then((w) => {
      if (!mounted) return;
      setSlot(applyWeather(pickSlot(new Date()), w.kind, w.isDay));
    });
    return () => { mounted = false; };
  }, []);

  const Icon = slot.Icon;
  const nickname = `${slot.baseNickname}, ${firstName}`;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div
          style={{ fontFamily: "'Source Serif 4', serif", fontSize: 26, fontWeight: 700, color: "#1C1917" }}
        >
          Hi, {firstName}! <span style={{ fontSize: 24 }}>{slot.emoji}</span>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r ${slot.from} ${slot.to} ${slot.text}`}
          style={{ border: "1px solid rgba(0,0,0,0.04)" }}
        >
          <Icon className="h-3 w-3" />
          {nickname}
        </span>
      </div>
      <p style={{ fontSize: 14, color: "#78716C", margin: "6px 0 0" }}>
        {slot.tagline}
        {subline ? <span style={{ color: "#A8A29E" }}> · {subline}</span> : null}
      </p>
    </div>
  );
};

export default DashboardGreeting;
