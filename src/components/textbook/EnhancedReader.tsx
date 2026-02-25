import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, BookOpen, Clock, Lightbulb, Calculator, ChevronDown } from "lucide-react";

interface Section {
  id: string;
  title: string;
  summary: string;
  content: string[];
  formulas?: string[];
  example?: { question: string; steps: string[]; answer: string };
  quickCheck?: { question: string; answer: string };
  tips?: string[];
}

const sections: Section[] = [
  {
    id: "edl",
    title: "What is Euclid's Division Lemma?",
    summary: "For any two positive integers a and b, there exist unique integers q and r such that a = bq + r, where 0 ≤ r < b.",
    content: [
      "Euclid's Division Lemma is a fundamental result in number theory attributed to the ancient Greek mathematician Euclid.",
      "It states: Given positive integers a and b, there exist unique integers q (quotient) and r (remainder) such that a = bq + r, where 0 ≤ r < b.",
      "This is essentially what we do when we perform long division — we find how many times b goes into a, and what's left over.",
      "The word 'lemma' means a proven statement used as a stepping stone for proving other results."
    ],
    formulas: ["a = bq + r, where 0 ≤ r < b"],
    example: {
      question: "Use Euclid's Division Lemma for a = 17, b = 5",
      steps: ["We need: 17 = 5 × q + r", "17 = 5 × 3 + 2", "Here q = 3, r = 2", "Check: 0 ≤ 2 < 5 ✓"],
      answer: "17 = 5 × 3 + 2"
    },
    quickCheck: {
      question: "Apply EDL to a = 23, b = 7. What are q and r?",
      answer: "23 = 7 × 3 + 2, so q = 3 and r = 2"
    }
  },
  {
    id: "examples",
    title: "Step-by-Step Examples",
    summary: "Worked examples showing how to apply the division lemma with different numbers.",
    content: [
      "Let's work through several examples to build confidence with Euclid's Division Lemma."
    ],
    example: {
      question: "Express 135 in terms of 19 using EDL",
      steps: ["Divide 135 by 19", "135 ÷ 19 = 7 remainder 2", "So 135 = 19 × 7 + 2", "Verify: 19 × 7 + 2 = 133 + 2 = 135 ✓"],
      answer: "135 = 19 × 7 + 2"
    },
    quickCheck: {
      question: "Express 240 in terms of 17 using EDL",
      answer: "240 = 17 × 14 + 2"
    }
  },
  {
    id: "hcf",
    title: "Finding HCF using Euclid's Algorithm",
    summary: "Euclid's Algorithm uses repeated application of the division lemma to find the HCF of two numbers.",
    content: [
      "Euclid's Algorithm is a method to find the Highest Common Factor (HCF) of two positive integers.",
      "Step 1: Apply EDL to the two numbers — the larger is 'a', smaller is 'b'.",
      "Step 2: If remainder r = 0, then b is the HCF.",
      "Step 3: If r ≠ 0, replace a with b and b with r, then repeat.",
      "Continue until the remainder becomes 0. The last non-zero divisor is the HCF."
    ],
    formulas: ["HCF(a, b) = HCF(b, r) where a = bq + r"],
    example: {
      question: "Find HCF of 56 and 72",
      steps: [
        "72 = 56 × 1 + 16",
        "56 = 16 × 3 + 8",
        "16 = 8 × 2 + 0",
        "Remainder is 0, so HCF = 8"
      ],
      answer: "HCF(56, 72) = 8"
    },
    quickCheck: {
      question: "Find HCF of 96 and 404 using Euclid's Algorithm",
      answer: "404 = 96 × 4 + 20 → 96 = 20 × 4 + 16 → 20 = 16 × 1 + 4 → 16 = 4 × 4 + 0. HCF = 4"
    }
  },
  {
    id: "fta",
    title: "Fundamental Theorem of Arithmetic",
    summary: "Every composite number can be expressed as a product of primes, and this factorisation is unique (apart from order).",
    content: [
      "The Fundamental Theorem of Arithmetic states that every integer greater than 1 is either prime or can be uniquely factorised into primes.",
      "For example: 36 = 2² × 3², and no other combination of primes gives 36.",
      "This uniqueness is powerful — it's used in finding HCF and LCM:",
      "HCF = product of smallest powers of common prime factors",
      "LCM = product of greatest powers of all prime factors"
    ],
    formulas: [
      "HCF(a,b) × LCM(a,b) = a × b",
      "HCF = product of least powers of common primes",
      "LCM = product of highest powers of all primes"
    ],
    example: {
      question: "Find HCF and LCM of 12 and 18 using prime factorisation",
      steps: [
        "12 = 2² × 3¹",
        "18 = 2¹ × 3²",
        "HCF = 2¹ × 3¹ = 6 (smallest powers of common primes)",
        "LCM = 2² × 3² = 36 (largest powers of all primes)",
        "Verify: 6 × 36 = 216 = 12 × 18 ✓"
      ],
      answer: "HCF = 6, LCM = 36"
    },
    quickCheck: {
      question: "Find HCF and LCM of 8 and 20",
      answer: "8 = 2³, 20 = 2² × 5. HCF = 2² = 4, LCM = 2³ × 5 = 40"
    }
  },
  {
    id: "irrational",
    title: "Irrational Numbers",
    summary: "Numbers like √2, √3, √5 cannot be expressed as p/q. We can prove this using the Fundamental Theorem.",
    content: [
      "A number is irrational if it cannot be written as p/q where p and q are integers and q ≠ 0.",
      "Examples: √2, √3, √5, π are irrational numbers.",
      "We prove √2 is irrational using proof by contradiction:",
      "Assume √2 = p/q (in lowest terms). Then 2 = p²/q², so p² = 2q².",
      "This means p² is even, so p must be even. Let p = 2k.",
      "Then 4k² = 2q², which gives q² = 2k², so q is also even.",
      "But if both p and q are even, p/q was not in lowest terms — contradiction!",
      "Therefore, √2 is irrational."
    ],
    tips: [
      "The key idea is 'proof by contradiction' — assume the opposite and find a logical impossibility",
      "If p² is divisible by a prime, then p is also divisible by that prime (from FTA)"
    ],
    quickCheck: {
      question: "Why is the proof that √2 is irrational called 'proof by contradiction'?",
      answer: "Because we assume √2 is rational and show this leads to a logical contradiction — both p and q would need to be even, violating our assumption that p/q is in simplest form."
    }
  },
  {
    id: "practice",
    title: "Practice Problems & Key Takeaways",
    summary: "Test your understanding with practice problems covering all topics in this chapter.",
    content: [
      "Key Takeaways:",
      "• Euclid's Division Lemma: a = bq + r (0 ≤ r < b)",
      "• Euclid's Algorithm finds HCF by repeated division",
      "• Every composite number has a unique prime factorisation",
      "• HCF × LCM = product of the two numbers",
      "• √p is irrational for any prime p"
    ],
    quickCheck: {
      question: "Find HCF of 135 and 225, then verify using prime factorisation",
      answer: "By Algorithm: 225=135×1+90 → 135=90×1+45 → 90=45×2+0. HCF=45. By Primes: 135=3³×5, 225=3²×5². HCF=3²×5=45 ✓"
    }
  }
];

const EnhancedReader = () => {
  const [understood, setUnderstood] = useState<Set<string>>(new Set());
  const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(new Set());

  const toggleUnderstood = (id: string) => {
    setUnderstood(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleReveal = (id: string) => {
    setRevealedAnswers(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const progress = Math.round((understood.size / sections.length) * 100);

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="flex items-center gap-6 p-4 rounded-xl bg-muted/50 border">
        <div className="flex items-center gap-2 text-sm">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="font-medium">{sections.length} Sections</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="font-medium">{understood.size} Completed</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>~25 min</span>
        </div>
        <div className="flex-1">
          <Progress value={progress} className="h-2" />
        </div>
        <span className="text-sm font-semibold text-primary">{progress}%</span>
      </div>

      {/* Accordion sections */}
      <Accordion type="multiple" className="space-y-3">
        {sections.map((section) => (
          <AccordionItem key={section.id} value={section.id} className="border rounded-xl px-1 bg-card shadow-sm">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                {understood.has(section.id) ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                )}
                <span className="font-semibold">{section.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              {/* Quick Summary */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm font-medium text-primary flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" /> Quick Summary
                </p>
                <p className="text-sm mt-1">{section.summary}</p>
              </div>

              {/* Content */}
              <div className="space-y-2">
                {section.content.map((para, i) => (
                  <p key={i} className="text-sm leading-relaxed">{para}</p>
                ))}
              </div>

              {/* Formulas */}
              {section.formulas && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2">
                    <Calculator className="h-3 w-3 inline mr-1" />Key Formulas
                  </p>
                  {section.formulas.map((f, i) => (
                    <p key={i} className="font-mono text-sm font-medium text-amber-900 dark:text-amber-200">{f}</p>
                  ))}
                </div>
              )}

              {/* Example */}
              {section.example && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800 space-y-2">
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">📝 Example: {section.example.question}</p>
                  <div className="space-y-1">
                    {section.example.steps.map((step, i) => (
                      <p key={i} className="text-sm font-mono pl-4 text-blue-700 dark:text-blue-300">Step {i + 1}: {step}</p>
                    ))}
                  </div>
                  <p className="text-sm font-bold text-blue-900 dark:text-blue-200 pt-1">Answer: {section.example.answer}</p>
                </div>
              )}

              {/* Tips */}
              {section.tips && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">💡 Tips</p>
                  {section.tips.map((t, i) => (
                    <p key={i} className="text-sm text-green-800 dark:text-green-300">• {t}</p>
                  ))}
                </div>
              )}

              {/* Quick Check */}
              {section.quickCheck && (
                <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
                  <p className="text-sm font-semibold">🧠 Quick Check</p>
                  <p className="text-sm">{section.quickCheck.question}</p>
                  {revealedAnswers.has(section.id) ? (
                    <p className="text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-2 rounded">{section.quickCheck.answer}</p>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => toggleReveal(section.id)}>
                      <ChevronDown className="h-3 w-3 mr-1" /> Reveal Answer
                    </Button>
                  )}
                </div>
              )}

              {/* Mark as Understood */}
              <Button
                size="sm"
                variant={understood.has(section.id) ? "default" : "outline"}
                onClick={() => toggleUnderstood(section.id)}
                className="mt-2"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {understood.has(section.id) ? "Understood ✓" : "Mark as Understood"}
              </Button>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default EnhancedReader;
