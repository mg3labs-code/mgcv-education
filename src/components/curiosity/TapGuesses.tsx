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
      <h3 className="text-xl sm:text-2xl font-serif font-medium mb-5">
        {question ?? "Which feels more true to you right now?"}
      </h3>
      <div className="space-y-3">
        {guesses.map((g, i) => (
          <button
            key={i}
            onClick={() => {
              setPicked(i);
              setTimeout(() => onPick(g, i as 0 | 1), 250);
            }}
            disabled={picked !== null}
            className={`w-full text-left rounded-xl border p-4 transition-all ${
              picked === i
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:bg-accent hover:border-primary/40"
            }`}
          >
            <span className="font-medium">{g}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
