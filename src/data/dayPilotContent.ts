/**
 * Day-1/2/3 hand-authored content for the Math Ch1 Ep1 pilot.
 *
 * Keyed by `${chapterId}::${episodeId}`. If a key is not present,
 * the day gate is bypassed and the original reader renders.
 *
 * Keep copy short, simple, and warm — Class 7 reading level.
 */

export interface SortBucketSpec {
  id: string;
  label: string;
  emoji?: string;
  tint?: string;
}

export interface SortItemSpec {
  id: string;
  label: string;
  bucketId?: string; // for buckets mode
  matchId?: string; // for pairs mode
}

export interface SortBucketsActivity {
  variant: "buckets";
  title: string;
  subtitle?: string;
  buckets: SortBucketSpec[];
  items: SortItemSpec[];
  explainOnWrong: string;
  explainOnRight: string;
}

export interface SortPairsActivity {
  variant: "pairs";
  title: string;
  subtitle?: string;
  leftItems: SortItemSpec[];
  rightItems: SortItemSpec[];
  explainOnWrong: string;
  explainOnRight: string;
}

export interface SortOrderActivity {
  variant: "order";
  title: string;
  subtitle?: string;
  correctOrder: SortItemSpec[];
  explainOnWrong: string;
  explainOnRight: string;
}

export type SortActivity = SortBucketsActivity | SortPairsActivity | SortOrderActivity;

export interface DayPilotContent {
  hookQuestion: string;
  conceptText: string;
  detective: { statement: string; isTrue: boolean; explain: string };
  /** Optional 1-question multiple-choice quick check shown after Detective on Day 1. */
  quickCheck?: {
    prompt: string;
    options: string[];
    correctIndex: number;
    explain: string;
  };
  /** Day-1 Sort-the-Rebels (buckets style). */
  day1Sort?: SortBucketsActivity;
  day2: {
    deepDiveText: string;
    detective1: { statement: string; isTrue: boolean; explain: string };
    detective2: { statement: string; isTrue: boolean; explain: string };
    /** Day-2 Sort-the-Rebels (pairs style — cause → effect). */
    sort?: SortPairsActivity;
  };
  day3: {
    whyItWorks: string;
    proveItPrompt: string;
    caseStudy: string;
    growthGains: { label: string; emoji: string; pct: number }[];
    /** Day-3 Sort-the-Rebels (order style — reorder proof/logic steps). */
    sort?: SortOrderActivity;
  };
}

export const dayPilotContent: Record<string, DayPilotContent> = {
  "ch1::ch1-ep1": {
    hookQuestion: "Why do we need so many different kinds of numbers?",
    conceptText:
      "Numbers come in families. Counting numbers (1, 2, 3…) help us count things we can see. Then someone asked: what about nothing? That gave us 0 — and the family grew. Later, what about the opposite of 5? That gave us −5. Each new number was invented to answer a question the old numbers couldn't.",
    detective: {
      statement: "Zero is a counting number.",
      isTrue: false,
      explain:
        "Counting numbers start at 1. Zero was added later — it's a whole number, not a counting (natural) number. Tricky, right?",
    },
    quickCheck: {
      prompt: "Which of these numbers belongs to ALL of these families: counting, whole, integer, AND rational?",
      options: ["−2", "0", "7", "1.5"],
      correctIndex: 2,
      explain:
        "7 is counted (1, 2, 3… 7), it's whole (no fraction), it's an integer (no negative needed), and it can be written as 7/1 → so it's rational too. Negatives skip 'counting' and 'whole'; 0 skips 'counting'; 1.5 skips 'integer'.",
    },
    day1Sort: {
      variant: "buckets",
      title: "Which family does each number belong to?",
      subtitle: "Drag each rebel into its smallest family.",
      buckets: [
        { id: "natural", label: "Natural (1, 2, 3…)", emoji: "🌱", tint: "hsl(160 70% 45%)" },
        { id: "whole", label: "Whole (adds 0)", emoji: "⚪", tint: "hsl(200 70% 50%)" },
        { id: "integer", label: "Integer (adds negatives)", emoji: "⚖️", tint: "hsl(270 70% 55%)" },
      ],
      items: [
        { id: "n1", label: "5", bucketId: "natural" },
        { id: "n2", label: "0", bucketId: "whole" },
        { id: "n3", label: "−3", bucketId: "integer" },
        { id: "n4", label: "12", bucketId: "natural" },
        { id: "n5", label: "−100", bucketId: "integer" },
      ],
      explainOnRight:
        "Sharp! Each number belongs to its SMALLEST family. 0 isn't counting because you can't count zero things. Negatives need the integer family — they don't fit in 'whole'.",
      explainOnWrong:
        "Sneaky! The rule: place each number in its SMALLEST family. 0 is 'whole' (not natural). Negatives are 'integer' (not whole). 5 is 'natural' — it fits all three families, but smallest is natural.",
    },
    day2: {
      deepDiveText:
        "Think of numbers like Indian Railways adding new routes.\n\nFirst there were just trains for big cities (counting numbers — 1, 2, 3). Then they added a station called Zero for 'no train here yet'. Then they built lines going the other direction (negative numbers — −1, −2, −3).\n\nEach new track was added because people needed it. Numbers grew the same way — each family was invented to solve a real problem.",
      detective1: {
        statement: "Every whole number is a natural number.",
        isTrue: false,
        explain:
          "Wholes include zero — but naturals start at 1. So 0 is a whole number that is NOT natural. The reverse IS true (every natural is a whole).",
      },
      detective2: {
        statement: "−7 is an integer but not a whole number.",
        isTrue: true,
        explain:
          "Integers include negatives, zero, and positives. Whole numbers stop at zero — they don't go negative. So −7 lives in the integer family but not the whole-number family.",
      },
      sort: {
        variant: "pairs",
        title: "Match each real-life need with the number it invented",
        subtitle: "Drag each cause to the number family that solved it.",
        leftItems: [
          { id: "c1", label: "Counting goats in a field", matchId: "e1" },
          { id: "c2", label: "An empty bank account", matchId: "e2" },
          { id: "c3", label: "Owing your friend ₹50", matchId: "e3" },
          { id: "c4", label: "Sharing 1 pizza among 4", matchId: "e4" },
        ],
        rightItems: [
          { id: "e1", label: "Natural numbers (1, 2, 3…)" },
          { id: "e2", label: "Zero (0)" },
          { id: "e3", label: "Negative integers (−50)" },
          { id: "e4", label: "Fractions / rationals (1/4)" },
        ],
        explainOnRight:
          "Exactly — every number family was invented to solve a real problem. That's why math keeps growing: reality asks new questions and we build new tools.",
        explainOnWrong:
          "Close! Remember: counting → naturals; nothing at all → zero; owing (opposite of having) → negatives; splitting one thing → fractions. Each family exists because one of these problems couldn't be solved by the older ones.",
      },
    },
    day3: {
      whyItWorks:
        "From first principles: a number system grows when reality forces it to.\n\nYou can't count −3 cows. But you CAN owe ₹3 — that's a debt, the opposite of having ₹3. Negatives were invented because the world has opposites.\n\nThis is how all of mathematics grows: someone notices the old rules can't describe something real, and invents a new rule that does.",
      proveItPrompt:
        "Imagine you're explaining to a younger cousin why we need negative numbers. What real-life situation would you use to convince them?",
      caseStudy:
        "A cricket team's net run rate can be negative. Suppose India scores 250 in 50 overs but lets the opponent chase it in 40 overs — the run-rate difference is negative.\n\nWithout negative numbers, we couldn't even talk about who is BEHIND in the tournament. The number system makes the standings possible.",
      growthGains: [
        { label: "Clarity", emoji: "👁️", pct: 4 },
        { label: "Thinking", emoji: "🧠", pct: 5 },
        { label: "Character", emoji: "🌱", pct: 2 },
      ],
      sort: {
        variant: "order",
        title: "Put history in order — how did the number system grow?",
        subtitle: "Drag the steps into the order they were invented.",
        correctOrder: [
          { id: "s1", label: "People count sheep: 1, 2, 3… (natural numbers)" },
          { id: "s2", label: "Indian mathematicians invent zero to mean 'none'" },
          { id: "s3", label: "Traders need to track debts → negative numbers" },
          { id: "s4", label: "People share pizza → fractions / rationals" },
          { id: "s5", label: "Geometry discovers √2 can't be a fraction → irrationals" },
        ],
        explainOnRight:
          "That IS the real history. Each step was forced by a problem the previous step couldn't answer. Math is not invented all at once — it grows, stone by stone.",
        explainOnWrong:
          "Nearly! Real order: count → zero → negatives → fractions → irrationals. Each new number came because the old ones couldn't describe something real (nothing, debt, sharing, diagonal of a square).",
      },
    },
  },
};

export function getPilotContent(chapterId?: string, episodeId?: string): DayPilotContent | null {
  if (!chapterId || !episodeId) return null;
  return dayPilotContent[`${chapterId}::${episodeId}`] ?? null;
}
