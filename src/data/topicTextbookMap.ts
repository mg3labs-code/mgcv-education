// Maps schedule topic titles (partial match) to textbook chapter/episode IDs
// Used by Calendar deep-links to connect daily schedule → textbook episodes

export interface TopicMapping {
  keywords: string[];
  chapterId: string;
  episodeId: string;
  episodeTitle: string;
  subject?: string;
}

export const topicTextbookMap: TopicMapping[] = [
  // ── Mathematics: Chapter 1 – Real Numbers ──
  { keywords: ["number types", "classification", "natural", "whole", "integer", "rational number"], chapterId: "ch1", episodeId: "ch1-ep1", episodeTitle: "Number Types & Classification", subject: "Mathematics" },
  { keywords: ["bee puzzle", "division algorithm", "euclid's division lemma", "division lemma"], chapterId: "ch1", episodeId: "ch1-ep2", episodeTitle: "The Bee Puzzle & Division Algorithm", subject: "Mathematics" },
  { keywords: ["euclid's algorithm", "hcf", "euclidean algorithm", "euclid algorithm"], chapterId: "ch1", episodeId: "ch1-ep3", episodeTitle: "Euclid's Algorithm for HCF", subject: "Mathematics" },
  { keywords: ["fundamental theorem", "prime factorization", "fta", "lcm"], chapterId: "ch1", episodeId: "ch1-ep4", episodeTitle: "Fundamental Theorem of Arithmetic", subject: "Mathematics" },
  { keywords: ["irrational", "sqrt", "√2", "√3", "irrational number"], chapterId: "ch1", episodeId: "ch1-ep5", episodeTitle: "Irrational Numbers", subject: "Mathematics" },
  { keywords: ["real numbers", "number line", "decimal expansion", "terminating"], chapterId: "ch1", episodeId: "ch1-ep6", episodeTitle: "Real Numbers & the Number Line", subject: "Mathematics" },
  { keywords: ["operations on real", "rationali", "surds", "exponents", "closure"], chapterId: "ch1", episodeId: "ch1-ep7", episodeTitle: "Operations on Real Numbers", subject: "Mathematics" },
  // Math: Chapter 2–6 placeholders
  { keywords: ["sets", "venn diagram", "union", "intersection"], chapterId: "ch2", episodeId: "", episodeTitle: "Sets", subject: "Mathematics" },
  { keywords: ["polynomial", "zeroes of polynomial", "zeros of polynomial", "degree of polynomial"], chapterId: "ch3", episodeId: "", episodeTitle: "Polynomials", subject: "Mathematics" },
  { keywords: ["linear equation", "pair of linear", "simultaneous"], chapterId: "ch4", episodeId: "", episodeTitle: "Pair of Linear Equations", subject: "Mathematics" },
  { keywords: ["quadratic", "completing the square", "discriminant"], chapterId: "ch5", episodeId: "", episodeTitle: "Quadratic Equations", subject: "Mathematics" },
  { keywords: ["progression", "arithmetic progression", "geometric progression", "ap ", "gp "], chapterId: "ch6", episodeId: "", episodeTitle: "Progressions", subject: "Mathematics" },

  // ── Science ──
  { keywords: ["chemical reaction", "chemical equation", "balancing equation", "types of reaction"], chapterId: "sci-ch1", episodeId: "", episodeTitle: "Chemical Reactions & Equations", subject: "Science" },
  { keywords: ["acid", "base", "salt", "ph scale", "neutrali"], chapterId: "sci-ch2", episodeId: "", episodeTitle: "Acids, Bases & Salts", subject: "Science" },
  { keywords: ["metal", "non-metal", "reactivity series", "corrosion"], chapterId: "sci-ch3", episodeId: "", episodeTitle: "Metals & Non-Metals", subject: "Science" },
  { keywords: ["carbon compound", "organic", "ethanol", "ethanoic", "hydrocarbon"], chapterId: "sci-ch4", episodeId: "", episodeTitle: "Carbon & its Compounds", subject: "Science" },
  { keywords: ["periodic table", "periodic classification", "mendeleev", "modern periodic"], chapterId: "sci-ch5", episodeId: "", episodeTitle: "Periodic Classification", subject: "Science" },
  { keywords: ["life process", "nutrition", "respiration", "transportation", "excretion"], chapterId: "sci-ch6", episodeId: "", episodeTitle: "Life Processes", subject: "Science" },
  { keywords: ["control", "coordination", "nervous system", "hormone", "reflex"], chapterId: "sci-ch7", episodeId: "", episodeTitle: "Control & Coordination", subject: "Science" },
  { keywords: ["reproduction", "sexual reproduction", "asexual", "budding", "fission"], chapterId: "sci-ch8", episodeId: "", episodeTitle: "How do Organisms Reproduce?", subject: "Science" },
  { keywords: ["heredity", "evolution", "mendel", "gene", "trait", "genetics"], chapterId: "sci-ch9", episodeId: "", episodeTitle: "Heredity & Evolution", subject: "Science" },
  { keywords: ["light", "reflection", "refraction", "mirror", "lens"], chapterId: "sci-ch10", episodeId: "", episodeTitle: "Light: Reflection & Refraction", subject: "Science" },
  { keywords: ["human eye", "prism", "dispersion", "scattering", "colour"], chapterId: "sci-ch11", episodeId: "", episodeTitle: "Human Eye & Colourful World", subject: "Science" },
  { keywords: ["electricity", "ohm", "resistance", "circuit", "current"], chapterId: "sci-ch12", episodeId: "", episodeTitle: "Electricity", subject: "Science" },
  { keywords: ["magnetic", "electromagnet", "fleming", "motor", "generator"], chapterId: "sci-ch13", episodeId: "", episodeTitle: "Magnetic Effects of Current", subject: "Science" },
  { keywords: ["energy", "fossil fuel", "solar", "wind energy", "renewable"], chapterId: "sci-ch14", episodeId: "", episodeTitle: "Sources of Energy", subject: "Science" },
  { keywords: ["environment", "ecosystem", "food chain", "ozone", "biodegradable"], chapterId: "sci-ch15", episodeId: "", episodeTitle: "Our Environment", subject: "Science" },
  { keywords: ["natural resource", "forest", "wildlife", "conservation", "sustainable"], chapterId: "sci-ch16", episodeId: "", episodeTitle: "Management of Natural Resources", subject: "Science" },

  // ── English ──
  { keywords: ["letter to god", "lencho"], chapterId: "eng-ch1", episodeId: "", episodeTitle: "A Letter to God", subject: "English" },
  { keywords: ["nelson mandela", "long walk", "freedom"], chapterId: "eng-ch2", episodeId: "", episodeTitle: "Nelson Mandela", subject: "English" },
  { keywords: ["two stories about flying", "black aeroplane"], chapterId: "eng-ch3", episodeId: "", episodeTitle: "Two Stories About Flying", subject: "English" },
  { keywords: ["from the diary", "anne frank"], chapterId: "eng-ch4", episodeId: "", episodeTitle: "From the Diary of Anne Frank", subject: "English" },
  { keywords: ["hundred dresses"], chapterId: "eng-ch5", episodeId: "", episodeTitle: "The Hundred Dresses", subject: "English" },

  // ── Social Science ──
  { keywords: ["power sharing", "sri lanka", "belgium", "majoritarianism"], chapterId: "sst-ch1", episodeId: "", episodeTitle: "Power Sharing", subject: "Social Science" },
  { keywords: ["federalism", "union list", "state list", "concurrent"], chapterId: "sst-ch2", episodeId: "", episodeTitle: "Federalism", subject: "Social Science" },
  { keywords: ["nationalism in india", "civil disobedience", "salt march", "gandhiji"], chapterId: "sst-ch3", episodeId: "", episodeTitle: "Nationalism in India", subject: "Social Science" },
  { keywords: ["globalisation", "mnc", "trade barrier", "liberalisation"], chapterId: "sst-ch4", episodeId: "", episodeTitle: "Globalisation & the Indian Economy", subject: "Social Science" },
  { keywords: ["development", "per capita income", "hdi", "bmi"], chapterId: "sst-ch5", episodeId: "", episodeTitle: "Development", subject: "Social Science" },
  { keywords: ["resource", "resource planning", "soil", "land use"], chapterId: "sst-ch6", episodeId: "", episodeTitle: "Resources & Development", subject: "Social Science" },

  // ── Hindi ──
  { keywords: ["sakhi", "kabir", "साखी", "कबीर"], chapterId: "hindi-ch1", episodeId: "", episodeTitle: "साखी – Sakhi (Kabir)", subject: "Hindi" },
  { keywords: ["meera", "मीरा", "पद"], chapterId: "hindi-ch2", episodeId: "", episodeTitle: "पद – Meera", subject: "Hindi" },
  { keywords: ["दोहे", "बिहारी", "bihari"], chapterId: "hindi-ch3", episodeId: "", episodeTitle: "दोहे – Bihari", subject: "Hindi" },
  { keywords: ["मानवीय करुणा", "manviya karuna"], chapterId: "hindi-ch4", episodeId: "", episodeTitle: "मानवीय करुणा की दिव्य चमक", subject: "Hindi" },

  // ── Sanskrit ──
  { keywords: ["shemushi", "शेमुषी", "प्रथम", "सूक्ति"], chapterId: "sans-ch1", episodeId: "", episodeTitle: "शुचिपर्यावरणम्", subject: "Sanskrit" },
  { keywords: ["बुद्धि", "बलवती", "buddhi"], chapterId: "sans-ch2", episodeId: "", episodeTitle: "बुद्धिर्बलवती सदा", subject: "Sanskrit" },
];

// Find matching textbook episode for a given topic string
export function findTextbookMatch(topicTitle: string): TopicMapping | null {
  const lower = topicTitle.toLowerCase();
  for (const mapping of topicTextbookMap) {
    for (const keyword of mapping.keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        return mapping;
      }
    }
  }
  return null;
}
