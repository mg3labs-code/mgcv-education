/**
 * Confidence Ladder — hand-authored Rungs for Chapter 1 of each subject.
 *
 * The ladder is invisible to students. They just feel "I'm getting it."
 * Internal mental model:
 *   Rung 1 RECOGNIZE  – gimme, 10-sec yes
 *   Rung 2 NOTICE     – small surprise, one twist
 *   Rung 3 EXPLAIN    – say it in your own words
 *   Rung 4 DEFEND     – hold your ground vs a tricky case
 *   Rung 5 APPLY      – use it somewhere new
 *
 * Used for chapter 1 across Maths, Physics, Chemistry, Biology.
 * Other chapters: AI-generated on first open, cached in concept_rungs table.
 */

export type RungType = "yesno" | "mcq" | "shortText" | "openText";

export interface Rung {
  prompt: string;
  type: RungType;
  options?: string[];
  /** Index of correct option (mcq/yesno: 0=yes/first option, 1=no/second). Optional for open prompts. */
  correctIndex?: number;
  /** Short hint shown after answering, builds the bridge to the concept. */
  reveal: string;
  /** Framing flavor — used by analytics, never shown raw to student. */
  clothing: "familiarity" | "stakes" | "social" | "difficulty";
}

export interface ConceptRungSet {
  conceptKey: string;
  conceptLabel: string;
  subject: "Maths" | "Physics" | "Chemistry" | "Biology";
  /** Optional regional flavor variants for rung 1–2 only. Key = lowercased region slug. */
  regionVariants?: Record<string, { rung1?: Partial<Rung>; rung2?: Partial<Rung> }>;
  rungs: [Rung, Rung, Rung, Rung, Rung];
}

/**
 * Index keyed by `${subject}/${chapter1Slug}` and concept_key.
 * Subject and chapter slug are matched loosely (case-insensitive, partial) at lookup time.
 */
export const CHAPTER_1_RUNGS: ConceptRungSet[] = [
  // ── MATHS Class 9/10 Chapter 1: Number Systems / Real Numbers ──
  {
    conceptKey: "real-numbers",
    conceptLabel: "Real Numbers",
    subject: "Maths",
    regionVariants: {
      telangana: {
        rung1: { prompt: "Quick gut-check: a coin lands heads 6 times out of 10 tosses. Is 6/10 a 'real' number you can plot on the number line?" },
      },
    },
    rungs: [
      {
        prompt: "Quick gut-check: a coin lands heads 6 times out of 10 tosses. Is 6/10 a 'real' number you can plot on the number line?",
        type: "yesno",
        options: ["Yes — I can plot it", "No — it's just a ratio"],
        correctIndex: 0,
        reveal: "Yes. 6/10 = 0.6 sits exactly between 0 and 1 on the number line. Every fraction of two whole numbers lands somewhere on that line — that's what makes it 'real'.",
        clothing: "familiarity",
      },
      {
        prompt: "IMD predicts the Kerala monsoon arrives ~June 1 every year, but the model actually says 31.4285714… May. Why does the headline get a clean date but the model keeps a never-ending decimal?",
        type: "mcq",
        options: ["IMD rounds for headlines; the model keeps the real average", "The model is wrong", "Weather is random"],
        correctIndex: 0,
        reveal: "Right. The average is sum ÷ count — most divisions don't terminate. Headlines round to 'June 1'; the maths keeps the full repeating tail. Same story behind every 'average rainfall', 'average temperature' you read.",
        clothing: "familiarity",
      },
      {
        prompt: "In your own words: why can't √2 be written as a simple fraction a/b?",
        type: "shortText",
        reveal: "Good thinking. If √2 could be written as a/b, you'd hit a contradiction — both a and b would have to keep being divisible by 2 forever. So no fraction works.",
        clothing: "difficulty",
      },
      {
        prompt: "A classmate insists 0.999... (nines forever) is NOT equal to 1. What do you tell them?",
        type: "shortText",
        reveal: "Trick: 1/3 = 0.333... Multiply both sides by 3 → 1 = 0.999... They really are the same number, just written differently.",
        clothing: "social",
      },
      {
        prompt: "Design a quick 5-second test you could use to check if a number a friend gives you is rational or irrational.",
        type: "openText",
        reveal: "Nice. One test: ask if it can be written as a fraction with whole numbers on top and bottom. If yes → rational. If the decimal goes on forever without a repeating pattern → irrational.",
        clothing: "difficulty",
      },
    ],
  },

  // ── PHYSICS Class 9 Chapter 1: Motion ──
  {
    conceptKey: "motion",
    conceptLabel: "Motion",
    subject: "Physics",
    regionVariants: {
      telangana: {
        rung1: { prompt: "You're sitting in a Hyderabad metro. The metro is moving. Are YOU moving?" },
      },
    },
    rungs: [
      {
        prompt: "You're sitting in a moving bus. Are YOU moving?",
        type: "mcq",
        options: ["Yes, I'm moving", "No, I'm sitting still", "Depends who you ask"],
        correctIndex: 2,
        reveal: "Both can be true. Compared to the seat — you're still. Compared to the road — you're flying. Motion always needs a reference point.",
        clothing: "familiarity",
      },
      {
        prompt: "Two friends run side by side at the same speed. Friend A says Friend B is NOT moving. Is A correct?",
        type: "yesno",
        options: ["Yes, A is right", "No, B is clearly running"],
        correctIndex: 0,
        reveal: "Yes — relative to A, B isn't moving (no distance opens up between them). To someone standing still, both are moving. This is 'relative motion'.",
        clothing: "stakes",
      },
      {
        prompt: "In your own words, what's the difference between speed and velocity?",
        type: "shortText",
        reveal: "Speed = how fast (just a number, like 60 km/h). Velocity = how fast AND in which direction (60 km/h north). Velocity tells the full story.",
        clothing: "difficulty",
      },
      {
        prompt: "A friend says: 'If I'm moving at constant velocity, no force is acting on me.' Are they fully right? Why or why not?",
        type: "shortText",
        reveal: "They're right that no NET force acts. But forces can still be present — they just cancel out. Like gravity pulling you down + the floor pushing you up.",
        clothing: "social",
      },
      {
        prompt: "Design a 30-second observation you could do at a bus stop to spot uniform motion vs non-uniform motion.",
        type: "openText",
        reveal: "Good idea. Watch a bus from far away on an empty road — looks like uniform motion. Watch the same bus near a signal — speeds up, slows down → non-uniform.",
        clothing: "difficulty",
      },
    ],
  },

  // ── CHEMISTRY Class 9 Chapter 1: Matter in Our Surroundings ──
  {
    conceptKey: "matter-states",
    conceptLabel: "States of Matter",
    subject: "Chemistry",
    rungs: [
      {
        prompt: "Pick one: which of these is NOT matter?",
        type: "mcq",
        options: ["Air in a balloon", "A glass of water", "Light from a bulb", "An ice cube"],
        correctIndex: 2,
        reveal: "Light is energy, not matter. Matter has mass and takes up space — air, water, ice all do. Light doesn't.",
        clothing: "familiarity",
      },
      {
        prompt: "You leave a wet cloth on a sunny windowsill. After 1 hour it's dry. Where did the water go?",
        type: "mcq",
        options: ["The sun absorbed it", "It turned into invisible water vapour in the air", "It seeped into the cloth permanently"],
        correctIndex: 1,
        reveal: "Water became vapour (a gas) and mixed into the air. You can't see it — but the air is now slightly more humid.",
        clothing: "stakes",
      },
      {
        prompt: "In your own words: why does ice take a fixed shape but water doesn't?",
        type: "shortText",
        reveal: "In ice, particles are locked tight in a pattern. In water, particles can slide past each other — so water takes the shape of whatever container it's in.",
        clothing: "difficulty",
      },
      {
        prompt: "A friend says: 'A gas has no mass — that's why a balloon floats.' Are they right? Convince them either way.",
        type: "shortText",
        reveal: "Gases DO have mass (you can weigh a filled balloon vs empty). Helium balloons float because helium is lighter than air, not because it has no mass.",
        clothing: "social",
      },
      {
        prompt: "Pick any object near you. Could you turn it into all three states (solid, liquid, gas) in real life? Explain.",
        type: "openText",
        reveal: "Most things can — water (ice → water → steam) is the easy one. A metal spoon needs a furnace to melt and a much hotter one to vapourise, but it's still possible.",
        clothing: "difficulty",
      },
    ],
  },

  // ── BIOLOGY Class 9/10 Chapter 1: The Fundamental Unit of Life / Life Processes ──
  {
    conceptKey: "cell",
    conceptLabel: "The Cell",
    subject: "Biology",
    rungs: [
      {
        prompt: "Are YOU made of cells?",
        type: "yesno",
        options: ["Yes", "No"],
        correctIndex: 0,
        reveal: "Yes — about 30 trillion of them. Skin, blood, brain, even your eyelashes. Cells are the building blocks of every living thing.",
        clothing: "familiarity",
      },
      {
        prompt: "Your friend cuts their finger. Within a week, the cut closes. How?",
        type: "mcq",
        options: ["Skin magically regrows", "Cells nearby divide and make new cells to fill the gap", "The body sends extra blood to the spot"],
        correctIndex: 1,
        reveal: "Cells divide. One becomes two, two become four, and they slowly fill the gap. This is how every wound heals.",
        clothing: "stakes",
      },
      {
        prompt: "In your own words: what's the difference between a plant cell and an animal cell?",
        type: "shortText",
        reveal: "Plant cells have a stiff cell wall + chloroplasts (for making food from sunlight). Animal cells don't — they're softer and need to eat for energy.",
        clothing: "difficulty",
      },
      {
        prompt: "A friend says: 'Bacteria aren't real cells — they're too small.' Convince them otherwise.",
        type: "shortText",
        reveal: "Bacteria ARE cells — just simpler ones (no nucleus). They eat, grow, divide, respond to their environment. All the things cells do.",
        clothing: "social",
      },
      {
        prompt: "If we discovered life on Mars made of something OTHER than cells, what would that mean for biology?",
        type: "openText",
        reveal: "Big deal. The 'cell theory' says all life on Earth is made of cells. Non-cellular life would mean a completely different way of being alive — and we'd need a new theory.",
        clothing: "difficulty",
      },
    ],
  },
];

/**
 * Look up a hand-authored rung set by subject + concept key.
 * Falls back to subject-level Chapter 1 default if exact concept not found.
 */
export function findAuthoredRungs(opts: {
  subject?: string | null;
  conceptKey?: string | null;
  chapterSlug?: string | null;
}): ConceptRungSet | null {
  const rawSubject = (opts.subject ?? "").toLowerCase();
  const chSlug = (opts.chapterSlug ?? "").toLowerCase();
  const subj = rawSubject.includes("math") || chSlug === "ch1"
    ? "maths"
    : rawSubject.includes("phys") || chSlug.startsWith("phy-")
      ? "physics"
      : rawSubject.includes("chem") || chSlug.startsWith("chem-") || chSlug.startsWith("sci-")
        ? "chemistry"
        : rawSubject.includes("bio") || chSlug.startsWith("bio-")
          ? "biology"
          : rawSubject;
  const key = (opts.conceptKey ?? "").toLowerCase();

  // Exact concept match
  const exact = CHAPTER_1_RUNGS.find(
    (r) => r.subject.toLowerCase() === subj && r.conceptKey === key,
  );
  if (exact) return exact;

  // Subject-level fallback for Chapter 1
  if (chSlug.includes("chapter-1") || chSlug.includes("ch-1") || chSlug.endsWith("-1") || chSlug === "1") {
    const subjectMatch = CHAPTER_1_RUNGS.find((r) => r.subject.toLowerCase() === subj);
    if (subjectMatch) return subjectMatch;
  }

  return null;
}

/** Apply a region variant on top of the base rung set (rungs 1–2 only). */
export function applyRegionVariant(
  set: ConceptRungSet,
  region?: string | null,
): ConceptRungSet {
  if (!region || !set.regionVariants) return set;
  const variant = set.regionVariants[region.toLowerCase()];
  if (!variant) return set;
  const merged: ConceptRungSet = {
    ...set,
    rungs: [...set.rungs] as ConceptRungSet["rungs"],
  };
  if (variant.rung1) merged.rungs[0] = { ...merged.rungs[0], ...variant.rung1 };
  if (variant.rung2) merged.rungs[1] = { ...merged.rungs[1], ...variant.rung2 };
  return merged;
}
