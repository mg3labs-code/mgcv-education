import { useState } from "react";
import { AssumptionsContent } from "@/data/textbookData";
import { AlertTriangle, ChevronDown, ChevronUp, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const AssumptionsBlock = ({ content }: { content: AssumptionsContent }) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [showDefense, setShowDefense] = useState(false);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Hidden assumptions about: {content.concept}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          These are beliefs most students hold without questioning. Can you spot the flaw?
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
                <p className="text-sm font-medium text-foreground">"{a.assumption}"</p>
                <p className="text-xs text-muted-foreground mt-0.5">Tap to examine this assumption</p>
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
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Why this matters:</p>
                <p className="text-sm text-amber-800 dark:text-amber-300">{a.whyItMatters}</p>
              </div>
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                <p className="text-xs font-semibold text-primary mb-1">🎯 Challenge:</p>
                <p className="text-sm text-foreground">{a.challenge}</p>
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
            <p className="text-sm font-semibold text-foreground mb-1">🎓 Oxford Tutorial Defense</p>
            <p className="text-sm text-muted-foreground">{content.defensePrompt}</p>
            {showDefense ? (
              <textarea
                className="w-full mt-3 rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[100px]"
                placeholder="Write your defense here... Think critically and argue your position."
              />
            ) : (
              <Button size="sm" className="mt-3" onClick={() => setShowDefense(true)}>
                <Shield className="h-3.5 w-3.5 mr-1" /> Accept the Challenge
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssumptionsBlock;
