import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Step {
  step: string;
  body: string;
}

interface Props {
  steps: Step[];
  onDone: () => void;
}

export default function ConceptUnfold({ steps, onDone }: Props) {
  const [i, setI] = useState(0);
  const current = steps[i];
  const last = i === steps.length - 1;

  return (
    <Card className="p-6 sm:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
        Step {i + 1} of {steps.length}
      </div>
      <h3 className="text-xl sm:text-2xl font-serif font-medium mb-3">{current.step}</h3>
      <p className="text-base sm:text-lg text-foreground/85 leading-relaxed mb-6">
        {current.body}
      </p>
      <Button
        onClick={() => {
          if (last) onDone();
          else setI(i + 1);
        }}
      >
        {last ? "I'm with it" : "Next step"}
      </Button>
    </Card>
  );
}
