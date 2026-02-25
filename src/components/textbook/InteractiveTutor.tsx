import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, MessageCircle, BookOpen, Send } from "lucide-react";

interface Subtopic {
  id: string;
  number: string;
  title: string;
  content: string[];
  questions: { question: string; keywords: string[]; simpleExplanation: string }[];
}

const subtopics: Subtopic[] = [
  {
    id: "edl",
    number: "1.1",
    title: "Euclid's Division Lemma",
    content: [
      "Euclid's Division Lemma states: Given positive integers a and b, there exist unique integers q and r such that a = bq + r, where 0 ≤ r < b.",
      "This is the mathematical way of saying what we already know from long division — when we divide a by b, we get a quotient q and remainder r, and the remainder is always less than the divisor.",
      "For example, dividing 17 by 5: 17 = 5 × 3 + 2. Here a=17, b=5, q=3, r=2.",
      "The key insight is that this always works for ANY two positive integers, and the q and r we get are UNIQUE — there's only one possible quotient and remainder."
    ],
    questions: [
      {
        question: "In your own words, what does Euclid's Division Lemma state?",
        keywords: ["positive integers", "quotient", "remainder", "unique", "a = bq + r", "less than"],
        simpleExplanation: "EDL says: for any two positive integers a and b, you can always write a = b×q + r where the remainder r is between 0 and b-1. Think of it as the math behind long division!"
      },
      {
        question: "If a = 43 and b = 9, what are q and r?",
        keywords: ["4", "7", "43 = 9", "q = 4", "r = 7"],
        simpleExplanation: "43 ÷ 9 = 4 remainder 7. So 43 = 9 × 4 + 7. The quotient q = 4, remainder r = 7."
      }
    ]
  },
  {
    id: "algo",
    number: "1.2",
    title: "Euclid's Algorithm for HCF",
    content: [
      "Euclid's Algorithm is a clever way to find the Highest Common Factor (HCF) of two numbers by repeatedly applying the Division Lemma.",
      "The idea is simple: HCF(a, b) = HCF(b, r), where a = bq + r. We keep replacing until the remainder is 0.",
      "Example — Find HCF(56, 72):",
      "Step 1: 72 = 56 × 1 + 16",
      "Step 2: 56 = 16 × 3 + 8",
      "Step 3: 16 = 8 × 2 + 0",
      "When remainder = 0, the divisor (8) is the HCF. So HCF(56, 72) = 8.",
      "This works because any common factor of a and b must also be a factor of r (since r = a - bq)."
    ],
    questions: [
      {
        question: "Explain the steps to find HCF using Euclid's Algorithm.",
        keywords: ["divide", "remainder", "repeat", "zero", "divisor", "HCF", "replace"],
        simpleExplanation: "Step 1: Divide the larger number by the smaller. Step 2: If remainder is 0, the smaller number is the HCF. Step 3: If not, replace the larger with the smaller, and the smaller with the remainder. Repeat!"
      },
      {
        question: "Find HCF of 96 and 404 using the algorithm.",
        keywords: ["4", "404 = 96", "96 = 20", "20 = 16", "16 = 4"],
        simpleExplanation: "404 = 96×4 + 20, then 96 = 20×4 + 16, then 20 = 16×1 + 4, then 16 = 4×4 + 0. HCF = 4!"
      }
    ]
  },
  {
    id: "fta",
    number: "1.3",
    title: "Fundamental Theorem of Arithmetic",
    content: [
      "The Fundamental Theorem of Arithmetic states: Every composite number can be expressed as a product of primes, and this factorisation is unique (apart from the order of factors).",
      "For example: 36 = 2 × 2 × 3 × 3 = 2² × 3². No other combination of primes gives 36.",
      "This theorem is incredibly useful for finding HCF and LCM:",
      "To find HCF: Take the product of the smallest powers of all common prime factors.",
      "To find LCM: Take the product of the greatest powers of all prime factors.",
      "Important relationship: HCF(a,b) × LCM(a,b) = a × b",
      "Example: For 12 = 2² × 3 and 18 = 2 × 3², HCF = 2 × 3 = 6, LCM = 2² × 3² = 36. Check: 6 × 36 = 216 = 12 × 18 ✓"
    ],
    questions: [
      {
        question: "What does 'unique factorisation' mean in the Fundamental Theorem?",
        keywords: ["one way", "unique", "primes", "order", "same primes", "only one"],
        simpleExplanation: "It means every number bigger than 1 can be broken down into prime numbers in exactly ONE way (ignoring the order). For example, 30 = 2×3×5 — no other set of primes multiplies to give 30."
      },
      {
        question: "Find HCF and LCM of 8 and 20 using prime factorisation.",
        keywords: ["2³", "2²", "5", "4", "40", "HCF", "LCM"],
        simpleExplanation: "8 = 2³, 20 = 2² × 5. HCF = 2² = 4 (smallest common power). LCM = 2³ × 5 = 40 (largest powers of all). Check: 4 × 40 = 160 = 8 × 20 ✓"
      }
    ]
  }
];

interface ChatMessage {
  role: "tutor" | "student";
  text: string;
}

const InteractiveTutor = () => {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>({});
  const [lastScore, setLastScore] = useState<number | null>(null);

  const analyzeAnswer = (input: string, keywords: string[]): number => {
    const lower = input.toLowerCase();
    const matched = keywords.filter(k => lower.includes(k.toLowerCase()));
    return Math.round((matched.length / keywords.length) * 100);
  };

  const handleSubmitAnswer = () => {
    if (!activeQuiz || !answer.trim()) return;
    const topic = subtopics.find(s => s.id === activeQuiz);
    if (!topic) return;
    const q = topic.questions[questionIndex];
    const score = analyzeAnswer(answer, q.keywords);
    setLastScore(score);

    const newMessages: ChatMessage[] = [
      { role: "tutor", text: q.question },
      { role: "student", text: answer },
      { role: "tutor", text: score >= 60
        ? `Great job! You scored ${score}%. You've captured the key concepts well.`
        : `You scored ${score}%. Let me explain simply: ${q.simpleExplanation}` }
    ];

    setChatHistory(prev => ({
      ...prev,
      [activeQuiz]: [...(prev[activeQuiz] || []), ...newMessages]
    }));

    setAnswer("");

    if (questionIndex < topic.questions.length - 1) {
      setQuestionIndex(prev => prev + 1);
      setLastScore(null);
    }
  };

  const finishQuiz = () => {
    if (activeQuiz) {
      setCompleted(prev => new Set(prev).add(activeQuiz));
    }
    setActiveQuiz(null);
    setQuestionIndex(0);
    setLastScore(null);
    setAnswer("");
  };

  const progress = Math.round((completed.size / subtopics.length) * 100);

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border">
        <BookOpen className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium">{completed.size}/{subtopics.length} topics completed</span>
        <div className="flex-1"><Progress value={progress} className="h-2" /></div>
        <span className="text-sm font-semibold text-primary">{progress}%</span>
      </div>

      {/* Subtopic cards */}
      <div className="space-y-4">
        {subtopics.map((topic) => (
          <Card key={topic.id} className={`transition-all ${completed.has(topic.id) ? "border-green-300 bg-green-50/30 dark:bg-green-950/10" : ""}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {completed.has(topic.id) && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                  <span className="text-primary font-mono text-sm">{topic.number}</span>
                  {topic.title}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Reading content */}
              <div className="space-y-2 text-sm leading-relaxed">
                {topic.content.map((para, i) => (
                  <p key={i} className={para.startsWith("Step") || para.startsWith("Example") ? "font-mono text-xs bg-muted/50 p-2 rounded" : ""}>
                    {para}
                  </p>
                ))}
              </div>

              {/* Chat history */}
              {chatHistory[topic.id] && chatHistory[topic.id].length > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-muted/30 border space-y-2 max-h-48 overflow-y-auto">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" /> Conversation History
                  </p>
                  {chatHistory[topic.id].map((msg, i) => (
                    <div key={i} className={`text-sm p-2 rounded ${msg.role === "tutor" ? "bg-primary/10 text-primary" : "bg-secondary ml-4"}`}>
                      <span className="font-medium text-xs">{msg.role === "tutor" ? "🤖 Tutor" : "👤 You"}:</span> {msg.text}
                    </div>
                  ))}
                </div>
              )}

              {/* Action button */}
              <Button
                size="sm"
                variant={completed.has(topic.id) ? "outline" : "default"}
                onClick={() => { setActiveQuiz(topic.id); setQuestionIndex(0); setLastScore(null); }}
              >
                {completed.has(topic.id) ? "Review Again" : "Finished Reading — Test Me!"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quiz dialog */}
      <Dialog open={!!activeQuiz} onOpenChange={(open) => { if (!open) finishQuiz(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Comprehension Check</DialogTitle>
            <DialogDescription>
              {activeQuiz && `${subtopics.find(s => s.id === activeQuiz)?.title} — Question ${questionIndex + 1}`}
            </DialogDescription>
          </DialogHeader>
          {activeQuiz && (
            <div className="space-y-4">
              <p className="text-sm font-medium">
                {subtopics.find(s => s.id === activeQuiz)?.questions[questionIndex]?.question}
              </p>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full min-h-[100px] p-3 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Type your answer here..."
              />
              {lastScore !== null && (
                <div className={`p-3 rounded-lg text-sm ${lastScore >= 60 ? "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300" : "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"}`}>
                  Score: {lastScore}% — {lastScore >= 60 ? "Well done!" : "Review the explanation above and try the next question."}
                </div>
              )}
              <div className="flex gap-2 justify-end">
                {lastScore === null ? (
                  <Button onClick={handleSubmitAnswer} disabled={!answer.trim()}>
                    <Send className="h-4 w-4 mr-1" /> Submit Answer
                  </Button>
                ) : questionIndex < (subtopics.find(s => s.id === activeQuiz)?.questions.length ?? 1) - 1 ? (
                  <Button onClick={() => { setQuestionIndex(prev => prev + 1); setLastScore(null); }}>
                    Next Question →
                  </Button>
                ) : (
                  <Button onClick={finishQuiz} variant="default">
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Complete Topic
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InteractiveTutor;
