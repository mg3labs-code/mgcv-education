// Class 10 Maths · Real Numbers · One 3-day curiosity loop.
// Hand-authored content. Mirrors the structure of the uploaded design HTMLs
// (interest_to_curiosity_engine, engagement_hook_cards_with_concept_flow,
//  day1_complete_5min_flow, complete_3day_arc_cricket).

export type InterestTag = "cricket" | "travel" | "movies" | "other";

export interface HookMcqChoice {
  label: string;
  correct: boolean;
  feedback: string; // shown after pick
}

export interface AhaVisual {
  emoji: string;
  title: string;
  body: string;
  formula: string;
}

export interface SortItem {
  id: string;
  label: string;
  bin: "terminating" | "non_terminating"; // correct bin
}

export interface TrapClaim {
  statement: string;
  context: string;
  // The trap-style statement is *false* by default for these — the "twist".
  truth: "false" | "true";
  reveal: string;
}

export interface HookVariant {
  tag: InterestTag;
  emoji: string;
  badgeLabel: string;
  // The hook is a real-world thing the student has already seen.
  headline: string;
  scene: string;
  noticed: string;

  // Inline tricky MCQ shown right on the hook card
  mcq: {
    question: string;
    choices: HookMcqChoice[]; // 3 choices, one correct
    reveal: string; // 2-line reveal after a pick
  };

  // Two soft guesses for the believe/doubt-style tap
  guesses: [string, string];

  // The aha visual frame after the student types a guess
  aha: AhaVisual;

  // Sort activity (6 items into terminating / non-terminating bins)
  sortPrompt: string;
  sortItems: SortItem[];

  // Trap-style true/false (slightly tricky)
  trap: TrapClaim;

  tinyReveal: string; // optional reveal at very end of Day 1
}

export interface RealNumbersConcept {
  conceptKey: "real-numbers";
  conceptLabel: string;
  oneLineTransform: string;
  hooks: HookVariant[];

  // Day 2
  yesterdayEchoTemplate: (firstThought: string) => string;
  believeDoubtClaim: string;
  conceptUnfold: { step: string; body: string }[];

  // Day 3
  miniCases: { id: string; situation: string; nudge: string }[];
  teachAFriendPrompt: string;
  loopCloseLine: string;
}

const hooks: HookVariant[] = [
  {
    tag: "cricket",
    emoji: "🏏",
    badgeLabel: "Cricket mode",
    headline: "Why does the run-rate never sit still?",
    scene:
      "Score 84 in 12.3 overs. The scoreboard shows run-rate 6.81081081… and it keeps trailing dots.",
    noticed:
      "On some balls the number lands cleanly. On others it just refuses to end.",
    mcq: {
      question: "Why does the run-rate sometimes show endless digits?",
      choices: [
        {
          label: "Scoreboard glitch 🛠️",
          correct: false,
          feedback:
            "Looks easy — but the same calculator on your phone does it too. Not a glitch.",
        },
        {
          label: "Some divisions truly never end 🔁",
          correct: true,
          feedback:
            "Yes — 84 ÷ 12.3 falls into a repeating loop. The maths is honest, the screen just cuts it off.",
        },
        {
          label: "Only happens on odd numbers 🎲",
          correct: false,
          feedback:
            "Tempting pattern — but 1 ÷ 3 (both odd? no, one even) also never ends. Something deeper is going on.",
        },
      ],
      reveal:
        "Some divisions *terminate* (1÷2 = 0.5). Some *repeat forever* (1÷3 = 0.333…). The scoreboard isn't lying — it's just out of pixels.",
    },
    guesses: [
      "The number ends, the scoreboard is just lazy.",
      "The number actually never ends.",
    ],
    aha: {
      emoji: "🏏",
      title: "The run-rate sits on a number line that never breaks.",
      body: "Run-rate = runs ÷ overs. Some divisions land on a clean dot. Some fall into a repeating pattern. Both are 'rational'. Between them sit numbers like √2 that never repeat at all — those are 'irrational'. Together they cover every point on the line.",
      formula: "runs ÷ overs → terminates OR repeats OR never-repeats",
    },
    sortPrompt:
      "Which of these decimals end, and which go on forever? Tap an item, then tap a bin.",
    sortItems: [
      { id: "s1", label: "1 ÷ 4 = 0.25", bin: "terminating" },
      { id: "s2", label: "1 ÷ 3 = 0.333…", bin: "non_terminating" },
      { id: "s3", label: "Run-rate 6.81081…", bin: "non_terminating" },
      { id: "s4", label: "3 ÷ 8 = 0.375", bin: "terminating" },
      { id: "s5", label: "√2 = 1.41421…", bin: "non_terminating" },
      { id: "s6", label: "7 ÷ 10 = 0.7", bin: "terminating" },
    ],
    trap: {
      statement:
        "If a decimal goes on forever, it must be irrational — like √2.",
      context:
        "Sounds obvious. But pause: 0.333… also goes on forever, and it's just 1/3 — a perfectly rational fraction.",
      truth: "false",
      reveal:
        "False. Going on forever isn't enough — what matters is whether the digits *repeat in a pattern*. Repeating forever = rational. Never repeating = irrational. Most cricket fans get this wrong.",
    },
    tinyReveal:
      "Some divisions stop. Some go on forever in a repeating loop. Some never repeat at all. Humans had to invent names for all three.",
  },
  {
    tag: "travel",
    emoji: "🍛",
    badgeLabel: "Food & travel",
    headline: "Splitting a ₹250 dosa bill three ways.",
    scene:
      "Three friends, one plate, total ₹250. The calculator shows ₹83.3333333… per person.",
    noticed:
      "Nobody actually pays that — someone pays ₹84 and the maths quietly leaks a paisa.",
    mcq: {
      question: "Why does ₹250 ÷ 3 never give a clean rupee answer?",
      choices: [
        {
          label: "Calculator rounds badly 🧮",
          correct: false,
          feedback:
            "The calculator is honest. The number itself is the one with no clean ending.",
        },
        {
          label: "3 doesn't divide 250 evenly 🔁",
          correct: true,
          feedback:
            "Right — and the leftover keeps repeating as .333… forever. Money pretends it ends; maths doesn't.",
        },
        {
          label: "Rupees can't be split 💸",
          correct: false,
          feedback:
            "Rupees can be split — ₹250 ÷ 2 gives a clean ₹125. The problem is the number 3, not the rupee.",
        },
      ],
      reveal:
        "Some divisions land. Some don't. 250 ÷ 3 falls into a repeating loop forever — and your phone just truncates.",
    },
    guesses: [
      "₹250 ÷ 3 has an exact answer; the phone is rounding.",
      "₹250 ÷ 3 truly has no clean answer in rupees.",
    ],
    aha: {
      emoji: "🍛",
      title: "Money rounds. Maths doesn't.",
      body: "₹250 ÷ 3 is 83.333… forever. To pay in real rupees we cheat by 1 paisa. The maths sits perfectly on the number line — the wallet just can't reach it.",
      formula: "₹250 ÷ 3 = 83.3̄  (the bar means it repeats forever)",
    },
    sortPrompt:
      "Which divisions land cleanly, and which leak forever? Tap an item then tap a bin.",
    sortItems: [
      { id: "s1", label: "₹100 ÷ 4 = 25", bin: "terminating" },
      { id: "s2", label: "₹250 ÷ 3 = 83.33…", bin: "non_terminating" },
      { id: "s3", label: "₹500 ÷ 8 = 62.5", bin: "terminating" },
      { id: "s4", label: "₹100 ÷ 7 = 14.285…", bin: "non_terminating" },
      { id: "s5", label: "₹120 ÷ 5 = 24", bin: "terminating" },
      { id: "s6", label: "₹1 ÷ 6 = 0.1666…", bin: "non_terminating" },
    ],
    trap: {
      statement:
        "If the calculator shows a clean answer, the division was exact.",
      context:
        "Looks safe. But your calculator shows ₹83.33 for ₹250 ÷ 3 — it just chopped off the rest to fit.",
      truth: "false",
      reveal:
        "False. Calculators round to fit the screen — what looks 'clean' may be a long tail of repeating digits hidden behind the display.",
    },
    tinyReveal:
      "Some divisions land. Some go forever. Money rounds them. Maths doesn't.",
  },
  {
    tag: "movies",
    emoji: "🎬",
    badgeLabel: "Music & movies",
    headline: "A song's tempo: 120 BPM, 121 BPM, 120.5 BPM.",
    scene:
      "A music app shows the beats-per-minute. Sometimes a clean number. Sometimes 120.5. Sometimes 120.4999…",
    noticed:
      "The app rounds — but the real tempo isn't always a whole number.",
    mcq: {
      question: "Why does BPM sometimes show endless digits like 120.4999…?",
      choices: [
        {
          label: "App lag 🔄",
          correct: false,
          feedback:
            "Easy to blame the app. But the real beat genuinely sits between two whole numbers.",
        },
        {
          label: "Tempo can sit between integers 🎼",
          correct: true,
          feedback:
            "Yes — between any two whole numbers there's an entire universe of in-between numbers.",
        },
        {
          label: "Only digital songs do this 💿",
          correct: false,
          feedback:
            "Even a metronome wound by hand can land between beats — it's a property of numbers, not files.",
        },
      ],
      reveal:
        "Between 120 and 121 sit infinite real numbers. Some end, some repeat, some never settle. Your ear hears the song; the maths sees the whole line.",
    },
    guesses: [
      "Tempo is always a whole number; decimals are bugs.",
      "Tempo can genuinely sit between whole numbers.",
    ],
    aha: {
      emoji: "🎵",
      title: "Between any two beats lies a whole line of numbers.",
      body: "120 and 121 look like neighbours. But between them are infinite in-between values — some that end (120.5), some that repeat (120.333…), some that never repeat (120 + √2 / 10). All of them are 'real numbers'.",
      formula: "between 120 and 121 → infinitely many real numbers",
    },
    sortPrompt:
      "Which BPM values terminate, which go on forever? Tap an item then a bin.",
    sortItems: [
      { id: "s1", label: "120.5 BPM", bin: "terminating" },
      { id: "s2", label: "120.333… BPM", bin: "non_terminating" },
      { id: "s3", label: "121 BPM", bin: "terminating" },
      { id: "s4", label: "120.4999… BPM", bin: "non_terminating" },
      { id: "s5", label: "118.75 BPM", bin: "terminating" },
      { id: "s6", label: "120 + √2 BPM", bin: "non_terminating" },
    ],
    trap: {
      statement:
        "Two songs with the same display BPM must have exactly the same tempo.",
      context:
        "Sounds fair. But the display is rounded — 120.4 and 120.499… both show as 120.5 in most apps.",
      truth: "false",
      reveal:
        "False. The display rounds. The real tempos can be different by tiny amounts the screen hides. Music software cheats; the number line doesn't.",
    },
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
