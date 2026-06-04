/**
 * Day-1/2/3 hand-authored content for Chapter 1 pilots.
 *
 * Exact pilots are keyed by `${chapterId}::${episodeId}`.
 * Chapter-level fallback covers supported Chapter 1 episodes; unsupported content falls back to the original reader.
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

// ── Subject-aware real-world hook bank ──────────────────────────
// Every topic gets sensory, curiosity-first content (eat, see, feel, wonder)
// so Day-1 starts from the student's lived world, Day-2 contrasts two real
// situations, and Day-3 ends with a teach-your-friend moment.

type SubjectDomain =
  | "physics"
  | "chemistry"
  | "biology"
  | "geography"
  | "literature-te"
  | "literature-hi"
  | "personality"
  | "generic";

interface RealWorldFrame {
  hook: (topic: string) => string;
  reveal: (topic: string, anchor: string) => string;
  deepDive: (topic: string, anchor: string) => string;
  myth: (topic: string) => { statement: string; isTrue: boolean; explain: string };
  surprise: (topic: string) => { statement: string; isTrue: boolean; explain: string };
  whyItWorks: (topic: string) => string;
  teachFriend: (topic: string) => string;
  caseStudy: (topic: string) => string;
  trap: (topic: string) => { statement: string; isTrue: boolean; explain: string };
}

const FRAMES: Record<SubjectDomain, RealWorldFrame> = {
  physics: {
    hook: (t) => `Switch on a fan and a tubelight together. The light is on instantly. The fan takes a second to spin up. Same current, same socket — why the lag? (Hint: it's hiding in ${t}.)`,
    reveal: (t, a) => `${a} ${t} shows up every time you charge a phone, push a swing, or feel a shock from a doorknob in winter. The rule isn't only in the textbook — it's in your pocket.`,
    deepDive: (t, a) => `Two phones, same 20W charger. One fills in 30 min, the other takes 90 min. Same wall, same wire. The difference is inside the phone — and it's pure ${t}. ${a} Once you see the rate, you stop blaming the charger.`,
    myth: (t) => ({ statement: `A thicker wire always carries more current — so a thick wire shocks you harder.`, isTrue: false, explain: `Thick wires have LESS resistance, so they heat up less and are safer. Shock strength depends on voltage and your body's resistance, not wire thickness. ${t} is why power lines use thick cables — to lose less energy as heat.` }),
    surprise: (t) => ({ statement: `Your phone's battery percent drops faster on a cold morning than a warm afternoon.`, isTrue: true, explain: `Cold slows the chemical reactions inside the battery, raising internal resistance. Same app, same brightness — but ${t} means more energy is lost as heat, less reaches the screen.` }),
    whyItWorks: (t) => `${t} exists because electricity isn't magic — it's charge moving through stuff that resists it. Strip it down: a push (voltage), a flow (current), a friction (resistance). Every gadget you own is just these three in some shape.`,
    teachFriend: (t) => `Your cousin asks: "Why does my old phone heat up while charging but my new one doesn't?" Explain it using ${t} — no jargon, like you're texting them.`,
    caseStudy: (t) => `It's a hot Hyderabad afternoon. The fan's on full, the AC kicks in, then the lights dim for a second. Using ${t}, what just happened in the wires of your house?`,
    trap: (t) => ({ statement: `If you double the voltage, the current always doubles too.`, isTrue: false, explain: `Only when resistance stays constant (Ohm's Law). Real devices — LED bulbs, motors, phone chargers — change resistance as they warm up. ${t} is a rule with a caveat: it's most honest in simple circuits.` }),
  },
  chemistry: {
    hook: (t) => `Cut an apple in half. Leave it on the kitchen counter. In 10 minutes it turns brown. Same apple, same air — but something invisible has changed forever. That's ${t} happening in your hand.`,
    reveal: (t, a) => `${a} ${t} isn't only in labs — it's in the iron gate that rusts, the milk that curdles, the chapati that browns on the tawa. New substances, every time.`,
    deepDive: (t, a) => `Pour vinegar on baking soda — it fizzes for 20 seconds and stops. Pour the same vinegar on a steel spoon — nothing for hours, then a tiny brown spot. Same vinegar, different ${t}. ${a} Speed isn't random — it's chemistry choosing its partners carefully.`,
    myth: (t) => ({ statement: `If a reaction looks 'finished' (no bubbles, no colour change), no atoms are moving anymore.`, isTrue: false, explain: `Atoms keep swapping — but at equal rates in both directions. It just LOOKS still. ${t} reaches equilibrium, not death. Same reason wet clothes still dry on a humid day, just slower.` }),
    surprise: (t) => ({ statement: `The total mass before and after a chemical reaction is exactly the same — even when smoke escapes.`, isTrue: true, explain: `Atoms are never created or destroyed; they just rearrange. ${t} obeys conservation of mass. Burn a candle in a sealed jar — the mass won't change by a milligram.` }),
    whyItWorks: (t) => `${t} exists because atoms aren't loyal — they swap partners to reach a more stable arrangement. Bonds break (energy in), bonds form (energy out), whichever side releases more energy wins. That's it. The rest is dressing.`,
    teachFriend: (t) => `Your friend's grandma says, "Don't keep cut lemons in steel bowls — they 'poison' the steel." Using ${t}, explain what's actually happening — and whether grandma is right.`,
    caseStudy: (t) => `Your mom adds turmeric to dal — it stays yellow. She squeezes lemon on top and it turns bright orange. Using ${t}, explain what just happened — and why this trick only works with turmeric.`,
    trap: (t) => ({ statement: `Burning a log and rusting a nail are both ${t} — but burning is 'real' chemistry and rusting is just decay.`, isTrue: false, explain: `Both are oxidation. Rusting is just slow burning. The log gives off heat in seconds; the nail gives off the same kind of heat over months. ${t} doesn't care about speed.` }),
  },
  biology: {
    hook: (t) => `You eat one chapati. Three hours later, you're running, thinking, breathing — powered by it. But where did the chapati 'go'? It didn't just disappear. That whole journey is ${t}.`,
    reveal: (t, a) => `${a} ${t} is the reason a banana becomes your heartbeat, a glass of milk becomes your bone, and a single seed becomes a 30-foot tree. Living things rebuild themselves from what they eat, drink, and breathe.`,
    deepDive: (t, a) => `A cow eats only grass and grows huge. A tiger eats only meat and grows huge. Same planet, same air — but completely different ${t}. ${a} Pick the wrong strategy for your body and you starve.`,
    myth: (t) => ({ statement: `Plants 'eat' soil — that's why the pot gets lighter as the plant grows bigger.`, isTrue: false, explain: `Van Helmont's experiment: a willow tree gained 75 kg in 5 years; the soil lost only 60 grams. Plants build themselves mostly from air (CO₂) and water. ${t} flipped how we understood life on Earth.` }),
    surprise: (t) => ({ statement: `More than half the oxygen you breathe right now came from tiny ocean plants — not forests.`, isTrue: true, explain: `Phytoplankton produce ~50–80% of Earth's oxygen. The Amazon gets the credit, but the real lungs of the planet are blue, not green. ${t} happens at scales we can't see.` }),
    whyItWorks: (t) => `${t} exists because life needs energy continuously — and energy doesn't come for free. Capture it (food or sun), break it down, use it (movement, thought, growth), throw the waste away. From a bacterium to you — same loop.`,
    teachFriend: (t) => `Your little brother says: "If plants make their own food, why do they need water and sunlight? Just food is food." Using ${t}, fix his confusion in three sentences.`,
    caseStudy: (t) => `Your aunt on a "no-carb" diet feels weak by evening. Your athlete cousin eats rice before every match and feels strong. Same food family, opposite effects. Using ${t}, explain what's happening inside their bodies.`,
    trap: (t) => ({ statement: `${t} only happens when we're awake and active — when you sleep, the body 'rests' and doesn't need energy.`, isTrue: false, explain: `Your brain alone uses ~20% of your body's energy 24/7. Heartbeat, breathing, cell repair, memory consolidation — all run while you sleep. ${t} is BUSIEST at night, just quietly.` }),
  },
  geography: {
    hook: (t) => `Two cities in India, same latitude, same month — Mumbai is drowning in monsoon, Pune (just 150 km east) is sunny and dry. Why? The answer is hidden in ${t}.`,
    reveal: (t, a) => `${a} ${t} decides who gets rain, who grows mangoes, who builds with wood vs. stone, even what people eat for breakfast. The land shapes the life.`,
    deepDive: (t, a) => `Cherrapunji gets 11,000 mm of rain a year. Jaisalmer gets 200 mm — same country, same monsoon system. Same clouds. Different ${t}. ${a} Hills lift clouds, force them to drop rain, leave the other side dry. One shape writes two completely different lives.`,
    myth: (t) => ({ statement: `Places closer to the equator are always hotter than places further away.`, isTrue: false, explain: `Quito sits on the equator at 2,850m — average temp 14°C. Delhi, far from the equator, hits 45°C. ${t} (altitude, winds, ocean currents) often beats latitude.` }),
    surprise: (t) => ({ statement: `The Ganga plain feeds nearly half of India's population from soil that originally came from the Himalayas.`, isTrue: true, explain: `Every monsoon, rivers carve tiny bits of Himalayan rock and dump it as fertile silt across the plains. ${t} isn't static — mountains literally feed billions through rivers, one grain at a time.` }),
    whyItWorks: (t) => `${t} exists because the Earth isn't flat or uniform — mountains, oceans, plateaus, and the sun hits each at different angles. Shape decides climate, climate decides water, water decides food, food decides civilisation.`,
    teachFriend: (t) => `Your cousin from Delhi says: "Why do Kerala houses have sloping roofs while Rajasthan houses have flat ones? Looks weird." Using ${t}, give him the one-line answer he'll never forget.`,
    caseStudy: (t) => `A startup wants to set up a solar farm. Option A: Rajasthan desert. Option B: Coastal Kerala. Both are 'sunny India'. Using ${t}, which would you pick and why?`,
    trap: (t) => ({ statement: `All deserts are hot — that's what makes them deserts.`, isTrue: false, explain: `Ladakh is a cold desert — under 100 mm of rain a year, temperatures down to −40°C. ${t} defines a desert by lack of water, not heat. Antarctica is the largest desert on Earth.` }),
  },
  "literature-te": {
    hook: (t) => `అమ్మ తిట్టినప్పుడు ఏడుపు వస్తుంది. నాన్న పొగిడినప్పుడు నవ్వు వస్తుంది. అదే మాటలు, వేరే వ్యక్తి అంటే వేరే అనిపిస్తుంది. కవిత్వం కూడా అలానే — ${t} ఆ తేడాను చూపిస్తుంది.`,
    reveal: (t, a) => `${a} ${t} అంటే కేవలం పదాలు కాదు — వాటి వెనుక భావం, లయ, చిత్రం. ఒక సినిమా పాట, ఒక డైలాగ్, అమ్మ చెప్పిన ఒక కథ — అన్నీ ${t} యొక్క రూపాలే.`,
    deepDive: (t, a) => `"వాన పడుతుంది" అని మిత్రుడు చెప్తే మామూలుగా అనిపిస్తుంది. అదే మాటను కవి "ఆకాశం కన్నీళ్లు రాలుస్తోంది" అంటే గుండె కదిలిపోతుంది. పదాలు ఒకటే కాదు. ${a}`,
    myth: (t) => ({ statement: `${t} ను అర్థం చేసుకోవాలంటే ప్రతి పదాన్ని డిక్షనరీలో చూడాలి.`, isTrue: false, explain: `డిక్షనరీ పదాల అర్థం చెప్తుంది, కవి భావం చెప్పదు. ${t} లో పదాల వెనుక ఉన్న అనుభూతిని గుండెతో పట్టుకోవాలి.` }),
    surprise: (t) => ({ statement: `మంచి కవితను బిగ్గరగా చదివితే మౌనంగా చదివిన దానికంటే ఎక్కువ అర్థమవుతుంది.`, isTrue: true, explain: `${t} లో లయ, ధ్వని, ఊపిరి కలిసి భావం తయారవుతుంది. మౌనంగా చదివితే సగం మిస్ అవుతాం.` }),
    whyItWorks: (t) => `${t} ఎందుకు ఉంది? మామూలు మాటలు సరిపోవు. "నాకు బాధగా ఉంది" వేరు; "నా గుండె రెండు ముక్కలుగా చీలింది" వేరు. భావాన్ని పూర్తిగా చెప్పాలంటే చిత్రం, లయ కావాలి.`,
    teachFriend: (t) => `మీ స్నేహితుడు అంటాడు: "కవిత్వం బోర్. డైరెక్ట్ గా చెప్తే పోలా?" ${t} ఉపయోగించి, రెండు వాక్యాల్లో అతని అభిప్రాయం మార్చండి.`,
    caseStudy: (t) => `ఒక సినిమా పాట మీకు చాలా నచ్చింది. మీ తాతగారికి అదే పాట నచ్చలేదు. అదే పదాలు, అదే ట్యూన్. ${t} దృష్టితో ఎందుకు ఇలా జరిగింది?`,
    trap: (t) => ({ statement: `${t} లోని భావం ఎప్పుడూ ఒకటే — ఎవరు చదివినా ఒకే అర్థం.`, isTrue: false, explain: `గొప్ప కవిత యొక్క శక్తి — ప్రతి పాఠకుడు తన అనుభవాన్ని జోడిస్తాడు. ${t} అద్దం లాంటిది.` }),
  },
  "literature-hi": {
    hook: (t) => `माँ की डाँट से रोना आता है, पापा की तारीफ़ से हँसी। एक ही बात, अलग आदमी कहे तो अलग चुभती है। कविता भी वैसी ही — ${t} इसी अंतर को पकड़ती है।`,
    reveal: (t, a) => `${a} ${t} सिर्फ़ शब्द नहीं — उनके पीछे का भाव, लय, और चित्र। एक गाना, एक डायलॉग, दादी की एक कहानी — सब ${t} के रूप हैं।`,
    deepDive: (t, a) => `"बारिश हो रही है" — दोस्त कहे तो साधारण। वही बात कवि कहे — "आसमान आँसू बहा रहा है" — दिल हिल जाता है। शब्द एक से नहीं। ${a}`,
    myth: (t) => ({ statement: `${t} समझने के लिए हर शब्द शब्दकोश में देखना ज़रूरी है।`, isTrue: false, explain: `शब्दकोश शब्द का अर्थ देता है, कवि का भाव नहीं। ${t} दिल से समझ आती है, दिमाग़ से नहीं।` }),
    surprise: (t) => ({ statement: `कविता ज़ोर से पढ़ने पर चुपचाप पढ़ने से ज़्यादा समझ आती है।`, isTrue: true, explain: `${t} में लय, ध्वनि, और साँस मिलकर भाव बनाते हैं। चुपचाप पढ़ने पर आधा छूट जाता है।` }),
    whyItWorks: (t) => `${t} क्यों है? साधारण शब्द काफ़ी नहीं। "मुझे दुख है" अलग बात; "मेरा दिल दो टुकड़े हो गया" बिलकुल अलग। भाव को पूरा कहने के लिए चित्र, लय चाहिए — वही कविता।`,
    teachFriend: (t) => `दोस्त कहता है: "कविता बोरिंग है। सीधे क्यों नहीं कहते?" ${t} इस्तेमाल करके दो वाक्यों में उसकी राय बदलिए।`,
    caseStudy: (t) => `एक फ़िल्मी गाना आपको बहुत पसंद आया। दादाजी को बिलकुल नहीं भाया। शब्द वही, धुन वही। ${t} के नज़रिए से ऐसा क्यों हुआ?`,
    trap: (t) => ({ statement: `${t} का भाव हमेशा एक जैसा — कोई भी पढ़े, अर्थ एक ही।`, isTrue: false, explain: `महान कविता की ताक़त — हर पाठक अपना अनुभव जोड़ता है। ${t} एक आईना है।` }),
  },
  personality: {
    hook: (t) => `Two brothers, same house, same school, same parents. One panics before every exam, the other feels curious. The difference isn't in DNA — it's in ${t}.`,
    reveal: (t, a) => `${a} ${t} is the quiet thing built from daily small habits — how you think, what you say, what you do under pressure. Ten years from now, this becomes 'you'.`,
    deepDive: (t, a) => `Young Virat Kohli was famously hot-headed — low self-control. By 30, he'd channelled that same aggression into laser focus. DNA didn't change — ${t} did. ${a} You're not fixed. You're being built, every day.`,
    myth: (t) => ({ statement: `${t} is something you're born with — some people are 'confident', some 'shy', and that's that.`, isTrue: false, explain: `Research is clear: ~30–50% of personality is genetic; the rest comes from experience, practice, and how you think about yourself. ${t} is a muscle, not a tattoo.` }),
    surprise: (t) => ({ statement: `Writing in a journal for 5 minutes a day can measurably change ${t} within one year.`, isTrue: true, explain: `Harvard studies: people who reflect daily on what they tried, failed, and learned show 23% higher self-awareness. ${t} is built from tiny, repeated honest moments — not big vows.` }),
    whyItWorks: (t) => `${t} matters because 80% of life's problems don't come from outside — they come from how we react. ${t} is the mould that turns every input into an output. Change the mould — the whole life shifts.`,
    teachFriend: (t) => `Your friend just failed an exam and says "I'm useless." Using ${t}, change his thinking in one sentence — without fake comfort.`,
    caseStudy: (t) => `Two students from the same class — one cracks IIT, the other drops out mid-year. IQ roughly equal. Using ${t}, where was the real difference hiding?`,
    trap: (t) => ({ statement: `The best way to improve ${t} is to be hard on yourself — scold your weaknesses and you'll fix them.`, isTrue: false, explain: `Research says the opposite: self-compassion drives 3x more change than self-criticism. ${t} grows in safety, not fear.` }),
  },
  generic: {
    hook: (t) => `Open Instagram. You watch 30 reels in 5 minutes. Your brain barely remembers 2 of them. But one song from 5 years ago — you remember every word. Why does memory pick what it picks? ${t} is part of that answer.`,
    reveal: (t, a) => `${a} ${t} isn't about being smart — it's about how the brain links new ideas to things you already care about. Connect it to your world, and it sticks.`,
    deepDive: (t, a) => `Two students study the same chapter. One re-reads it 5 times. The other reads it once, then explains it to a friend. The second scores higher. Same chapter, same time. Different ${t}. ${a}`,
    myth: (t) => ({ statement: `More study hours always means more learning — 6 hours beats 3 hours, always.`, isTrue: false, explain: `Research shows 3 hours of focused, active learning beats 6 hours of passive re-reading. ${t} cares about depth of attention, not clock time.` }),
    surprise: (t) => ({ statement: `Teaching a topic to someone for 10 minutes makes you remember it longer than re-reading the chapter 5 times.`, isTrue: true, explain: `Called the 'Protégé effect' — explaining forces your brain to organise the idea. ${t} sticks best when it leaves your head and meets another person's confusion.` }),
    whyItWorks: (t) => `${t} works because the brain doesn't store information like a hard drive — it builds connections. New idea + old idea you care about = memory that lasts.`,
    teachFriend: (t) => `Your younger sibling says, "I read everything, but I forget by morning." Using ${t}, give them one practical change they can try today.`,
    caseStudy: (t) => `Two friends prep for the same exam. One uses YouTube + notes + group discussion. The other uses only the textbook. Same final marks. Using ${t}, explain how both can work — and which builds more lasting skill.`,
    trap: (t) => ({ statement: `Once you understand ${t} in class, you've learned it. Revision is just for marks.`, isTrue: false, explain: `Understanding ≠ remembering. Without spaced revision, ~70% of what you understood today is gone in a week. ${t} sticks only when revisited at day 1, 3, 7, 21.` }),
  },
};

const detectDomain = (topic: string, chapterIdHint?: string): SubjectDomain => {
  const id = (chapterIdHint || "").toLowerCase();
  const t = topic.toLowerCase();
  if (id.startsWith("phy") || /electric|circuit|ohm|resist|current|voltage|force|motion|gravity|wave/.test(t)) return "physics";
  if (id.startsWith("chem") || id.startsWith("sci") || /chemical|reaction|equation|acid|base|oxid|element|compound|salt/.test(t)) return "chemistry";
  if (id.startsWith("bio") || /nutrition|photosynthesis|digest|respir|cell|tissue|organ/.test(t)) return "biology";
  if (id.startsWith("india-relief") || /himalaya|plateau|coast|island|desert|river|relief|climate|monsoon|geograph/.test(t)) return "geography";
  if (id.startsWith("danaseelamu") || /[\u0C00-\u0C7F]/.test(topic)) return "literature-te";
  if (id.startsWith("baraste") || /[\u0900-\u097F]/.test(topic)) return "literature-hi";
  if (id.startsWith("personality") || /attitude|success|determination|character|mindset/.test(t)) return "personality";
  return "generic";
};

const makeChapterPilot = (topic: string, anchorIdea: string, chapterIdHint?: string): DayPilotContent => {
  const domain = detectDomain(topic, chapterIdHint);
  const F = FRAMES[domain];
  return {
    conceptKey: toConceptKey(topic),
    conceptLabel: topic,
    hookQuestion: F.hook(topic),
    conceptText: F.reveal(topic, anchorIdea),
    detective: F.trap(topic),
    quickCheck: {
      prompt: `Which of these is the clearest, real-world way to learn ${topic}?`,
      options: [
        `Memorise the textbook definition word-for-word`,
        `Spot it in something you already eat, see, or feel every day`,
        `Copy the formula five times in a notebook`,
        `Watch a YouTube video at 2x speed`,
      ],
      correctIndex: 1,
      explain: `Real understanding starts when you SEE the idea in something you already know — your kitchen, your phone, your street. That "ohhh, that's why!" moment is the brain locking the idea into long-term memory.`,
    },
    day2: {
      deepDiveText: F.deepDive(topic, anchorIdea),
      detective1: F.myth(topic),
      detective2: F.surprise(topic),
      sort: {
        variant: "pairs",
        title: "Match the Real-World Move",
        subtitle: "Connect each strong-learner move to what it actually unlocks.",
        leftItems: [
          { id: "c1", label: "Spot it in your kitchen / phone / street", matchId: "e1" },
          { id: "c2", label: "Compare two real situations side-by-side", matchId: "e2" },
          { id: "c3", label: "Catch the myth most people believe", matchId: "e3" },
          { id: "c4", label: "Explain it to a friend in 2 sentences", matchId: "e4" },
        ],
        rightItems: [
          { id: "e1", label: "Anchor the idea to memory you already trust" },
          { id: "e2", label: "See what the rule actually does differently" },
          { id: "e3", label: "Drop a wrong mental model you've been carrying" },
          { id: "e4", label: "Prove your brain has organised the idea" },
        ],
        explainOnRight: "Exactly. These four moves turn 'I read it' into 'I own it'.",
        explainOnWrong: "Each move unlocks one specific thing — anchor, contrast, myth-bust, expression.",
      },
    },
    day3: {
      whyItWorks: F.whyItWorks(topic),
      proveItPrompt: F.teachFriend(topic),
      caseStudy: F.caseStudy(topic),
      growthGains: innerOSGains,
      sort: {
        variant: "order",
        title: "Order the path most students skip",
        subtitle: "Drag the steps into the order that actually builds mastery.",
        correctOrder: [
          { id: "s1", label: "Notice it in your real world (eat, see, feel, wonder)" },
          { id: "s2", label: "Compare two situations side-by-side" },
          { id: "s3", label: "Catch the myth most people believe" },
          { id: "s4", label: "Explain it to a friend in your own words" },
          { id: "s5", label: "Use it once in a brand-new situation" },
        ],
        explainOnRight: "That's the path. Notice → contrast → myth-bust → teach → re-use. Mastery, not memory.",
        explainOnWrong: "Close. Always start in your real world, then contrast, then myth-bust, then teach, then re-use.",
      },
    },
  };
};

const chapterOnePilots: Record<string, DayPilotContent> = {
  "sci-ch1::sci-ch1-ep1": makeChapterPilot("chemical reactions", "A chemical reaction means substances change into new substances.", "sci-ch1"),
  "sci-ch1::sci-ch1-ep2": makeChapterPilot("chemical equations", "A chemical equation uses symbols and formulas to show a reaction clearly.", "sci-ch1"),
  "sci-ch1::sci-ch1-ep3": makeChapterPilot("types of chemical reactions", "Reaction types help us classify what changes during a chemical reaction.", "sci-ch1"),
  "personality-development::attitude-is-altitude": makeChapterPilot("Attitude", "Attitude shapes how a person responds to every challenge.", "personality-development"),
  "personality-development::every-success-story": makeChapterPilot("Success", "Success stories show how choices, effort, and support shape growth.", "personality-development"),
  "personality-development::i-will-do-it": makeChapterPilot("Determination", "Strong determination turns a difficult goal into steady action.", "personality-development"),
  "india-relief-features::the-great-himalayas": makeChapterPilot("the Great Himalayas", "Relief features shape climate, rivers, travel, and human life.", "india-relief-features"),
  "india-relief-features::peninsular-plateau-coastal-plains": makeChapterPilot("plateaus and coastal plains", "Plateaus and coastal plains shape farming, minerals, transport, and settlement.", "india-relief-features"),
  "india-relief-features::islands-deserts-river-plains": makeChapterPilot("islands, deserts, and river plains", "Landforms influence water, soil, climate, and where people live.", "india-relief-features"),
  "danaseelamu::danaseelamu-padya-parichayam": makeChapterPilot("దానశీలము", "ఈ పద్యం దాతృత్వం యొక్క నిజమైన అర్థాన్ని చూపిస్తుంది.", "danaseelamu"),
  "danaseelamu::danaseelamu-padya-vishleshanam": makeChapterPilot("దానశీలము భావ విశ్లేషణ", "పద్య విశ్లేషణ అంటే ప్రతి పంక్తి వెనుక భావాన్ని పట్టుకోవడం.", "danaseelamu"),
  "danaseelamu::danaseelamu-bhava-vistaranam": makeChapterPilot("దానశీలము భావ విస్తరణ", "పద్యం యొక్క భావాన్ని నిజ జీవితానికి అన్వయించడం.", "danaseelamu"),
  "baraste-badal::baraste-badal-kavita-parichay": makeChapterPilot("बरसते बादल", "यह कविता बारिश के दृश्य और भावनाओं को सजीव करती है।", "baraste-badal"),
  "baraste-badal::baraste-badal-bhav-vishleshan": makeChapterPilot("बरसते बादल भाव विश्लेषण", "भाव विश्लेषण कविता के पीछे की भावना पकड़ता है।", "baraste-badal"),
  "baraste-badal::baraste-badal-bhasha-shilp": makeChapterPilot("बरसते बादल भाषा और शिल्प", "भाषा और शिल्प दिखाते हैं कवि चित्रों को कैसे जीवंत करता है।", "baraste-badal"),
  "bio-ch1::bio-ch1-ep1": makeChapterPilot("nutrition", "Nutrition is how living things get and use food for energy and growth.", "bio-ch1"),
  "bio-ch1::bio-ch1-ep2": makeChapterPilot("photosynthesis", "Photosynthesis is how green plants use sunlight to make food.", "bio-ch1"),
  "bio-ch1::bio-ch1-ep3": makeChapterPilot("human digestion", "Digestion breaks food into smaller parts the body can actually use.", "bio-ch1"),
  "phy-ch1::phy-ch1-ep1": makeChapterPilot("electric current and circuits", "A circuit gives electric current a complete path to flow.", "phy-ch1"),
  "phy-ch1::phy-ch1-ep2": makeChapterPilot("Ohm's Law", "Ohm's Law connects voltage, current, and resistance in a circuit.", "phy-ch1"),
  "phy-ch1::phy-ch1-ep3": makeChapterPilot("resistance and resistivity", "Resistance explains how strongly a material opposes electric current.", "phy-ch1"),
  "chem-ch1::chem-ch1-ep1": makeChapterPilot("chemical reactions", "A chemical reaction means old substances rearrange to form new substances.", "chem-ch1"),
  "chem-ch1::chem-ch1-ep2": makeChapterPilot("balancing chemical equations", "Balanced equations show that atoms are conserved in a reaction.", "chem-ch1"),
  "chem-ch1::chem-ch1-ep3": makeChapterPilot("types of reactions", "Reaction types help classify how substances combine, break, or exchange parts.", "chem-ch1"),
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
    hookQuestion: "A team flew to the World Cup semis without playing their last match. A decimal that never ends decided it. How?",
    conceptText:
      "Net Run Rate, monsoon onset dates, song BPMs, bill splits — every 'average' you see is built from one whole number divided by another. Most of those divisions never end cleanly. Some stop (1÷2 = 0.5). Some repeat forever in a pattern (1÷3 = 0.333…). Some, like √2, never repeat at all. Together they fill every point on the number line — and we call them the real numbers. The scoreboard rounds. The number doesn't.",
    detective: {
      statement: "0.9999999… (nines that never stop) is almost equal to 1, but not exactly 1.",
      isTrue: false,
      explain:
        "Feels true — but it's false. Proof in one line: let x = 0.999…. Then 10x = 9.999…. Subtract: 9x = 9, so x = 1. Same point on the number line, two valid names. Your doubt wasn't wrong — it just means your brain takes 'infinity' seriously. That's what real numbers are about.",
    },
    quickCheck: {
      prompt: "An IPL team's Net Run Rate shows as 1.34782608… on the points table. Which family of real numbers is this?",
      options: ["Irrational — digits never stop", "Rational — it's runs ÷ overs, two whole numbers", "Neither — sport numbers are special", "Whole number — boards round it"],
      correctIndex: 1,
      explain:
        "Every NRR is runs ÷ overs — an integer divided by an integer. That makes it rational by definition, even when the decimal tail is endless. Irrational numbers (like √2) come from a totally different source — they can't be written as any fraction at all.",
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
        "Your cousin says '0.333… is NOT exactly 1/3 — it's just close.' In two sentences, convince them they're the same number.",
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
  return null;
}

// ── Interest-flavoured hook overrides (Day 1 first-thought + concept reveal) ──
// Keeps the same trap / sort / Day-2 / Day-3 — only swaps the opening mystery so
// the student feels the lesson starts from something they already love.
export type PilotInterest = "cricket" | "nature" | "music" | "travel";

export interface PilotInterestOverride {
  hookQuestion: string;
  conceptText: string;
  badgeLabel: string;
  emoji: string;
}

export const PILOT_INTEREST_OPTIONS: { tag: PilotInterest; label: string; emoji: string; sub: string }[] = [
  { tag: "cricket", label: "Cricket", emoji: "🏏", sub: "NRR, run-rates, qualifiers" },
  { tag: "nature", label: "Monsoon & nature", emoji: "🌧", sub: "Rain, forests, wildlife" },
  { tag: "music", label: "Music", emoji: "🎵", sub: "BPM, beats, tempo" },
  { tag: "travel", label: "Travel & food", emoji: "✈️", sub: "Flights, splits, recipes" },
];

const PILOT_INTEREST_OVERRIDES: Record<string, Partial<Record<PilotInterest, PilotInterestOverride>>> = {
  "ch1::ch1-ep1": {
    cricket: {
      badgeLabel: "Cricket",
      emoji: "🏏",
      hookQuestion: "A team flew to the World Cup semis without playing their last match. A decimal that never ends decided it. How?",
      conceptText:
        "Net Run Rate = runs ÷ overs — one whole number divided by another. Most of those divisions never end cleanly (1÷3 = 0.333…, NRR = 1.34782608…). Some, like √2, never repeat at all. Together they fill every point on the number line — the real numbers. The scoreboard rounds. The number doesn't.",
    },
    nature: {
      badgeLabel: "Monsoon",
      emoji: "🌧",
      hookQuestion: "IMD says the Kerala monsoon arrives ~June 1 every year — but the model actually says 31.4285714… May. Why does the date get rounded but the maths can't be?",
      conceptText:
        "Every 'average rainfall', 'average onset date', 'average forest cover' is sum ÷ count — a fraction of two whole numbers. Most divisions never terminate (1÷7 = 0.142857142857…). Some, like √2, never repeat at all. All of them fit on the number line — that's the real numbers. Headlines round. Nature doesn't.",
    },
    music: {
      badgeLabel: "Music",
      emoji: "🎵",
      hookQuestion: "Your tuner app shows the song at 120.000 BPM. Your friend's app shows 119.9999987… BPM. Both are right. How?",
      conceptText:
        "BPM = beats ÷ minutes — a fraction. Most fractions never end cleanly (1÷3 = 0.333…). Some numbers, like √2, never repeat at all. Between any two BPM readings there are infinitely many real numbers — the apps just round to different decimal places. The real number line has no gaps.",
    },
    travel: {
      badgeLabel: "Travel",
      emoji: "✈️",
      hookQuestion: "A bill for ₹1000 split among 3 friends should be ₹333.33… each — but the payment app only shows ₹333.33. Where did the extra paisa go?",
      conceptText:
        "1000 ÷ 3 = 333.333… — a decimal that never ends. Apps round to 2 places, but the real number sits on the number line, exactly. Every average flight time, bill split, fuel-per-km is integer ÷ integer. Some divisions terminate. Most don't. A few, like √2, never even repeat — yet all of them are real numbers.",
    },
  },
};

export function getPilotInterestOverride(
  chapterId: string | undefined,
  episodeId: string | undefined,
  interest: PilotInterest | undefined,
): PilotInterestOverride | null {
  if (!chapterId || !episodeId || !interest) return null;
  return PILOT_INTEREST_OVERRIDES[`${chapterId}::${episodeId}`]?.[interest] ?? null;
}

export function hasPilotInterestOverrides(chapterId?: string, episodeId?: string): boolean {
  if (!chapterId || !episodeId) return false;
  return !!PILOT_INTEREST_OVERRIDES[`${chapterId}::${episodeId}`];
}

