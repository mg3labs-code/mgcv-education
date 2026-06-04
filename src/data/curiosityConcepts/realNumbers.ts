// Class 10 Maths · Real Numbers · One 3-day curiosity loop.
// Hand-authored content. Each HookVariant carries its own activities so the
// flow stays end-to-end synced to the student's chosen interest.

export type InterestTag = "cricket" | "travel" | "movies" | "other";

export interface HookMcqChoice {
  label: string;
  correct: boolean;
  feedback: string;
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
  bin: "terminating" | "non_terminating";
}

export interface TrapClaim {
  statement: string;
  context: string;
  truth: "false" | "true";
  reveal: string;
}

export interface TrickyMcq {
  question: string;
  choices: HookMcqChoice[];
  reveal: string;
}

export interface MiniCase {
  id: string;
  situation: string;
  nudge: string;
  // tiny domain-flavoured callout the student has actually seen in an app
  domainExample: string;
}

export interface HookVariant {
  tag: InterestTag;
  emoji: string;
  badgeLabel: string;
  headline: string;
  scene: string;
  noticed: string;

  mcq: {
    question: string;
    choices: HookMcqChoice[];
    reveal: string;
  };

  guesses: [string, string];
  aha: AhaVisual;

  sortPrompt: string;
  sortItems: SortItem[];

  trap: TrapClaim;

  // Day 2 — a slightly harder tricky MCQ that builds on the same hook.
  trickyMcq: TrickyMcq;

  // Day 3 — one hook-flavoured mini case (was global before; now per-hook).
  miniCase: MiniCase;

  tinyReveal: string;
}

export interface RealNumbersConcept {
  conceptKey: "real-numbers";
  conceptLabel: string;
  oneLineTransform: string;
  hooks: HookVariant[];

  yesterdayEchoTemplate: (firstThought: string) => string;
  believeDoubtClaim: string;
  conceptUnfold: { step: string; body: string }[];

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
        { label: "Scoreboard glitch 🛠️", correct: false, feedback: "Looks easy — but the same calculator on your phone does it too. Not a glitch." },
        { label: "Some divisions truly never end 🔁", correct: true, feedback: "Yes — 84 ÷ 12.3 falls into a repeating loop. The maths is honest, the screen just cuts it off." },
        { label: "Only happens on odd numbers 🎲", correct: false, feedback: "Tempting pattern — but 1 ÷ 3 also never ends. Something deeper is going on." },
      ],
      reveal: "Some divisions *terminate* (1÷2 = 0.5). Some *repeat forever* (1÷3 = 0.333…). The scoreboard isn't lying — it's just out of pixels.",
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
    sortPrompt: "Which of these decimals end, and which go on forever? Tap an item, then tap a bin.",
    sortItems: [
      { id: "s1", label: "1 ÷ 4 = 0.25", bin: "terminating" },
      { id: "s2", label: "1 ÷ 3 = 0.333…", bin: "non_terminating" },
      { id: "s3", label: "Run-rate 6.81081…", bin: "non_terminating" },
      { id: "s4", label: "3 ÷ 8 = 0.375", bin: "terminating" },
      { id: "s5", label: "√2 = 1.41421…", bin: "non_terminating" },
      { id: "s6", label: "7 ÷ 10 = 0.7", bin: "terminating" },
    ],
    trap: {
      statement: "If a decimal goes on forever, it must be irrational — like √2.",
      context: "Sounds obvious. But pause: 0.333… also goes on forever, and it's just 1/3 — a perfectly rational fraction.",
      truth: "false",
      reveal: "False. Going on forever isn't enough — what matters is whether the digits *repeat in a pattern*. Repeating forever = rational. Never repeating = irrational.",
    },
    trickyMcq: {
      question: "A batter scores 100 runs in 14.2 overs. Run-rate shows 6.97674418… — which family is this number in?",
      choices: [
        { label: "Irrational — the digits never stop", correct: false, feedback: "Looks like √2 maybe, but it isn't. Every cricket run-rate comes from runs ÷ overs — both whole numbers — so it has to be rational." },
        { label: "Rational — it's a fraction of two integers", correct: true, feedback: "Right. 100 ÷ 14.2 = 1000/142 = a fraction. So the decimal must either end or repeat in a pattern. It just looks scary on screen." },
        { label: "Neither — cricket numbers are special", correct: false, feedback: "Tempting, but maths doesn't care about sport. Every quotient of two integers is rational." },
      ],
      reveal: "Every run-rate, asking-rate, strike-rate is rational — they're all integer ÷ integer. The scoreboard just truncates the tail.",
    },
    miniCase: {
      id: "case-cricket",
      situation: "India needs 47 in 6.3 overs. Commentator says 'asking rate 7.23'. Where exactly does that number come from, and what family of real numbers does it belong to?",
      nudge: "Write the division. Decide: ends, repeats, or never-repeats?",
      domainExample: "Same maths runs Uber surge: when surge is ×1.333…, that's 4/3 — a rational number rounded for the screen.",
    },
    tinyReveal: "Some divisions stop. Some go on forever in a repeating loop. Some never repeat at all. Humans had to invent names for all three.",
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
        { label: "Calculator rounds badly 🧮", correct: false, feedback: "The calculator is honest. The number itself has no clean ending." },
        { label: "3 doesn't divide 250 evenly 🔁", correct: true, feedback: "Right — and the leftover keeps repeating as .333… forever. Money pretends it ends; maths doesn't." },
        { label: "Rupees can't be split 💸", correct: false, feedback: "₹250 ÷ 2 gives a clean ₹125. The problem is the number 3, not the rupee." },
      ],
      reveal: "Some divisions land. Some don't. 250 ÷ 3 falls into a repeating loop forever — your phone just truncates.",
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
    sortPrompt: "Which divisions land cleanly, and which leak forever? Tap an item then tap a bin.",
    sortItems: [
      { id: "s1", label: "₹100 ÷ 4 = 25", bin: "terminating" },
      { id: "s2", label: "₹250 ÷ 3 = 83.33…", bin: "non_terminating" },
      { id: "s3", label: "₹500 ÷ 8 = 62.5", bin: "terminating" },
      { id: "s4", label: "₹100 ÷ 7 = 14.285…", bin: "non_terminating" },
      { id: "s5", label: "₹120 ÷ 5 = 24", bin: "terminating" },
      { id: "s6", label: "₹1 ÷ 6 = 0.1666…", bin: "non_terminating" },
    ],
    trap: {
      statement: "If the calculator shows a clean answer, the division was exact.",
      context: "Looks safe. But your calculator shows ₹83.33 for ₹250 ÷ 3 — it just chopped off the rest to fit.",
      truth: "false",
      reveal: "False. Calculators round to fit the screen — what looks 'clean' may be a long tail of repeating digits hidden behind the display.",
    },
    trickyMcq: {
      question: "Zomato splits a ₹700 bill across 6 friends. The app shows ₹116.67. Is the *actual* share rational or irrational?",
      choices: [
        { label: "Irrational — decimals are messy", correct: false, feedback: "Messy isn't the same as irrational. Irrational means it can't be written as a fraction at all. ₹700/6 is literally a fraction." },
        { label: "Rational — it's just 700/6 = 350/3 in disguise", correct: true, feedback: "Right. Any bill split across an integer number of people is rational. The app shows .67 because it cuts off — 116.666… really repeats." },
        { label: "Depends on the currency", correct: false, feedback: "Rupees, dollars, yen — same maths. The split is rational regardless." },
      ],
      reveal: "Every Zomato / Splitwise split is a rational number. The 'cleanness' you see on screen is the app rounding, not the maths.",
    },
    miniCase: {
      id: "case-travel",
      situation: "A Swiggy bill of ₹530 is split between you and 2 friends. The app shows ₹176.67 each. Where's the missing rupee, and what does it tell you about the actual share?",
      nudge: "Multiply 176.67 × 3 and compare with 530. Then decide which family the true share belongs to.",
      domainExample: "Splitwise, Zomato, Cred — they all round the same way you'd cheat a paisa at a dosa shop.",
    },
    tinyReveal: "Some divisions land. Some go forever. Money rounds them. Maths doesn't.",
  },
  {
    tag: "movies",
    emoji: "🎬",
    badgeLabel: "Music & movies",
    headline: "A song's tempo: 120 BPM, 121 BPM, 120.5 BPM.",
    scene:
      "A music app shows the beats-per-minute. Sometimes a clean number. Sometimes 120.5. Sometimes 120.4999…",
    noticed: "The app rounds — but the real tempo isn't always a whole number.",
    mcq: {
      question: "Why does BPM sometimes show endless digits like 120.4999…?",
      choices: [
        { label: "App lag 🔄", correct: false, feedback: "Easy to blame the app. But the real beat genuinely sits between two whole numbers." },
        { label: "Tempo can sit between integers 🎼", correct: true, feedback: "Yes — between any two whole numbers there's an entire universe of in-between numbers." },
        { label: "Only digital songs do this 💿", correct: false, feedback: "A metronome wound by hand can land between beats — it's a property of numbers, not files." },
      ],
      reveal: "Between 120 and 121 sit infinite real numbers. Some end, some repeat, some never settle.",
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
    sortPrompt: "Which BPM values terminate, which go on forever? Tap an item then a bin.",
    sortItems: [
      { id: "s1", label: "120.5 BPM", bin: "terminating" },
      { id: "s2", label: "120.333… BPM", bin: "non_terminating" },
      { id: "s3", label: "121 BPM", bin: "terminating" },
      { id: "s4", label: "120.4999… BPM", bin: "non_terminating" },
      { id: "s5", label: "118.75 BPM", bin: "terminating" },
      { id: "s6", label: "120 + √2 BPM", bin: "non_terminating" },
    ],
    trap: {
      statement: "Two songs with the same display BPM must have exactly the same tempo.",
      context: "Sounds fair. But the display is rounded — 120.4 and 120.499… both show as 120.5 in most apps.",
      truth: "false",
      reveal: "False. The display rounds. The real tempos can be different by tiny amounts the screen hides. Music software cheats; the number line doesn't.",
    },
    trickyMcq: {
      question: "Spotify shows a song's tempo as 128 BPM exactly. A studio tool shows 127.9999… BPM. Which is true?",
      choices: [
        { label: "Spotify is right, studio tool is buggy", correct: false, feedback: "Studio tools usually have more precision, not less. The 'cleanness' you see in Spotify is rounded." },
        { label: "Both can be the same number written differently", correct: true, feedback: "Yes — 0.999… equals 1 exactly. Same for 127.999… = 128. The two displays describe the same point on the line." },
        { label: "Only one of them can possibly be correct", correct: false, feedback: "Two correct representations of one number is fine in maths — happens all the time with repeating decimals." },
      ],
      reveal: "0.999… = 1 is one of the most famous 'feels wrong, is right' results in maths. Same point on the number line, two valid names.",
    },
    miniCase: {
      id: "case-movies",
      situation: "Shazam tags a song at 174 BPM. A DJ tool tags it at 173.9999… BPM. Your friend says they're different. What do you tell her?",
      nudge: "Think about what 0.999… really equals. Then decide.",
      domainExample: "Spotify, Shazam, Apple Music — every BPM detector rounds. The underlying tempo is a real number; the badge is a label.",
    },
    tinyReveal: "Between any two whole numbers there are endless in-between numbers. Some end, some don't.",
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
  teachAFriendPrompt:
    "In one or two sentences, how would you tell a friend in Class 8 what 'real numbers' are — using something real from your day?",
  loopCloseLine:
    "You started by noticing a number that wouldn't end. You ended by being able to name three families of numbers and spot which one you're looking at. That's the loop.",
};
