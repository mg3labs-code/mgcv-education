import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plane, Trophy, Music, Sparkles } from "lucide-react";
import { useState } from "react";
import type { InterestTag } from "@/data/curiosityConcepts/realNumbers";

const options: { tag: InterestTag; label: string; sub: string; Icon: typeof Plane }[] = [
  { tag: "cricket", label: "Cricket & games", sub: "Scores, run-rates, stats", Icon: Trophy },
  { tag: "travel", label: "Travel & food", sub: "Trips, splits, dishes", Icon: Plane },
  { tag: "movies", label: "Movies & music", sub: "Songs, scenes, tempo", Icon: Music },
];

interface Props {
  onPick: (tag: InterestTag, custom?: string) => void;
}

export default function InterestPicker({ onPick }: Props) {
  const [custom, setCustom] = useState("");

  return (
    <Card className="p-6 sm:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <Sparkles className="h-4 w-4" />
        Before we start
      </div>
      <h1 className="text-2xl sm:text-3xl font-serif font-semibold mb-2">
        What excites you most these days?
      </h1>
      <p className="text-muted-foreground mb-6">
        Pick one — we'll use it to start today's thinking from something you already love.
      </p>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {options.map(({ tag, label, sub, Icon }) => (
          <button
            key={tag}
            onClick={() => onPick(tag)}
            className="text-left rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/40 transition-all p-4"
          >
            <Icon className="h-5 w-5 text-primary mb-2" />
            <div className="font-medium">{label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Or type your own:</label>
        <div className="flex gap-2">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="e.g. drawing, coding, animals…"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            maxLength={40}
          />
          <Button
            variant="outline"
            disabled={!custom.trim()}
            onClick={() => onPick("other", custom.trim())}
          >
            Use this
          </Button>
        </div>
      </div>
    </Card>
  );
}
