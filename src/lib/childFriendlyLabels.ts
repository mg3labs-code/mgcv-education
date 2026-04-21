/**
 * Age-appropriate label mapping for Classes 7-10.
 * Internal codes stay technical; UI surfaces these friendly versions.
 */

export const dayLabels = {
  1: { name: "Spark", subtitle: "First taste of the idea", emoji: "✨", duration: "4 min" },
  2: { name: "Build", subtitle: "Go a little deeper", emoji: "🔨", duration: "6 min" },
  3: { name: "Master", subtitle: "Make it truly yours", emoji: "🎓", duration: "8 min" },
} as const;

export const modeLabels = {
  explorer: { name: "Quick Look", emoji: "🌱", tint: "hsl(160 60% 45%)" },
  builder: { name: "Deep Dive", emoji: "🔨", tint: "hsl(215 70% 55%)" },
  master: { name: "Full Story", emoji: "🎓", tint: "hsl(265 60% 55%)" },
} as const;

export const friendlyLabels = {
  hookQuestion: "What do you think?",
  detective: "Believe It or Doubt It",
  prove: "Prove It",
  growth: "Your Growth",
  streak: "🔥 Your Streak",
  pickStyle: "Pick Your Style",
} as const;

export type DayNumber = 1 | 2 | 3;
