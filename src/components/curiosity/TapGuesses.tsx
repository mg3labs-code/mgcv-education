import { Card } from "@/components/ui/card";
import { useState } from "react";

interface Props {
  question?: string;
  guesses: [string, string];
  onPick: (guess: string, index: 0 | 1) => void;
}

export default function TapGuesses({ question, guesses, onPick }: Props) {
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <Card className="p-6 sm:p-8 max-w-2xl mx-auto">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
        Quick gut-check — there's no wrong answer
      </div>
      <h3 id="tap-q" className="text-xl sm:text-2xl font-serif font-medium mb-5 text-foreground leading-snug">
        {question ?? "Which feels more true to you right now?"}
      </h3>
      <div role="radiogroup" aria-labelledby="tap-q" className="space-y-3">
        {guesses.map((g, i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={picked === i}
            onClick={() => {
              setPicked(i);
              setTimeout(() => onPick(g, i as 0 | 1), 250);
            }}
            disabled={picked !== null}
            className={`w-full text-left rounded-xl border p-4 min-h-[60px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-90 ${
              picked === i
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:bg-accent hover:border-primary/40"
            }`}
          >
            <span className="font-medium text-foreground text-base leading-snug">{g}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
