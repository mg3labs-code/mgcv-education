import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { TrickyMcq as TrickyMcqData } from "@/data/curiosityConcepts/realNumbers";

interface Props {
  data: TrickyMcqData;
  onPicked: (correct: boolean) => void;
}

// Day-2 tricky MCQ — same shape as the hook MCQ but slightly harder.
// Required step: forward only after a pick.
export default function TrickyMcq({ data, onPicked }: Props) {
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const picked = pickedIdx !== null ? data.choices[pickedIdx] : null;

  return (
    <div className="arc-shell max-w-[480px] mx-auto space-y-3">
      <div className="text-[10px] uppercase tracking-[2px] font-bold text-violet-700 flex items-center gap-2">
        <span>Trickier this time · 60s</span>
        <span aria-hidden="true" className="flex-1 h-px bg-border" />
      </div>
      <Card className="p-4 sm:p-5">
        <p className="arc-display text-[15.5px] sm:text-base font-extrabold text-foreground leading-snug mb-3">
          {data.question}
        </p>
        <div role="radiogroup" aria-label="Pick what you believe" className="space-y-2">
          {data.choices.map((c, i) => {
            const isPicked = pickedIdx === i;
            const showState = pickedIdx !== null;
            const cls = !showState
              ? "border-border bg-card hover:bg-accent"
              : c.correct
              ? "border-emerald-500 bg-emerald-50 text-emerald-900"
              : isPicked
              ? "border-rose-500 bg-rose-50 text-rose-900"
              : "border-border bg-card opacity-60";
            return (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={isPicked}
                disabled={pickedIdx !== null}
                onClick={() => {
                  setPickedIdx(i);
                  onPicked(c.correct);
                }}
                className={`w-full text-left rounded-xl border-[1.5px] px-3 py-3 text-[13px] font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${cls}`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {picked && (
          <div
            className="mt-3 rounded-lg px-3 py-3 text-[12.5px] leading-relaxed bg-violet-50 border border-violet-200 text-violet-900 animate-fade-in"
            aria-live="polite"
          >
            <p className="mb-2">{picked.feedback}</p>
            <p className="text-[12px] text-violet-800">
              <span className="font-semibold">Why this matters: </span>
              {data.reveal}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
