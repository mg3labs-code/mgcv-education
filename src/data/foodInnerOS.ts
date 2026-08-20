/**
 * Food-lens Inner OS curriculum.
 * Every module is a <4 minute micro-session built on our curiosity arc:
 * hook (wonder) -> guess -> reveal -> concept -> apply -> close the loop.
 */

export type StepKind =
  | "hook"
  | "guess"
  | "reveal"
  | "concept"
  | "apply"
  | "close"
  | "challenge"
  /** 7-layer depth steps layered under the 3-day spark */
  | "firstprinciples"
  | "truefalse"
  | "assumption"
  | "connect"
  | "reflect";

/** One statement in a Spot-the-Trap true/false step. */
export interface TfStatement {
  text: string;
  isTrue: boolean;
  why: string;
}

/** One rung of a first-principles rebuild chain. */
export interface PrincipleRung {
  claim: string;
  because: string;
}

/** Labelled area diagram rendered on concept cards. */
export interface StepVisual {
  kind: "square2" | "diff2" | "trinomial";
  a: string;
  b: string;
  c?: string;
  caption?: string;
}

/** One rapid-fire item inside a Counter Challenge step. */
export interface ChallengeItem {
  prompt: string;
  answer: string;
  hint?: string;
}

export interface InnerStep {
  kind: StepKind;
  /** Short eyebrow shown on the card. */
  label?: string;
  /** Which of the 7 pedagogy layers this step exercises (defaults per kind). */
  layer?: LayerKey;
  /** Story / prompt body (may contain simple <br> line breaks). */
  text?: string;
  emoji?: string;
  /** Question steps */
  question?: string;
  options?: string[];
  answer?: number;
  explanation?: string;
  /** Concept steps */
  title?: string;
  /** Optional labelled area diagram (concept steps). */
  visual?: StepVisual;
  /** Counter Challenge items (kind: "challenge"). */
  items?: ChallengeItem[];
  /** Spot-the-trap true/false statements (kind: "truefalse"). */
  statements?: TfStatement[];
  /** First-principles rebuild chain (kind: "firstprinciples"). */
  rungs?: PrincipleRung[];
  /** Reflection / teach-it-back prompts (kind: "reflect"). */
  prompts?: string[];
  /** Minimum words before the reflect step can be submitted. */
  minWords?: number;
}


export interface InnerModule {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  /** Estimated minutes — always kept under 4. */
  minutes: number;
  /** Spark-session day this module belongs to. */
  day?: 1 | 2 | 3;
  /** Textbook reference, e.g. "Ch 4.2". */
  chapterRef?: string;
  /** Open loop shown on the close card instead of a summary. */
  cliffhanger?: string;
  /** The one thing the student can perform in front of someone else. */
  showOff?: string;
  steps: InnerStep[];
}

export interface InnerJourney {
  id: string;
  title: string;
  lens: string;
  persona: string;
  personaEmoji: string;
  modules: InnerModule[];
}


export const FOOD_MODULES: InnerModule[] = [
  {
    id: "f1",
    title: "The Counting Kitchen",
    subtitle: "Natural & whole numbers",
    emoji: "🍔",
    minutes: 3,
    steps: [
      {
        kind: "hook",
        label: "Curiosity hook",
        emoji: "🎊",
        text: "Opening day at your food truck. The order screen says:<br><br>🍔 3 burgers · 🍕 5 pizzas · 🥤 2 juices<br><br>Every single kitchen on earth starts with numbers like these. Why?",
      },
      {
        kind: "guess",
        label: "Your guess",
        question: "What were numbers like 1, 2, 3 invented for?",
        options: ["Measuring exact weight", "Counting things you can point at", "Recording debt", "Splitting portions"],
        answer: 1,
        explanation: "These are Natural Numbers — invented purely to COUNT things sitting in front of you.",
      },
      {
        kind: "reveal",
        label: "Tiny reveal",
        emoji: "😱",
        text: "Rush hour ends. Every pizza is sold. You open the freezer and it is completely empty. Your board still needs a number.",
      },
      {
        kind: "guess",
        label: "Your call",
        question: "Which number do you need to write 'empty freezer'?",
        options: ["-1", "1/2", "0", "100"],
        answer: 2,
        explanation: "Zero. Natural numbers + 0 = Whole Numbers.",
      },
      {
        kind: "concept",
        title: "Natural (N) & Whole (W)",
        text: "1, 2, 3, 4 … are Natural Numbers.<br>Add zero and you get Whole Numbers: 0, 1, 2, 3 …",
      },
      {
        kind: "apply",
        label: "Kitchen check",
        question: "Your stock sheet shows 0 samosas and 12 dosas. Which set covers both?",
        options: ["Natural numbers", "Whole numbers"],
        answer: 1,
        explanation: "Zero only lives in the whole numbers.",
      },
      {
        kind: "close",
        label: "Loop closed",
        emoji: "✅",
        text: "You started wondering why kitchens count. Now you can write a full stock sheet — sold out included.",
      },
    ],
  },
  {
    id: "f2",
    title: "Sharing a Pizza Fairly",
    subtitle: "Rational numbers",
    emoji: "🍕",
    minutes: 3,
    steps: [
      {
        kind: "hook",
        label: "Curiosity hook",
        emoji: "🍕",
        text: "Closing time. 2 leftover pizzas, 3 hungry chefs. Nobody wants to be the one who gets less. Whole numbers cannot help you here.",
      },
      {
        kind: "guess",
        label: "Your guess",
        question: "How much pizza does each chef get?",
        options: ["2 × 3", "2 / 3", "3 − 2", "3 / 2"],
        answer: 1,
        explanation: "2 pizzas across 3 people = 2/3 each. A ratio.",
      },
      {
        kind: "concept",
        title: "Rational numbers (Q)",
        text: "Anything you can write as p/q (q ≠ 0) is rational. 'Rational' comes from ratio — exactly what fair sharing is.",
      },
      {
        kind: "apply",
        label: "Kitchen check",
        question: "A 5-litre stock pot. Is 5 a rational number?",
        options: ["No, there's no fraction", "Yes — it's 5/1"],
        answer: 1,
        explanation: "Every integer is a rational number in disguise.",
      },
      {
        kind: "apply",
        label: "Trap",
        question: "Why is 4/0 not a number at all?",
        options: ["Because 0 is negative", "Because you cannot share 4 pizzas among 0 people", "Because 4 is even"],
        answer: 1,
        explanation: "Dividing by zero breaks reality, not just maths.",
      },
      {
        kind: "close",
        label: "Loop closed",
        emoji: "🤝",
        text: "Fair sharing is the whole idea behind fractions. Your chefs are happy.",
      },
    ],
  },
  {
    id: "f3",
    title: "The Mystery Table",
    subtitle: "Irrational numbers",
    emoji: "🪚",
    minutes: 4,
    steps: [
      {
        kind: "hook",
        label: "Curiosity hook",
        emoji: "🪚",
        text: "The owner wants a perfect square table with area exactly 2 m².<br>Area = side × side, so side = √2.<br>The carpenter asks: 'give me the number in cm.'",
      },
      {
        kind: "guess",
        label: "Your guess",
        question: "What does √2 look like as a decimal?",
        options: ["1.414 exactly", "1.414141… repeating", "1.41421356… forever, never repeating"],
        answer: 2,
        explanation: "It refuses to be a neat fraction — that makes it irrational.",
      },
      {
        kind: "concept",
        title: "Irrational numbers",
        text: "Decimals that never end and never repeat. They cannot be written as p/q.",
      },
      {
        kind: "apply",
        label: "Pizza check",
        question: "You use π for round pizza sizes. Is π rational?",
        options: ["Rational — it's 22/7", "Irrational — 22/7 is only an approximation"],
        answer: 1,
        explanation: "22/7 is a kitchen shortcut, not the real π.",
      },
      {
        kind: "apply",
        label: "Spot it",
        question: "Which one is irrational?",
        options: ["√4", "√9", "√3", "0.333…"],
        answer: 2,
        explanation: "√4 = 2, √9 = 3, 0.333… repeats. Only √3 stays wild.",
      },
      {
        kind: "close",
        label: "Loop closed",
        emoji: "📐",
        text: "The carpenter can still cut the table — the length is exact, the decimal just never finishes.",
      },
    ],
  },
  {
    id: "f4",
    title: "The Inspector's One Line",
    subtitle: "Real numbers",
    emoji: "📋",
    minutes: 3,
    steps: [
      {
        kind: "hook",
        label: "Curiosity hook",
        emoji: "📋",
        text: "The health inspector wants ONE sheet: burgers counted, empty freezers, supplier debt, pizza slices and that √2 table — all on a single number line.",
      },
      {
        kind: "guess",
        label: "Your guess",
        question: "What do we call every number that fits on that one line?",
        options: ["Whole numbers", "Real numbers", "Rational numbers"],
        answer: 1,
        explanation: "Real numbers = rational + irrational, the full family.",
      },
      {
        kind: "concept",
        title: "Real numbers (R)",
        text: "Every point on the number line is a real number, and every real number has exactly one point. No gaps.",
      },
      {
        kind: "apply",
        label: "Kitchen check",
        question: "Every rational is real. Is every real rational?",
        options: ["Yes", "No"],
        answer: 1,
        explanation: "No — √2 and π are real but not rational.",
      },
      {
        kind: "close",
        label: "Loop closed",
        emoji: "🧾",
        text: "One line, one family. Your inspection sheet is complete.",
      },
    ],
  },
  {
    id: "f5",
    title: "Viral Order Scaling",
    subtitle: "Exponents in the kitchen",
    emoji: "🚀",
    minutes: 4,
    steps: [
      {
        kind: "hook",
        label: "Curiosity hook",
        emoji: "🚀",
        text: "Your truck goes viral. Orders stop arriving as 8 burgers and start arriving as 2³ trays, then 2⁴ trays. The chef needs one number.",
      },
      {
        kind: "guess",
        label: "Your guess",
        question: "2³ × 2⁴ = ?",
        options: ["2¹²", "2⁷", "4⁷", "4¹²"],
        answer: 1,
        explanation: "Same base → add powers. 3 + 4 = 7.",
      },
      {
        kind: "concept",
        title: "Laws of exponents",
        text: "aᵐ × aⁿ = aᵐ⁺ⁿ<br>(aᵐ)ⁿ = aᵐⁿ<br>aᵐ ÷ aⁿ = aᵐ⁻ⁿ",
      },
      {
        kind: "apply",
        label: "Recipe check",
        question: "A masala recipe needs (3²)³ grams. That is…",
        options: ["3⁵", "3⁶", "9⁵"],
        answer: 1,
        explanation: "Power of a power → multiply. 2 × 3 = 6.",
      },
      {
        kind: "apply",
        label: "Trap",
        question: "2 litres + √3 litres of stock is…",
        options: ["Rational", "Irrational"],
        answer: 1,
        explanation: "Adding a neat number to a wild decimal keeps it wild.",
      },
      {
        kind: "close",
        label: "Loop closed",
        emoji: "📈",
        text: "Scaling a kitchen is exactly what exponents were built for.",
      },
    ],
  },
];

export const STEP_META: Record<StepKind, { tag: string; tint: string }> = {
  hook: { tag: "Hook", tint: "primary" },
  guess: { tag: "Your guess", tint: "accent" },
  reveal: { tag: "Reveal", tint: "primary" },
  concept: { tag: "Concept", tint: "accent" },
  apply: { tag: "Apply", tint: "success" },
  close: { tag: "Loop closed", tint: "success" },
  challenge: { tag: "Counter challenge", tint: "accent" },
  firstprinciples: { tag: "First principles", tint: "primary" },
  truefalse: { tag: "Spot the trap", tint: "accent" },
  assumption: { tag: "Hidden assumption", tint: "accent" },
  connect: { tag: "Connections", tint: "primary" },
  reflect: { tag: "Teach it back", tint: "success" },
};

/** Default 7-layer mapping for each step kind (a step can override with `layer`). */
export const KIND_LAYER: Record<StepKind, LayerKey> = {
  hook: "definition",
  guess: "reasoning",
  reveal: "mechanism",
  concept: "mechanism",
  firstprinciples: "reasoning",
  truefalse: "assumptions",
  assumption: "assumptions",
  connect: "connections",
  apply: "applications",
  challenge: "applications",
  reflect: "implications",
  close: "implications",
};

