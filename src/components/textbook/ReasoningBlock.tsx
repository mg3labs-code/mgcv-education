import { useState, useEffect, useCallback, useRef } from "react";
import { ReasoningContent } from "@/data/textbookData";
import { Eye, Lightbulb, ChevronDown, ChevronUp, Loader2, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import CompanionVoiceInput from "@/components/student/CompanionVoiceInput";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

/* ───── Step-level AI illustration (cached) ───── */
const ILLUSTRATION_CACHE: Record<string, string> = {};

const StepIllustration = ({ prompt, stepLabel }: { prompt: string; stepLabel: string }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cacheKey = `reason_ill_${prompt.slice(0, 60).replace(/\s+/g, "_").toLowerCase()}`;

  useEffect(() => {
    // Check memory cache first, then localStorage
    if (ILLUSTRATION_CACHE[cacheKey]) {
      setUrl(ILLUSTRATION_CACHE[cacheKey]);
      return;
    }
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const { u, ts } = JSON.parse(raw);
        if (Date.now() - ts < 30 * 24 * 60 * 60 * 1000) {
          ILLUSTRATION_CACHE[cacheKey] = u;
          setUrl(u);
          return;
        }
      }
    } catch { /* ignore */ }

    // Generate illustration
    setLoading(true);
    supabase.functions
      .invoke("resolve-visual-aid", {
        body: {
          searchTerms: `educational diagram: ${stepLabel} - ${prompt}`,
          caption: prompt,
          alt: `${stepLabel} illustration`,
        },
      })
      .then(({ data }) => {
        const resolved = data?.url;
        if (resolved) {
          ILLUSTRATION_CACHE[cacheKey] = resolved;
          try { localStorage.setItem(cacheKey, JSON.stringify({ u: resolved, ts: Date.now() })); } catch { /* ignore */ }
          setUrl(resolved);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cacheKey, prompt, stepLabel]);

  if (loading) {
    return (
      <div className="w-full h-32 rounded-xl bg-muted/50 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!url) return null;

  return (
    <img
      src={url}
      alt={`${stepLabel} illustration`}
      className="w-full h-auto max-h-[400px] object-contain rounded-xl border border-border/50"
      loading="lazy"
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
};

/* ───── Think-First Gate Component ───── */
const ThinkFirstGate = ({ onReveal }: { onReveal: () => void }) => {
  const [countdown, setCountdown] = useState(10);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [started, countdown]);

  if (!started) {
    return (
      <div className="rounded-xl border-2 border-dashed border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/10 p-4 text-center">
        <p className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-2">🧠 Think about this for a moment first...</p>
        <p className="text-xs text-muted-foreground mb-3">The best learning happens when you struggle a bit before seeing the answer.</p>
        <Button variant="outline" size="sm" onClick={() => setStarted(true)} className="border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400">
          I'm thinking... Start timer ⏱️
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onReveal}
      disabled={countdown > 0}
      className={`w-full border-dashed transition-all ${countdown > 0 ? "opacity-60" : "border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"}`}
    >
      <Eye className="h-3.5 w-3.5 mr-2" />
      {countdown > 0
        ? `Keep thinking... ${countdown}s ⏱️`
        : "I've thought about it — reveal the insight! 👀"
      }
      <ChevronDown className="h-3.5 w-3.5 ml-2" />
    </Button>
  );
};

/* ───── Step config ───── */
const STEP_META = [
  {
    number: 1,
    label: "Understand the Problem",
    emoji: "🔍",
    color: "from-sky-100 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/30",
    borderColor: "border-sky-300 dark:border-sky-700",
    badgeColor: "bg-sky-500 text-white",
    description: "What exactly are we trying to figure out?",
  },
  {
    number: 2,
    label: "Break It Into Parts",
    emoji: "🧩",
    color: "from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20",
    borderColor: "border-amber-300 dark:border-amber-700",
    badgeColor: "bg-amber-500 text-white",
    description: "Let's look at each piece separately.",
  },
  {
    number: 3,
    label: "Explore Possibilities",
    emoji: "💡",
    color: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20",
    borderColor: "border-emerald-300 dark:border-emerald-700",
    badgeColor: "bg-emerald-500 text-white",
    description: "What could be happening and why?",
  },
  {
    number: 4,
    label: "Logical Conclusion",
    emoji: "✅",
    color: "from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20",
    borderColor: "border-violet-300 dark:border-violet-700",
    badgeColor: "bg-violet-500 text-white",
    description: "So the answer is...",
  },
];

/* ───── Main Component ───── */
const ReasoningBlock = ({ content }: { content: ReasoningContent }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [revealedInsights, setRevealedInsights] = useState<Record<number, boolean>>({});
  const prevStep = useRef(0);
  const direction = useRef(1);

  const goToStep = useCallback((next: number) => {
    direction.current = next > activeStep ? 1 : -1;
    prevStep.current = activeStep;
    setActiveStep(next);
  }, [activeStep]);

  // Map whyQuestions to 4 steps:
  // Step 0 = central question, Steps 1-3 = whyQuestions (or fewer)
  const questions = content.whyQuestions || [];

  const toggleInsight = useCallback((idx: number) => {
    setRevealedInsights((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl overflow-hidden border-2 border-primary/20 shadow-sm">
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 px-5 py-3 border-b border-orange-200 dark:border-orange-800">
          <p className="text-sm font-bold text-orange-700 dark:text-orange-400 flex items-center gap-2">
            🧠 Active Reasoning: Steps
          </p>
        </div>
        <div className="px-5 py-4 bg-gradient-to-br from-orange-50/30 to-amber-50/20 dark:from-orange-950/10 dark:to-amber-950/10">
          <p className="text-base font-bold text-foreground text-center leading-relaxed">
            {content.centralQuestion}
          </p>
          <p className="text-xs text-muted-foreground mt-2 text-center italic">
            Follow the 4 steps below to reason through this!
          </p>
        </div>
      </div>

      {/* Step Progress Bar */}
      <div className="flex items-center gap-1 px-2">
        {STEP_META.map((step, i) => (
          <button
            key={i}
            onClick={() => goToStep(i)}
            className="flex-1 flex flex-col items-center gap-0.5 group"
          >
            <div
              className={`w-full h-2 rounded-full transition-all ${
                i <= activeStep
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            />
            <span className={`text-[10px] font-medium transition-colors ${
              i === activeStep ? "text-primary" : "text-muted-foreground"
            }`}>
              {step.number}
            </span>
          </button>
        ))}
      </div>

      {/* Active Step Card */}
      <AnimatePresence mode="wait" custom={direction.current}>
        {STEP_META.map((step, stepIdx) => {
          if (stepIdx !== activeStep) return null;

          return (
            <motion.div
              key={stepIdx}
              custom={direction.current}
              initial={{ opacity: 0, x: direction.current * 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction.current * -80 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`rounded-2xl border-2 ${step.borderColor} overflow-hidden shadow-md`}
            >
            {/* Step header */}
            <div className={`bg-gradient-to-r ${step.color} px-5 py-4 flex items-center gap-3`}>
              <span className={`${step.badgeColor} h-9 w-9 rounded-full flex items-center justify-center text-lg font-bold shadow-sm`}>
                {step.number}
              </span>
              <div>
                <p className="font-bold text-foreground text-sm">{step.label}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              <span className="ml-auto text-2xl">{step.emoji}</span>
            </div>

            {/* Step content */}
            <div className="p-5 space-y-4">
              {stepIdx === 0 ? (
              /* Step 1: Understand the Problem */
                <Step1ThinkBox
                  centralQuestion={content.centralQuestion}
                  onSubmit={() => goToStep(1)}
                />
              ) : (
                /* Steps 2-4: Map to whyQuestions */
                (() => {
                  const qIdx = stepIdx - 1;
                  const q = questions[qIdx];
                  if (!q) {
                    return (
                      <div className="rounded-xl bg-muted/30 p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                          {stepIdx === 3
                            ? "Now you have the full picture! Think about how all the pieces connect."
                            : "Explore the previous steps to build understanding."}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      <StepIllustration
                        prompt={q.question}
                        stepLabel={step.label.toLowerCase()}
                      />

                      {/* Question */}
                      <div className="rounded-xl bg-card border border-border p-4">
                        <p className="text-[0.95rem] font-medium text-foreground leading-relaxed">
                          {q.question}
                        </p>
                      </div>

                      {/* Hint */}
                      {q.hint && (
                        <div className="rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4">
                          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">💡 Hint</p>
                          <p className="text-sm text-foreground/80">{q.hint}</p>
                        </div>
                      )}

                      {/* Think-first gate + Reveal deeper insight */}
                      {revealedInsights[qIdx] ? (
                        <div className="rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border-2 border-emerald-300 dark:border-emerald-700 p-4 animate-fade-in">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">Aha! Here's the insight:</p>
                              <p className="text-[0.95rem] text-foreground leading-relaxed">{q.deeperInsight}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleInsight(qIdx)}
                            className="text-xs text-muted-foreground hover:text-foreground mt-2 flex items-center gap-1"
                          >
                            <ChevronUp className="h-3 w-3" /> Hide
                          </button>
                        </div>
                      ) : (
                        <ThinkFirstGate onReveal={() => toggleInsight(qIdx)} />
                      )}
                    </div>
                  );
                })()
              )}
            </div>

            {/* Navigation within card */}
            <div className="px-5 pb-4 flex justify-between">
              <Button
                variant="ghost"
                size="sm"
                disabled={stepIdx === 0}
                onClick={() => goToStep(stepIdx - 1)}
              >
                ← Previous
              </Button>
              {stepIdx < 3 ? (
                <Button
                  size="sm"
                  onClick={() => goToStep(stepIdx + 1)}
                >
                  Next Step →
                </Button>
              ) : (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  ✅ Reasoning Complete!
                </span>
              )}
            </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ReasoningBlock;
