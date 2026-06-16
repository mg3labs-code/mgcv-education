import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { HookVariant } from "@/data/curiosityConcepts/realNumbers";

interface Props {
  hook: HookVariant;
  onPickedAndContinue: (pickedLabel: string, wasCorrect: boolean) => void;
}

// Short-style vertical hook card mirroring engagement_hook_cards_with_concept_flow.
// Dark gradient, interest badge, big question, 3 choice chips, inline reveal.
export default function HookShortCard({ hook, onPickedAndContinue }: Props) {
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);

  const picked = pickedIdx !== null ? hook.mcq.choices[pickedIdx] : null;

  return (
    <div className="arc-shell max-w-[440px] mx-auto">
      <div className="text-[10px] uppercase tracking-[2px] font-bold text-muted-foreground mb-3 flex items-center gap-2">
        <span>Day 1 · Spark</span>
        <span aria-hidden="true" className="flex-1 h-px bg-border" />
        <span>60s</span>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl mb-3 flex flex-col justify-end"
        style={{
          background:
            "linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          aspectRatio: "9 / 13",
          minHeight: 460,
        }}
      >
        {/* big background emoji */}
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center opacity-20 text-[180px] select-none"
        >
          {hook.emoji}
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.85) 70%)",
          }}
        />
        <div className="relative z-10 p-4 sm:p-5 space-y-3">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide"
            style={{
              background: "rgba(34,197,94,0.22)",
              color: "#86EFAC",
              border: "0.5px solid rgba(134,239,172,0.4)",
            }}
          >
            <span aria-hidden="true">{hook.emoji}</span>
            {hook.badgeLabel}
          </span>

          <h2 className="arc-display text-[19px] sm:text-[22px] font-extrabold text-white leading-tight">
            {hook.mcq.question}
          </h2>
          <p className="text-[12px] text-white/70 leading-relaxed">
            {hook.scene}
          </p>

          <div
            className="space-y-2"
            role="radiogroup"
            aria-label="Pick the answer that feels right"
          >
            {hook.mcq.choices.map((c, i) => {
              const isPicked = pickedIdx === i;
              const showState = pickedIdx !== null;
              const cls = !showState
                ? ""
                : c.correct
                ? "is-correct"
                : isPicked
                ? "is-wrong"
                : "";
              return (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={isPicked}
                  disabled={pickedIdx !== null}
                  onClick={() => setPickedIdx(i)}
                  className={`arc-choice ${cls} focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {picked && (
            <div
              className="rounded-xl p-3 text-[12px] leading-relaxed text-white/90 animate-fade-in"
              style={{
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(8px)",
                border: "0.5px solid rgba(255,255,255,0.15)",
              }}
              aria-live="polite"
            >
              <div className="text-[10px] font-bold tracking-wider uppercase text-amber-200 mb-1">
                {picked.correct ? "Nice catch" : "Real thought"}
              </div>
              <p className="mb-2">{picked.feedback}</p>
              <p className="text-white/80">
                <span className="font-semibold text-amber-200">Reveal: </span>
                {hook.mcq.reveal}
              </p>
            </div>
          )}
        </div>
      </div>

      <Button
        className="w-full"
        disabled={pickedIdx === null}
        onClick={() =>
          picked &&
          onPickedAndContinue(picked.label, picked.correct)
        }
      >
        {pickedIdx === null
          ? "Pick one above to continue"
          : "Now write your first thought →"}
      </Button>
    </div>
  );
}
