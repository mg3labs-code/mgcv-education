import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Props {
  claim: string;
  onPick: (choice: "believe" | "doubt" | "unsure") => void;
}

export default function BelieveDoubt({ claim, onPick }: Props) {
  const [picked, setPicked] = useState<string | null>(null);
  const options = [
    { id: "believe", label: "I believe it" },
    { id: "doubt", label: "I doubt it" },
    { id: "unsure", label: "Not sure yet" },
  ] as const;

  return (
    <Card className="p-6 sm:p-8 max-w-2xl mx-auto">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
        Sit with this for a moment
      </div>
      <p id="bd-claim" className="text-lg sm:text-xl font-serif leading-relaxed mb-6 text-foreground">
        {claim}
      </p>
      <div role="radiogroup" aria-labelledby="bd-claim" className="grid sm:grid-cols-3 gap-3">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={picked === o.id}
            onClick={() => {
              setPicked(o.id);
              setTimeout(() => onPick(o.id), 200);
            }}
            disabled={picked !== null}
            className={`rounded-xl border p-3 min-h-11 font-medium text-foreground transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              picked === o.id
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:bg-accent hover:border-primary/40"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </Card>
  );
}
