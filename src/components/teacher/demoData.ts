// Shared dummy data used by the Live Intelligence Hub widgets when
// real RLS-scoped queries return empty (e.g. teacher viewing an
// unseeded class). Keeps the dashboard always feeling alive +
// demo-ready without polluting the database.

export const DEMO_NAMES = [
  "Aanya Sharma", "Arjun Reddy", "Kavya Iyer", "Vivaan Jain", "Diya Patel",
  "Rohan Mehta", "Ishita Rao", "Aarav Kumar", "Sara Khan", "Krish Verma",
  "Meera Nair", "Aditya Singh", "Pari Joshi", "Yash Gupta", "Anvi Das",
  "Reyansh Bose",
];

export const DEMO_SIGNALS = [
  { id: "d-1", kind: "rung" as const, studentName: "Aanya Sharma", text: "Rung 4/5 · core", meta: "real-numbers-ep1", at: new Date(Date.now() - 30 * 1000).toISOString() },
  { id: "d-2", kind: "thought" as const, studentName: "Arjun Reddy", text: "I think HCF is the biggest common factor of two numbers, like a shared rhythm.", meta: "hcf-lcm", at: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
  { id: "d-3", kind: "vibe" as const, studentName: "Kavya Iyer", text: "Feeling 🔥 — this clicked!", meta: "polynomials-ep2", at: new Date(Date.now() - 4 * 60 * 1000).toISOString() },
  { id: "d-4", kind: "rung" as const, studentName: "Diya Patel", text: "Rung 3/5 · advanced", meta: "quadratics-ep1", at: new Date(Date.now() - 7 * 60 * 1000).toISOString() },
  { id: "d-5", kind: "thought" as const, studentName: "Rohan Mehta", text: "If a number ends in 0, both 2 and 5 must be inside it…", meta: "real-numbers", at: new Date(Date.now() - 12 * 60 * 1000).toISOString() },
  { id: "d-6", kind: "rung" as const, studentName: "Ishita Rao", text: "Rung 5/5 · core", meta: "trigonometry-ep1", at: new Date(Date.now() - 18 * 60 * 1000).toISOString() },
  { id: "d-7", kind: "vibe" as const, studentName: "Aarav Kumar", text: "Confused 😕 needs another example", meta: "polynomials", at: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
  { id: "d-8", kind: "thought" as const, studentName: "Sara Khan", text: "Quadratic looks like a bouncing ball path — both have a peak.", meta: "quadratics", at: new Date(Date.now() - 41 * 60 * 1000).toISOString() },
  { id: "d-9", kind: "rung" as const, studentName: "Krish Verma", text: "Rung 2/5 · foundation", meta: "real-numbers-ep2", at: new Date(Date.now() - 55 * 60 * 1000).toISOString() },
  { id: "d-10", kind: "rung" as const, studentName: "Meera Nair", text: "Rung 4/5 · advanced", meta: "trigonometry-ep2", at: new Date(Date.now() - 70 * 60 * 1000).toISOString() },
];

export const DEMO_MISCONCEPTIONS = [
  { chapter: "real-numbers", episode: "euclid-division", block: "ladder", attempts: 42, wrong: 24, studentCount: 11, stuckRate: 0.57 },
  { chapter: "polynomials", episode: "factor-theorem", block: "trap_tf", attempts: 38, wrong: 17, studentCount: 9, stuckRate: 0.45 },
  { chapter: "quadratics", episode: "completing-square", block: "tricky_mcq", attempts: 51, wrong: 19, studentCount: 12, stuckRate: 0.37 },
  { chapter: "trigonometry", episode: "ratios-intro", block: "vibe_check", attempts: 29, wrong: 9, studentCount: 7, stuckRate: 0.31 },
  { chapter: "real-numbers", episode: "hcf-lcm", block: "sort_activity", attempts: 33, wrong: 8, studentCount: 6, stuckRate: 0.24 },
  { chapter: "linear-eq", episode: "graphical-method", block: "ladder", attempts: 27, wrong: 5, studentCount: 4, stuckRate: 0.18 },
];

export const DEMO_DEPTH = {
  dist: { foundation: 5, core: 9, advanced: 4 },
  byChapter: {
    "real-numbers": [
      { user_id: "demo-1", name: "Aanya Sharma", episode_id: "ep-1", current_rung: 4, depth_track: "core" as const },
      { user_id: "demo-2", name: "Arjun Reddy", episode_id: "ep-1", current_rung: 5, depth_track: "advanced" as const },
      { user_id: "demo-3", name: "Kavya Iyer", episode_id: "ep-2", current_rung: 3, depth_track: "core" as const },
      { user_id: "demo-4", name: "Vivaan Jain", episode_id: "ep-2", current_rung: 2, depth_track: "foundation" as const },
    ],
    "polynomials": [
      { user_id: "demo-5", name: "Diya Patel", episode_id: "ep-1", current_rung: 4, depth_track: "advanced" as const },
      { user_id: "demo-6", name: "Rohan Mehta", episode_id: "ep-1", current_rung: 3, depth_track: "core" as const },
      { user_id: "demo-7", name: "Ishita Rao", episode_id: "ep-2", current_rung: 2, depth_track: "foundation" as const },
    ],
    "quadratics": [
      { user_id: "demo-8", name: "Aarav Kumar", episode_id: "ep-1", current_rung: 3, depth_track: "core" as const },
      { user_id: "demo-9", name: "Sara Khan", episode_id: "ep-1", current_rung: 4, depth_track: "core" as const },
      { user_id: "demo-10", name: "Krish Verma", episode_id: "ep-2", current_rung: 1, depth_track: "foundation" as const },
    ],
  },
};

export const DEMO_HOOKS = [
  { concept: "Real Numbers", interest: "cricket", line: "Open Real Numbers like a cricket scoreboard — show how a single rule keeps the score honest." },
  { concept: "Polynomials", interest: "cricket", line: "Frame Polynomials as a batting trajectory — every coefficient bends the ball's path." },
  { concept: "Quadratics", interest: "food", line: "Start Quadratics from a kitchen — doubling rice for 2x guests reveals the squared term in 30 seconds." },
];
