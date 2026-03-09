import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Layers, ArrowRight, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FirstPrinciplesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: string;
  episodeTitle: string;
}

const STEPS = [
  { id: "strip", label: "Strip It Down", emoji: "🧹", instruction: "Break this concept down to its most basic parts. What are the fundamental truths that cannot be simplified further?" },
  { id: "question", label: "Question Everything", emoji: "❓", instruction: "For each fundamental part, ask: WHY is this true? What evidence do we have? Could it be wrong?" },
  { id: "rebuild", label: "Rebuild From Scratch", emoji: "🏗️", instruction: "Now rebuild your understanding from the ground up. Explain the concept using ONLY the fundamentals you identified." },
];

const FirstPrinciplesModal = ({ open, onOpenChange, topic, episodeTitle }: FirstPrinciplesModalProps) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  const getFeedback = async (stepIndex: number) => {
    if (!answers[stepIndex]?.trim()) return;
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("first-principles", {
        body: {
          topic,
          episodeTitle,
          step: STEPS[stepIndex].id,
          studentAnswer: answers[stepIndex],
          previousAnswers: Object.entries(answers).filter(([k]) => Number(k) < stepIndex).map(([, v]) => v),
        },
      });
      setFeedback({ ...feedback, [stepIndex]: res.data?.feedback || "Good thinking! Now move to the next step." });
    } catch {
      setFeedback({ ...feedback, [stepIndex]: "Good effort! Keep digging deeper into the fundamentals." });
    }
    setLoading(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep(0);
    setAnswers({});
    setFeedback({});
  };

  const currentStep = STEPS[step];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            First Principles Thinking
          </DialogTitle>
          <DialogDescription>
            Deconstruct <span className="font-medium text-foreground">{topic}</span> to its fundamentals, then rebuild your understanding.
          </DialogDescription>
        </DialogHeader>

        {/* Step Progress */}
        <div className="flex items-center gap-2 py-2">
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
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3">
              <p className="text-sm text-green-800 dark:text-green-300">{feedback[step]}</p>
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
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleClose}>
                <Check className="h-4 w-4 mr-1" /> Complete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FirstPrinciplesModal;
