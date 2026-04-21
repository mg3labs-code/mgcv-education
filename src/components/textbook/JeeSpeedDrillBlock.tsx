import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Zap, Clock, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import type { JeeSpeedDrillContent } from "@/data/textbookData";
import { useDifficulty } from "@/contexts/DifficultyContext";

interface Props {
  content: JeeSpeedDrillContent;
  onComplete?: () => void;
}

const JeeSpeedDrillBlock = ({ content, onComplete }: Props) => {
  const { mode } = useDifficulty();
  if (mode !== "master") return null;
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [results, setResults] = useState<{ correct: boolean; userAnswer: string; time: number }[]>([]);
  const [timer, setTimer] = useState(content.totalTimeSeconds || 120);
  const [qStartTime, setQStartTime] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const questions = content.questions;
  const q = questions[currentQ];

  useEffect(() => {
    if (!started || finished) return;
    if (timer <= 0) { setFinished(true); onComplete?.(); return; }
    const id = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer, started, finished]);

  const handleStart = () => {
    setStarted(true);
    setQStartTime(Date.now());
  };

  const handleSubmit = useCallback(() => {
    const timeTaken = Math.round((Date.now() - qStartTime) / 1000);
    const isCorrect = answer.trim().toLowerCase() === q.answer.trim().toLowerCase();
    setResults(prev => [...prev, { correct: isCorrect, userAnswer: answer, time: timeTaken }]);
    setAnswer("");
    setShowHint(false);
    if (currentQ < questions.length - 1) {
      setCurrentQ(c => c + 1);
      setQStartTime(Date.now());
    } else {
      setFinished(true);
      onComplete?.();
    }
  }, [answer, q, currentQ, questions.length, qStartTime]);

  const handleReset = () => {
    setStarted(false);
    setCurrentQ(0);
    setAnswer("");
    setResults([]);
    setTimer(content.totalTimeSeconds || 120);
    setFinished(false);
    setShowHint(false);
  };

  const correctCount = results.filter(r => r.correct).length;
  const totalTime = content.totalTimeSeconds || 120;
  const timeUsed = totalTime - timer;

  if (!started) {
    return (
      <div className="rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 p-6 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Zap className="h-6 w-6 text-amber-600" />
          <h3 className="text-lg font-bold text-amber-700 dark:text-amber-400">Speed Drill</h3>
        </div>
        <p className="text-sm text-muted-foreground">{questions.length} questions · {totalTime}s total · Answer as fast as you can!</p>
        <Button onClick={handleStart} className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
          <Zap className="h-4 w-4" /> Start Drill
        </Button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-card p-6 space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-foreground">⚡ Drill Complete!</h3>
          <p className="text-3xl font-bold text-amber-600">{correctCount}/{results.length}</p>
          <p className="text-sm text-muted-foreground">in {timeUsed}s</p>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {results.map((r, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${r.correct ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20" : "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"}`}>
              {r.correct ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground truncate">{questions[i].question}</p>
                {!r.correct && <p className="text-[10px] text-emerald-600">Answer: {questions[i].answer}</p>}
              </div>
              <span className="text-[10px] text-muted-foreground">{r.time}s</span>
            </div>
          ))}
        </div>
        <Button variant="outline" onClick={handleReset} className="w-full gap-2"><RotateCcw className="h-4 w-4" /> Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timer bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Q{currentQ + 1}/{questions.length}</span>
        <div className={`flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-full ${timer <= 15 ? "bg-red-100 text-red-700 animate-pulse" : "bg-muted text-muted-foreground"}`}>
          <Clock className="h-3 w-3" />{timer}s
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-amber-500 transition-all" style={{ width: `${(timer / totalTime) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-5">
        <p className="text-base font-medium text-foreground">{q.question}</p>
      </div>

      {/* Answer input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          onKeyDown={e => e.key === "Enter" && answer.trim() && handleSubmit()}
          placeholder="Type your answer..."
          className="flex-1 rounded-xl border-2 border-border bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
          autoFocus
        />
        <Button onClick={handleSubmit} disabled={!answer.trim()} className="bg-amber-600 hover:bg-amber-700 text-white">→</Button>
      </div>

      {q.hint && (
        <button onClick={() => setShowHint(true)} className="text-xs text-amber-600 hover:underline">
          {showHint ? `💡 ${q.hint}` : "Need a hint?"}
        </button>
      )}

      {/* Progress dots */}
      <div className="flex gap-1 justify-center">
        {questions.map((_, i) => (
          <div key={i} className={`h-2 w-2 rounded-full ${i < results.length ? (results[i].correct ? "bg-emerald-500" : "bg-red-400") : i === currentQ ? "bg-amber-500" : "bg-muted"}`} />
        ))}
      </div>
    </div>
  );
};

export default JeeSpeedDrillBlock;
