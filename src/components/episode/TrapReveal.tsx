import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, RotateCcw, Sparkles, Eye } from "lucide-react";

/**
 * Reusable feedback card shown after a Detective / MCQ / drag-drop answer.
 *
 * On wrong → "🎣 You almost fell for it!" + the trap explanation + Try Again + See Why.
 * On right → calm celebration + the same explanation + Continue.
 *
 * Used by Day1Spark, Day2Build, Day3Master so every wrong answer feels safe to retry.
 */

interface Props {
  isCorrect: boolean;
  explain: string;
  /** Optional shortened "trap" hint shown above the explain text on wrong answers. */
  trapHint?: string;
  /** Called when user wants to redo the question (only shown on wrong). */
  onRetry?: () => void;
  /** Called when user is ready to move on. */
  onContinue: () => void;
  continueLabel?: string;
  /** Optional extra action node (e.g. extra reading link). */
  extra?: ReactNode;
  disabled?: boolean;
}

const TrapReveal = ({
  isCorrect,
  explain,
  trapHint,
  onRetry,
  onContinue,
  continueLabel = "Continue",
  extra,
  disabled,
}: Props) => {
  if (isCorrect) {
    return (
      <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 p-5 space-y-3 animate-[scale-in_0.3s_ease-out]">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
          <Sparkles className="h-4 w-4" />
          <span>Sharp thinking!</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{explain}</p>
        {extra}
        <Button onClick={onContinue} className="w-full gap-1" disabled={disabled}>
          {continueLabel} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-orange-400 bg-orange-50/70 dark:bg-orange-950/30 p-5 space-y-3 animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-bold">
        <span className="text-xl leading-none">🎣</span>
        <span>You almost fell for it!</span>
      </div>
      {trapHint && (
        <p className="text-sm text-orange-800/90 dark:text-orange-300/90 italic">
          The trap: {trapHint}
        </p>
      )}
      <div className="flex items-start gap-2 rounded-xl bg-card/70 border border-border p-3">
        <Eye className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-foreground leading-relaxed">{explain}</p>
      </div>
      {extra}
      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="flex-1 gap-1" disabled={disabled}>
            <RotateCcw className="h-4 w-4" /> Try again
          </Button>
        )}
        <Button onClick={onContinue} className="flex-1 gap-1" disabled={disabled}>
          {continueLabel} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default TrapReveal;
