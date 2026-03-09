import { useState } from "react";
import { ApplicationContent } from "@/data/textbookData";
import { Briefcase, ChevronRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

const ApplicationBlock = ({ content }: { content: ApplicationContent }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showWhy, setShowWhy] = useState(false);

  return (
    <div className="space-y-4">
      {/* Scenario Card */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-5">
        <div className="flex items-start gap-3">
          <Briefcase className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-foreground mb-1">{content.scenario}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{content.context}</p>
          </div>
        </div>
      </div>

      {/* Questions */}
      {content.questions.map((q, i) => (
        <div key={i} className="rounded-xl border bg-card p-4">
          <p className="text-sm font-medium text-foreground mb-2 flex items-start gap-2">
            <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              {i + 1}
            </span>
            {q.question}
          </p>
          {q.hint && (
            <p className="text-xs text-muted-foreground italic ml-8 mb-2">💡 {q.hint}</p>
          )}
          <textarea
            className="w-full ml-8 max-w-[calc(100%-2rem)] rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            rows={2}
            placeholder="Work it out here..."
            value={answers[i] || ""}
            onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
          />
        </div>
      ))}

      {/* Real World Why */}
      <div className="rounded-xl border-2 border-dashed border-accent bg-accent/10 p-4">
        {showWhy ? (
          <div>
            <p className="text-xs font-semibold text-primary mb-1">🌍 Why this matters in real life:</p>
            <p className="text-sm text-foreground">{content.realWorldWhy}</p>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setShowWhy(true)}>
            <Eye className="h-3.5 w-3.5 mr-1" /> Why does this matter?
          </Button>
        )}
      </div>
    </div>
  );
};

export default ApplicationBlock;
