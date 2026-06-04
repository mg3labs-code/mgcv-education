import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Props {
  claim: string;
  reveal?: string;
  onPick: (choice: "believe" | "doubt" | "unsure") => void;
}

export default function BelieveDoubt({ claim, reveal, onPick }: Props) {
  const [picked, setPicked] = useState<"believe" | "doubt" | "unsure" | null>(null);
  const options = [
    { id: "believe", label: "I believe it" },
    { id: "doubt", label: "I doubt it" },
    { id: "unsure", label: "Not sure yet" },
  ] as const;

  return (
    <Card className="p-6 sm:p-8 max-w-2xl mx-auto">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
        Sit with this for a moment — no rush
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
            onClick={() => setPicked(o.id)}
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

      {picked && reveal && (
        <div
          className="mt-5 rounded-lg px-4 py-4 text-[13.5px] leading-relaxed bg-amber-50 border border-amber-200 text-amber-900 animate-fade-in"
          aria-live="polite"
        >
          <p className="font-semibold mb-2 text-amber-900">
            {picked === "doubt"
              ? "Good — your doubt is mathematically sharp. Now look:"
              : picked === "believe"
              ? "Brave call. Here's why it actually holds:"
              : "Fair to be unsure. Walk through this once:"}
          </p>
          <p className="whitespace-pre-line">{reveal}</p>
        </div>
      )}

      {picked && (
        <Button
          className="mt-4 w-full"
          onClick={() => onPick(picked)}
        >
          Continue →
        </Button>
      )}
    </Card>
  );
}
