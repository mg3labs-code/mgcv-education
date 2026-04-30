import { useState } from "react";

interface Props {
  onPick: (answer: "easy" | "right" | "hard") => void;
}

/**
 * 3-tap "how did that feel?" — only surfaced when behavior signals are ambiguous.
 * Used at most once per day per concept.
 */
const VibeCheck = ({ onPick }: Props) => {
  const [picked, setPicked] = useState<string | null>(null);

  const handle = (val: "easy" | "right" | "hard") => {
    if (picked) return;
    setPicked(val);
    setTimeout(() => onPick(val), 250);
  };

  const opts: Array<{ val: "easy" | "right" | "hard"; emoji: string; label: string }> = [
    { val: "easy", emoji: "😌", label: "Too easy" },
    { val: "right", emoji: "🙂", label: "Just right" },
    { val: "hard", emoji: "😣", label: "Felt hard" },
  ];

  return (
    <div className="rounded-3xl border border-border/60 bg-muted/30 p-5 sm:p-6 text-center">
      <p className="text-sm font-medium text-muted-foreground mb-4">How did that feel?</p>
      <div className="flex justify-center gap-2.5 sm:gap-4">
        {opts.map((o) => (
          <button
            key={o.val}
            type="button"
            onClick={() => handle(o.val)}
            disabled={!!picked}
            className={[
              "flex flex-col items-center gap-1.5 rounded-2xl border-2 px-4 sm:px-6 py-3 transition-all",
              picked === o.val ? "border-primary bg-primary/10 scale-105" : "border-border/60 hover:border-primary/40 hover:bg-card",
              picked && picked !== o.val && "opacity-40",
            ].filter(Boolean).join(" ")}
          >
            <span className="text-2xl sm:text-3xl">{o.emoji}</span>
            <span className="text-xs sm:text-sm font-medium">{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default VibeCheck;
