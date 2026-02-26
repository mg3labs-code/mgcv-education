// Maps schedule topic titles (partial match) to textbook chapter/episode IDs
// Used by Deep Dive to link daily schedule to textbook episodes

export interface TopicMapping {
  keywords: string[]; // partial matches against schedule topic title
  chapterId: string;
  episodeId: string;
  episodeTitle: string;
}

export const topicTextbookMap: TopicMapping[] = [
  // Chapter 1: Real Numbers
  { keywords: ["number types", "classification", "natural", "whole", "integer", "rational number"], chapterId: "ch1", episodeId: "ch1-ep1", episodeTitle: "Number Types & Classification" },
  { keywords: ["bee puzzle", "division algorithm", "euclid's division lemma", "division lemma"], chapterId: "ch1", episodeId: "ch1-ep2", episodeTitle: "The Bee Puzzle & Division Algorithm" },
  { keywords: ["euclid's algorithm", "hcf", "euclidean algorithm", "euclid algorithm"], chapterId: "ch1", episodeId: "ch1-ep3", episodeTitle: "Euclid's Algorithm for HCF" },
  { keywords: ["fundamental theorem", "prime factorization", "fta", "lcm"], chapterId: "ch1", episodeId: "ch1-ep4", episodeTitle: "Fundamental Theorem of Arithmetic" },
  { keywords: ["irrational", "sqrt", "√2", "√3", "irrational number"], chapterId: "ch1", episodeId: "ch1-ep5", episodeTitle: "Irrational Numbers" },
  { keywords: ["real numbers", "number line", "decimal expansion", "terminating"], chapterId: "ch1", episodeId: "ch1-ep6", episodeTitle: "Real Numbers & the Number Line" },
  { keywords: ["operations on real", "rationali", "surds", "exponents", "closure"], chapterId: "ch1", episodeId: "ch1-ep7", episodeTitle: "Operations on Real Numbers" },

  // Chapter 2: Sets (placeholder for future)
  { keywords: ["sets", "venn diagram", "union", "intersection"], chapterId: "ch2", episodeId: "", episodeTitle: "Sets" },

  // Chapter 3: Polynomials
  { keywords: ["polynomial", "zeroes of polynomial", "zeros of polynomial", "degree of polynomial"], chapterId: "ch3", episodeId: "", episodeTitle: "Polynomials" },

  // Chapter 4: Pair of Linear Equations
  { keywords: ["linear equation", "pair of linear", "simultaneous"], chapterId: "ch4", episodeId: "", episodeTitle: "Pair of Linear Equations" },

  // Chapter 5: Quadratic Equations
  { keywords: ["quadratic", "completing the square", "discriminant"], chapterId: "ch5", episodeId: "", episodeTitle: "Quadratic Equations" },

  // Chapter 6: Progressions
  { keywords: ["progression", "arithmetic progression", "geometric progression", "ap", "gp"], chapterId: "ch6", episodeId: "", episodeTitle: "Progressions" },
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
