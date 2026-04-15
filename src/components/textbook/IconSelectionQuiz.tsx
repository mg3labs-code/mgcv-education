import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RotateCcw, Trophy } from "lucide-react";

export interface QuizIcon {
  emoji: string;
  label: string;
  isCorrect: boolean;
}

interface IconSelectionQuizProps {
  question: string;
  icons: QuizIcon[];
  onComplete?: (score: number, total: number) => void;
}

const IconSelectionQuiz = ({ question, icons, onComplete }: IconSelectionQuizProps) => {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const correctCount = icons.filter(i => i.isCorrect).length;
  const selectedCorrect = [...selected].filter(i => icons[i].isCorrect).length;
  const selectedWrong = [...selected].filter(i => !icons[i].isCorrect).length;
  const score = Math.max(0, selectedCorrect - selectedWrong);
  const isPerfect = selectedCorrect === correctCount && selectedWrong === 0;

  const toggle = useCallback((idx: number) => {
    if (submitted) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, [submitted]);

  const handleSubmit = () => {
    setSubmitted(true);
    setShowResult(true);
    onComplete?.(score, correctCount);
  };

  const handleRetry = () => {
    setSelected(new Set());
    setSubmitted(false);
    setShowResult(false);
  };

  return (
    <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-5 space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">🎮 Quick Check</p>
        <h3 className="text-base font-bold text-foreground leading-snug">{question}</h3>
        <p className="text-[11px] text-muted-foreground">Tap all correct answers, then check!</p>
      </div>

      {/* Icon grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {icons.map((icon, idx) => {
          const isSelected = selected.has(idx);
          const isCorrectAnswer = icon.isCorrect;

          let ringClass = "border-border hover:border-primary/40";
          let bgClass = "bg-card hover:bg-accent/30";
          let checkIcon = null;

          if (isSelected && !submitted) {
            ringClass = "border-primary ring-2 ring-primary/30";
            bgClass = "bg-primary/10";
          }

          if (submitted) {
            if (isSelected && isCorrectAnswer) {
              ringClass = "border-emerald-500 ring-2 ring-emerald-200";
              bgClass = "bg-emerald-50 dark:bg-emerald-950/40";
              checkIcon = <CheckCircle2 className="h-4 w-4 text-emerald-600 absolute -top-1 -right-1" />;
            } else if (isSelected && !isCorrectAnswer) {
              ringClass = "border-red-400 ring-2 ring-red-200";
              bgClass = "bg-red-50 dark:bg-red-950/40";
              checkIcon = <XCircle className="h-4 w-4 text-red-500 absolute -top-1 -right-1" />;
            } else if (!isSelected && isCorrectAnswer) {
              ringClass = "border-emerald-300 border-dashed";
              bgClass = "bg-emerald-50/50 dark:bg-emerald-950/20";
              checkIcon = <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 absolute -top-1 -right-1" />;
            }
          }

          return (
            <button
              key={idx}
              onClick={() => toggle(idx)}
              disabled={submitted}
              className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${ringClass} ${bgClass} ${submitted ? "cursor-default" : "cursor-pointer active:scale-95"}`}
            >
              {checkIcon}
              <span className="text-2xl">{icon.emoji}</span>
              <span className="text-[10px] font-medium text-foreground/80 leading-tight text-center line-clamp-2">
                {icon.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Result / Actions */}
      {showResult ? (
        <div className="text-center space-y-3">
          {isPerfect ? (
            <div className="flex items-center justify-center gap-2 text-emerald-600">
              <Trophy className="h-5 w-5" />
              <span className="font-bold text-sm">Perfect! All correct! 🎉</span>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {selectedCorrect}/{correctCount} correct
                {selectedWrong > 0 && <span className="text-red-500 ml-1">({selectedWrong} wrong)</span>}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {selectedCorrect >= correctCount / 2 ? "Good effort! Try again for a perfect score." : "Review the steps above and try again!"}
              </p>
            </div>
          )}
          {!isPerfect && (
            <Button size="sm" variant="outline" onClick={handleRetry} className="gap-1.5">
              <RotateCcw className="h-3 w-3" /> Try Again
            </Button>
          )}
        </div>
      ) : (
        <div className="flex justify-center">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={selected.size === 0}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 gap-1.5"
          >
            Check Answers ✓
          </Button>
        </div>
      )}
    </div>
  );
};

export default IconSelectionQuiz;
