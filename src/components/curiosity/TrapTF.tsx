import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TrapClaim } from "@/data/curiosityConcepts/realNumbers";

interface Props {
  trap: TrapClaim;
  onContinue: (pick: "true" | "false") => void;
}

export default function TrapTF({ trap, onContinue }: Props) {
  const [picked, setPicked] = useState<"true" | "false" | null>(null);
  const correct = picked && picked === trap.truth;

  return (
    <div className="arc-shell max-w-[440px] mx-auto space-y-3">
      <div className="text-[10px] uppercase tracking-[2px] font-bold text-violet-700 flex items-center gap-2">
        <span>Spot the trap · 45s</span>
        <span aria-hidden="true" className="flex-1 h-px bg-border" />
      </div>

      <Card className="p-4 sm:p-5">
        <div className="inline-block text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-1 rounded-md mb-3">
          Detective challenge — most people get this wrong
        </div>
        <p className="arc-display text-[15.5px] font-extrabold text-foreground leading-snug mb-2">
          “{trap.statement}”
        </p>
        <p className="text-[12px] italic text-muted-foreground leading-relaxed mb-4">
          {trap.context}
        </p>

        <div
          role="radiogroup"
          aria-label="Believe or doubt this claim"
          className="grid grid-cols-2 gap-2.5 mb-3"
        >
          {(["true", "false"] as const).map((opt) => {
            const isPicked = picked === opt;
            const isCorrect = picked && opt === trap.truth;
            const showState = !!picked;
            const cls = !showState
              ? "border-border bg-card hover:bg-accent"
              : isCorrect
              ? "border-emerald-500 bg-emerald-50 text-emerald-800 arc-glow"
              : isPicked
              ? "border-rose-500 bg-rose-50 text-rose-800"
              : "border-border bg-card opacity-60";
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={isPicked}
                disabled={!!picked}
                onClick={() => setPicked(opt)}
                className={`min-h-12 rounded-xl border-[1.5px] px-3 py-2.5 text-[13px] font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${cls}`}
              >
                {opt === "true" ? "✓ I believe it" : "⚡ I doubt it"}
              </button>
            );
          })}
        </div>

        {picked && (
          <div
            className="rounded-lg px-3 py-3 text-[12.5px] leading-relaxed bg-violet-50 border border-violet-200 text-violet-900 animate-fade-in"
            aria-live="polite"
          >
            <p>{trap.reveal}</p>
            <p className="mt-2 text-[11px] font-semibold text-violet-700">
              🧠 What you just did: you questioned an assumption. That's the
              core skill — {correct ? "and you nailed it." : "and now you've felt the trap."}
            </p>
          </div>
        )}
      </Card>

      <Button
        className="w-full"
        disabled={!picked}
        onClick={() => picked && onContinue(picked)}
      >
        See what you learned today →
      </Button>
    </div>
  );
}
