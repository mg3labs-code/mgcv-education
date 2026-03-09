import { useState } from "react";
import { ImplicationsContent } from "@/data/textbookData";
import { Compass } from "lucide-react";

const ImplicationsBlock = ({ content }: { content: ImplicationsContent }) => {
  const [essay, setEssay] = useState("");
  const wordCount = essay.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* What-If Question */}
      <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/20 border border-primary/20 p-5">
        <div className="flex items-start gap-3">
          <Compass className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-primary mb-1">🔮 The Big Question</p>
            <p className="text-base font-semibold text-foreground">{content.whatIfQuestion}</p>
          </div>
        </div>
      </div>

      {/* Reflection Prompts */}
      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3">Think about these:</p>
        <div className="space-y-2">
          {content.reflectionPrompts.map((p, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-foreground">
              <span className="text-primary mt-0.5 shrink-0">→</span>
              {p}
            </div>
          ))}
        </div>
      </div>

      {/* Essay / Reflection */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{content.essayPrompt}</p>
        <textarea
          className="w-full rounded-xl border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[140px]"
          placeholder="Write your reflection here..."
          value={essay}
          onChange={(e) => setEssay(e.target.value)}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">{wordCount} words</span>
          {content.wordLimit && (
            <span className={`text-xs ${wordCount > content.wordLimit ? "text-destructive" : "text-muted-foreground"}`}>
              Limit: {content.wordLimit}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImplicationsBlock;
