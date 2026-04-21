/**
 * Day-1/2/3 hand-authored content for the Math Ch1 Ep1 pilot.
 *
 * Keyed by `${chapterId}::${episodeId}`. If a key is not present,
 * the day gate is bypassed and the original reader renders.
 *
 * Keep copy short, simple, and warm — Class 7 reading level.
 */

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
  day2: {
    deepDiveText: string;
    detective1: { statement: string; isTrue: boolean; explain: string };
    detective2: { statement: string; isTrue: boolean; explain: string };
  };
  day3: {
    whyItWorks: string;
    proveItPrompt: string;
    caseStudy: string;
    growthGains: { label: string; emoji: string; pct: number }[];
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
    },
  },
};

export function getPilotContent(chapterId?: string, episodeId?: string): DayPilotContent | null {
  if (!chapterId || !episodeId) return null;
  return dayPilotContent[`${chapterId}::${episodeId}`] ?? null;
}
