import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Lightbulb, Search, MessageSquare, ClipboardCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type BlockType = "concept" | "pattern" | "recall" | "explain" | "assessment";

interface Block {
  type: BlockType;
  title: string;
  icon: React.ElementType;
  duration: string;
}

const blocks: Block[] = [
  { type: "concept", title: "Concept Block", icon: Lightbulb, duration: "2 min" },
  { type: "pattern", title: "Pattern Recognition", icon: Search, duration: "1.5 min" },
  { type: "recall", title: "Active Recall", icon: ClipboardCheck, duration: "1.5 min" },
  { type: "explain", title: "Explain-Back", icon: MessageSquare, duration: "1.5 min" },
  { type: "assessment", title: "Quick Validation", icon: CheckCircle2, duration: "1.5 min" },
];

const ConceptBlock = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="rounded-lg bg-muted p-5 border-l-4 border-accent">
      <p className="text-sm font-medium text-accent-foreground mb-1">Purpose</p>
      <p className="text-sm text-muted-foreground">Understand the fundamental structure of polynomials and identify their components — terms, coefficients, degree.</p>
    </div>
    <div className="space-y-4">
      <h3 className="text-xl font-bold font-serif text-foreground">What is a Polynomial?</h3>
      <p className="text-foreground/80 leading-relaxed">
        A <strong>polynomial</strong> is an algebraic expression consisting of variables and coefficients, combined using addition, subtraction, and multiplication. The variable has only non-negative integer exponents.
      </p>
      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <p className="text-sm font-semibold text-foreground">Standard Form:</p>
        <p className="text-center text-lg font-mono text-foreground py-2">
          p(x) = aₙxⁿ + aₙ₋₁xⁿ⁻¹ + ... + a₁x + a₀
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-muted rounded p-3">
            <span className="font-medium text-foreground">Degree:</span>
            <span className="text-muted-foreground ml-1">Highest power of x</span>
          </div>
          <div className="bg-muted rounded p-3">
            <span className="font-medium text-foreground">Coefficient:</span>
            <span className="text-muted-foreground ml-1">Numerical factor of each term</span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Key Examples:</p>
        <ul className="space-y-1.5 text-sm text-foreground/80">
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" /> 3x² + 2x − 5 → Degree 2 (Quadratic)</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" /> x³ − 1 → Degree 3 (Cubic)</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" /> 7 → Degree 0 (Constant)</li>
        </ul>
      </div>
    </div>
  </div>
);

const PatternBlock = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const options = [
    { text: "x⁻¹ + 3", isPolynomial: false },
    { text: "4x³ − x + 2", isPolynomial: true },
    { text: "√x + 1", isPolynomial: false },
    { text: "5x² + 3x − 7", isPolynomial: true },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-lg bg-muted p-5 border-l-4 border-info">
        <p className="text-sm text-muted-foreground">Identify which expressions are polynomials. Look for the pattern — what makes an expression qualify?</p>
      </div>
      <h3 className="text-lg font-bold font-serif text-foreground">Which are polynomials?</h3>
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`p-4 rounded-lg border text-left transition-all ${
              selected === i
                ? opt.isPolynomial
                  ? "border-success bg-success/5"
                  : "border-destructive bg-destructive/5"
                : "border-border bg-card hover:border-accent"
            }`}
          >
            <p className="font-mono text-foreground">{opt.text}</p>
            {selected === i && (
              <p className={`text-xs mt-2 ${opt.isPolynomial ? "text-success" : "text-destructive"}`}>
                {opt.isPolynomial ? "✓ Correct — All exponents are non-negative integers" : "✗ Not a polynomial — Contains negative or fractional exponent"}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

const RecallBlock = () => {
  const [revealed, setRevealed] = useState<boolean[]>([false, false, false]);
  const questions = [
    { q: "What defines the degree of a polynomial?", a: "The highest power (exponent) of the variable in the polynomial." },
    { q: "Can a polynomial have negative exponents?", a: "No. All exponents in a polynomial must be non-negative integers." },
    { q: "What is a constant polynomial?", a: "A polynomial of degree 0, e.g., p(x) = 7." },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-lg bg-muted p-5 border-l-4 border-metric-pattern">
        <p className="text-sm text-muted-foreground">Answer each question from memory before revealing the answer. This strengthens recall pathways.</p>
      </div>
      <div className="space-y-3">
        {questions.map((item, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-5">
            <p className="font-medium text-foreground text-sm mb-3">{item.q}</p>
            {revealed[i] ? (
              <p className="text-sm text-success bg-success/5 rounded p-3">{item.a}</p>
            ) : (
              <button
                onClick={() => setRevealed(prev => { const n = [...prev]; n[i] = true; return n; })}
                className="text-sm text-accent hover:underline"
              >
                Reveal Answer
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ExplainBlock = () => {
  const [text, setText] = useState("");
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-lg bg-muted p-5 border-l-4 border-metric-conceptual-clarity">
        <p className="text-sm text-muted-foreground">Explain the concept of polynomials in your own words. Writing strengthens understanding.</p>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">
          Explain: What is a polynomial and what are its key properties?
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Write your explanation here..."
          className="w-full rounded-lg border border-input bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-muted-foreground">{text.split(/\s+/).filter(Boolean).length} words</p>
          <p className="text-xs text-muted-foreground">Aim for 30–50 words</p>
        </div>
      </div>
    </div>
  );
};

const AssessmentBlock = () => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const questions = [
    { q: "What is the degree of 4x³ + 2x − 1?", options: ["1", "2", "3", "4"], correct: 2 },
    { q: "Which is NOT a polynomial?", options: ["x² + 1", "3x + 5", "x⁻² + x", "0"], correct: 2 },
    { q: "The coefficient of x in 5x² − 3x + 7 is:", options: ["5", "−3", "7", "2"], correct: 1 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-lg bg-muted p-5 border-l-4 border-accent">
        <p className="text-sm text-muted-foreground">Quick validation — 3 questions to confirm understanding.</p>
      </div>
      <div className="space-y-5">
        {questions.map((item, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-5">
            <p className="font-medium text-foreground text-sm mb-3">{i + 1}. {item.q}</p>
            <div className="grid grid-cols-2 gap-2">
              {item.options.map((opt, j) => (
                <button
                  key={j}
                  onClick={() => setAnswers(prev => ({ ...prev, [i]: j }))}
                  className={`p-3 rounded-md border text-sm text-left transition-all ${
                    answers[i] === j
                      ? j === item.correct
                        ? "border-success bg-success/5 text-foreground"
                        : "border-destructive bg-destructive/5 text-foreground"
                      : "border-border hover:border-accent text-foreground"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {answers[i] !== undefined && answers[i] !== item.correct && (
              <p className="text-xs text-destructive mt-2">The correct answer is: {item.options[item.correct]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const blockComponents: Record<BlockType, React.FC> = {
  concept: ConceptBlock,
  pattern: PatternBlock,
  recall: RecallBlock,
  explain: ExplainBlock,
  assessment: AssessmentBlock,
};

const LearningEpisode = () => {
  const navigate = useNavigate();
  const [currentBlock, setCurrentBlock] = useState(0);
  const block = blocks[currentBlock];
  const BlockContent = blockComponents[block.type];

  return (
    <PageLayout role="student">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate("/student")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        <div className="mb-6">
          <p className="text-xs text-accent font-semibold uppercase tracking-wider mb-1">Episode 3 of 6</p>
          <h1 className="text-2xl font-bold font-serif text-foreground">Polynomials — Structure</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> ~7 minutes · Chapter 2: Polynomials
          </p>
        </div>

        {/* Block navigation */}
        <div className="flex items-center gap-1 mb-8">
          {blocks.map((b, i) => (
            <button
              key={i}
              onClick={() => setCurrentBlock(i)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-xs font-medium transition-all ${
                i === currentBlock
                  ? "bg-primary text-primary-foreground"
                  : i < currentBlock
                  ? "bg-success/10 text-success"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {i < currentBlock ? <CheckCircle2 className="h-3 w-3" /> : <b.icon className="h-3 w-3" />}
              <span className="hidden sm:inline">{b.title}</span>
            </button>
          ))}
        </div>

        {/* Block content */}
        <div className="min-h-[400px]">
          <BlockContent />
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={() => setCurrentBlock(Math.max(0, currentBlock - 1))}
            disabled={currentBlock === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Previous
          </Button>

          {currentBlock < blocks.length - 1 ? (
            <Button onClick={() => setCurrentBlock(currentBlock + 1)}>
              Next Block <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={() => navigate("/student")} className="bg-success hover:bg-success/90 text-success-foreground">
              <Sparkles className="h-4 w-4 mr-2" /> Complete Episode
            </Button>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default LearningEpisode;
