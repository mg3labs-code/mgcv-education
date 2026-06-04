import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface MiniCase {
  id: string;
  situation: string;
  nudge: string;
}

interface Props {
  cases: MiniCase[];
  onDone: (answers: Record<string, string>) => void;
}

export default function ApplyMiniCases({ cases, onDone }: Props) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const c = cases[i];
  const last = i === cases.length - 1;

  return (
    <Card className="p-6 sm:p-8 max-w-2xl mx-auto">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
        Day 3 · Try it on something new · Case {i + 1} of {cases.length}
      </div>
      <p className="text-base sm:text-lg font-medium mb-3">{c.situation}</p>
      <p className="text-sm text-muted-foreground italic mb-4">{c.nudge}</p>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        placeholder="Write what you think…"
        maxLength={400}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
      />
      <Button
        className="mt-3"
        disabled={!draft.trim()}
        onClick={() => {
          const next = { ...answers, [c.id]: draft.trim() };
          setAnswers(next);
          setDraft("");
          if (last) onDone(next);
          else setI(i + 1);
        }}
      >
        {last ? "Done with cases" : "Next case"}
      </Button>
    </Card>
  );
}
