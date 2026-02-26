import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getQuizForSubject, getDailyQuiz, QuizQuestion, DailyQuizQuestion } from "@/data/popQuizData";

interface PopQuizModalProps {
  open: boolean;
  onClose: () => void;
  subject: string;
  mode?: "subject" | "daily";
  onComplete?: (score: number, total: number) => void;
}

const PopQuizModal = ({ open, onClose, subject, mode = "subject", onComplete }: PopQuizModalProps) => {
  const [questions] = useState<(QuizQuestion | DailyQuizQuestion)[]>(() =>
    mode === "daily" ? getDailyQuiz(10) : getQuizForSubject(subject, 10)
  );
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  const handleSubmit = () => {
    if (selected === null) return;
    const isCorrect = selected === questions[currentQ].correct;
    const newScore = isCorrect ? score + 1 : score;
    setScore(newScore);
    setAnswers([...answers, selected]);

    if (currentQ + 1 < questions.length) {
      setCurrentQ(currentQ + 1);
      setSelected(null);
    } else {
      setFinished(true);
      onComplete?.(newScore, questions.length);
    }
  };

  const getResultMessage = (pct: number) => {
    if (pct >= 90) return "🌟 Outstanding! You're mastering the concepts!";
    if (pct >= 80) return "🎉 Excellent work! Keep up the great effort!";
    if (pct >= 70) return "👍 Good job! You're on the right track!";
    if (pct >= 60) return "📚 Fair attempt! Review the topics and try again!";
    return "💪 Keep studying! Practice makes perfect!";
  };

  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const title = mode === "daily" ? "🧠 Daily Knowledge Quiz" : "Pop Quiz";

  if (questions.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <p className="text-center text-muted-foreground py-8">No quiz questions available yet.</p>
          <Button onClick={onClose} className="w-full">Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  const currentQuestion = questions[currentQ];
  const questionSubject = "subject" in currentQuestion ? (currentQuestion as DailyQuizQuestion).subject : subject;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            {finished ? "🎯 Quiz Complete!" : `${title} — Question ${currentQ + 1}/${questions.length}`}
          </DialogTitle>
          {!finished && mode === "daily" && (
            <Badge variant="outline" className="mx-auto mt-1">{questionSubject}</Badge>
          )}
          {!finished && mode === "subject" && (
            <p className="text-sm text-muted-foreground text-center">{subject}</p>
          )}
        </DialogHeader>

        {!finished ? (
          <div className="space-y-4">
            {/* Progress bar */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${((currentQ) / questions.length) * 100}%` }}
              />
            </div>

            {/* Question */}
            <div className="bg-muted/50 rounded-xl p-5 border-l-4 border-primary">
              <p className="font-semibold text-foreground">{currentQuestion.question}</p>
            </div>

            {/* Options */}
            <div className="space-y-2">
              {currentQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`w-full text-left p-3.5 rounded-lg border-2 transition-all text-sm font-medium
                    ${selected === i
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:border-primary/50 text-foreground"
                    }`}
                >
                  <span className="mr-2 font-bold text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              ))}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={selected === null}
              className="w-full"
              size="lg"
            >
              {currentQ + 1 < questions.length ? "Submit & Next →" : "Submit & Finish"}
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Result */}
            <div className="text-center py-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl">
              <div className="text-5xl font-bold text-primary mb-2">{score}/{questions.length}</div>
              <div className="text-lg font-medium text-foreground">{percentage}%</div>
              <p className="text-sm text-muted-foreground mt-2">{getResultMessage(percentage)}</p>
            </div>

            {/* Answer Review */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">📝 Answer Review:</h4>
              {questions.map((q, i) => {
                const userAns = answers[i];
                const isCorrect = userAns === q.correct;
                const qSubject = "subject" in q ? (q as DailyQuizQuestion).subject : subject;
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border-2 text-sm ${
                      isCorrect
                        ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800"
                        : "bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium flex-1">Q{i + 1}: {q.question}</p>
                      {mode === "daily" && (
                        <Badge variant="secondary" className="text-[10px] shrink-0">{qSubject}</Badge>
                      )}
                    </div>
                    <p className={isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}>
                      Your answer: {userAns !== null && userAns !== undefined ? q.options[userAns] : "—"}
                    </p>
                    {!isCorrect && (
                      <p className="text-emerald-700 dark:text-emerald-400">Correct: {q.options[q.correct]}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <Button onClick={onClose} variant="outline" className="w-full" size="lg">
              Close Quiz
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PopQuizModal;
