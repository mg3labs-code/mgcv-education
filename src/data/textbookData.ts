// 10th Class Mathematics - Telangana State Board
// Chapter & Episode structure with interactive content blocks

export interface ContentBlock {
  type: "concept" | "activity" | "recall" | "explain" | "assessment" | "exercise";
  title: string;
  icon: string;
  content: ConceptContent | ActivityContent | RecallContent | ExplainContent | AssessmentContent | ExerciseContent;
}

export interface ConceptContent {
  sections: { heading: string; body: string; highlight?: boolean }[];
  keyFormulas?: string[];
  example?: { question: string; solution: string }[];
}

export interface ActivityContent {
  instruction: string;
  type: "classify" | "match" | "order" | "explore";
  items?: { value: string; categories?: string[] }[];
  categories?: { id: string; label: string; description: string }[];
}

export interface RecallContent {
  questions: { question: string; answer: string; hint?: string }[];
}

export interface ExplainContent {
  prompt: string;
  guidePoints?: string[];
  wordLimit?: number;
}

export interface AssessmentContent {
  questions: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export interface ExerciseContent {
  source: string;
  problems: { number: string; text: string; answer?: string }[];
}

export interface Episode {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  duration: string;
  type: "Concept" | "Deep Dive" | "Application" | "Assessment" | "Practice";
  blocks: ContentBlock[];
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  color: string;
  periods: number;
  pageRange: string;
  episodes: Episode[];
}

export const chapters: Chapter[] = [
  {
    id: "ch1",
    number: 1,
    title: "Real Numbers",
    subtitle: "Euclid's Division Algorithm, Fundamental Theorem of Arithmetic, Irrational & Rational Numbers",
    color: "#6366f1",
    periods: 15,
    pageRange: "1–28",
    episodes: [
      {
        id: "ch1-ep1",
        number: 1,
        title: "The Bee Puzzle & Division Algorithm",
        subtitle: "Discover how division works through a fun puzzle about bees and flowers",
        duration: "8 min",
        type: "Concept",
        blocks: [
          {
            type: "concept",
            title: "The Puzzle That Started It All",
            icon: "🐝",
            content: {
              sections: [
                {
                  heading: "🐝 The Bee Puzzle",
                  body: "In a garden, a swarm of bees settles equally on flowers.\n\n• On 2 flowers → 1 bee left out\n• On 3 flowers → 2 bees left out\n• On 4 flowers → 3 bees left out\n• On 5 flowers → no bee left out\n\nIf there are at most 50 bees, how many bees are in the swarm?",
                  highlight: true,
                },
                {
                  heading: "🔍 Breaking It Down",
                  body: "Let x = number of bees. We translate each condition:\n\n• x = 5a + 0 (divisible by 5)\n• x = 4b + 3 (remainder 3 when ÷ 4)\n• x = 3c + 2 (remainder 2 when ÷ 3)\n• x = 2d + 1 (remainder 1 when ÷ 2, so x is odd)\n\nOdd multiples of 5 under 50: 5, 15, 25, 35, 45\nChecking: 35 ÷ 4 = 8 remainder 3 ✓, 35 ÷ 3 = 11 remainder 2 ✓\n\n**Answer: 35 bees** 🎉",
                },
                {
                  heading: "📐 The General Rule: Division Algorithm",
                  body: "For any positive integers a (dividend) and b (divisor), there exist unique whole numbers q (quotient) and r (remainder) such that:\n\n**a = bq + r, where 0 ≤ r < b**\n\nExamples from the puzzle:\n• 35 = 2 × 17 + 1\n• 35 = 3 × 11 + 2\n• 35 = 4 × 8 + 3\n• 35 = 5 × 7 + 0",
                },
              ],
              keyFormulas: ["a = bq + r, where 0 ≤ r < b"],
            } as ConceptContent,
          },
          {
            type: "activity",
            title: "Find q and r",
            icon: "✏️",
            content: {
              instruction: "For each pair of numbers, find the quotient q and remainder r satisfying a = bq + r",
              type: "explore",
              items: [
                { value: "a = 13, b = 3" },
                { value: "a = 80, b = 8" },
                { value: "a = 125, b = 5" },
                { value: "a = 132, b = 11" },
              ],
            } as ActivityContent,
          },
          {
            type: "recall",
            title: "Quick Recall",
            icon: "🧠",
            content: {
              questions: [
                {
                  question: "What does the Division Algorithm state?",
                  answer: "For positive integers a and b, there exist unique integers q and r such that a = bq + r, where 0 ≤ r < b.",
                  hint: "Think: dividend = divisor × quotient + remainder",
                },
                {
                  question: "In 35 = 4 × 8 + 3, what is the remainder?",
                  answer: "3",
                  hint: "The remainder is the number left over after division.",
                },
                {
                  question: "Why must r be less than b?",
                  answer: "Because if r ≥ b, we could divide one more time, increasing q by 1 and reducing r by b.",
                },
              ],
            } as RecallContent,
          },
          {
            type: "explain",
            title: "Explain It Your Way",
            icon: "💬",
            content: {
              prompt: "Imagine explaining to a younger student: Why can't the remainder be equal to or greater than the divisor? Use the bee puzzle to explain.",
              guidePoints: [
                "Think about what 'remainder' means physically",
                "If bees are left over more than flowers available...",
                "Connect it to the formula a = bq + r",
              ],
              wordLimit: 100,
            } as ExplainContent,
          },
          {
            type: "assessment",
            title: "Check Understanding",
            icon: "✅",
            content: {
              questions: [
                {
                  question: "When 117 is divided by 14, what is the remainder?",
                  options: ["3", "5", "7", "9"],
                  correctIndex: 1,
                  explanation: "117 = 14 × 8 + 5. So q = 8 and r = 5.",
                },
                {
                  question: "Which of these correctly represents 255 using division algorithm with divisor 11?",
                  options: [
                    "255 = 11 × 23 + 2",
                    "255 = 11 × 22 + 3",
                    "255 = 11 × 24 + 1",
                    "255 = 11 × 23 + 0",
                  ],
                  correctIndex: 0,
                  explanation: "11 × 23 = 253, and 255 - 253 = 2. So 255 = 11 × 23 + 2.",
                },
                {
                  question: "For a = bq + r, which condition must r satisfy?",
                  options: ["r < a", "r < b", "r ≤ b", "r > 0"],
                  correctIndex: 1,
                  explanation: "The remainder r must satisfy 0 ≤ r < b (strictly less than the divisor).",
                },
              ],
            } as AssessmentContent,
          },
        ],
      },
      {
        id: "ch1-ep2",
        number: 2,
        title: "Euclid's Algorithm for HCF",
        subtitle: "A paper-strip activity to discover how Euclid found the greatest common factor",
        duration: "10 min",
        type: "Deep Dive",
        blocks: [
          {
            type: "concept",
            title: "The Paper Strip Method",
            icon: "📏",
            content: {
              sections: [
                {
                  heading: "📏 Activity: Measuring Strips",
                  body: "Take two strips: 60 cm and 100 cm. Find the longest strip that measures both exactly.\n\n1. Measure 100 cm with 60 cm strip → 40 cm left over\n2. Measure 60 cm with 40 cm strip → 20 cm left over\n3. Measure 40 cm with 20 cm strip → 0 left over!\n\n**HCF(60, 100) = 20** ✂️",
                  highlight: true,
                },
                {
                  heading: "🔢 Euclid's Algorithm — Step by Step",
                  body: "To find HCF of c and d (where c > d):\n\n**Step 1:** Apply division algorithm: c = dq + r\n**Step 2:** If r = 0, then d is the HCF. If r ≠ 0, replace c with d and d with r.\n**Step 3:** Repeat until remainder = 0.\n\nWhy it works: HCF(c, d) = HCF(d, r)",
                },
                {
                  heading: "📝 Worked Example: HCF(100, 60)",
                  body: "100 = 60 × 1 + 40\n60 = 40 × 1 + 20\n40 = 20 × 2 + 0 ← remainder is 0!\n\nSo HCF(100, 60) = **20**",
                },
              ],
              keyFormulas: ["HCF(c, d) = HCF(d, r) where c = dq + r"],
              example: [
                {
                  question: "Show that every positive even integer is of the form 2q",
                  solution: "Let a be any positive integer, b = 2. By division algorithm: a = 2q + r, where r = 0 or 1. If r = 0, a = 2q (even). If r = 1, a = 2q + 1 (odd). So every even integer is 2q.",
                },
              ],
            } as ConceptContent,
          },
          {
            type: "activity",
            title: "Find HCF Using Euclid's Algorithm",
            icon: "🔧",
            content: {
              instruction: "Apply Euclid's algorithm step by step to find the HCF of each pair.",
              type: "explore",
              items: [
                { value: "50 and 70" },
                { value: "96 and 72" },
                { value: "300 and 550" },
                { value: "1860 and 2015" },
              ],
            } as ActivityContent,
          },
          {
            type: "recall",
            title: "Quick Recall",
            icon: "🧠",
            content: {
              questions: [
                {
                  question: "What is Euclid's algorithm used for?",
                  answer: "To compute the Highest Common Factor (HCF) of two positive integers.",
                },
                {
                  question: "When do we stop applying Euclid's algorithm?",
                  answer: "When the remainder becomes 0. The divisor at that step is the HCF.",
                },
                {
                  question: "Why does HCF(c, d) = HCF(d, r)?",
                  answer: "Because any common divisor of c and d must also divide r (since r = c - dq), and vice versa.",
                },
              ],
            } as RecallContent,
          },
          {
            type: "assessment",
            title: "Test Yourself",
            icon: "✅",
            content: {
              questions: [
                {
                  question: "What is HCF(900, 270)?",
                  options: ["90", "270", "30", "180"],
                  correctIndex: 0,
                  explanation: "900 = 270 × 3 + 90; 270 = 90 × 3 + 0. HCF = 90.",
                },
                {
                  question: "Using Euclid's algorithm for HCF(196, 38220), the first step gives:",
                  options: [
                    "38220 = 196 × 195 + 0",
                    "38220 = 196 × 194 + 196",
                    "38220 = 196 × 195 + 0",
                    "38220 = 196 × 194 + 196",
                  ],
                  correctIndex: 0,
                  explanation: "196 × 195 = 38220 exactly, so HCF = 196.",
                },
              ],
            } as AssessmentContent,
          },
          {
            type: "exercise",
            title: "Exercise 1.1 (Textbook)",
            icon: "📝",
            content: {
              source: "Exercise 1.1, Page 6",
              problems: [
                { number: "1(i)", text: "Use Euclid's algorithm to find the HCF of 900 and 270.", answer: "90" },
                { number: "1(ii)", text: "Use Euclid's algorithm to find the HCF of 196 and 38220.", answer: "196" },
                { number: "1(iii)", text: "Use Euclid's algorithm to find the HCF of 1651 and 2032.", answer: "1" },
                { number: "2", text: "Use division algorithm to show that any positive odd integer is of the form 6q+1, or 6q+3, or 6q+5." },
                { number: "3", text: "Use division algorithm to show that the square of any positive integer is of the form 3p or 3p+1." },
                { number: "4", text: "Use division algorithm to show that the cube of any positive integer is of the form 9m, 9m+1, or 9m+8." },
                { number: "5", text: "Show that one and only one out of n, n+2 or n+4 is divisible by 3, where n is any positive integer." },
              ],
            } as ExerciseContent,
          },
        ],
      },
      {
        id: "ch1-ep3",
        number: 3,
        title: "Fundamental Theorem of Arithmetic",
        subtitle: "Every number has a unique prime factorization — discover why this matters",
        duration: "8 min",
        type: "Deep Dive",
        blocks: [
          {
            type: "concept",
            title: "Prime Factorization is Unique",
            icon: "🔢",
            content: {
              sections: [
                {
                  heading: "🧱 Building Blocks of Numbers",
                  body: "Just like every building is made of bricks, every composite number is built from primes.\n\n24 = 2 × 12 = 2 × 2 × 6 = 2 × 2 × 2 × 3\n\nNo matter how you factor it, you always get: **2³ × 3**",
                  highlight: true,
                },
                {
                  heading: "📜 The Fundamental Theorem",
                  body: "**Every composite number can be expressed as a product of primes, and this factorization is unique (apart from the order of factors).**\n\nThis is called the Fundamental Theorem of Arithmetic.\n\nExample: 32760 = 2³ × 3² × 5 × 7 × 13\n\nNo other combination of primes will give 32760!",
                },
                {
                  heading: "💡 Why It Matters",
                  body: "This theorem helps us:\n• Find HCF and LCM efficiently\n• Prove numbers are irrational\n• Understand divisibility\n• Work with fractions and decimals",
                },
              ],
              keyFormulas: [
                "HCF = product of smallest powers of common primes",
                "LCM = product of greatest powers of all primes",
                "HCF(a,b) × LCM(a,b) = a × b",
              ],
            } as ConceptContent,
          },
          {
            type: "assessment",
            title: "Quick Check",
            icon: "✅",
            content: {
              questions: [
                {
                  question: "The prime factorization of 140 is:",
                  options: ["2² × 5 × 7", "2 × 5 × 14", "4 × 5 × 7", "2 × 70"],
                  correctIndex: 0,
                  explanation: "140 = 2 × 70 = 2 × 2 × 35 = 2 × 2 × 5 × 7 = 2² × 5 × 7",
                },
                {
                  question: "HCF(12, 18) using prime factorization:",
                  options: ["2", "3", "6", "36"],
                  correctIndex: 2,
                  explanation: "12 = 2² × 3, 18 = 2 × 3². Common primes with smallest powers: 2¹ × 3¹ = 6",
                },
              ],
            } as AssessmentContent,
          },
        ],
      },
    ],
  },
  {
    id: "ch2", number: 2, title: "Sets", subtitle: "Types of sets, Venn diagrams, operations on sets",
    color: "#ec4899", periods: 8, pageRange: "29–50", episodes: [],
  },
  {
    id: "ch3", number: 3, title: "Polynomials", subtitle: "Zeroes, division algorithm for polynomials",
    color: "#f59e0b", periods: 8, pageRange: "51–76", episodes: [],
  },
  {
    id: "ch4", number: 4, title: "Pair of Linear Equations", subtitle: "Graphical & algebraic methods of solving",
    color: "#10b981", periods: 15, pageRange: "77–104", episodes: [],
  },
  {
    id: "ch5", number: 5, title: "Quadratic Equations", subtitle: "Factorization, completing the square, formula method",
    color: "#8b5cf6", periods: 12, pageRange: "105–128", episodes: [],
  },
  {
    id: "ch6", number: 6, title: "Progressions", subtitle: "Arithmetic & geometric progressions, nth term, sum",
    color: "#ef4444", periods: 11, pageRange: "129–162", episodes: [],
  },
  {
    id: "ch7", number: 7, title: "Coordinate Geometry", subtitle: "Distance, section formula, area of triangle",
    color: "#06b6d4", periods: 12, pageRange: "163–194", episodes: [],
  },
  {
    id: "ch8", number: 8, title: "Similar Triangles", subtitle: "Criteria for similarity, areas of similar triangles, Pythagoras theorem",
    color: "#d946ef", periods: 18, pageRange: "195–228", episodes: [],
  },
  {
    id: "ch9", number: 9, title: "Tangents and Secants to a Circle", subtitle: "Tangent properties, number of tangents from a point",
    color: "#0ea5e9", periods: 15, pageRange: "229–248", episodes: [],
  },
  {
    id: "ch10", number: 10, title: "Mensuration", subtitle: "Surface areas and volumes of combinations of solids",
    color: "#84cc16", periods: 10, pageRange: "249–272", episodes: [],
  },
  {
    id: "ch11", number: 11, title: "Trigonometry", subtitle: "Trigonometric ratios, identities, and tables",
    color: "#f97316", periods: 15, pageRange: "273–297", episodes: [],
  },
  {
    id: "ch12", number: 12, title: "Applications of Trigonometry", subtitle: "Heights and distances, angle of elevation & depression",
    color: "#14b8a6", periods: 8, pageRange: "298–308", episodes: [],
  },
  {
    id: "ch13", number: 13, title: "Probability", subtitle: "Classical definition, simple events, complementary events",
    color: "#a855f7", periods: 10, pageRange: "309–326", episodes: [],
  },
  {
    id: "ch14", number: 14, title: "Statistics", subtitle: "Mean, median, mode of grouped data, ogive curves",
    color: "#e11d48", periods: 15, pageRange: "327–356", episodes: [],
  },
];
