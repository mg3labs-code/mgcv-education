import { useState } from "react";
import { ReasoningContent } from "@/data/textbookData";
import { Eye, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExampleCard, ImportantNote } from "@/components/textbook/ContentCards";

const ReasoningBlock = ({ content }: { content: ReasoningContent }) => {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  return (
    <div className="space-y-5">
      <div className="rounded-2xl overflow-hidden border-2 border-primary/30 shadow-sm">
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 px-5 py-3 border-b border-orange-200 dark:border-orange-800">
          <p className="text-sm font-bold text-orange-700 dark:text-orange-400 flex items-center gap-2">🤔 But WHY though?</p>
        </div>
        <div className="px-5 py-4 bg-gradient-to-br from-orange-50/30 to-amber-50/20 dark:from-orange-950/10 dark:to-amber-950/10">
          <p className="text-[0.95rem] font-semibold text-foreground leading-relaxed">{content.centralQuestion}</p>
          <p className="text-xs text-muted-foreground mt-2 italic">Don't just memorize — understand the reason!</p>
        </div>
      </div>

      {content.whyQuestions.map((q, i) => (
        <div key={i} className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-[0.95rem] font-medium text-foreground mb-3 flex items-start gap-3">
            <span className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 dark:from-amber-800 dark:to-orange-700 text-amber-800 dark:text-amber-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
              Why?
            </span>
            {q.question}
          </p>

          {q.hint && !revealed[i] && (
            <ImportantNote title="Hint">
              <p className="text-sm text-foreground">{q.hint}</p>
            </ImportantNote>
          )}

          {revealed[i] ? (
            <div className="mt-3">
              <ExampleCard title="Aha! Here's the cool part" defaultOpen={true}>
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <p className="text-[0.95rem] text-foreground leading-relaxed">{q.deeperInsight}</p>
                </div>
              </ExampleCard>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRevealed({ ...revealed, [i]: true })}
              className="mt-3"
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
