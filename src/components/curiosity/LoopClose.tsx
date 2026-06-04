import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface Props {
  line: string;
  onRestart: () => void;
}

export default function LoopClose({ line, onRestart }: Props) {
  return (
    <Card className="p-6 sm:p-8 max-w-2xl mx-auto bg-gradient-to-br from-primary/5 to-accent/30 border-primary/20">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary/80 mb-3">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        Loop closed
      </div>
      <p className="text-lg sm:text-xl font-serif leading-relaxed text-foreground mb-6">
        {line}
      </p>

      <div className="rounded-xl bg-background/60 border border-border p-4 mb-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
          The arc you walked
        </div>
        <ol className="space-y-2 text-sm">
          {[
            "Noticed something real",
            "Made a first guess",
            "Found the hidden pattern",
            "Explained it in your own words",
            "Used it on a fresh case",
            "Taught it to a friend",
          ].map((s, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold">
                {i + 1}
              </span>
              <span className="text-foreground/80">{s}</span>
            </li>
          ))}
        </ol>
      </div>

      <Button variant="outline" onClick={onRestart}>
        Start over (for testing)
      </Button>
    </Card>
  );
}
