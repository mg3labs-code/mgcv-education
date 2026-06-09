import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { HookVariant } from "@/data/curiosityConcepts/realNumbers";
import { getInterestVisual } from "@/data/interestVisuals";

interface Props {
  hook: HookVariant;
  interestTag?: string | null;
  onPickedAndContinue: (pickedLabel: string, wasCorrect: boolean) => void;
}

// Short-style vertical hook card with interest-themed photo backdrop.
// Photo → overlay → motifs → big scene emoji → glass MCQ panel.
export default function HookShortCard({ hook, interestTag, onPickedAndContinue }: Props) {
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const v = getInterestVisual(interestTag ?? hook.tag);

  const picked = pickedIdx !== null ? hook.mcq.choices[pickedIdx] : null;

  return (
    <div className="arc-shell max-w-[440px] mx-auto">
      <div className="text-[10px] uppercase tracking-[2px] font-bold text-muted-foreground mb-3 flex items-center gap-2">
        <span>Day 1 · Spark</span>
        <span aria-hidden="true" className="flex-1 h-px bg-border" />
        <span>60s</span>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl mb-3 flex flex-col justify-end shadow-2xl"
        style={{ aspectRatio: "9 / 13", minHeight: 460 }}
      >
        {/* interest-themed photo */}
        <img
          src={v.image}
          alt={`${v.label} scene`}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        {/* gradient overlay tuned per interest */}
        <div aria-hidden className="absolute inset-0" style={{ background: v.overlay }} />
        {/* motif confetti */}
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          {v.motifs.map((m, i) => (
            <span
              key={i}
              className="absolute opacity-25 select-none"
              style={{
                fontSize: `${26 + i * 5}px`,
                top: `${8 + (i * 21) % 60}%`,
                left: `${(i * 29) % 78 + 4}%`,
                transform: `rotate(${(i * 19) % 40 - 20}deg)`,
                filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.45))",
              }}
            >
              {m}
            </span>
          ))}
        </div>
        {/* big scene emoji */}
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center opacity-30 text-[160px] select-none"
          style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.5))" }}
        >
          {v.scenes[1].emoji || hook.emoji}
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.88) 78%)",
          }}
        />
        <div className="relative z-10 p-4 sm:p-5 space-y-3">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide backdrop-blur-sm"
            style={{
              background: v.accentSoft,
              color: v.accent,
              border: `0.5px solid ${v.accent}66`,
            }}
          >
            <span aria-hidden="true">{v.emoji}</span>
            {v.label} · {hook.badgeLabel}
          </span>
          <p
            className="text-[12px] text-white/90 font-medium leading-snug"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
          >
            {v.scenes[1].caption}
          </p>

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
