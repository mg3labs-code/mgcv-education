import { useEffect, useRef, useState } from "react";
import { Sparkles, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Rung } from "@/data/conceptRungs";
import type { Signal } from "@/hooks/useRungPacing";

type VibeResponse = "easy" | "right" | "hard";

const vibeCopy: Record<VibeResponse, { prefix: string; cta: string }> = {
  easy: { prefix: "😌 You found the last one smooth — try this stretch.", cta: "Try the stretch" },
  right: { prefix: "🙂 Good pace. Same idea, one step forward.", cta: "Take the next step" },
  hard: { prefix: "😣 No rush. Let's make the same idea feel safer.", cta: "Try a softer one" },
};

interface Props {
  rung: Rung;
  /** Optional small label like "Warm-up" / "One more" — shown above the prompt. */
  eyebrow?: string;
  onSubmit: (signal: Signal) => void;
  /** Render the next CTA (e.g. "Continue") only after the reveal is shown. */
  onContinue?: () => void;
  continueLabel?: string;
  vibeResponse?: VibeResponse | null;
}

/**
 * Renders any rung type. Tracks behavior signals invisibly:
 * timing, wrong attempts, answer changes.
 */
const RungCard = ({ rung, eyebrow, onSubmit, onContinue, continueLabel = "Continue", vibeResponse }: Props) => {
  const startRef = useRef<number>(Date.now());
  const [picked, setPicked] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [answerChanges, setAnswerChanges] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);

  useEffect(() => {
    startRef.current = Date.now();
    setPicked(null);
    setText("");
    setWrongAttempts(0);
    setAnswerChanges(0);
    setRevealed(false);
    setWasCorrect(false);
  }, [rung.prompt]);

  const isChoice = rung.type === "yesno" || rung.type === "mcq";
  const isText = rung.type === "shortText" || rung.type === "openText";
  const personalized = vibeResponse ? vibeCopy[vibeResponse] : null;

  const handlePick = (idx: number) => {
    if (revealed) return;
    if (picked !== null && picked !== idx) {
      setAnswerChanges((c) => c + 1);
    }
    setPicked(idx);
  };

  const handleSubmit = () => {
    const timeSec = Math.round((Date.now() - startRef.current) / 1000);
    let correct = true;
    if (isChoice && rung.correctIndex !== undefined) {
      correct = picked === rung.correctIndex;
      if (!correct) {
        setWrongAttempts((w) => w + 1);
        // For choice questions: let them try again, only reveal on second wrong or correct.
        if (wrongAttempts === 0) {
          setPicked(null);
          return;
        }
      }
    } else if (isText) {
      // open/short text: no objective correct/wrong, treat as "engaged" if reasonable length
      correct = text.trim().split(/\s+/).filter(Boolean).length >= 3;
      if (!correct) return; // nudge them to write more, no submit yet
    }
    setWasCorrect(correct);
    setRevealed(true);
    onSubmit({ timeSec, wrongAttempts: correct ? wrongAttempts : wrongAttempts + 1, answerChanges, correct });
  };

  const canSubmit = isChoice ? picked !== null : text.trim().length > 0;

  return (
    <div className="rounded-3xl border border-border/60 bg-card/80 p-5 sm:p-7 shadow-sm backdrop-blur-sm">
      {eyebrow && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
          <Sparkles className="h-3.5 w-3.5" /> {eyebrow}
        </div>
      )}
      <h3 className="text-lg sm:text-xl font-semibold leading-snug text-foreground">
        {personalized && <span className="mb-2 block text-sm font-medium text-muted-foreground">{personalized.prefix}</span>}
        {rung.prompt}
      </h3>

      {/* Choice answers */}
      {isChoice && rung.options && (
        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {rung.options.map((opt, idx) => {
            const isPicked = picked === idx;
            const isCorrectShow = revealed && rung.correctIndex === idx;
            const isWrongShow = revealed && isPicked && rung.correctIndex !== undefined && rung.correctIndex !== idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handlePick(idx)}
                disabled={revealed}
                className={[
                  "rounded-2xl border-2 px-4 py-3.5 text-left text-sm sm:text-base font-medium transition-all",
                  isPicked && !revealed && "border-primary bg-primary/5",
                  !isPicked && !revealed && "border-border/60 hover:border-primary/40 hover:bg-muted/40",
                  isCorrectShow && "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                  isWrongShow && "border-rose-400 bg-rose-500/10 text-rose-700 dark:text-rose-300",
                  revealed && "cursor-default",
                ].filter(Boolean).join(" ")}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {/* Text answers */}
      {isText && (
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={revealed}
          placeholder={rung.type === "shortText" ? "A sentence is enough…" : "Take a couple of sentences if you need…"}
          className="mt-5 min-h-[96px] text-base"
        />
      )}

      {/* Submit / reveal */}
      {!revealed && (
        <div className="mt-5 flex justify-end">
          <Button onClick={handleSubmit} disabled={!canSubmit} size="lg" className="rounded-full">
            Check my answer <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}

      {revealed && (
        <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm sm:text-base leading-relaxed text-foreground/90">
          <div className="mb-1.5 flex items-center gap-2 text-primary font-semibold">
            {wasCorrect ? <CheckCircle2 className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
            {wasCorrect ? "Nice." : "Worth a closer look."}
          </div>
          {rung.reveal}
        </div>
      )}

      {revealed && onContinue && (
        <div className="mt-5 flex justify-end">
          <Button onClick={onContinue} size="lg" className="rounded-full">
            {personalized?.cta ?? continueLabel} <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default RungCard;
