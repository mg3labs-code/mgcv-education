import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Zap, Puzzle, Eye, ChevronRight, CheckCircle2, RotateCcw } from "lucide-react";

/* ── Micro Lessons ── */
interface MicroLesson {
  id: string;
  hook: string;
  visual: string[];
  thinkQuestion: string;
  thinkAnswer: string;
}

const microLessons: MicroLesson[] = [
  {
    id: "ml1",
    hook: "🐝 Can 28 bees be evenly split into groups? Let's think about it using Euclid!",
    visual: [
      "Imagine 28 bees. Try grouping them into 5s:",
      "🐝🐝🐝🐝🐝 | 🐝🐝🐝🐝🐝 | 🐝🐝🐝🐝🐝 | 🐝🐝🐝🐝🐝 | 🐝🐝🐝🐝🐝 | 🐝🐝🐝",
      "5 groups of 5 + 3 left over → 28 = 5 × 5 + 3",
      "That's Euclid's Division Lemma in action! a = bq + r"
    ],
    thinkQuestion: "Why must the remainder always be less than the divisor?",
    thinkAnswer: "Because if the remainder were ≥ the divisor, you could fit one more group! The remainder is what's truly 'left over' after making as many complete groups as possible."
  },
  {
    id: "ml2",
    hook: "🔗 Finding what two numbers share — the HCF chain reaction!",
    visual: [
      "Find HCF(48, 18):",
      "48 = 18 × 2 + 12  →  Keep 18 and 12",
      "18 = 12 × 1 + 6   →  Keep 12 and 6",
      "12 = 6 × 2 + 0    →  STOP! HCF = 6",
      "Like a chain: each step shrinks the numbers until they 'click' perfectly."
    ],
    thinkQuestion: "Why does replacing (a, b) with (b, r) still give the same HCF?",
    thinkAnswer: "Because any number that divides both a and b must also divide r (since r = a - bq). So the common factors stay the same at each step — we're just working with smaller numbers!"
  },
  {
    id: "ml3",
    hook: "🌳 Every number has a DNA — its unique prime fingerprint!",
    visual: [
      "Let's decode 180's prime DNA:",
      "180 → 2 × 90",
      "      → 2 × 2 × 45",
      "      → 2 × 2 × 3 × 15",
      "      → 2 × 2 × 3 × 3 × 5",
      "180 = 2² × 3² × 5 — unique! No other primes give 180."
    ],
    thinkQuestion: "If two numbers share no prime factors, what is their HCF?",
    thinkAnswer: "Their HCF is 1! They're called 'co-prime' numbers. Example: 8 (= 2³) and 15 (= 3 × 5) share no primes, so HCF(8, 15) = 1."
  }
];

/* ── Pattern Game ── */
interface PatternChallenge {
  id: string;
  title: string;
  sequence: (number | string)[];
  question: string;
  answer: string;
  hint: string;
}

const patternChallenges: PatternChallenge[] = [
  {
    id: "p1",
    title: "Remainder Patterns",
    sequence: [17, 12, 7, 2, "?"],
    question: "Each number is the remainder when dividing by 5. What's the pattern?",
    answer: "Each number is 5 less than the previous. They all give remainder 2 when divided by 5. Pattern: subtract 5 each time.",
    hint: "Try dividing each by 5 and look at the remainders"
  },
  {
    id: "p2",
    title: "HCF Chain",
    sequence: [252, 105, 42, 21, "?"],
    question: "These are the divisors in Euclid's Algorithm. What comes next?",
    answer: "0! Because 42 = 21 × 2 + 0. The algorithm stops when remainder is 0, so HCF = 21.",
    hint: "Apply division: each number ÷ next number"
  },
  {
    id: "p3",
    title: "Prime Factor Count",
    sequence: ["2=1", "6=2", "30=3", "210=4", "?=5"],
    question: "Each number is the product of the first n primes. What has 5 prime factors?",
    answer: "2310 = 2 × 3 × 5 × 7 × 11. These are called 'primorial' numbers!",
    hint: "First 5 primes: 2, 3, 5, 7, 11"
  }
];

/* ── Visual Exploration: Factor Tree ── */
interface TreeNode { value: number; left?: TreeNode; right?: TreeNode; isPrime?: boolean }

const factorTreeData: TreeNode = {
  value: 180,
  left: { value: 2, isPrime: true },
  right: {
    value: 90,
    left: { value: 2, isPrime: true },
    right: {
      value: 45,
      left: { value: 3, isPrime: true },
      right: {
        value: 15,
        left: { value: 3, isPrime: true },
        right: { value: 5, isPrime: true }
      }
    }
  }
};

const TreeNodeComponent = ({ node, depth = 0 }: { node: TreeNode; depth?: number }) => (
  <div className="flex flex-col items-center">
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
      node.isPrime ? "bg-primary text-primary-foreground border-primary" : "bg-card border-muted-foreground/30"
    }`}>
      {node.value}
    </div>
    {(node.left || node.right) && (
      <div className="flex gap-4 mt-2 pt-2 border-t border-dashed border-muted-foreground/20">
        {node.left && <TreeNodeComponent node={node.left} depth={depth + 1} />}
        {node.right && <TreeNodeComponent node={node.right} depth={depth + 1} />}
      </div>
    )}
  </div>
);

const VisualThinkingLab = () => {
  const [lessonStep, setLessonStep] = useState<Record<string, number>>({});
  const [revealedPatterns, setRevealedPatterns] = useState<Set<string>>(new Set());
  const [revealedThink, setRevealedThink] = useState<Set<string>>(new Set());

  const getLessonStep = (id: string) => lessonStep[id] || 0;
  const advanceLesson = (id: string) => setLessonStep(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));

  return (
    <Tabs defaultValue="micro" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="micro" className="flex items-center gap-1"><Zap className="h-3 w-3" /> Micro Lessons</TabsTrigger>
        <TabsTrigger value="patterns" className="flex items-center gap-1"><Puzzle className="h-3 w-3" /> Pattern Game</TabsTrigger>
        <TabsTrigger value="visual" className="flex items-center gap-1"><Eye className="h-3 w-3" /> Visual Explore</TabsTrigger>
      </TabsList>

      {/* Micro Lessons */}
      <TabsContent value="micro" className="space-y-4">
        {microLessons.map((lesson) => {
          const step = getLessonStep(lesson.id);
          return (
            <Card key={lesson.id}>
              <CardContent className="pt-5 space-y-3">
                {/* Hook */}
                <p className="text-base font-semibold">{lesson.hook}</p>

                {/* Visual steps */}
                {step >= 1 && (
                  <div className="p-3 rounded-lg bg-muted/50 border font-mono text-sm space-y-1">
                    {lesson.visual.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                )}

                {/* Think question */}
                {step >= 2 && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                    <p className="text-sm font-semibold">🤔 Think About It:</p>
                    <p className="text-sm">{lesson.thinkQuestion}</p>
                    {revealedThink.has(lesson.id) ? (
                      <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-2 rounded">{lesson.thinkAnswer}</p>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setRevealedThink(prev => new Set(prev).add(lesson.id))}>
                        Show Answer
                      </Button>
                    )}
                  </div>
                )}

                {/* Navigation */}
                {step < 2 && (
                  <Button size="sm" onClick={() => advanceLesson(lesson.id)}>
                    {step === 0 ? "Show Explanation" : "Think Question"} <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
                {step >= 2 && revealedThink.has(lesson.id) && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" /> Lesson Complete!
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </TabsContent>

      {/* Pattern Game */}
      <TabsContent value="patterns" className="space-y-4">
        {patternChallenges.map((challenge) => (
          <Card key={challenge.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{challenge.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                {challenge.sequence.map((item, i) => (
                  <div key={i} className={`px-4 py-2 rounded-lg font-mono text-sm font-bold ${
                    item === "?" ? "bg-primary text-primary-foreground animate-pulse" : "bg-muted border"
                  }`}>
                    {item}
                  </div>
                ))}
              </div>
              <p className="text-sm">{challenge.question}</p>
              <p className="text-xs text-muted-foreground">💡 Hint: {challenge.hint}</p>

              {revealedPatterns.has(challenge.id) ? (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-sm text-green-800 dark:text-green-300">
                  {challenge.answer}
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setRevealedPatterns(prev => new Set(prev).add(challenge.id))}>
                  Reveal Pattern
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      {/* Visual Exploration */}
      <TabsContent value="visual" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Factor Tree of 180</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Watch how 180 breaks down into its prime factors. Coloured circles are primes — the "DNA" of the number.
            </p>
            <div className="flex justify-center py-4">
              <TreeNodeComponent node={factorTreeData} />
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
              <p className="font-mono font-bold">180 = 2² × 3² × 5</p>
              <p className="text-xs text-muted-foreground mt-1">Every branch ends at a prime — that's the Fundamental Theorem!</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Euclid's Algorithm Visualised</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { a: 72, b: 56, q: 1, r: 16, label: "72 = 56 × 1 + 16" },
                { a: 56, b: 16, q: 3, r: 8, label: "56 = 16 × 3 + 8" },
                { a: 16, b: 8, q: 2, r: 0, label: "16 = 8 × 2 + 0" },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`flex-1 rounded-lg p-3 font-mono text-sm border ${step.r === 0 ? "bg-green-50 dark:bg-green-950/30 border-green-300" : "bg-muted/50"}`}>
                    {step.label}
                    {step.r === 0 && <span className="ml-2 font-bold text-green-700 dark:text-green-400">← HCF = {step.b}</span>}
                  </div>
                  {i < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default VisualThinkingLab;
