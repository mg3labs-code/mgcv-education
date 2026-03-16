import { useState } from "react";
import { AssumptionsContent } from "@/data/textbookData";
import { AlertTriangle, ChevronDown, ChevronUp, Shield, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AssumptionsBlockProps {
  content: AssumptionsContent;
  onStartDefense?: () => void;
}

const AssumptionsBlock = ({ content, onStartDefense }: AssumptionsBlockProps) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [showDefense, setShowDefense] = useState(false);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4">
        <p className="text-base font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          🕵️ Detective Mode: What if everyone's wrong about {content.concept}?
        </p>
        <p className="text-sm text-muted-foreground mt-1 italic">
          Most people believe these without checking. Can YOU spot the trick?
        </p>
      </div>

      {content.hiddenAssumptions.map((a, i) => (
        <div key={i} className="rounded-xl border bg-card overflow-hidden">
          <button
            onClick={() => setExpanded({ ...expanded, [i]: !expanded[i] })}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="h-7 w-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div>
                <p className="text-base font-medium text-foreground">"{a.assumption}"</p>
                <p className="text-xs text-muted-foreground mt-0.5">Tap to bust this myth! 🔍</p>
              </div>
            </div>
            {expanded[i] ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </button>

          {expanded[i] && (
            <div className="px-4 pb-4 space-y-3 border-t pt-3">
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">🤯 Mind-blowing part:</p>
                <p className="text-base text-amber-800 dark:text-amber-300">{a.whyItMatters}</p>
              </div>
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                <p className="text-xs font-semibold text-primary mb-1">🎯 Your mission:</p>
                <p className="text-base text-foreground">{a.challenge}</p>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Tutorial Defense Prompt */}
      <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-base font-semibold font-serif text-foreground mb-1">⚔️ Can you defend your answer?</p>
            <p className="text-base text-muted-foreground leading-relaxed">{content.defensePrompt}</p>
            {showDefense ? (
              <textarea
                className="w-full mt-3 rounded-lg border bg-background px-3 py-2 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[100px]"
                placeholder="Pretend you're explaining to a friend who disagrees..."
              />
            ) : (
              <Button size="sm" className="mt-3" onClick={() => setShowDefense(true)}>
                <Shield className="h-3.5 w-3.5 mr-1" /> I'm ready! Let's go 💪
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Inline Tutorial Defense CTA */}
      {onStartDefense && (
        <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 p-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
              <Shield className="h-6 w-6 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold font-serif text-foreground">Think you really get it? Prove it!</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <Timer className="h-3.5 w-3.5" /> 5 min · AI buddy will ask you tricky questions
              </p>
            </div>
            <Button onClick={onStartDefense} className="bg-amber-600 hover:bg-amber-700 text-white shrink-0">
              <Shield className="h-4 w-4 mr-1" /> Start Tutorial Defense
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssumptionsBlock;
