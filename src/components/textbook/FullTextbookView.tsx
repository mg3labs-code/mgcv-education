import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

interface Topic {
  id: string;
  title: string;
  content: TopicBlock[];
}

interface TopicBlock {
  type: "definition" | "formula" | "example" | "steps" | "note" | "text" | "proof";
  title?: string;
  content: string | string[];
}

const topics: Topic[] = [
  {
    id: "edl",
    title: "Euclid's Division Lemma",
    content: [
      { type: "text", content: "This chapter begins with a fundamental result in number theory that forms the basis for Euclid's Algorithm — a method to compute the Highest Common Factor (HCF) of two positive integers." },
      { type: "definition", title: "Euclid's Division Lemma", content: "Given positive integers a and b, there exist unique integers q and r satisfying a = bq + r, where 0 ≤ r < b." },
      { type: "text", content: "This is essentially a restatement of the long division process. When we divide a by b, we get quotient q and remainder r." },
      { type: "example", title: "Example 1", content: ["Use Euclid's Division Lemma for a = 17, b = 5", "Solution: 17 = 5 × 3 + 2", "Here q = 3 and r = 2", "Check: 0 ≤ 2 < 5 ✓"] },
      { type: "example", title: "Example 2", content: ["Express 135 in terms of 19", "Solution: 135 = 19 × 7 + 2", "Verification: 19 × 7 + 2 = 133 + 2 = 135 ✓"] },
      { type: "note", content: "The lemma guarantees both existence and uniqueness of q and r. This uniqueness is crucial for the algorithm that follows." }
    ]
  },
  {
    id: "algo",
    title: "Euclid's Algorithm for HCF",
    content: [
      { type: "text", content: "Euclid's Algorithm is an efficient method to find the HCF of two positive integers. It uses the Division Lemma repeatedly." },
      { type: "steps", title: "Algorithm Steps", content: [
        "Step 1: Apply Division Lemma to a and b (a > b): a = bq + r",
        "Step 2: If r = 0, then HCF(a, b) = b. Stop.",
        "Step 3: If r ≠ 0, apply the lemma to b and r: replace a → b, b → r",
        "Step 4: Repeat until the remainder is 0. The last divisor is the HCF."
      ]},
      { type: "formula", title: "Key Property", content: "HCF(a, b) = HCF(b, r) where a = bq + r" },
      { type: "example", title: "Find HCF(56, 72)", content: [
        "72 = 56 × 1 + 16",
        "56 = 16 × 3 + 8",
        "16 = 8 × 2 + 0",
        "∴ HCF(56, 72) = 8"
      ]},
      { type: "example", title: "Find HCF(96, 404)", content: [
        "404 = 96 × 4 + 20",
        "96 = 20 × 4 + 16",
        "20 = 16 × 1 + 4",
        "16 = 4 × 4 + 0",
        "∴ HCF(96, 404) = 4"
      ]}
    ]
  },
  {
    id: "fta",
    title: "Fundamental Theorem of Arithmetic",
    content: [
      { type: "definition", title: "Fundamental Theorem of Arithmetic", content: "Every composite number can be expressed (factorised) as a product of primes, and this factorisation is unique, apart from the order in which the prime factors occur." },
      { type: "text", content: "This theorem has two parts: (1) existence — every number CAN be factored into primes, and (2) uniqueness — there's only ONE way to do it (ignoring order)." },
      { type: "example", title: "Prime Factorisations", content: [
        "36 = 2² × 3²",
        "180 = 2² × 3² × 5",
        "420 = 2² × 3 × 5 × 7"
      ]},
      { type: "formula", title: "Finding HCF & LCM", content: [
        "HCF = Product of smallest powers of common prime factors",
        "LCM = Product of greatest powers of all prime factors",
        "HCF(a,b) × LCM(a,b) = a × b"
      ] },
      { type: "example", title: "HCF and LCM of 12 and 18", content: [
        "12 = 2² × 3¹",
        "18 = 2¹ × 3²",
        "HCF = 2¹ × 3¹ = 6",
        "LCM = 2² × 3² = 36",
        "Check: 6 × 36 = 216 = 12 × 18 ✓"
      ]}
    ]
  },
  {
    id: "irrational",
    title: "Irrational Numbers",
    content: [
      { type: "definition", title: "Irrational Number", content: "A number that cannot be expressed in the form p/q, where p and q are integers and q ≠ 0." },
      { type: "text", content: "Examples of irrational numbers include √2, √3, √5, and π. We can prove these are irrational using proof by contradiction and the Fundamental Theorem of Arithmetic." },
      { type: "proof", title: "Proof: √2 is irrational", content: [
        "Assume √2 is rational, so √2 = p/q where p/q is in lowest terms (HCF(p,q) = 1).",
        "Squaring: 2 = p²/q², so p² = 2q².",
        "This means p² is even, therefore p must be even. Let p = 2k.",
        "Substituting: (2k)² = 2q² → 4k² = 2q² → q² = 2k².",
        "So q² is even, meaning q is also even.",
        "But if both p and q are even, HCF(p,q) ≥ 2, contradicting our assumption!",
        "∴ √2 is irrational. □"
      ]},
      { type: "note", content: "The same method works for proving √3, √5, √7, etc. are irrational. The key insight from FTA: if p² is divisible by a prime, then p is also divisible by that prime." }
    ]
  }
];

const FullTextbookView = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const topic = topics[activeIndex];
  const progress = Math.round((completed.size / topics.length) * 100);

  const markComplete = () => {
    setCompleted(prev => new Set(prev).add(topic.id));
    if (activeIndex < topics.length - 1) setActiveIndex(prev => prev + 1);
  };

  const renderBlock = (block: TopicBlock, i: number) => {
    const lines = Array.isArray(block.content) ? block.content : [block.content];

    switch (block.type) {
      case "definition":
        return (
          <div key={i} className="p-4 rounded-xl bg-primary/5 border-l-4 border-primary space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">{block.title}</p>
            {lines.map((l, j) => <p key={j} className="text-sm leading-relaxed">{l}</p>)}
          </div>
        );
      case "formula":
        return (
          <div key={i} className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">{block.title}</p>
            {lines.map((l, j) => <p key={j} className="font-mono text-sm font-medium">{l}</p>)}
          </div>
        );
      case "example":
        return (
          <div key={i} className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">{block.title}</p>
            {lines.map((l, j) => <p key={j} className="text-sm font-mono">{l}</p>)}
          </div>
        );
      case "steps":
        return (
          <div key={i} className="p-4 rounded-xl bg-muted/50 border space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground/70">{block.title}</p>
            {lines.map((l, j) => <p key={j} className="text-sm">{l}</p>)}
          </div>
        );
      case "proof":
        return (
          <div key={i} className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">{block.title}</p>
            {lines.map((l, j) => <p key={j} className="text-sm">{l}</p>)}
          </div>
        );
      case "note":
        return (
          <div key={i} className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-300">📌 {lines[0]}</p>
          </div>
        );
      default:
        return (
          <div key={i} className="space-y-1">
            {lines.map((l, j) => <p key={j} className="text-sm leading-relaxed">{l}</p>)}
          </div>
        );
    }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-260px)] min-h-[500px]">
      {/* Sidebar */}
      <div className="w-56 shrink-0 border rounded-xl bg-card flex flex-col">
        <div className="p-3 border-b">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chapter 1 Topics</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {topics.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setActiveIndex(i)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  i === activeIndex ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"
                }`}
              >
                {completed.has(t.id) ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="truncate">{t.title}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
        <div className="p-3 border-t space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 border rounded-xl bg-card flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">{topic.title}</h2>
          <span className="text-xs text-muted-foreground">{activeIndex + 1} of {topics.length}</span>
        </div>
        <ScrollArea className="flex-1 p-5">
          <div className="space-y-4 max-w-2xl">
            {topic.content.map((block, i) => renderBlock(block, i))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={activeIndex === 0} onClick={() => setActiveIndex(prev => prev - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          {!completed.has(topic.id) ? (
            <Button size="sm" onClick={markComplete}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Complete & Next
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled={activeIndex === topics.length - 1} onClick={() => setActiveIndex(prev => prev + 1)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FullTextbookView;
