import React, { useState, useCallback, useRef } from "react";
import { ReasoningContent } from "@/data/textbookData";
import { AlertCircle, CheckCircle2, Lightbulb, ChevronUp, Send, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { STEP_META } from "./reasoning/stepConfig";
import ThinkFirstGate from "./reasoning/ThinkFirstGate";
import Step1ThinkBox from "./reasoning/Step1ThinkBox";
import CompanionVoiceInput from "@/components/student/CompanionVoiceInput";
import { supabase } from "@/integrations/supabase/client";

const ReasoningBlock = ({
  content,
  topic,
  onComplete,
  onDebugEvent,
}: {
  content: ReasoningContent;
  topic?: string;
  onComplete?: () => void;
  onDebugEvent?: (event: string, details?: Record<string, unknown>) => void;
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [revealedInsights, setRevealedInsights] = useState<Record<number, boolean>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const direction = useRef(1);

  const goToStep = useCallback((next: number) => {
    direction.current = next > activeStep ? 1 : -1;
    setActiveStep(next);
    onDebugEvent?.("reasoning_step_change", { from: activeStep + 1, to: next + 1 });
  }, [activeStep, onDebugEvent]);

  const markStepComplete = useCallback((step: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(step);
      if (next.size >= 4) onComplete?.();
      return next;
    });
    onDebugEvent?.("reasoning_step_complete", { step });
  }, [onComplete, onDebugEvent]);

  const questions = content.whyQuestions || [];

  const toggleInsight = useCallback((idx: number) => {
    setRevealedInsights((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }, []);

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/10 px-4 py-3">
        <p className="text-sm font-bold text-orange-700 dark:text-orange-400 mb-1">🧠 Active Reasoning</p>
        <p className="text-[0.95rem] font-semibold text-foreground leading-snug">{content.centralQuestion}</p>
        <p className="text-[10px] text-muted-foreground mt-1">Follow 4 steps to reason through this</p>
      </div>

      {/* Step Progress - compact pills */}
      <div className="flex gap-1 px-1">
        {STEP_META.map((step, i) => (
          <button
            key={i}
            onClick={() => goToStep(i)}
            className={`flex-1 rounded-full py-1.5 text-[10px] font-bold transition-all ${
              i === activeStep
                ? "bg-primary text-primary-foreground shadow-sm"
                : i < activeStep
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {step.emoji} {step.number}
          </button>
        ))}
      </div>

      {/* Active Step */}
      <AnimatePresence mode="wait" custom={direction.current}>
        <motion.div
          key={activeStep}
          custom={direction.current}
          initial={{ opacity: 0, x: direction.current * 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction.current * -60 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        >
          {(() => {
            const step = STEP_META[activeStep];
            return (
              <div className={`rounded-xl border ${step.borderColor} overflow-hidden`}>
                {/* Step header - compact */}
                <div className={`bg-gradient-to-r ${step.color} px-4 py-3 flex items-center gap-2.5`}>
                  <span className={`${step.badgeColor} h-7 w-7 rounded-full flex items-center justify-center text-sm font-bold`}>
                    {step.number}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground text-sm leading-tight">{step.label}</p>
                    <p className="text-[10px] text-muted-foreground">{step.description}</p>
                  </div>
                  <span className="ml-auto text-xl">{step.emoji}</span>
                </div>

                {/* Step content */}
                <div className="p-4">
                  {activeStep === 0 ? (
                    <Step1ThinkBox
                      centralQuestion={content.centralQuestion}
                      topic={topic}
                      onComplete={() => markStepComplete(1)}
                      onDebugEvent={onDebugEvent}
                    />
                  ) : (
                    <StepContent
                      question={questions[activeStep - 1]}
                      stepIdx={activeStep}
                      topic={topic}
                      revealed={!!revealedInsights[activeStep - 1]}
                      onToggleInsight={() => toggleInsight(activeStep - 1)}
                      onComplete={() => markStepComplete(activeStep + 1)}
                      onDebugEvent={onDebugEvent}
                    />
                  )}
                </div>

                {/* Nav */}
                <div className="px-4 pb-3 flex justify-between items-center">
                  <Button variant="ghost" size="sm" disabled={activeStep === 0} onClick={() => goToStep(activeStep - 1)}>
                    ← Back
                  </Button>
                  {activeStep < 3 ? (
                    <Button size="sm" onClick={() => goToStep(activeStep + 1)}>
                      Next →
                    </Button>
                  ) : (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">✅ Complete!</span>
                  )}
                </div>
              </div>
            );
          })()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ── Step 2-4 Content (with voice/text input, same pattern as Step 1) ── */
const StepContent = ({
  question,
  stepIdx,
  topic,
  revealed,
  onToggleInsight,
  onComplete,
  onDebugEvent,
}: {
  question?: { question: string; hint?: string; deeperInsight?: string };
  stepIdx: number;
  topic?: string;
  revealed: boolean;
  onToggleInsight: () => void;
  onComplete?: () => void;
  onDebugEvent?: (event: string, details?: Record<string, unknown>) => void;
}) => {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (answer.trim().length < 5 || loading || !question) return;
    setLoading(true);
    setError(null);
    onDebugEvent?.("reasoning_submit_start", { step: stepIdx + 1, prompt: question.question, answerLength: answer.trim().length });
    try {
      const { data, error: evalError } = await supabase.functions.invoke("inline-evaluate", {
        body: { topic: topic || "Reasoning", prompt: question.question, answer },
      });
      if (evalError) throw evalError;
      const nextFeedback = data?.feedback || "Good effort. Add one example or cause-and-effect link to make it stronger.";
      setFeedback(nextFeedback);
      setSubmitted(true);
      onComplete?.();
      onDebugEvent?.("reasoning_submit_success", { step: stepIdx + 1, feedbackLength: nextFeedback.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Evaluation failed";
      setError(message);
      onDebugEvent?.("reasoning_submit_error", { step: stepIdx + 1, message });
    } finally {
      setLoading(false);
    }
  };

  if (!question) {
    return (
      <div className="rounded-lg bg-muted/30 p-5 text-center">
        <p className="text-sm text-muted-foreground">
          {stepIdx === 3 ? "Think about how all the pieces connect." : "Explore the previous steps first."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Question - clean card */}
      <div className="rounded-lg bg-card border border-border p-3">
        <p className="text-[0.95rem] font-medium text-foreground leading-relaxed">{question.question}</p>
      </div>

      {/* Hint */}
      {question.hint && (
        <div className="rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">💡 Hint</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{question.hint}</p>
        </div>
      )}

      {/* Student answer input (same pattern as Step1ThinkBox) */}
      {!submitted ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">✍️ Write or speak your thinking:</p>
          <div className="relative">
            <Textarea
              value={answer}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAnswer(e.target.value)}
              placeholder="What do you think and why?"
              className="min-h-[70px] pr-12 text-sm resize-none"
            />
            <div className="absolute right-2 bottom-2">
              <CompanionVoiceInput
                onTranscript={(text: string) => setAnswer((prev) => (prev ? prev + " " + text : text))}
                disabled={false}
              />
            </div>
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>Evaluation did not run: {error}</span>
            </div>
          )}
          <Button size="sm" onClick={handleSubmit} disabled={answer.trim().length < 5 || loading} className="w-full">
            {loading ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-2" />}
            {loading ? "Evaluating..." : "Submit and evaluate"}
          </Button>
        </div>
      ) : (
        <div className="rounded-lg bg-card border border-primary/30 p-3 space-y-3">
          <div>
            <p className="text-xs font-bold text-primary mb-0.5">Your thinking:</p>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{answer}</p>
          </div>
          {feedback && (
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
              <div className="flex items-center gap-2 text-primary mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <p className="text-xs font-bold">AI feedback</p>
              </div>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{feedback}</p>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => { setSubmitted(false); setFeedback(null); }}>
            <RotateCcw className="h-3 w-3 mr-1" /> Improve answer
          </Button>
        </div>
      )}

      {/* Insight reveal — only after submitting */}
      {submitted && (
        revealed ? (
          <div className="rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border-2 border-emerald-300 dark:border-emerald-700 p-3 animate-fade-in">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">Aha! The insight:</p>
                <p className="text-sm text-foreground leading-relaxed">{question.deeperInsight}</p>
              </div>
            </div>
            <button onClick={onToggleInsight} className="text-xs text-muted-foreground hover:text-foreground mt-2 flex items-center gap-1">
              <ChevronUp className="h-3 w-3" /> Hide
            </button>
          </div>
        ) : (
          <ThinkFirstGate onReveal={onToggleInsight} />
        )
      )}
    </div>
  );
};

export default ReasoningBlock;
