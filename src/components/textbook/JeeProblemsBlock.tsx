import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, Clock, RotateCcw } from "lucide-react";
import type { JeeProblemsContent } from "@/data/textbookData";

interface Props {
  content: JeeProblemsContent;
  onComplete?: () => void;
}

const JeeProblemsBlock = ({ content, onComplete }: Props) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [negScore, setNegScore] = useState(0);
  const [answered, setAnswered] = useState<Set<number>>(new Set());
  const [timer, setTimer] = useState(content.timePerQuestion || 60);
  const [timerActive, setTimerActive] = useState(true);

  const q = content.questions[currentQ];
  const totalQ = content.questions.length;

  // Timer countdown
  useEffect(() => {
    if (!timerActive || revealed) return;
    if (timer <= 0) {
      handleReveal();
      return;
    }
    const id = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer, timerActive, revealed]);

  // Reset timer on question change
  useEffect(() => {
    setTimer(content.timePerQuestion || 60);
    setSelected(null);
    setRevealed(false);
    setTimerActive(true);
  }, [currentQ]);

  const handleReveal = useCallback(() => {
    setRevealed(true);
    setTimerActive(false);
    if (selected === q.correctIndex) {
      setScore(s => s + 4);
    } else if (selected !== null) {
      setNegScore(s => s + (q.negativeMarking ?? 1));
    }
    setAnswered(prev => new Set(prev).add(currentQ));
  }, [selected, q, currentQ]);

  const handleNext = () => {
    if (currentQ < totalQ - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      onComplete?.();
    }
  };

  const handleReset = () => {
    setCurrentQ(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setNegScore(0);
    setAnswered(new Set());
    setTimer(content.timePerQuestion || 60);
    setTimerActive(true);
  };

  const isCorrect = selected === q.correctIndex;
  const netScore = score - negScore;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
            ⚡ JEE Level
          </span>
          <span className="text-xs text-muted-foreground">
            Q{currentQ + 1}/{totalQ}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground">
            Score: <span className="text-emerald-600 font-bold">+{score}</span> / <span className="text-red-500 font-bold">-{negScore}</span> = <span className="font-bold text-foreground">{netScore}</span>
          </span>
          <div className={`flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-full ${timer <= 10 ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 animate-pulse" : "bg-muted text-muted-foreground"}`}>
            <Clock className="h-3 w-3" />
            {timer}s
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-5">
        <p className="text-base font-medium text-foreground leading-relaxed">{q.question}</p>
        {q.previousYear && (
          <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400">
            📋 {q.previousYear}
          </span>
        )}
      </div>

      {/* Options */}
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const isAnswer = i === q.correctIndex;
          let borderClass = "border-border hover:border-primary/50";
          if (revealed) {
            if (isAnswer) borderClass = "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20";
            else if (isSelected) borderClass = "border-red-500 bg-red-50/60 dark:bg-red-950/20";
          } else if (isSelected) {
            borderClass = "border-amber-500 bg-amber-50/40 dark:bg-amber-950/20";
          }

          return (
            <button
              key={i}
              onClick={() => !revealed && setSelected(i)}
              disabled={revealed}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${borderClass} ${!revealed ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className="flex items-center gap-3">
                <span className="h-7 w-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 border-current">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm text-foreground">{opt}</span>
                {revealed && isAnswer && <CheckCircle2 className="h-4 w-4 text-emerald-600 ml-auto" />}
                {revealed && isSelected && !isAnswer && <XCircle className="h-4 w-4 text-red-500 ml-auto" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      {!revealed ? (
        <Button onClick={handleReveal} disabled={selected === null} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
          Submit Answer
        </Button>
      ) : (
        <div className="space-y-3">
          {/* Explanation */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <p className="text-sm text-foreground leading-relaxed">{q.explanation}</p>
            {q.trap && (
              <div className="flex items-start gap-2 mt-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 dark:text-red-400"><b>Common Trap:</b> {q.trap}</p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleNext} className="flex-1 bg-primary hover:bg-primary/90">
              {currentQ < totalQ - 1 ? "Next Question →" : "Finish ✓"}
            </Button>
            <Button variant="outline" size="icon" onClick={handleReset}><RotateCcw className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Negative marking info */}
      <p className="text-[10px] text-center text-muted-foreground">
        +4 correct · -{q.negativeMarking ?? 1} wrong · 0 unanswered (JEE marking scheme)
      </p>
    </div>
  );
};

export default JeeProblemsBlock;
