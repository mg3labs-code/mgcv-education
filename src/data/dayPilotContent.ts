/**
 * Day-1/2/3 hand-authored content for Chapter 1 pilots.
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
  conceptKey?: string;
  conceptLabel?: string;
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

const innerOSGains = [
  { label: "Attention", emoji: "👁️", pct: 4 },
  { label: "Thinking", emoji: "🧠", pct: 5 },
  { label: "Resilience", emoji: "🛡️", pct: 3 },
  { label: "Momentum", emoji: "⚡", pct: 4 },
  { label: "Values", emoji: "🌱", pct: 2 },
];

const toConceptKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "chapter-1-concept";

const withConceptMeta = (pilot: DayPilotContent, topic: string): DayPilotContent => ({
  conceptKey: pilot.conceptKey ?? toConceptKey(topic),
  conceptLabel: pilot.conceptLabel ?? topic,
  ...pilot,
});

const makeChapterPilot = (topic: string, anchorIdea: string): DayPilotContent => ({
  conceptKey: toConceptKey(topic),
  conceptLabel: topic,
  hookQuestion: `What is the first thing you notice about ${topic}?`,
  conceptText: `${topic} becomes easier when we find the main idea first. Today, do not try to memorize everything. Notice the key idea, connect it to one example, and check one common misunderstanding.`,
  detective: {
    statement: `Understanding ${topic} means memorizing every line first.`,
    isTrue: false,
    explain: `Not first. Start with the main idea, then use details to support it. Memorizing without meaning is weak learning.`,
  },
  quickCheck: {
    prompt: `What is the best first step when learning ${topic}?`,
    options: ["Memorize all words", "Find the main idea", "Skip examples", "Only guess answers"],
    correctIndex: 1,
    explain: `Finding the main idea gives your brain a handle. After that, examples and facts become easier to place.`,
  },
  day2: {
    deepDiveText: `${anchorIdea} A strong learner asks: what is happening, why does it happen, and what mistake might someone make here? That is deeper than only reading the paragraph once.`,
    detective1: {
      statement: `One example is enough to understand all of ${topic}.`,
      isTrue: false,
      explain: `One example helps, but you need the idea behind it. Otherwise a new example can confuse you.`,
    },
    detective2: {
      statement: `Explaining ${topic} in your own words can reveal whether you really understood it.`,
      isTrue: true,
      explain: `Yes. Explain-back shows gaps quickly because your brain has to organize the idea, not just repeat it.`,
    },
    sort: {
      variant: "pairs",
      title: "Match Idea to Use",
      subtitle: "Connect each learning move to what it helps you do.",
      leftItems: [
        { id: "c1", label: "Find the main idea", matchId: "e1" },
        { id: "c2", label: "Use one example", matchId: "e2" },
        { id: "c3", label: "Spot a mistake", matchId: "e3" },
        { id: "c4", label: "Explain in your words", matchId: "e4" },
      ],
      rightItems: [
        { id: "e1", label: "Know what the lesson is really about" },
        { id: "e2", label: "Make the idea concrete" },
        { id: "e3", label: "Avoid shallow understanding" },
        { id: "e4", label: "Prove you can organize the idea" },
      ],
      explainOnRight: "Good. These are the moves strong learners use before heavy practice.",
      explainOnWrong: "Try matching the move to its purpose: idea, example, mistake, explanation.",
    },
  },
  day3: {
    whyItWorks: `${topic} stays in memory when you rebuild it yourself. First you notice the idea. Then you test it with examples. Finally, you explain it clearly enough that someone else can understand it.`,
    proveItPrompt: `Explain ${topic} to a younger student in simple words. Use one example.`,
    caseStudy: `Your call: imagine a classmate misunderstood ${topic}. What would you say first to make the idea clear without confusing them?`,
    growthGains: innerOSGains,
    sort: {
      variant: "order",
      title: "Put the learning path in order",
      subtitle: "Drag the steps into the best order for mastery.",
      correctOrder: [
        { id: "s1", label: "Notice the main idea" },
        { id: "s2", label: "Connect one example" },
        { id: "s3", label: "Spot a common mistake" },
        { id: "s4", label: "Explain it in your own words" },
        { id: "s5", label: "Use it in a new situation" },
      ],
      explainOnRight: "Exactly. This path turns reading into real understanding.",
      explainOnWrong: "Close. Start with the idea, then example, mistake, explanation, and new use.",
    },
  },
});

const chapterOnePilots: Record<string, DayPilotContent> = {
  "sci-ch1::sci-ch1-ep1": makeChapterPilot("chemical reactions", "A chemical reaction means substances change into new substances."),
  "sci-ch1::sci-ch1-ep2": makeChapterPilot("chemical equations", "A chemical equation uses symbols and formulas to show a reaction clearly."),
  "sci-ch1::sci-ch1-ep3": makeChapterPilot("types of chemical reactions", "Reaction types help us classify what changes during a chemical reaction."),
  "personality-development::attitude-is-altitude": makeChapterPilot("Attitude is Altitude", "Attitude shapes how a person responds to challenges."),
  "personality-development::every-success-story": makeChapterPilot("Every Success Story", "Success stories show how choices, effort, and support shape growth."),
  "personality-development::i-will-do-it": makeChapterPilot("I Will Do It", "Strong determination turns a difficult goal into steady action."),
  "india-relief-features::the-great-himalayas": makeChapterPilot("the Great Himalayas", "Relief features affect climate, rivers, travel, and human life."),
  "india-relief-features::peninsular-plateau-coastal-plains": makeChapterPilot("plateaus and coastal plains", "Plateaus and coastal plains shape farming, minerals, transport, and settlement."),
  "india-relief-features::islands-deserts-river-plains": makeChapterPilot("islands, deserts, and river plains", "Landforms influence water, soil, climate, and where people live."),
  "danaseelamu::danaseelamu-padya-parichayam": makeChapterPilot("దానశీలము", "A poem becomes clearer when we first catch its central feeling and value."),
  "danaseelamu::danaseelamu-padya-vishleshanam": makeChapterPilot("దానశీలము భావ విశ్లేషణ", "Poem analysis means noticing feeling, message, and how lines create meaning."),
  "danaseelamu::danaseelamu-bhava-vistaranam": makeChapterPilot("దానశీలము భావ విస్తరణ", "Expanding a poem's idea helps connect its value to real life."),
  "baraste-badal::baraste-badal-kavita-parichay": makeChapterPilot("बरसते बादल", "A poem becomes clearer when we first notice its image, feeling, and message."),
  "baraste-badal::baraste-badal-bhav-vishleshan": makeChapterPilot("बरसते बादल भाव विश्लेषण", "Poem analysis means finding the feeling and message behind the images."),
  "baraste-badal::baraste-badal-bhasha-shilp": makeChapterPilot("बरसते बादल भाषा और शिल्प", "Language and style show how a poet makes images feel alive."),
  "bio-ch1::bio-ch1-ep1": makeChapterPilot("nutrition", "Nutrition is how living things get and use food for energy and growth."),
  "bio-ch1::bio-ch1-ep2": makeChapterPilot("photosynthesis", "Photosynthesis is how green plants use sunlight to make food."),
  "bio-ch1::bio-ch1-ep3": makeChapterPilot("human digestion", "Digestion breaks food into smaller parts the body can use."),
  "phy-ch1::phy-ch1-ep1": makeChapterPilot("electric current and circuits", "A circuit gives electric current a complete path to flow."),
  "phy-ch1::phy-ch1-ep2": makeChapterPilot("Ohm's Law", "Ohm's Law connects voltage, current, and resistance in a circuit."),
  "phy-ch1::phy-ch1-ep3": makeChapterPilot("resistance and resistivity", "Resistance explains how strongly a material opposes electric current."),
  "chem-ch1::chem-ch1-ep1": makeChapterPilot("chemical reactions", "A chemical reaction means old substances rearrange to form new substances."),
  "chem-ch1::chem-ch1-ep2": makeChapterPilot("balancing chemical equations", "Balanced equations show that atoms are conserved in a reaction."),
  "chem-ch1::chem-ch1-ep3": makeChapterPilot("types of reactions", "Reaction types help classify how substances combine, break, or exchange parts."),
};

const chapterOneTopicByChapterId: Record<string, { topic: string; anchorIdea: string }> = {
  ch1: { topic: "real numbers", anchorIdea: "Real numbers help us describe counting, zero, negatives, fractions, and measurements." },
  "sci-ch1": { topic: "chemical reactions", anchorIdea: "A chemical reaction means substances change into new substances." },
  "personality-development": { topic: "personality development", anchorIdea: "Personality grows through attitude, choices, effort, and reflection." },
  "india-relief-features": { topic: "India's relief features", anchorIdea: "Relief features affect climate, rivers, travel, and human life." },
  danaseelamu: { topic: "దానశీలము", anchorIdea: "A poem becomes clearer when we first catch its central feeling and value." },
  "baraste-badal": { topic: "बरसते बादल", anchorIdea: "A poem becomes clearer when we first notice its image, feeling, and message." },
  "bio-ch1": { topic: "nutrition", anchorIdea: "Nutrition is how living things get and use food for energy and growth." },
  "phy-ch1": { topic: "electricity", anchorIdea: "Electricity becomes useful when current has a complete path to flow." },
  "chem-ch1": { topic: "chemical reactions", anchorIdea: "A chemical reaction means old substances rearrange to form new substances." },
};

export const dayPilotContent: Record<string, DayPilotContent> = {
  ...chapterOnePilots,
  "ch1::ch1-ep2": makeChapterPilot("Euclid's Division Lemma", "Euclid's Division Lemma breaks a number into divisor, quotient, and remainder."),
  "ch1::ch1-ep3": makeChapterPilot("prime factorization", "Prime factorization shows every whole number as a unique product of primes."),
  "ch1::ch1-ep1": withConceptMeta({
    hookQuestion: "Why do we need so many different kinds of numbers?",
    conceptText:
      "Numbers come in families. Counting numbers help us count things we can see. Then we needed 0 for nothing. Then we needed negative numbers for opposites like debt or below zero. Each new family was added when the old numbers could not solve a real problem.",
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
      title: "Build the Families",
      subtitle: "Drag each number into its smallest family.",
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
        "Number systems grow like routes on a map. Counting numbers came first. Zero was added for 'nothing'. Negative numbers were added for opposites like debt. Fractions were added for sharing. Each new family solved a problem the older family could not solve.",
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
        title: "Match Need to Number",
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
        "A number system grows when reality forces it to. You cannot count −3 cows, but you can owe ₹3. That is why negative numbers exist. Math grows when old rules cannot describe something real, so people build a better rule.",
      proveItPrompt:
        "Imagine you're explaining to a younger cousin why we need negative numbers. What real-life situation would you use to convince them?",
      caseStudy:
        "A cricket team's net run rate can be negative. Without negative numbers, we could not clearly show who is behind in a tournament. Your call: where else do negative numbers help us show a real situation clearly?",
      growthGains: [
        { label: "Attention", emoji: "👁️", pct: 4 },
        { label: "Thinking", emoji: "🧠", pct: 5 },
        { label: "Resilience", emoji: "🛡️", pct: 3 },
        { label: "Momentum", emoji: "⚡", pct: 4 },
        { label: "Values", emoji: "🌱", pct: 2 },
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
  }, "real numbers"),
};

export function getPilotContent(chapterId?: string, episodeId?: string): DayPilotContent | null {
  if (!chapterId || !episodeId) return null;
  const exactPilot = dayPilotContent[`${chapterId}::${episodeId}`];
  if (exactPilot) return exactPilot;
  const chapterPilot = chapterOneTopicByChapterId[chapterId];
  return chapterPilot ? makeChapterPilot(chapterPilot.topic, chapterPilot.anchorIdea) : null;
}
