import { useState } from "react";
import { ReasoningContent } from "@/data/textbookData";
import { Eye, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

const ReasoningBlock = ({ content }: { content: ReasoningContent }) => {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-primary mb-1">🤔 But WHY though?</p>
        <p className="text-sm font-semibold text-foreground">{content.centralQuestion}</p>
        <p className="text-xs text-muted-foreground mt-1 italic">Don't just memorize — understand the reason!</p>
      </div>

      {content.whyQuestions.map((q, i) => (
        <div key={i} className="rounded-xl border bg-card p-5">
          <p className="text-sm font-medium text-foreground mb-2 flex items-start gap-2">
            <span className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 dark:from-amber-800 dark:to-orange-700 text-amber-800 dark:text-amber-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
              Why?
            </span>
            {q.question}
          </p>

          {q.hint && !revealed[i] && (
            <p className="text-xs text-muted-foreground italic ml-8 mb-2">💡 Hint: {q.hint}</p>
          )}

          {revealed[i] ? (
            <div className="ml-8 mt-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">💡 Aha! Here's the cool part:</p>
                  <p className="text-sm text-amber-800 dark:text-amber-300">{q.deeperInsight}</p>
                </div>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRevealed({ ...revealed, [i]: true })}
              className="ml-8 mt-1"
            >
              <Eye className="h-3.5 w-3.5 mr-1" /> I've thought about it — show me! 👀
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

export default ReasoningBlock;
