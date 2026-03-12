import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Layers, ArrowRight, Check, Loader2, ThumbsUp, ThumbsDown, Trophy, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface FirstPrinciplesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: string;
  episodeTitle: string;
  subject?: string;
  chapterId?: string;
  episodeId?: string;
}

const STEPS = [
  { id: "strip", label: "Break It Down", emoji: "🧹", instruction: "What are the BASIC building blocks of this concept? Like, if you had to explain it to a 5-year-old, what simple truths would you start with?" },
  { id: "question", label: "Question Everything", emoji: "❓", instruction: "Now challenge each building block — WHY is it true? How do you KNOW? Could it be wrong? Play detective! 🕵️" },
  { id: "rebuild", label: "Rebuild It", emoji: "🏗️", instruction: "Now put it all back together! Explain the concept using ONLY the basic truths you found. Make it simpler and clearer than any textbook." },
];

const ENCOURAGEMENTS = [
  "You're thinking like a scientist! 🔬",
  "That's real understanding building up! 💪",
  "Your rebuilt understanding is YOUR knowledge now! 🏆",
];

const FirstPrinciplesModal = ({ open, onOpenChange, topic, episodeTitle, subject, chapterId, episodeId }: FirstPrinciplesModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [confidenceChecks, setConfidenceChecks] = useState<Record<number, boolean | null>>({});
  const [completed, setCompleted] = useState(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (open) startTime.current = Date.now();
  }, [open]);

  const getFeedback = async (stepIndex: number) => {
    if (!answers[stepIndex]?.trim()) return;
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("first-principles", {
        body: {
          topic,
          episodeTitle,
          subject: subject || "General",
          step: STEPS[stepIndex].id,
          studentAnswer: answers[stepIndex],
          previousAnswers: Object.entries(answers).filter(([k]) => Number(k) < stepIndex).map(([, v]) => v),
        },
      });
      if (res.error) throw res.error;
      setFeedback(prev => ({ ...prev, [stepIndex]: res.data?.feedback || "Good thinking! Now move to the next step. 💪" }));
    } catch {
      setFeedback(prev => ({ ...prev, [stepIndex]: "Good effort! Keep digging deeper into the fundamentals. 💪" }));
    }
    setLoading(false);
  };

  const trackSession = async () => {
    if (!user) return;
    try {
      await supabase.from("method_sessions").insert({
        user_id: user.id,
        method_type: "first_principles",
        chapter_id: chapterId || null,
        episode_id: episodeId || null,
        duration_seconds: Math.round((Date.now() - startTime.current) / 1000),
        completed: true,
        score: Object.values(confidenceChecks).filter(v => v === true).length * 33,
      });
    } catch (e) {
      console.error("Failed to track session:", e);
    }
  };

  const handleComplete = async () => {
    setCompleted(true);
    await trackSession();
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep(0);
    setAnswers({});
    setFeedback({});
    setConfidenceChecks({});
    setCompleted(false);
  };

  const currentStep = STEPS[step];
  const progressPct = ((step + (feedback[step] ? 1 : 0)) / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            First Principles Thinking
          </DialogTitle>
          <DialogDescription>
            Deconstruct <span className="font-medium text-foreground">{topic}</span> like Feynman would.
          </DialogDescription>
        </DialogHeader>

        {completed ? (
          <div className="flex flex-col items-center py-6 gap-4">
            <Trophy className="h-12 w-12 text-amber-500" />
            <p className="text-lg font-semibold text-foreground">You rebuilt this concept! 🎉</p>
            <div className="w-full rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-3">
              <p className="text-xs font-semibold text-primary">Your Rebuilt Understanding:</p>
              <p className="text-sm text-foreground italic">"{answers[2] || answers[1] || answers[0]}"</p>
              <div className="flex items-center gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex items-center gap-1 text-xs">
                    {confidenceChecks[i] === true ? (
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ) : (
                      <Star className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
                <span className="text-xs text-muted-foreground ml-1">
                  {Object.values(confidenceChecks).filter(v => v === true).length}/3 steps felt clear
                </span>
              </div>
            </div>
            <Button onClick={handleClose} className="w-full">Done</Button>
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="flex items-center gap-2 py-1">
              <Progress value={progressPct} className="h-2 flex-1" />
              <span className="text-xs text-muted-foreground">{step + 1}/3</span>
            </div>

            {/* Step Progress Dots */}
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${
                    i < step ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                    i === step ? "bg-primary text-primary-foreground" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {i < step ? <Check className="h-4 w-4" /> : s.emoji}
                  </div>
                  {i < STEPS.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>

            {/* Current Step */}
            <div className="space-y-4">
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                <p className="text-xs font-semibold text-primary mb-1">Step {step + 1}: {currentStep.label}</p>
                <p className="text-sm text-foreground">{currentStep.instruction}</p>
              </div>

              <textarea
                className="w-full rounded-xl border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[120px]"
                placeholder={`Your ${currentStep.label.toLowerCase()} for "${topic}"...`}
                value={answers[step] || ""}
                onChange={(e) => setAnswers({ ...answers, [step]: e.target.value })}
              />

              {feedback[step] && (
                <div className="space-y-3">
                  <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3">
                    <p className="text-sm text-green-800 dark:text-green-300">{feedback[step]}</p>
                  </div>

                  {/* Micro encouragement */}
                  <p className="text-xs text-center text-primary font-medium">{ENCOURAGEMENTS[step]}</p>

                  {/* Confidence check */}
                  {confidenceChecks[step] === null || confidenceChecks[step] === undefined ? (
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-xs text-muted-foreground">Did this feel clear?</span>
                      <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setConfidenceChecks(prev => ({ ...prev, [step]: true }))}>
                        <ThumbsUp className="h-3.5 w-3.5 text-green-600" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setConfidenceChecks(prev => ({ ...prev, [step]: false }))}>
                        <ThumbsDown className="h-3.5 w-3.5 text-orange-500" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-center text-muted-foreground">
                      {confidenceChecks[step] ? "✅ Feeling clear!" : "🔄 That's okay — understanding builds over time!"}
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-between">
                {!feedback[step] ? (
                  <Button
                    size="sm"
                    onClick={() => getFeedback(step)}
                    disabled={loading || !answers[step]?.trim()}
                  >
                    {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                    Get Feedback
                  </Button>
                ) : step < STEPS.length - 1 ? (
                  <Button size="sm" onClick={() => setStep(step + 1)}>
                    Next Step <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleComplete}>
                    <Trophy className="h-4 w-4 mr-1" /> Complete
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FirstPrinciplesModal;
