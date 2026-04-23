// Curated 3-day demo content for /demo-2304-{subject}
// Used ONLY by Demo2304.tsx — does NOT affect live student flow.
// Each subject covers Chapter 1, Episode 1 with the redesigned Day 1/2/3 structure.

export type Subject = "math" | "physics" | "chemistry";

export interface QuickCheckQ {
  prompt: string;
  options: string[];
  correctIndex: number;
  explain: string;
}

export interface DetectiveQ {
  statement: string;
  isTrue: boolean;
  explain: string;
}

export interface Day1Content {
  hookQuestion: string;
  conceptText: string;
  detective: DetectiveQ;
  quickCheck: QuickCheckQ;
}

export interface Day2Content {
  recallPrompt: string;          // shown atop the recall card
  deepDiveTitle: string;
  deepDiveBody: string;          // 1 single core concept (no layer cake)
  buildBlocks: string[];         // student drags these into order ("Build the explanation")
  buildCorrectOrder: number[];   // indices into buildBlocks giving correct order
  buildExplain: string;
  detective: DetectiveQ;
}

export interface Day3Content {
  whyItWorks: string;
  proveItPrompt: string;
  caseStudy: string;
  growth: { label: string; emoji: string; pct: number }[];
}

export interface DemoSubjectContent {
  subjectLabel: string;
  subjectEmoji: string;
  accent: string;                // tailwind color class root e.g. "emerald", "sky", "amber"
  chapterTitle: string;
  episodeTitle: string;
  episodeSubtitle: string;
  estimatedMinutes: { d1: number; d2: number; d3: number };
  day1: Day1Content;
  day2: Day2Content;
  day3: Day3Content;
}

export const DEMO_2304: Record<Subject, DemoSubjectContent> = {
  math: {
    subjectLabel: "Mathematics",
    subjectEmoji: "🔢",
    accent: "emerald",
    chapterTitle: "Chapter 1 · Real Numbers",
    episodeTitle: "Introduction to Real Numbers",
    episodeSubtitle: "What are real numbers — and why do they matter?",
    estimatedMinutes: { d1: 4, d2: 6, d3: 5 },
    day1: {
      hookQuestion: "If 1, 2, 3… are 'natural', what makes 0, −5, ½ and √2 deserve to be called numbers too?",
      conceptText:
        "Real numbers are the full family of numbers we use on a number line. They include whole numbers, negatives, fractions, and even tricky ones like √2 and π. Together they cover every possible measurement — no gaps.",
      detective: {
        statement: "Every fraction is a real number, but not every real number is a fraction.",
        isTrue: true,
        explain:
          "Fractions like 3/4 sit on the number line — so they are real. But √2 and π also sit on the line and CANNOT be written as a fraction. So real numbers are a bigger family.",
      },
      quickCheck: {
        prompt: "Which of these is NOT a real number?",
        options: ["−7", "√2", "π", "√(−1)"],
        correctIndex: 3,
        explain:
          "√(−1) is imaginary — it does not sit anywhere on the real number line. The other three all do.",
      },
    },
    day2: {
      recallPrompt: "Yesterday you said real numbers fill the line. Today: WHY can we trust there are no gaps?",
      deepDiveTitle: "The Density Idea",
      deepDiveBody:
        "Pick any two real numbers, say 0.1 and 0.2. Between them you can ALWAYS find another (0.15). And between 0.1 and 0.15 you'll find 0.125. This never stops. The number line has no gaps because between any two real numbers there is always another. Mathematicians call this 'density'.",
      buildBlocks: [
        "Pick any two real numbers.",
        "You can always find a number between them.",
        "Repeat — there is always another in between.",
        "So the number line has no gaps.",
      ],
      buildCorrectOrder: [0, 1, 2, 3],
      buildExplain:
        "Density is a chain: any two reals → one between → repeat → no gaps. Each step depends on the one before it.",
      detective: {
        statement: "Between 0.999… (repeating forever) and 1, there is at least one other real number.",
        isTrue: false,
        explain:
          "Trick! 0.999… is exactly equal to 1. They're the same point on the line, so nothing sits between them.",
      },
    },
    day3: {
      whyItWorks:
        "Real numbers work because every measurement we can imagine — distance, time, temperature — fits somewhere on this line. No physical quantity 'falls through the cracks'. That's why physics, engineering, and finance all start here.",
      proveItPrompt:
        "A friend says: 'π is not a real number because we can never write it down completely.' How do you reply?",
      caseStudy:
        "GPS satellites use real-number distances accurate to millimetres. If we banned irrationals like √2, even basic Pythagoras-distance calculations would fail and your phone could mis-locate you by metres.",
      growth: [
        { label: "Clarity", emoji: "💡", pct: 12 },
        { label: "Reasoning", emoji: "🧠", pct: 9 },
        { label: "Confidence", emoji: "💪", pct: 7 },
      ],
    },
  },

  physics: {
    subjectLabel: "Physics",
    subjectEmoji: "⚡",
    accent: "sky",
    chapterTitle: "Chapter 1 · Electricity",
    episodeTitle: "Electric Current and Circuit",
    episodeSubtitle: "What actually 'flows' when a bulb lights up?",
    estimatedMinutes: { d1: 4, d2: 6, d3: 5 },
    day1: {
      hookQuestion:
        "When you flip a switch, the bulb glows almost instantly — but electrons drift slower than a snail. How can both be true?",
      conceptText:
        "Electric current is the flow of electric charge through a closed loop called a circuit. The electrons themselves drift slowly, but the electric field that pushes them spreads through the wire at almost the speed of light — so the bulb lights up the moment you flip the switch.",
      detective: {
        statement: "If you cut a wire in the middle of a working circuit, the bulb keeps glowing for a moment because the electrons inside the wire keep moving.",
        isTrue: false,
        explain:
          "The bulb stops instantly. Without a closed loop, the electric field collapses and the push that drives the electrons disappears.",
      },
      quickCheck: {
        prompt: "Which of these is the BEST description of electric current?",
        options: [
          "Electrons travelling at the speed of light",
          "The flow of electric charge through a closed loop",
          "Heat moving through a metal wire",
          "Pure energy with no particles involved",
        ],
        correctIndex: 1,
        explain:
          "Current = flow of charge through a closed loop. Electrons drift slowly; only the field travels near light-speed.",
      },
    },
    day2: {
      recallPrompt:
        "Yesterday you learnt that a closed loop is essential. Today: WHY does the loop matter — and what is actually being 'pushed'?",
      deepDiveTitle: "Charge, Push, and the Loop",
      deepDiveBody:
        "A battery is like a pump. It creates a 'push' (voltage) on one side and a 'pull' on the other. When the wire forms a complete loop, free electrons in the metal feel this push and drift from − to +. The amount of charge crossing any point per second is what we call current (1 Ampere = 1 Coulomb / second). Break the loop and the push has nowhere to act → no current.",
      buildBlocks: [
        "A battery creates a push (voltage).",
        "If the wire forms a complete loop…",
        "…electrons in the metal start to drift.",
        "Charge crossing per second = current.",
      ],
      buildCorrectOrder: [0, 1, 2, 3],
      buildExplain:
        "It's a chain: voltage exists → loop allows it to act → electrons drift → drifting charge per second IS the current.",
      detective: {
        statement: "Doubling the voltage of a battery in the same circuit roughly doubles the current.",
        isTrue: true,
        explain:
          "For an ohmic conductor at fixed temperature, current is directly proportional to voltage (V = IR). Twice the push → roughly twice the flow.",
      },
    },
    day3: {
      whyItWorks:
        "The loop + push idea explains everything from a torch bulb to a city's power grid. Engineers can compute exactly how much current will flow before building anything — that's why your phone charger never burns out the first time you plug it in.",
      proveItPrompt:
        "A friend believes 'a single wire from one battery terminal to a bulb' should make it glow. Use the loop idea to convince them otherwise.",
      caseStudy:
        "When a bird sits on a single high-voltage wire it doesn't get shocked — there's no closed loop through its body. Touch a second wire and the loop closes → fatal current flows. The same loop principle saves and kills.",
      growth: [
        { label: "Clarity", emoji: "💡", pct: 11 },
        { label: "Reasoning", emoji: "🧠", pct: 10 },
        { label: "Confidence", emoji: "💪", pct: 8 },
      ],
    },
  },

  chemistry: {
    subjectLabel: "Chemistry",
    subjectEmoji: "⚗️",
    accent: "amber",
    chapterTitle: "Chapter 1 · Chemical Reactions and Equations",
    episodeTitle: "Introduction to Chemical Reactions",
    episodeSubtitle: "When does a 'change' become a real chemical reaction?",
    estimatedMinutes: { d1: 4, d2: 6, d3: 5 },
    day1: {
      hookQuestion:
        "Ice melting and a matchstick burning both LOOK like changes. Why do scientists count only one as a chemical reaction?",
      conceptText:
        "A chemical reaction happens when substances rearrange their atoms to form new substances with different properties. Melting ice only changes its shape — the H₂O molecules stay the same. Burning a matchstick creates totally new molecules (CO₂, H₂O, ash). New substance = chemical reaction.",
      detective: {
        statement: "Cutting an apple and the apple turning brown an hour later are both chemical reactions.",
        isTrue: false,
        explain:
          "Cutting is just a physical change — the apple molecules are unchanged. The browning IS a reaction (oxidation creates new compounds). So only one of the two is a chemical reaction.",
      },
      quickCheck: {
        prompt: "Which observation is the STRONGEST clue that a chemical reaction has occurred?",
        options: [
          "Something looks shiny",
          "A new substance with different properties forms",
          "The temperature stays the same",
          "The mass of the object changes shape",
        ],
        correctIndex: 1,
        explain:
          "The defining clue is a NEW substance with NEW properties. The other clues can occur without any reaction.",
      },
    },
    day2: {
      recallPrompt:
        "Yesterday you learnt: new substance = reaction. Today: HOW do we know — what signals should we look for?",
      deepDiveTitle: "The 5 Tell-Tale Signs",
      deepDiveBody:
        "Chemists look for any of these signs to confirm a reaction: (1) colour change, (2) gas given off, (3) heat or light released or absorbed, (4) a solid (precipitate) forming in a liquid, (5) a smell change. None alone proves a reaction, but together they strongly suggest atoms have rearranged into something new.",
      buildBlocks: [
        "Two substances are mixed or heated.",
        "We watch for tell-tale signs (colour, gas, heat, precipitate, smell).",
        "If signs appear, atoms have likely rearranged.",
        "A new substance with new properties has been formed.",
      ],
      buildCorrectOrder: [0, 1, 2, 3],
      buildExplain:
        "Reactions are detective work: mix → observe signs → infer rearrangement → confirm new substance. Each step relies on the previous one.",
      detective: {
        statement: "Boiling water in a kettle is a chemical reaction because steam looks very different from liquid water.",
        isTrue: false,
        explain:
          "Trick! Steam is still H₂O — same molecules, different state. No new substance was formed, so it's a physical change, not a reaction.",
      },
    },
    day3: {
      whyItWorks:
        "Spotting reactions matters because almost every modern technology — from medicines to batteries to airbags — depends on choosing the RIGHT reaction at the right moment. Misread the signs and you get pollution, explosions, or wasted money.",
      proveItPrompt:
        "Your cousin claims rusting iron isn't a reaction because 'nothing exploded'. Convince them using the 5 signs.",
      caseStudy:
        "Car airbags inflate in 30 milliseconds because a reaction inside (sodium azide → nitrogen gas) is triggered by a crash sensor. Engineers had to be 100% sure NO accidental signs of reaction could occur during normal driving — or your airbag would fire on a pothole.",
      growth: [
        { label: "Clarity", emoji: "💡", pct: 13 },
        { label: "Reasoning", emoji: "🧠", pct: 9 },
        { label: "Confidence", emoji: "💪", pct: 8 },
      ],
    },
  },
};
