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
      <p className="text-lg sm:text-xl font-serif leading-relaxed mb-6">{claim}</p>
      <div className="grid sm:grid-cols-3 gap-3">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => {
              setPicked(o.id);
              setTimeout(() => onPick(o.id), 200);
            }}
            disabled={picked !== null}
            className={`rounded-xl border p-3 font-medium transition-all ${
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
