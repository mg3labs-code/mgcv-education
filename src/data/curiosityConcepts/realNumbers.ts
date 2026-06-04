// Class 10 Maths · Real Numbers · One 3-day curiosity loop.
// Hand-authored content lives here so we never depend on AI for the spine.
// AI is only used by `bridgeFromAnswer` to soften surprises in student replies.

export type InterestTag = "cricket" | "travel" | "movies" | "other";

export interface HookVariant {
  tag: InterestTag;
  // The hook is a real-world thing the student has already seen.
  // Day 1 starts here. No vocabulary, no formulas.
  headline: string;
  scene: string;          // 1-2 sentence vivid scene
  noticed: string;        // "you may have noticed..." line
  guesses: [string, string]; // 2 tap-guesses, neither labelled right/wrong
  tinyReveal: string;     // one-line reveal at end of Day 1
}

export interface RealNumbersConcept {
  conceptKey: "real-numbers";
  conceptLabel: string;
  oneLineTransform: string;
  hooks: HookVariant[];

  // Day 2
  yesterdayEchoTemplate: (firstThought: string) => string;
  believeDoubtClaim: string;
  conceptUnfold: { step: string; body: string }[]; // 3 steps, local -> deep

  // Day 3
  miniCases: { id: string; situation: string; nudge: string }[]; // 2 cases
  teachAFriendPrompt: string;
  loopCloseLine: string;
}

const hooks: HookVariant[] = [
  {
    tag: "cricket",
    headline: "Why does the run-rate never sit still?",
    scene:
      "Score 84 in 12.3 overs. The scoreboard shows run-rate 6.81081081… and it keeps trailing dots.",
    noticed:
      "You may have noticed the number after the dot just refuses to end on some balls and ends cleanly on others.",
    guesses: [
      "The number ends, the scoreboard is just lazy.",
      "The number actually never ends.",
    ],
    tinyReveal:
      "Some divisions stop. Some go on forever in a repeating loop. Humans had to invent a name for both.",
  },
  {
    tag: "travel",
    headline: "Splitting a ₹250 dosa bill three ways.",
    scene:
      "Three friends, one plate, total ₹250. The calculator shows ₹83.3333333… per person.",
    noticed:
      "You may have noticed nobody actually pays that — someone pays ₹84 and the maths quietly leaks a paisa.",
    guesses: [
      "₹250 ÷ 3 has an exact answer, the phone is rounding.",
      "₹250 ÷ 3 truly has no clean answer in rupees.",
    ],
    tinyReveal:
      "Some divisions land exactly. Some go on forever. Money rounds them — maths doesn't.",
  },
  {
    tag: "movies",
    headline: "A song's tempo: 120 BPM, 121 BPM, 120.5 BPM.",
    scene:
      "A music app shows the beats-per-minute of your favourite song. Sometimes a clean number. Sometimes 120.5. Sometimes 120.4999…",
    noticed:
      "You may have noticed the app rounds — but the real tempo isn't always a whole number.",
    guesses: [
      "Tempo is always a whole number; decimals are software bugs.",
      "Tempo can genuinely sit between whole numbers.",
    ],
    tinyReveal:
      "Between any two whole numbers there are endless in-between numbers. Some end, some don't.",
  },
];

export const realNumbers: RealNumbersConcept = {
  conceptKey: "real-numbers",
  conceptLabel: "Real Numbers",
  oneLineTransform:
    "From 'rules to memorise' to 'tools humans invented to handle numbers that don't behave'.",
  hooks,
  yesterdayEchoTemplate: (firstThought) =>
    firstThought?.trim()
      ? `Yesterday you said: "${firstThought.trim()}". Let's see where that thought leads.`
      : "Yesterday you started wondering whether some numbers ever really end. Let's follow that.",
  believeDoubtClaim:
    "Claim: every number you can think of either ends, repeats forever in a pattern, or never repeats at all.",
  conceptUnfold: [
    {
      step: "What you already see",
      body: "Divide 1 by 2 → 0.5. Divide 1 by 3 → 0.3333… Divide 1 by 7 → 0.142857142857… Three different behaviours from the same simple operation.",
    },
    {
      step: "What's hiding underneath",
      body: "Mathematicians split numbers by behaviour. Terminating, repeating, and never-repeating. The first two are 'rational'. The third is 'irrational'. Together they are the real numbers.",
    },
    {
      step: "Why this matters beyond the textbook",
      body: "Calculators round. Money rounds. Music rounds. But the underlying number doesn't care — the maths is exact even when the display isn't.",
    },
  ],
  miniCases: [
    {
      id: "case-1",
      situation:
        "Your phone shows √2 as 1.41421356… and the bar above some digits never appears. What family does √2 belong to?",
      nudge: "Think about whether the digits ever fall into a repeating loop.",
    },
    {
      id: "case-2",
      situation:
        "A baker divides 5 kg flour into 8 equal packets. The weight per packet is 0.625 kg. What family does 5/8 belong to?",
      nudge: "Does the decimal end, repeat, or wander forever?",
    },
  ],
  teachAFriendPrompt:
    "In one or two sentences, how would you tell a friend in Class 8 what 'real numbers' are — using something real from your day?",
  loopCloseLine:
    "You started by noticing a number that wouldn't end. You ended by being able to name three families of numbers and spot which one you're looking at. That's the loop.",
};
