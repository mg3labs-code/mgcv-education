// Interest-themed visual system for the 3-day curiosity arc.
// Every hook / aha / build / master surface can pull from this single source
// so the arc visually syncs to the student's chosen domain (cricket, food, …).

import type { PilotInterest } from "@/data/dayPilotContent";

export interface DayScene {
  emoji: string;
  caption: string;
}

export interface InterestVisual {
  tag: PilotInterest;
  label: string;
  emoji: string;
  /** Hero photo (Unsplash, optimized). */
  image: string;
  /** Photographer / credit short label, optional. */
  credit?: string;
  /** Tailwind-safe hex for accents and pills. */
  accent: string;
  accentSoft: string;
  /** CSS gradient overlay used on top of the photo to keep text legible. */
  overlay: string;
  /** Small motif emojis layered as confetti behind the scene. */
  motifs: string[];
  /** Per-day scene context — short, punchy, in the student's world. */
  scenes: { 1: DayScene; 2: DayScene; 3: DayScene };
}

const baseOverlay = (h1: string, h2: string) =>
  `linear-gradient(160deg, ${h1} 0%, rgba(0,0,0,0.35) 55%, ${h2} 100%)`;

export const INTEREST_VISUALS: Record<PilotInterest, InterestVisual> = {
  cricket: {
    tag: "cricket",
    label: "Cricket",
    emoji: "🏏",
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=900&q=80",
    accent: "#22D3EE",
    accentSoft: "rgba(34,211,238,0.18)",
    overlay: baseOverlay("rgba(8,47,73,0.78)", "rgba(2,6,23,0.92)"),
    motifs: ["🏏", "🏟️", "⚡", "🎯"],
    scenes: {
      1: { emoji: "🏏", caption: "Last over · 18 needed off 6 — what do the numbers really say?" },
      2: { emoji: "📊", caption: "Two run-rates. One wins the qualifier. Spot why." },
      3: { emoji: "🏆", caption: "You're the analyst — call the next move from the data." },
    },
  },
  food: {
    tag: "food",
    label: "Foodie",
    emoji: "🍔",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&q=80",
    accent: "#FB923C",
    accentSoft: "rgba(251,146,60,0.20)",
    overlay: baseOverlay("rgba(67,20,7,0.78)", "rgba(20,7,2,0.92)"),
    motifs: ["🍕", "🍟", "🥤", "🧾"],
    scenes: {
      1: { emoji: "🧾", caption: "₹847 bill, 4 friends, 1 didn't drink — split it fairly." },
      2: { emoji: "🍕", caption: "Recipe for 3 → cooking for 7. Scale it without ruining the dough." },
      3: { emoji: "👩‍🍳", caption: "Your café, your menu — price a combo that still earns ₹40." },
    },
  },
  movies: {
    tag: "movies",
    label: "Movies",
    emoji: "🎬",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&q=80",
    accent: "#F472B6",
    accentSoft: "rgba(244,114,182,0.20)",
    overlay: baseOverlay("rgba(49,10,40,0.80)", "rgba(15,5,20,0.92)"),
    motifs: ["🎬", "🎞️", "🍿", "⭐"],
    scenes: {
      1: { emoji: "🎞️", caption: "24 frames every second — why does a fast pan still look smooth?" },
      2: { emoji: "✂️", caption: "Two cuts of the same scene. One feels longer. Find the trick." },
      3: { emoji: "🎬", caption: "You're editing the trailer — pick the cut that hooks in 8s." },
    },
  },
  gaming: {
    tag: "gaming",
    label: "Gaming",
    emoji: "🎮",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=900&q=80",
    accent: "#A78BFA",
    accentSoft: "rgba(167,139,250,0.20)",
    overlay: baseOverlay("rgba(20,8,55,0.82)", "rgba(8,4,28,0.94)"),
    motifs: ["🎮", "🕹️", "💎", "⚔️"],
    scenes: {
      1: { emoji: "🎯", caption: "120 FPS vs 60 FPS — when does your eye actually notice?" },
      2: { emoji: "📈", caption: "Rank climb stalled at Diamond. The math says why." },
      3: { emoji: "🏅", caption: "Design the loot drop — odds that feel fair but stay rare." },
    },
  },
  music: {
    tag: "music",
    label: "Music",
    emoji: "🎵",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=900&q=80",
    accent: "#34D399",
    accentSoft: "rgba(52,211,153,0.20)",
    overlay: baseOverlay("rgba(6,40,30,0.80)", "rgba(2,12,10,0.94)"),
    motifs: ["🎵", "🎧", "🥁", "🎚️"],
    scenes: {
      1: { emoji: "🎧", caption: "120 BPM. Your foot taps anyway — what's your brain counting?" },
      2: { emoji: "🥁", caption: "Same beat, two time-signatures. One makes you dance." },
      3: { emoji: "🎚️", caption: "Mix the drop — pick the tempo that lifts the room." },
    },
  },
  travel: {
    tag: "travel",
    label: "Travel",
    emoji: "✈️",
    image: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=900&q=80",
    accent: "#38BDF8",
    accentSoft: "rgba(56,189,248,0.20)",
    overlay: baseOverlay("rgba(8,30,60,0.80)", "rgba(2,10,25,0.92)"),
    motifs: ["✈️", "🧳", "🗺️", "⛽"],
    scenes: {
      1: { emoji: "⛽", caption: "Hyderabad → Goa, 612 km, ₹104/L. Will ₹2,000 of fuel make it?" },
      2: { emoji: "🧭", caption: "Two routes. One is shorter, one is faster — pick & defend it." },
      3: { emoji: "🗺️", caption: "Plan a 5-day trip on ₹12,000 — every rupee earns its seat." },
    },
  },
  tech: {
    tag: "tech",
    label: "Tech",
    emoji: "💻",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80",
    accent: "#60A5FA",
    accentSoft: "rgba(96,165,250,0.20)",
    overlay: baseOverlay("rgba(10,20,55,0.82)", "rgba(2,6,25,0.94)"),
    motifs: ["💻", "📱", "⚙️", "🔋"],
    scenes: {
      1: { emoji: "🔋", caption: "100% → 20% in 4 hours. When does your phone really die?" },
      2: { emoji: "📡", caption: "5G says 1.2 Gbps. Your download crawls. The bottleneck is…" },
      3: { emoji: "⚙️", caption: "Spec a phone for ₹18k that beats one at ₹25k. Trade-offs." },
    },
  },
  nature: {
    tag: "nature",
    label: "Nature",
    emoji: "🌧",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&q=80",
    accent: "#4ADE80",
    accentSoft: "rgba(74,222,128,0.20)",
    overlay: baseOverlay("rgba(6,40,20,0.80)", "rgba(2,15,8,0.94)"),
    motifs: ["🌧", "🌳", "🦅", "🌊"],
    scenes: {
      1: { emoji: "🌧", caption: "120 mm rain in 2 hours flooded one street, not the next. Why?" },
      2: { emoji: "🌳", caption: "One forest grows back in 5 years, another takes 50. The pattern." },
      3: { emoji: "🦅", caption: "You design a wildlife corridor — defend it with the numbers." },
    },
  },
};

export function getInterestVisual(tag?: string | null): InterestVisual {
  if (tag && (tag as PilotInterest) in INTEREST_VISUALS) {
    return INTEREST_VISUALS[tag as PilotInterest];
  }
  return INTEREST_VISUALS.cricket;
}
