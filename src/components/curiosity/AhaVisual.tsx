import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AhaVisual as AhaVisualType } from "@/data/curiosityConcepts/realNumbers";

interface Props {
  guess: string;
  aha: AhaVisualType;
  onContinue: () => void;
}

export default function AhaVisual({ guess, aha, onContinue }: Props) {
  return (
    <div className="arc-shell max-w-[440px] mx-auto space-y-3">
      <div className="text-[10px] uppercase tracking-[2px] font-bold text-emerald-700 flex items-center gap-2">
        <span>Aha moment · 60s</span>
        <span aria-hidden="true" className="flex-1 h-px bg-border" />
      </div>

      {/* echo of student's guess */}
      <div className="rounded-r-lg border-l-4 border-amber-400 bg-amber-50 px-3 py-2">
        <div className="text-[10px] uppercase tracking-wider font-bold text-amber-700">
          You guessed
        </div>
        <div className="text-[12px] italic text-amber-900 mt-1 leading-snug">
          {guess?.trim() || "(no guess — that's okay)"}
        </div>
      </div>

      <Card className="p-5 text-center bg-emerald-50 border-emerald-300">
        <div className="text-4xl mb-2" aria-hidden="true">
          {aha.emoji}
        </div>
        <h3 className="arc-display text-[16px] font-extrabold text-foreground mb-2 leading-snug">
          {aha.title}
        </h3>
        <p className="text-[12.5px] text-foreground/80 leading-relaxed mb-3">
          {aha.body}
        </p>
        <div className="inline-block text-[11px] font-bold px-3 py-1.5 rounded-full bg-emerald-200 text-emerald-900">
          {aha.formula}
        </div>
      </Card>

      <Button className="w-full" onClick={onContinue}>
        Got it — now try this →
      </Button>
    </div>
  );
}
