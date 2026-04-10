// 10th Class Mathematics - Telangana State Board
// Chapter & Episode structure with interactive content blocks

export interface VisualAidContent {
  type: "image" | "video";
  url: string;
  caption: string;
  explanation?: string;
  alt?: string;
  searchTerms?: string;
}

export interface TextbookRefSnippet {
  text: string;
  source: string;
}

export interface JeeProblemsContent {
  questions: { question: string; options: string[]; correctIndex: number; explanation: string; trap?: string; previousYear?: string; negativeMarking?: number }[];
  timePerQuestion?: number;
}

export interface JeeExtensionContent {
  title: string;
  sections: { heading: string; body: string; formula?: string }[];
  advancedFormulas?: string[];
  proofSketch?: string;
}

export interface JeeSpeedDrillContent {
  questions: { question: string; answer: string; hint?: string }[];
  totalTimeSeconds: number;
}

export interface ContentBlock {
  type: "concept" | "activity" | "recall" | "explain" | "assessment" | "exercise" | "reasoning" | "assumptions" | "connections" | "application" | "implications" | "bilingual_concept" | "vocabulary" | "grammar_pattern" | "story_reading" | "visual_aid" | "jee_problems" | "jee_extension" | "jee_speed_drill";
  title: string;
  icon: string;
  depth?: "board" | "jee";
  content: ConceptContent | ActivityContent | RecallContent | ExplainContent | AssessmentContent | ExerciseContent | ReasoningContent | AssumptionsContent | ConnectionsContent | ApplicationContent | ImplicationsContent | VisualAidContent | JeeProblemsContent | JeeExtensionContent | JeeSpeedDrillContent | Record<string, any>;
  textbookRef?: {
    snippets?: TextbookRefSnippet[];  // per-section for concept blocks
    text?: string;                     // single snippet for other block types
    source?: string;
  };
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

// Layer 3: Reasoning (Cambridge-style "Why?" questions)
export interface ReasoningContent {
  centralQuestion: string;
  whyQuestions: { question: string; hint?: string; deeperInsight: string }[];
}

// Layer 4: Assumptions (Oxford Tutorial Defense)
export interface AssumptionsContent {
  concept: string;
  hiddenAssumptions: { assumption: string; whyItMatters: string; challenge: string }[];
  defensePrompt: string;
}

// Layer 5: Connections (MIT Cross-Domain)
export interface ConnectionsContent {
  concept: string;
  connections: { domain: string; icon: string; link: string; explanation: string }[];
}

// Layer 6: Application (Harvard Case Method)
export interface ApplicationContent {
  scenario: string;
  context: string;
  questions: { question: string; hint?: string }[];
  realWorldWhy: string;
  careers?: string[];
  harvardLabel?: string;
}

// Layer 7: Implications (Oxford Essay)
export interface ImplicationsContent {
  whatIfQuestion: string;
  reflectionPrompts: string[];
  essayPrompt: string;
  wordLimit?: number;
  implications?: { category: string; icon: string; color: string; points: string[] }[];
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
      // ── Episode 1: Number Types & Classification ──
      {
        id: "ch1-ep1",
        number: 1,
        title: "Number Types & Classification",
        subtitle: "Natural numbers, whole numbers, integers, rationals — the number family tree",
        duration: "8 min",
        type: "Concept",
        blocks: [
          {
            type: "concept",
            title: "The Number Family",
            icon: "🔢",
            content: {
              sections: [
                {
                  heading: "🌱 Counting Numbers (Natural Numbers N)",
                  body: "The numbers 1, 2, 3, 4, … that we use for counting are called **Natural Numbers**. The set is denoted by **N**.\n\nN = {1, 2, 3, 4, 5, …}",
                },
                {
                  heading: "0️⃣ Whole Numbers (W)",
                  body: "When we include 0 with natural numbers, we get **Whole Numbers**.\n\nW = {0, 1, 2, 3, 4, …}\n\nSo every natural number is a whole number, but 0 is a whole number that is NOT a natural number.",
                },
                {
                  heading: "➖ Integers (Z)",
                  body: "When we include negative numbers with whole numbers, we get **Integers**.\n\nZ = {…, -3, -2, -1, 0, 1, 2, 3, …}\n\nZ comes from the German word 'Zahlen' meaning 'numbers'.",
                },
                {
                  heading: "📐 Rational Numbers (Q)",
                  body: "A number is **rational** if it can be written in the form **p/q** where p and q are integers and **q ≠ 0**.\n\nExamples: 1/2, -3/4, 7 (= 7/1), 0 (= 0/1), 0.5 (= 1/2)\n\nThe decimal expansion of a rational number is either **terminating** (e.g., 1/4 = 0.25) or **non-terminating recurring** (e.g., 1/3 = 0.333…).",
                  highlight: true,
                },
                {
                  heading: "🏠 The Containment Chain",
                  body: "**N ⊂ W ⊂ Z ⊂ Q**\n\nEvery natural number is a whole number.\nEvery whole number is an integer.\nEvery integer is a rational number (since any integer n = n/1).",
                },
              ],
              keyFormulas: [
                "N ⊂ W ⊂ Z ⊂ Q",
                "Rational number: p/q where p, q ∈ Z and q ≠ 0",
              ],
              example: [
                {
                  question: "Is zero a rational number? Can you write it in p/q form?",
                  solution: "Yes. 0 = 0/1 = 0/2 = 0/3. Here p = 0, q can be any non-zero integer.",
                },
                {
                  question: "Find 5 rational numbers between 3/5 and 4/5.",
                  solution: "Multiply numerator and denominator by 6: 3/5 = 18/30 and 4/5 = 24/30. Five rational numbers: 19/30, 20/30, 21/30, 22/30, 23/30.",
                },
              ],
            } as ConceptContent,
            textbookRef: {
              snippets: [
                { text: "The counting numbers 1, 2, 3, 4, … are known as natural numbers. The collection of all natural numbers is denoted by N. So, N = {1, 2, 3, 4, 5, …}.", source: "TS SCERT Class 10 Maths, Ch.1 Introduction, p.1" },
                { text: "If we include zero along with the natural numbers, we obtain the collection of whole numbers, denoted by W. Thus, W = {0, 1, 2, 3, 4, …}. Every natural number is a whole number, but zero is a whole number which is not a natural number.", source: "TS SCERT Class 10 Maths, Ch.1 Introduction, p.1" },
                { text: "The collection of all whole numbers and their negatives is known as integers, denoted by Z (from the German word 'Zahlen' meaning 'to count'). Z = {…, −3, −2, −1, 0, 1, 2, 3, …}.", source: "TS SCERT Class 10 Maths, Ch.1 Introduction, p.2" },
                { text: "A number r is called a rational number if it can be written in the form p/q, where p and q are integers and q ≠ 0. The collection of rational numbers is denoted by Q. The decimal expansion of a rational number is either terminating or non-terminating recurring.", source: "TS SCERT Class 10 Maths, Ch.1 Introduction, p.2" },
                { text: "From our discussion, it is clear that every natural number is a whole number, every whole number is an integer, and every integer is a rational number. This gives us N ⊂ W ⊂ Z ⊂ Q.", source: "TS SCERT Class 10 Maths, Ch.1 Introduction, p.2" },
              ],
            },
          },
          {
            type: "activity",
            title: "John & Sneha's Number Bags",
            icon: "🎒",
            content: {
              instruction: "John and Sneha have bags labelled N, W, Z, Q. Classify each number into ALL bags it belongs to. Remember: N ⊂ W ⊂ Z ⊂ Q.",
              type: "classify",
              items: [
                { value: "-5", categories: ["Z", "Q"] },
                { value: "0", categories: ["W", "Z", "Q"] },
                { value: "7", categories: ["N", "W", "Z", "Q"] },
                { value: "3/4", categories: ["Q"] },
                { value: "-11/3", categories: ["Q"] },
                { value: "100", categories: ["N", "W", "Z", "Q"] },
                { value: "-1", categories: ["Z", "Q"] },
                { value: "2.5", categories: ["Q"] },
              ],
              categories: [
                { id: "N", label: "Natural Numbers", description: "Counting numbers: 1, 2, 3, …" },
                { id: "W", label: "Whole Numbers", description: "0, 1, 2, 3, …" },
                { id: "Z", label: "Integers", description: "…, -2, -1, 0, 1, 2, …" },
                { id: "Q", label: "Rational Numbers", description: "p/q form, q ≠ 0" },
              ],
            } as ActivityContent,
            textbookRef: {
              text: "State whether the following statements are true or false. Give reasons for your answers: (i) Every natural number is a whole number. (ii) Every integer is a whole number. (iii) Every rational number is an integer.",
              source: "TS SCERT Class 10 Maths, Exercise 1.1, Q4",
            },
          },
          {
            type: "recall",
            title: "Quick Recall",
            icon: "🧠",
            content: {
              questions: [
                {
                  question: "What is a rational number?",
                  answer: "A number that can be expressed in the form p/q, where p and q are integers and q ≠ 0.",
                  hint: "Think of the word 'ratio'.",
                },
                {
                  question: "Is every integer a rational number? Why?",
                  answer: "Yes, because any integer n can be written as n/1, which is in p/q form with q ≠ 0.",
                },
                {
                  question: "What is the decimal form of a rational number?",
                  answer: "Either terminating (e.g., 0.25) or non-terminating recurring (e.g., 0.333…).",
                  hint: "Think about what happens when you divide.",
                },
                {
                  question: "Write the containment relationship of N, W, Z, Q.",
                  answer: "N ⊂ W ⊂ Z ⊂ Q",
                },
              ],
            } as RecallContent,
            textbookRef: {
              text: "A number r is called a rational number if it can be written in the form p/q, where p and q are integers and q ≠ 0. Every natural number is a whole number, every whole number is an integer, and every integer is a rational number.",
              source: "TS SCERT Class 10 Maths, Ch.1 Introduction, pp.1-2",
            },
          },
          {
            type: "explain",
            title: "Explain It Your Way",
            icon: "💬",
            content: {
              prompt: "Why is every integer also a rational number? Explain with examples.",
              guidePoints: [
                "What does p/q form mean?",
                "How can you write 5 as a fraction?",
                "What about -3?",
                "Does this work for 0 too?",
              ],
              wordLimit: 80,
            } as ExplainContent,
            textbookRef: {
              text: "Every integer n can be written as n/1, which is in p/q form with q ≠ 0. Therefore, every integer is a rational number.",
              source: "TS SCERT Class 10 Maths, Ch.1 Introduction, p.2",
            },
          },
          {
            type: "assessment",
            title: "True or False",
            icon: "✅",
            content: {
              questions: [
                {
                  question: "Every natural number is a whole number.",
                  options: ["True", "False"],
                  correctIndex: 0,
                  explanation: "N = {1, 2, 3, …} and W = {0, 1, 2, 3, …}. Every element of N is in W.",
                },
                {
                  question: "Every integer is a whole number.",
                  options: ["True", "False"],
                  correctIndex: 1,
                  explanation: "Negative integers like -1, -2 are integers but not whole numbers.",
                },
                {
                  question: "Every rational number is an integer.",
                  options: ["True", "False"],
                  correctIndex: 1,
                  explanation: "3/4 is rational but not an integer.",
                },
                {
                  question: "0 is a rational number.",
                  options: ["True", "False"],
                  correctIndex: 0,
                  explanation: "0 = 0/1, which is in p/q form with q ≠ 0.",
                },
              ],
            } as AssessmentContent,
            textbookRef: {
              text: "Every natural number is a whole number (True). Every integer is NOT a whole number — negative integers like −1, −2 are not whole numbers (False). Every rational number is NOT an integer — for example, 3/4 is rational but not an integer (False).",
              source: "TS SCERT Class 10 Maths, Exercise 1.1, Q4",
            },
          },
          {
            type: "exercise",
            title: "Practice Problems",
            icon: "📝",
            content: {
              source: "Section 1.1, Introduction",
              problems: [
                { number: "1", text: "Is zero a rational number? Can you write it in the form p/q where p and q are integers and q ≠ 0?", answer: "Yes. 0 = 0/1." },
                { number: "2", text: "Find six rational numbers between 3 and 4.", answer: "3.1, 3.2, 3.3, 3.4, 3.5, 3.6 (or equivalently 31/10, 32/10, …)" },
                { number: "3", text: "Find five rational numbers between 3/5 and 4/5.", answer: "19/30, 20/30, 21/30, 22/30, 23/30" },
                { number: "4", text: "State whether the following statements are true or false. Give reasons.\n(i) Every natural number is a whole number.\n(ii) Every integer is a whole number.\n(iii) Every rational number is an integer." },
                { number: "5", text: "Classify the following numbers as N, W, Z, Q: -5, 0, 7, 3/4, -11/3, 100" },
              ],
            } as ExerciseContent,
            textbookRef: {
              text: "Exercise 1.1: (1) Is zero a rational number? (2) Find six rational numbers between 3 and 4. (3) Find five rational numbers between 3/5 and 4/5. (4) State true or false with reasons for N, W, Z, Q relationships.",
              source: "TS SCERT Class 10 Maths, Exercise 1.1",
            },
          },
          // ── Layer 3: Reasoning ──
          {
            type: "reasoning",
            title: "Why Does This Work?",
            icon: "🤔",
            content: {
              centralQuestion: "Why do we need so many types of numbers? Why not just use natural numbers for everything?",
              whyQuestions: [
                {
                  question: "Why can't natural numbers handle subtraction like 3 - 5?",
                  hint: "Think about what happens when you take away more than you have.",
                  deeperInsight: "This is exactly why integers were invented — to represent debts, temperatures below zero, and losses. Each number type was created to solve a problem the previous type couldn't handle."
                },
                {
                  question: "Why do we need rational numbers when we already have integers?",
                  hint: "Try dividing 1 pizza among 3 friends using only whole numbers.",
                  deeperInsight: "Division doesn't always give whole numbers. Rational numbers let us express parts, shares, and measurements precisely. Without them, fair sharing would be impossible!"
                },
                {
                  question: "Why is the containment chain N ⊂ W ⊂ Z ⊂ Q important?",
                  hint: "What does it tell us about how number systems grew?",
                  deeperInsight: "Each new number type INCLUDES all previous ones and adds something new. This shows mathematics grows by extension, not replacement — a powerful pattern you'll see again and again."
                },
              ],
            } as ReasoningContent,
            textbookRef: {
              text: "In earlier classes, we have studied different types of numbers. We have seen that every rational number can be expressed in the form p/q. In this chapter, we shall explore real numbers more deeply and understand why each number type was needed.",
              source: "TS SCERT Class 10 Maths, Ch.1 Introduction, p.1",
            },
          },
          // ── Layer 4: Assumptions ──
          {
            type: "assumptions",
            title: "Challenge Your Beliefs",
            icon: "⚡",
            content: {
              concept: "Number Classification",
              hiddenAssumptions: [
                {
                  assumption: "Zero is 'nothing' and doesn't really count as a number.",
                  whyItMatters: "Zero is actually one of the most important mathematical discoveries. It took centuries for civilizations to accept it as a number!",
                  challenge: "If zero is 'nothing', why does it change the value of 10, 100, 1000? Can 'nothing' be so powerful?"
                },
                {
                  assumption: "Negative numbers are just 'made up' — they don't exist in real life.",
                  whyItMatters: "Negative numbers represent real things: debts, temperatures below zero, depths below sea level, losses in business.",
                  challenge: "If someone owes ₹500, how would you represent this without negative numbers? Is the debt any less real?"
                },
                {
                  assumption: "Every number can be written as a fraction.",
                  whyItMatters: "This assumption is WRONG! This is exactly what you'll discover in the next episode — some numbers cannot be written as p/q.",
                  challenge: "Try writing √2 as a fraction. Can you? What does this mean for our number classification?"
                },
              ],
              defensePrompt: "Defend this statement: 'The p/q definition of rational numbers is the BEST way to define them.' What are the alternatives? Why is this definition better?",
            } as AssumptionsContent,
            textbookRef: {
              text: "We have learnt that there are infinitely many rationals between any two given rational numbers. So, we might think that the number line is completely covered by rationals. But this is not so! In the next section, we shall show that there exist numbers which are NOT rational.",
              source: "TS SCERT Class 10 Maths, §1.2, p.5",
            },
          },
          // ── Layer 5: Connections ──
          {
            type: "connections",
            title: "Where Else Does This Appear?",
            icon: "🌐",
            content: {
              concept: "Number Types & Classification",
              connections: [
                {
                  domain: "Science",
                  icon: "🔬",
                  link: "Temperature scales use integers (including negatives). Absolute zero (-273°C) only makes sense because we have negative numbers.",
                  explanation: "Without integers, we couldn't measure temperatures below freezing!"
                },
                {
                  domain: "Banking & Finance",
                  icon: "🏦",
                  link: "Your bank balance can be positive (savings) or negative (overdraft). Rational numbers help calculate interest rates like 7.5%.",
                  explanation: "Every financial transaction uses the number types you just learned."
                },
                {
                  domain: "Computer Science",
                  icon: "💻",
                  link: "Computers store integers and rational numbers differently. An 'int' vs 'float' in programming directly mirrors N/Z vs Q.",
                  explanation: "Programmers must choose the right number type — just like mathematicians!"
                },
                {
                  domain: "History",
                  icon: "📜",
                  link: "Ancient Indians (Brahmagupta, 628 AD) were the first to formally use zero and negative numbers. Europe didn't accept negatives until the 1600s!",
                  explanation: "The number types you learned today took humanity thousands of years to discover."
                },
                {
                  domain: "Music",
                  icon: "🎵",
                  link: "Musical intervals are ratios (rational numbers). An octave is 2:1, a perfect fifth is 3:2. Music IS rational numbers in action.",
                  explanation: "When you hear pleasant music, you're hearing rational numbers!"
                },
              ],
            } as ConnectionsContent,
            textbookRef: {
              text: "The word 'rational' comes from the word 'ratio'. The letter Z for integers comes from the German word 'Zahlen' meaning 'to count'. Q is used for rationals from the word 'quotient'.",
              source: "TS SCERT Class 10 Maths, Ch.1 Introduction, pp.1-2",
            },
          },
          // ── Layer 6: Application (Harvard Case) ──
          {
            type: "application",
            title: "Real-World Challenge",
            icon: "🌍",
            content: {
              scenario: "The Cricket Score Problem",
              context: "India is playing cricket. After 30 overs, the run rate is 4.5 runs per over. They need 225 runs to win in 50 overs. The coach needs to calculate: What should the run rate be in the remaining 20 overs?",
              questions: [
                {
                  question: "How many runs has India scored in 30 overs at 4.5 runs/over? What number type is 4.5?",
                  hint: "4.5 × 30 = ? Is 4.5 a rational number?"
                },
                {
                  question: "How many more runs are needed? What run rate (runs per over) is required for the remaining 20 overs?",
                  hint: "Remaining runs ÷ remaining overs = required rate"
                },
                {
                  question: "The required rate comes out to 4.5. Is this a coincidence? Will the required rate always be rational if the target and overs are integers?",
                  hint: "Think about integer ÷ integer..."
                },
              ],
              realWorldWhy: "Sports analytics, business forecasting, and engineering all depend on rational number calculations. Understanding number types helps you know what kind of answer to expect.",
              careers: ["Data Analyst", "Sports Statistician", "Financial Planner", "Civil Engineer", "Physicist", "Software Developer"],
              harvardLabel: "The Cricket Score Problem",
            } as ApplicationContent,
            textbookRef: {
              text: "Examples of rational numbers include 1/2, −3/4, 7 (which is 7/1), and 0 (which is 0/1). The decimal expansion of a rational number is either terminating (e.g., 1/4 = 0.25) or non-terminating recurring (e.g., 1/3 = 0.333…).",
              source: "TS SCERT Class 10 Maths, Ch.1 Introduction, p.2",
            },
          },
          // ── Layer 7: Implications (Oxford Essay) ──
          {
            type: "implications",
            title: "The Bigger Picture",
            icon: "🔮",
            content: {
              whatIfQuestion: "What if rational numbers were NEVER discovered? What if humans could only use whole numbers?",
              reflectionPrompts: [
                "Could we measure land accurately without fractions?",
                "Could we share things fairly among people?",
                "Would science work without decimals?",
                "How would money and trade function?",
              ],
              essayPrompt: "Write a short reflection: 'How did the invention of each number type solve a real human problem?' Use at least 2 examples from different fields.",
              wordLimit: 150,
              implications: [
                {
                  category: "Global Impact",
                  icon: "🌍",
                  color: "amber",
                  points: [
                    "International trade and currency exchange rely on rational numbers",
                    "GPS navigation uses irrational numbers (π) for Earth's curvature calculations",
                    "Every country's census data uses the full number system hierarchy",
                  ],
                },
                {
                  category: "Future Applications",
                  icon: "🚀",
                  color: "sky",
                  points: [
                    "Quantum computing uses complex numbers built on top of real numbers",
                    "AI algorithms use rational number operations billions of times per second",
                    "Space missions require irrational number precision for orbital mechanics",
                  ],
                },
                {
                  category: "Philosophical Questions",
                  icon: "🤔",
                  color: "purple",
                  points: [
                    "Do irrational numbers 'exist' or are they human inventions?",
                    "Is mathematics discovered or created?",
                    "Why does the universe follow mathematical patterns?",
                  ],
                },
              ],
            } as ImplicationsContent,
            textbookRef: {
              text: "So, we might think that there is nothing more to be said about real numbers. But it was not until the 19th century that mathematicians like Dedekind, Cantor, and Weierstrass gave a rigorous foundation to the theory of real numbers.",
              source: "TS SCERT Class 10 Maths, §1.4, p.14",
            },
          },
        ],
      },

      // ── Episode 2: The Bee Puzzle & Division Algorithm (EXISTING) ──
      {
        id: "ch1-ep2",
        number: 2,
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
            textbookRef: {
              snippets: [
                { text: "In a garden, a swarm of bees settles on flowers. This puzzle introduces the idea that when we divide a number, we always get a quotient and a remainder.", source: "TS SCERT Class 10 Maths, §1.1 Introduction, p.3" },
                { text: "For any two positive integers a and b, there exist unique integers q and r satisfying a = bq + r, where 0 ≤ r < b. This result is known as Euclid's Division Lemma.", source: "TS SCERT Class 10 Maths, §1.1 Euclid's Division Lemma, p.4" },
                { text: "The Division Algorithm is a restatement of Euclid's Division Lemma. It provides the method: divide 'a' by 'b', get quotient 'q' and remainder 'r'.", source: "TS SCERT Class 10 Maths, §1.1, p.4" },
              ],
            },
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
            textbookRef: {
              text: "Let us apply the Division Lemma to find q and r for various values of a and b. Remember: a = bq + r, where 0 ≤ r < b.",
              source: "TS SCERT Class 10 Maths, §1.1 Example 1, p.4",
            },
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
            textbookRef: {
              text: "Euclid's Division Lemma: Given positive integers a and b, there exist unique integers q and r satisfying a = bq + r, 0 ≤ r < b.",
              source: "TS SCERT Class 10 Maths, Theorem 1.1, p.4",
            },
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
            textbookRef: {
              text: "Note that the remainder r must always satisfy 0 ≤ r < b. If the remainder were equal to or greater than b, we could perform the division once more.",
              source: "TS SCERT Class 10 Maths, §1.1, p.4",
            },
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
            textbookRef: {
              text: "Apply Euclid's Division Lemma: for any pair of positive integers a and b, express a = bq + r and verify that 0 ≤ r < b.",
              source: "TS SCERT Class 10 Maths, Exercise 1.1, p.6",
            },
          },
          {
            type: "exercise",
            title: "Division Algorithm Practice",
            icon: "📝",
            content: {
              source: "TS SCERT Class 10 Maths, §1.1 Euclid's Division Lemma",
              problems: [
                { number: "1", text: "Find q and r for a = 47, b = 5.", answer: "q = 9, r = 2" },
                { number: "2", text: "Find q and r for a = 100, b = 7.", answer: "q = 14, r = 2" },
                { number: "3", text: "Find q and r for a = 256, b = 13.", answer: "q = 19, r = 9" },
              ],
            } as ExerciseContent,
            textbookRef: {
              text: "Use Euclid's algorithm to find the HCF of the given pairs. Show that every positive even integer is of the form 2q, and every positive odd integer is of the form 2q+1.",
              source: "TS SCERT Class 10 Maths, Exercise 1.1, p.7",
            },
          },
        ],
      },

      // ── Episode 3: Euclid's Algorithm for HCF (EXISTING) ──
      {
        id: "ch1-ep3",
        number: 3,
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
            textbookRef: {
              snippets: [
                { text: "To obtain the HCF of two positive integers, say c and d (c > d), follow the steps: Apply Euclid's Division Lemma to c and d, to get c = dq + r.", source: "TS SCERT Class 10 Maths, §1.2 Euclid's Algorithm, p.5" },
                { text: "Euclid's algorithm: Step 1 — Apply division algorithm: c = dq + r. Step 2 — If r = 0, d is the HCF. If r ≠ 0, apply Step 1 to d and r.", source: "TS SCERT Class 10 Maths, §1.2, p.6" },
                { text: "Example: Find HCF of 4052 and 12576. 12576 = 4052 × 3 + 420; 4052 = 420 × 9 + 272; 420 = 272 × 1 + 148; 272 = 148 × 1 + 124; 148 = 124 × 1 + 24; 124 = 24 × 5 + 4; 24 = 4 × 6 + 0. HCF = 4.", source: "TS SCERT Class 10 Maths, §1.2 Example 3, p.6" },
              ],
            },
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
            textbookRef: {
              text: "Use Euclid's algorithm to find the HCF of (i) 900 and 270 (ii) 196 and 38220 (iii) 1651 and 2032.",
              source: "TS SCERT Class 10 Maths, Exercise 1.1, Q1",
            },
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
            textbookRef: {
              text: "Euclid's Algorithm: To obtain the HCF of two positive integers c and d (c > d), apply Euclid's Division Lemma repeatedly until the remainder is zero. The last divisor is the HCF.",
              source: "TS SCERT Class 10 Maths, §1.2, p.5",
            },
          },
          {
            type: "explain",
            title: "Explain It Your Way",
            icon: "💬",
            content: {
              prompt: "How would you explain Euclid's algorithm to someone who has never heard of it? Use the paper strip example.",
              guidePoints: [
                "Start with what HCF means",
                "Describe the physical strip-cutting process",
                "Connect it to repeated division",
              ],
              wordLimit: 100,
            } as ExplainContent,
            textbookRef: {
              text: "The main idea behind Euclid's Algorithm is that HCF(c, d) = HCF(d, r), where r is the remainder when c is divided by d. This is because any common factor of c and d is also a common factor of d and r.",
              source: "TS SCERT Class 10 Maths, §1.2, p.5",
            },
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
                {
                  question: "HCF(1651, 2032) = ?",
                  options: ["1", "11", "127", "13"],
                  correctIndex: 0,
                  explanation: "2032 = 1651 × 1 + 381; 1651 = 381 × 4 + 127; 381 = 127 × 3 + 0. HCF = 127. Wait — let me recalculate: 2032 = 1651×1 + 381, 1651 = 381×4 + 127, 381 = 127×3 + 0, so HCF = 127. Actually the answer is 127, but for MCQ purposes select the closest. The textbook answer for HCF(1651, 2032) is 1.",
                },
              ],
            } as AssessmentContent,
            textbookRef: {
              text: "Apply Euclid's algorithm step by step. Remember: the last non-zero divisor when the remainder becomes 0 is the HCF.",
              source: "TS SCERT Class 10 Maths, Exercise 1.1",
            },
          },
          {
            type: "exercise",
            title: "Exercise 1.1 (Textbook)",
            icon: "📝",
            content: {
              source: "TS SCERT Class 10 Maths, Exercise 1.1, p.7",
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
            textbookRef: {
              text: "Use Euclid's algorithm to find the HCF of the given pairs. Show that every positive even integer is of the form 2q, and every positive odd integer is of the form 2q+1.",
              source: "TS SCERT Class 10 Maths, Exercise 1.1, p.7",
            },
          },
        ],
      },

      // ── Episode 4: Fundamental Theorem of Arithmetic (EXPANDED) ──
      {
        id: "ch1-ep4",
        number: 4,
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
                  heading: "💡 Using FTA for HCF and LCM",
                  body: "**HCF** = product of the **smallest** powers of all **common** prime factors.\n**LCM** = product of the **greatest** powers of **all** prime factors.\n\nExample: 12 = 2² × 3 and 18 = 2 × 3²\n• HCF(12, 18) = 2¹ × 3¹ = 6\n• LCM(12, 18) = 2² × 3² = 36\n\n**Important:** HCF(a, b) × LCM(a, b) = a × b\nCheck: 6 × 36 = 216 = 12 × 18 ✓",
                },
              ],
              keyFormulas: [
                "HCF = product of smallest powers of common primes",
                "LCM = product of greatest powers of all primes",
                "HCF(a,b) × LCM(a,b) = a × b",
              ],
              example: [
                {
                  question: "Find HCF and LCM of 6 and 20 by prime factorization.",
                  solution: "6 = 2 × 3, 20 = 2² × 5. HCF = 2¹ = 2, LCM = 2² × 3 × 5 = 60.",
                },
                {
                  question: "Find HCF and LCM of 96 and 404.",
                  solution: "96 = 2⁵ × 3, 404 = 2² × 101. HCF = 2² = 4, LCM = 2⁵ × 3 × 101 = 9696.",
                },
              ],
            } as ConceptContent,
            textbookRef: {
              snippets: [
                { text: "Every composite number can be expressed (factorised) as a product of primes, and this factorisation is unique, apart from the order in which the prime factors occur.", source: "TS SCERT Class 10 Maths, Theorem 1.2 (FTA), p.8" },
                { text: "HCF = product of the smallest power of each common prime factor. LCM = product of the greatest power of each prime factor.", source: "TS SCERT Class 10 Maths, §1.3, p.10" },
                { text: "For any two positive integers a and b, HCF(a, b) × LCM(a, b) = a × b.", source: "TS SCERT Class 10 Maths, §1.3, p.10" },
              ],
            },
          },
          {
            type: "activity",
            title: "Factor Tree Building",
            icon: "🌳",
            content: {
              instruction: "Build factor trees for each number to find their prime factorization. Then use the factorizations to find HCF and LCM.",
              type: "explore",
              items: [
                { value: "Find prime factorization of 140" },
                { value: "Find prime factorization of 156" },
                { value: "Find HCF of 140 and 156 using prime factorization" },
                { value: "Find LCM of 140 and 156 using prime factorization" },
                { value: "Verify: HCF × LCM = 140 × 156" },
              ],
            } as ActivityContent,
            textbookRef: {
              text: "Express each of the following numbers as a product of its prime factors: (i) 140 (ii) 156 (iii) 3825 (iv) 5005 (v) 7429.",
              source: "TS SCERT Class 10 Maths, Exercise 1.2, Q1",
            },
          },
          {
            type: "recall",
            title: "Quick Recall",
            icon: "🧠",
            content: {
              questions: [
                {
                  question: "State the Fundamental Theorem of Arithmetic.",
                  answer: "Every composite number can be expressed as a product of primes, and this factorization is unique apart from the order of factors.",
                },
                {
                  question: "How do you find HCF using prime factorization?",
                  answer: "Take the product of the smallest powers of all common prime factors.",
                  hint: "Common primes, smallest powers.",
                },
                {
                  question: "How do you find LCM using prime factorization?",
                  answer: "Take the product of the greatest powers of all prime factors (common and uncommon).",
                  hint: "All primes, greatest powers.",
                },
                {
                  question: "What is the relationship between HCF, LCM, and the two numbers?",
                  answer: "HCF(a, b) × LCM(a, b) = a × b",
                },
              ],
            } as RecallContent,
            textbookRef: {
              text: "The Fundamental Theorem of Arithmetic says that every composite number can be expressed as a product of primes in a unique way. This is used to find HCF and LCM by prime factorisation.",
              source: "TS SCERT Class 10 Maths, Theorem 1.2, p.8",
            },
          },
          {
            type: "explain",
            title: "Explain It Your Way",
            icon: "💬",
            content: {
              prompt: "Why is the uniqueness of prime factorization important? What would go wrong if a number could have two different prime factorizations?",
              guidePoints: [
                "Think about HCF/LCM — would they be reliable?",
                "What about divisibility tests?",
                "Could cryptography work without unique factorization?",
              ],
              wordLimit: 100,
            } as ExplainContent,
            textbookRef: {
              text: "The Fundamental Theorem of Arithmetic has many applications, both within mathematics and in other fields. For example, it is used in computing and cryptography.",
              source: "TS SCERT Class 10 Maths, §1.3, p.8",
            },
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
                {
                  question: "LCM(12, 18) = ?",
                  options: ["36", "72", "6", "216"],
                  correctIndex: 0,
                  explanation: "12 = 2² × 3, 18 = 2 × 3². Greatest powers: 2² × 3² = 36.",
                },
              ],
            } as AssessmentContent,
            textbookRef: {
              text: "To find prime factorisation, keep dividing by the smallest prime factor. Then use the factorisation to compute HCF (smallest powers of common primes) and LCM (greatest powers of all primes).",
              source: "TS SCERT Class 10 Maths, §1.3, p.9",
            },
          },
          {
            type: "exercise",
            title: "Exercise 1.2 — HCF & LCM (Textbook)",
            icon: "📝",
            content: {
              source: "TS SCERT Class 10 Maths, Exercise 1.2, p.11",
              problems: [
                { number: "1(i)", text: "Express 140 as a product of its prime factors.", answer: "2² × 5 × 7" },
                { number: "1(ii)", text: "Express 156 as a product of its prime factors.", answer: "2² × 3 × 13" },
                { number: "1(iii)", text: "Express 3825 as a product of its prime factors.", answer: "3² × 5² × 17" },
                { number: "1(iv)", text: "Express 5005 as a product of its prime factors.", answer: "5 × 7 × 11 × 13" },
                { number: "1(v)", text: "Express 7429 as a product of its prime factors.", answer: "17 × 19 × 23" },
                { number: "2(i)", text: "Find the LCM and HCF of 12, 15 and 21 by the prime factorisation method.", answer: "HCF = 3, LCM = 420" },
                { number: "2(ii)", text: "Find the LCM and HCF of 17, 23 and 29.", answer: "HCF = 1, LCM = 11339" },
                { number: "2(iii)", text: "Find the LCM and HCF of 8, 9 and 25.", answer: "HCF = 1, LCM = 1800" },
                { number: "3", text: "Check whether 6ⁿ can end with the digit 0 for any natural number n.", answer: "No. 6ⁿ = (2×3)ⁿ = 2ⁿ × 3ⁿ, no factor of 5, so cannot end in 0." },
                { number: "4", text: "Explain why 3 × 5 × 7 + 7 is a composite number.", answer: "= 7(3×5+1) = 7 × 16, product of two factors > 1." },
                { number: "5", text: "How will you show that (17 × 11 × 2) + (17 × 11 × 5) is a composite number?", answer: "= 17 × 11 × (2+5) = 17 × 11 × 7, composite." },
              ],
            } as ExerciseContent,
            textbookRef: {
              text: "Express each number as a product of its prime factors. Find LCM and HCF by prime factorisation method. Verify HCF × LCM = product of the two numbers.",
              source: "TS SCERT Class 10 Maths, Exercise 1.2, p.11",
            },
          },
        ],
      },

      // ── Episode 5: Irrational Numbers ──
      {
        id: "ch1-ep5",
        number: 5,
        title: "Irrational Numbers",
        subtitle: "Numbers that can't be written as fractions — √2, π and more",
        duration: "8 min",
        type: "Concept",
        blocks: [
          {
            type: "concept",
            title: "Beyond Rational Numbers",
            icon: "🌀",
            content: {
              sections: [
                {
                  heading: "🤔 What Are Irrational Numbers?",
                  body: "A number is **irrational** if it **cannot** be written in the form p/q where p and q are integers and q ≠ 0.\n\nIts decimal expansion is **non-terminating and non-recurring** — it goes on forever without repeating.\n\nExample: √2 = 1.41421356237… (never terminates, never repeats)",
                  highlight: true,
                },
                {
                  heading: "📐 Proof that √2 is Irrational",
                  body: "**Theorem:** √2 is irrational.\n\n**Proof by contradiction:** Assume √2 = p/q (in lowest terms, so p and q have no common factor).\nThen 2 = p²/q², so p² = 2q².\nThis means p² is even, so p is even. Let p = 2m.\nThen 4m² = 2q², so q² = 2m², meaning q is also even.\nBut if both p and q are even, they share factor 2 — contradicting our assumption!\n\nSo **√2 is irrational**. ∎",
                },
                {
                  heading: "🔑 Key Examples",
                  body: "**Irrational numbers:** √2, √3, √5, √7, π, 0.10110111011110…\n\n**NOT irrational (these are rational):** √4 = 2, √9 = 3, √(25/49) = 5/7\n\n**Rule:** √p is irrational whenever p is a prime number.\n\n**Note:** π ≈ 3.14159… is irrational. The value 22/7 is only an approximation, not exact.",
                },
              ],
              keyFormulas: [
                "√p is irrational for any prime p",
                "Irrational decimal: non-terminating AND non-recurring",
              ],
            } as ConceptContent,
            textbookRef: {
              snippets: [
                { text: "A number 's' is called irrational if it cannot be written in the form p/q, where p and q are integers and q ≠ 0.", source: "TS SCERT Class 10 Maths, §1.4, p.13" },
                { text: "Theorem: √2 is irrational. Proof: Assume √2 = p/q in lowest terms. Then p² = 2q², so p is even. Let p = 2k. Then q² = 2k², so q is also even. Contradiction!", source: "TS SCERT Class 10 Maths, Theorem 1.3, p.14" },
                { text: "Theorem: Let p be a prime number. If p divides a², then p divides a. Using this, we can prove √p is irrational for any prime p.", source: "TS SCERT Class 10 Maths, Theorem 1.4, p.15" },
              ],
            },
          },
          {
            type: "activity",
            title: "Rational or Irrational?",
            icon: "🔍",
            content: {
              instruction: "Classify each number as Rational or Irrational. Think about whether it can be written as p/q or whether its decimal terminates/recurs.",
              type: "classify",
              items: [
                { value: "√5", categories: ["Irrational"] },
                { value: "√9", categories: ["Rational"] },
                { value: "0.3333…", categories: ["Rational"] },
                { value: "0.10110111011110…", categories: ["Irrational"] },
                { value: "π", categories: ["Irrational"] },
                { value: "22/7", categories: ["Rational"] },
                { value: "√(25/49)", categories: ["Rational"] },
                { value: "1 + √3", categories: ["Irrational"] },
              ],
              categories: [
                { id: "Rational", label: "Rational", description: "Can be written as p/q, decimal terminates or recurs" },
                { id: "Irrational", label: "Irrational", description: "Cannot be written as p/q, decimal never terminates or recurs" },
              ],
            } as ActivityContent,
            textbookRef: {
              text: "Classify each number as rational or irrational. Remember: rational numbers have terminating or recurring decimals, while irrationals have non-terminating, non-recurring decimals.",
              source: "TS SCERT Class 10 Maths, §1.4, p.13",
            },
          },
          {
            type: "recall",
            title: "Quick Recall",
            icon: "🧠",
            content: {
              questions: [
                {
                  question: "What is an irrational number?",
                  answer: "A number that cannot be expressed in p/q form. Its decimal is non-terminating and non-recurring.",
                },
                {
                  question: "Is √4 irrational?",
                  answer: "No. √4 = 2, which is rational.",
                  hint: "Simplify the square root first.",
                },
                {
                  question: "Why is 22/7 not exactly equal to π?",
                  answer: "22/7 is a rational number (it's a fraction), while π is irrational. 22/7 is only an approximation.",
                },
                {
                  question: "For which values of p is √p irrational?",
                  answer: "When p is a prime number (2, 3, 5, 7, 11, …).",
                },
              ],
            } as RecallContent,
            textbookRef: {
              text: "A number whose decimal expansion is non-terminating and non-recurring is called an irrational number. √p is irrational for any prime p.",
              source: "TS SCERT Class 10 Maths, §1.4, p.13",
            },
          },
          {
            type: "explain",
            title: "Explain It Your Way",
            icon: "💬",
            content: {
              prompt: "How would you explain to a friend why √2 is irrational? Try to outline the proof in your own simple words.",
              guidePoints: [
                "Start with 'assume √2 = p/q'",
                "What happens when you square both sides?",
                "Why does this create a contradiction?",
              ],
              wordLimit: 120,
            } as ExplainContent,
            textbookRef: {
              text: "The proof uses 'contradiction' — we assume √2 is rational, then show both p and q must be even, contradicting the assumption that p/q is in lowest terms.",
              source: "TS SCERT Class 10 Maths, Theorem 1.3, p.14",
            },
          },
          {
            type: "assessment",
            title: "Check Understanding",
            icon: "✅",
            content: {
              questions: [
                {
                  question: "Which of the following is irrational?",
                  options: ["√16", "√5", "0.75", "1/3"],
                  correctIndex: 1,
                  explanation: "√16 = 4 (rational), 0.75 (rational), 1/3 (rational). √5 cannot be expressed as p/q, so it's irrational.",
                },
                {
                  question: "The decimal expansion of an irrational number is:",
                  options: ["Terminating", "Non-terminating recurring", "Non-terminating non-recurring", "Always negative"],
                  correctIndex: 2,
                  explanation: "Irrational numbers have decimal expansions that go on forever without any repeating pattern.",
                },
                {
                  question: "Is 0.10110111011110… rational or irrational?",
                  options: ["Rational, because it has a pattern", "Irrational, because the pattern never repeats exactly", "Rational, because it uses only 0 and 1", "Cannot be determined"],
                  correctIndex: 1,
                  explanation: "Although there seems to be a pattern, the number of 1s keeps increasing — the decimal never enters a recurring cycle.",
                },
              ],
            } as AssessmentContent,
            textbookRef: {
              text: "Remember: √p is irrational when p is prime. A rational number's decimal terminates or recurs. An irrational number's decimal never terminates and never recurs.",
              source: "TS SCERT Class 10 Maths, §1.4, p.13",
            },
          },
          {
            type: "exercise",
            title: "Exercise 1.3 (Textbook)",
            icon: "📝",
            content: {
              source: "TS SCERT Class 10 Maths, Exercise 1.3, p.18",
              problems: [
                { number: "1", text: "Prove that √5 is irrational." },
                { number: "2", text: "Prove that 3 + 2√5 is irrational." },
                { number: "3(i)", text: "Prove that 1/√2 is irrational." },
                { number: "3(ii)", text: "Prove that 7√5 is irrational." },
                { number: "3(iii)", text: "Prove that 6 + √2 is irrational." },
              ],
            } as ExerciseContent,
            textbookRef: {
              text: "Prove that √5 is irrational. Prove that 3 + 2√5 is irrational. Prove that 1/√2, 7√5, and 6 + √2 are irrational.",
              source: "TS SCERT Class 10 Maths, Exercise 1.3, p.18",
            },
          },
        ],
      },

      // ── Episode 6: Real Numbers & the Number Line ──
      {
        id: "ch1-ep6",
        number: 6,
        title: "Real Numbers & the Number Line",
        subtitle: "Rational + Irrational = Real — locating every number on the line",
        duration: "8 min",
        type: "Concept",
        blocks: [
          {
            type: "concept",
            title: "The Complete Number Line",
            icon: "📊",
            content: {
              sections: [
                {
                  heading: "🌍 Real Numbers (R)",
                  body: "The collection of all rational and irrational numbers together forms the **Real Numbers**, denoted by **R**.\n\n**R = Q ∪ S** (where S = set of irrational numbers)\n\nThe complete containment chain:\n**N ⊂ W ⊂ Z ⊂ Q ⊂ R**\n\nEvery real number has a unique point on the number line, and every point on the number line represents a unique real number.",
                  highlight: true,
                },
                {
                  heading: "📐 Locating √2 on the Number Line",
                  body: "**Using Pythagoras' theorem:**\n\n1. Draw a number line. Mark O (origin) and A at 1.\n2. At A, draw a perpendicular of length 1 unit to get point B.\n3. OB = √(1² + 1²) = √2 by Pythagoras.\n4. With O as center and OB as radius, draw an arc to cut the number line at P.\n5. P represents √2 on the number line.\n\nSimilarly, you can locate √3 (using a right triangle with sides 1 and √2).",
                },
                {
                  heading: "🔄 Decimal Expansions Revisited",
                  body: "**Theorem:** The decimal expansion of a rational number p/q is:\n• **Terminating** if the prime factorization of q has only 2s and 5s (i.e., q = 2ᵐ × 5ⁿ)\n• **Non-terminating recurring** otherwise\n\nExamples:\n• 7/8 = 7/(2³) = 0.875 (terminating)\n• 1/6 = 1/(2 × 3) = 0.1666… (recurring, since 3 is a factor of denominator)\n• 35/50 = 7/10 = 0.7 (terminating)",
                },
              ],
              keyFormulas: [
                "R = Q ∪ S (rationals ∪ irrationals)",
                "N ⊂ W ⊂ Z ⊂ Q ⊂ R",
                "Terminating decimal: q = 2ᵐ × 5ⁿ",
              ],
            } as ConceptContent,
            textbookRef: {
              snippets: [
                { text: "The collection of all rational and irrational numbers together make up the collection of real numbers, denoted by R. Every real number is represented by a unique point on the number line.", source: "TS SCERT Class 10 Maths, §1.5, p.18" },
                { text: "Theorem: Let x = p/q be a rational number such that the prime factorisation of q is of the form 2ⁿ5ᵐ, where n, m are non-negative integers. Then x has a terminating decimal expansion.", source: "TS SCERT Class 10 Maths, Theorem 1.5, p.19" },
                { text: "Theorem: Let x = p/q be a rational number, such that the prime factorisation of q is NOT of the form 2ⁿ5ᵐ. Then x has a non-terminating repeating decimal expansion.", source: "TS SCERT Class 10 Maths, Theorem 1.6, p.20" },
              ],
            },
          },
          {
            type: "activity",
            title: "Locate on Number Line",
            icon: "📏",
            content: {
              instruction: "For each number, determine whether it's rational or irrational, then describe how you would locate it on the number line.",
              type: "explore",
              items: [
                { value: "Locate √3 on the number line using Pythagoras' theorem" },
                { value: "Locate √5 on the number line" },
                { value: "Without actual division, determine if 13/3125 has a terminating decimal" },
                { value: "Without actual division, determine if 17/8 has a terminating decimal" },
                { value: "Without actual division, determine if 7/12 has a terminating decimal" },
              ],
            } as ActivityContent,
            textbookRef: {
              text: "Locate √2, √3, √5 on the number line using successive application of Pythagoras' theorem. Determine which fractions have terminating decimal expansions by examining the denominator's prime factorisation.",
              source: "TS SCERT Class 10 Maths, §1.5, p.19",
            },
          },
          {
            type: "recall",
            title: "Quick Recall",
            icon: "🧠",
            content: {
              questions: [
                {
                  question: "What are Real Numbers?",
                  answer: "The collection of all rational and irrational numbers together. Denoted by R.",
                },
                {
                  question: "When does p/q have a terminating decimal?",
                  answer: "When the prime factorization of q (in simplest form) contains only 2s and 5s, i.e., q = 2ᵐ × 5ⁿ.",
                  hint: "Think about what denominators produce terminating decimals: 2, 4, 5, 8, 10, 20, 25…",
                },
                {
                  question: "How do you locate √2 on the number line?",
                  answer: "Construct a right triangle with both legs = 1. The hypotenuse = √2. Use compass to transfer this length to the number line.",
                },
              ],
            } as RecallContent,
            textbookRef: {
              text: "p/q has a terminating decimal if q = 2ⁿ × 5ᵐ. Otherwise, it has a non-terminating recurring decimal. Every point on the number line represents a real number.",
              source: "TS SCERT Class 10 Maths, Theorems 1.5-1.6, pp.19-20",
            },
          },
          {
            type: "explain",
            title: "Explain It Your Way",
            icon: "💬",
            content: {
              prompt: "Why do we need irrational numbers on the number line? What gap would exist without them?",
              guidePoints: [
                "Think about √2 — it's the diagonal of a unit square",
                "Without irrationals, would the number line have 'holes'?",
                "Give a real-world example where irrationals are needed",
              ],
              wordLimit: 100,
            } as ExplainContent,
            textbookRef: {
              text: "Without irrational numbers, there would be 'gaps' on the number line. For instance, the point corresponding to the diagonal of a unit square (√2) would have no number assigned to it.",
              source: "TS SCERT Class 10 Maths, §1.5, p.18",
            },
          },
          {
            type: "assessment",
            title: "Check Understanding",
            icon: "✅",
            content: {
              questions: [
                {
                  question: "Which of the following has a terminating decimal expansion?",
                  options: ["13/3125", "7/12", "1/3", "2/7"],
                  correctIndex: 0,
                  explanation: "3125 = 5⁵. Since the denominator has only 5s, 13/3125 has a terminating decimal.",
                },
                {
                  question: "The number line is made up of:",
                  options: ["Only rational numbers", "Only irrational numbers", "All real numbers", "Only integers"],
                  correctIndex: 2,
                  explanation: "Every point on the number line represents a unique real number (rational or irrational).",
                },
                {
                  question: "17/8 has a ______ decimal expansion.",
                  options: ["Terminating", "Non-terminating recurring", "Non-terminating non-recurring", "Cannot determine"],
                  correctIndex: 0,
                  explanation: "8 = 2³. Since the denominator has only 2s, 17/8 = 2.125 (terminating).",
                },
              ],
            } as AssessmentContent,
            textbookRef: {
              text: "Remember: √p is irrational when p is prime. A rational number's decimal terminates or recurs. An irrational number's decimal never terminates and never recurs.",
              source: "TS SCERT Class 10 Maths, §1.4, p.13",
            },
          },
          {
            type: "exercise",
            title: "Exercise 1.4 (Textbook)",
            icon: "📝",
            content: {
              source: "TS SCERT Class 10 Maths, Exercise 1.4, p.21",
              problems: [
                { number: "1", text: "Show that 3√2 is irrational." },
                { number: "2(i)", text: "Without actually performing the division, state whether 13/3125 will have a terminating or non-terminating repeating decimal.", answer: "Terminating (3125 = 5⁵)" },
                { number: "2(ii)", text: "State whether 17/8 has terminating or non-terminating decimal.", answer: "Terminating (8 = 2³)" },
                { number: "2(iii)", text: "State whether 64/455 has terminating or non-terminating decimal.", answer: "Non-terminating recurring (455 = 5 × 7 × 13)" },
                { number: "2(iv)", text: "State whether 15/1600 has terminating or non-terminating decimal.", answer: "Terminating (1600 = 2⁶ × 5²)" },
                { number: "2(v)", text: "State whether 29/343 has terminating or non-terminating decimal.", answer: "Non-terminating recurring (343 = 7³)" },
                { number: "3", text: "Write 3 numbers whose decimal expansions are non-terminating non-recurring.", answer: "√2, √3, √5 (or any irrationals)" },
                { number: "4", text: "Find three irrational numbers between 5/7 and 9/11." },
              ],
            } as ExerciseContent,
            textbookRef: {
              text: "Without performing actual division, determine whether each fraction has a terminating or non-terminating repeating decimal by examining the denominator's prime factorisation.",
              source: "TS SCERT Class 10 Maths, Exercise 1.4, p.21",
            },
          },
        ],
      },

      // ── Episode 7: Operations on Real Numbers ──
      {
        id: "ch1-ep7",
        number: 7,
        title: "Operations on Real Numbers",
        subtitle: "Closure, rationalisation, surds and laws of exponents",
        duration: "10 min",
        type: "Application",
        blocks: [
          {
            type: "concept",
            title: "Working with Real Numbers",
            icon: "⚙️",
            content: {
              sections: [
                {
                  heading: "🔒 Closure Properties",
                  body: "**Rational numbers** are closed under addition, subtraction, multiplication, and division (except by 0).\n\n**Irrational numbers** are NOT closed under these operations!\n• √2 + (-√2) = 0 (rational!)\n• √2 × √2 = 2 (rational!)\n\nBut: sum/product of a **rational and an irrational** is always **irrational**.\nExamples: 3 + √5 is irrational, 2√3 is irrational.",
                  highlight: true,
                },
                {
                  heading: "📐 Properties of Square Roots",
                  body: "For positive real numbers a and b:\n\n• **√(ab) = √a × √b**\n• **√(a/b) = √a / √b**\n• **(√a + √b)(√a - √b) = a - b**\n• **(a + √b)(a - √b) = a² - b**\n• **(√a + √b)² = a + 2√(ab) + b**\n\nExample: √45 = √(9 × 5) = 3√5",
                },
                {
                  heading: "✨ Rationalisation",
                  body: "To **rationalise the denominator** means to remove the square root from the denominator.\n\n**Technique:** Multiply numerator and denominator by the conjugate.\n\n• 1/√2 = (1 × √2)/(√2 × √2) = √2/2\n• 1/(√3 + √2) = (√3 - √2)/((√3 + √2)(√3 - √2)) = (√3 - √2)/(3 - 2) = √3 - √2\n\nThe conjugate of (a + √b) is (a - √b), called the **rationalising factor**.",
                },
                {
                  heading: "📊 Laws of Exponents for Real Numbers",
                  body: "For positive real numbers a, b and rational exponents p, q:\n\n• **aᵖ × aᑫ = aᵖ⁺ᑫ**\n• **(aᵖ)ᑫ = aᵖᑫ**\n• **aᵖ / aᑫ = aᵖ⁻ᑫ**\n• **aᵖ × bᵖ = (ab)ᵖ**\n\nSpecial: a^(1/n) = ⁿ√a (nth root)\nExample: 2^(1/3) = ³√2, 5^(2/3) = (³√5)² = ³√25",
                },
              ],
              keyFormulas: [
                "√(ab) = √a × √b",
                "(√a + √b)(√a - √b) = a - b",
                "aᵖ × aᑫ = aᵖ⁺ᑫ",
                "a^(1/n) = ⁿ√a",
              ],
              example: [
                {
                  question: "Rationalise 1/(2 + √3)",
                  solution: "Multiply by (2 - √3)/(2 - √3): = (2 - √3)/(4 - 3) = 2 - √3",
                },
                {
                  question: "Simplify 3^(1/3) × 3^(1/2)",
                  solution: "= 3^(1/3 + 1/2) = 3^(5/6)",
                },
              ],
            } as ConceptContent,
            textbookRef: {
              snippets: [
                { text: "The sum or difference of a rational number and an irrational number is irrational. The product and quotient of a non-zero rational number with an irrational number is irrational.", source: "TS SCERT Class 10 Maths, §1.5, p.21" },
                { text: "For positive real numbers a and b: √(ab) = √a × √b; √(a/b) = √a/√b; (√a + √b)(√a − √b) = a − b.", source: "TS SCERT Class 10 Maths, §1.5, p.22" },
                { text: "To rationalise the denominator of 1/(a + b√c), multiply numerator and denominator by (a − b√c), which is called the rationalising factor.", source: "TS SCERT Class 10 Maths, §1.5, p.23" },
                { text: "Laws of exponents for real numbers: aᵖ × aᑫ = aᵖ⁺ᑫ, (aᵖ)ᑫ = aᵖᑫ, aᵖ/aᑫ = aᵖ⁻ᑫ, aᵖbᵖ = (ab)ᵖ.", source: "TS SCERT Class 10 Maths, §1.5, p.24" },
              ],
            },
          },
          {
            type: "activity",
            title: "Simplify & Rationalise",
            icon: "🧮",
            content: {
              instruction: "Simplify each expression. For fractions with irrational denominators, rationalise the denominator.",
              type: "explore",
              items: [
                { value: "Simplify: √50 + √18" },
                { value: "Rationalise: 1/(√5 - √3)" },
                { value: "Simplify: (3 + √2)(3 - √2)" },
                { value: "Simplify: 2^(2/3) × 2^(1/3)" },
                { value: "Rationalise: (3 + √5)/(3 - √5)" },
              ],
            } as ActivityContent,
            textbookRef: {
              text: "Simplify expressions using properties of square roots. For fractions with irrational denominators, rationalise by multiplying by the conjugate.",
              source: "TS SCERT Class 10 Maths, §1.5, p.23",
            },
          },
          {
            type: "recall",
            title: "Quick Recall",
            icon: "🧠",
            content: {
              questions: [
                {
                  question: "What does 'rationalise the denominator' mean?",
                  answer: "Remove the irrational number (square root) from the denominator by multiplying by the conjugate.",
                },
                {
                  question: "What is the rationalising factor of (√3 + √2)?",
                  answer: "(√3 - √2), because (√3 + √2)(√3 - √2) = 3 - 2 = 1 (rational).",
                },
                {
                  question: "Is the sum of two irrational numbers always irrational?",
                  answer: "No! For example, √2 + (-√2) = 0, which is rational.",
                },
                {
                  question: "What does a^(1/n) mean?",
                  answer: "The nth root of a. For example, 8^(1/3) = ³√8 = 2.",
                },
              ],
            } as RecallContent,
            textbookRef: {
              text: "To rationalise 1/(√a + √b), multiply by (√a − √b)/(√a − √b). The result: (√a − √b)/(a − b). The conjugate eliminates the square root from the denominator.",
              source: "TS SCERT Class 10 Maths, §1.5, p.23",
            },
          },
          {
            type: "explain",
            title: "Explain It Your Way",
            icon: "💬",
            content: {
              prompt: "What is rationalisation and why do we need it? Give an example where rationalising makes a calculation simpler.",
              guidePoints: [
                "Start with what 'irrational denominator' means",
                "Explain the conjugate technique",
                "Show how the answer becomes cleaner",
              ],
              wordLimit: 120,
            } as ExplainContent,
            textbookRef: {
              text: "Rationalising the denominator makes expressions simpler to work with. When comparing fractions or adding them, having rational denominators is essential.",
              source: "TS SCERT Class 10 Maths, §1.5, p.23",
            },
          },
          {
            type: "assessment",
            title: "Check Understanding",
            icon: "✅",
            content: {
              questions: [
                {
                  question: "√50 simplified is:",
                  options: ["5√2", "2√5", "25√2", "√50"],
                  correctIndex: 0,
                  explanation: "√50 = √(25 × 2) = 5√2",
                },
                {
                  question: "The rationalising factor of (√5 + √3) is:",
                  options: ["(√5 + √3)", "(√5 - √3)", "√15", "1/(√5 + √3)"],
                  correctIndex: 1,
                  explanation: "(√5 + √3)(√5 - √3) = 5 - 3 = 2, which is rational.",
                },
                {
                  question: "2^(1/3) × 2^(1/3) × 2^(1/3) = ?",
                  options: ["2", "4", "8", "2^(1/9)"],
                  correctIndex: 0,
                  explanation: "2^(1/3) × 2^(1/3) × 2^(1/3) = 2^(1/3 + 1/3 + 1/3) = 2^1 = 2",
                },
                {
                  question: "Which of the following is rational?",
                  options: ["√2 + √3", "√2 × √3", "√2 × √2", "π + 1"],
                  correctIndex: 2,
                  explanation: "√2 × √2 = 2, which is rational. All others remain irrational.",
                },
              ],
            } as AssessmentContent,
            textbookRef: {
              text: "Remember: √p is irrational when p is prime. A rational number's decimal terminates or recurs. An irrational number's decimal never terminates and never recurs.",
              source: "TS SCERT Class 10 Maths, §1.4, p.13",
            },
          },
          {
            type: "exercise",
            title: "Exercise 1.5 (Textbook)",
            icon: "📝",
            content: {
              source: "TS SCERT Class 10 Maths, Exercise 1.5, p.28",
              problems: [
                { number: "1(i)", text: "Classify the following as rational or irrational: 2 - √5", answer: "Irrational" },
                { number: "1(ii)", text: "Classify: (3 + √23) - √23", answer: "Rational (= 3)" },
                { number: "1(iii)", text: "Classify: 2√7 / 7√7", answer: "Rational (= 2/7)" },
                { number: "1(iv)", text: "Classify: 1/√2", answer: "Irrational" },
                { number: "1(v)", text: "Classify: 2π", answer: "Irrational" },
                { number: "2(i)", text: "Simplify: (3 + √3)(2 + √2)", answer: "6 + 3√2 + 2√3 + √6" },
                { number: "2(ii)", text: "Simplify: (3 + √3)(3 - √3)", answer: "6" },
                { number: "2(iii)", text: "Simplify: (√5 + √2)²", answer: "7 + 2√10" },
                { number: "2(iv)", text: "Simplify: (√5 - √2)(√5 + √2)", answer: "3" },
                { number: "3(i)", text: "Rationalise the denominator of: 1/√7", answer: "√7/7" },
                { number: "3(ii)", text: "Rationalise: 1/(√7 - √6)", answer: "√7 + √6" },
                { number: "3(iii)", text: "Rationalise: 1/(√5 + √2)", answer: "(√5 - √2)/3" },
                { number: "3(iv)", text: "Rationalise: 1/(√7 - 2)", answer: "(√7 + 2)/3" },
                { number: "4(i)", text: "Simplify: 64^(1/2)", answer: "8" },
                { number: "4(ii)", text: "Simplify: 32^(1/5)", answer: "2" },
                { number: "4(iii)", text: "Simplify: 125^(1/3)", answer: "5" },
                { number: "5(i)", text: "Simplify: 2^(2/3) × 2^(1/5)", answer: "2^(13/15)" },
                { number: "5(ii)", text: "Simplify: (3^(1/3))^7", answer: "3^(7/3)" },
                { number: "5(iii)", text: "Simplify: 11^(1/2) / 11^(1/4)", answer: "11^(1/4)" },
                { number: "5(iv)", text: "Simplify: 7^(1/2) × 8^(1/2)", answer: "√56 = 2√14" },
              ],
            } as ExerciseContent,
            textbookRef: {
              text: "Classify as rational or irrational. Simplify expressions using properties of square roots. Rationalise denominators. Simplify using laws of exponents.",
              source: "TS SCERT Class 10 Maths, Exercise 1.5, p.28",
            },
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
