import { useState } from "react";
import { ApplicationContent } from "@/data/textbookData";
import { Briefcase, Eye, Rocket, Send, Loader2, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { DefinitionCard, ExampleCard, InsightCard } from "@/components/textbook/ContentCards";

const ApplicationBlock = ({ content }: { content: ApplicationContent }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showWhy, setShowWhy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const allAnswers = Object.values(answers).filter(v => v.trim().length > 2);
  const canSubmit = allAnswers.length > 0;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("inline-evaluate", {
        body: { topic: content.scenario, prompt: content.context, answer: Object.values(answers).join("\n") },
      });
      setFeedback(data?.feedback || "Good thinking! Keep exploring real-world applications. 🚀");
    } catch {
      setFeedback("Nice attempt! Real-world thinking is exactly what matters. 💡");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      {/* Scenario header as InsightCard */}
      <InsightCard title="🚀 Real Life Mission" color="amber">
        <div className="flex items-start gap-3 mt-1">
          <Briefcase className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-base font-bold font-serif text-foreground mb-1">{content.harvardLabel || content.scenario}</p>
            <p className="text-[0.95rem] text-foreground/80 leading-relaxed">{content.context}</p>
          </div>
        </div>
      </InsightCard>

      {content.questions.map((q, i) => (
        <div key={i} className="rounded-xl border-2 border-border/50 bg-card p-5 shadow-sm">
          <p className="text-[0.95rem] font-medium text-foreground mb-3 flex items-start gap-3">
            <span className="h-7 w-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
            {q.question}
          </p>
          {q.hint && (
            <div className="ml-10 mb-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
              <p className="text-sm text-amber-700 dark:text-amber-400 italic">💡 {q.hint}</p>
            </div>
          )}
          <textarea
            className="w-full ml-10 max-w-[calc(100%-2.5rem)] rounded-lg border bg-background px-3 py-2.5 text-[0.95rem] resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            rows={2}
            placeholder="Write your answer here — there's no wrong answer! ✍️"
            value={answers[i] || ""}
            onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
          />
        </div>
      ))}

      {/* Submit / Feedback */}
      {feedback ? (
        <ExampleCard title="AI Feedback" defaultOpen={true}>
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-bold">Great effort!</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{feedback}</p>
          <Button variant="ghost" size="sm" onClick={() => setFeedback(null)} className="mt-2"><RotateCcw className="h-3 w-3 mr-1" /> Try again</Button>
        </ExampleCard>
      ) : canSubmit ? (
        <Button onClick={handleSubmit} disabled={loading} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Evaluating...</> : <><Send className="h-3.5 w-3.5" /> Submit for Feedback</>}
        </Button>
      ) : null}

      {/* Why should I care */}
      <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5">
        {showWhy ? (
          <ExampleCard title="Here's why this is actually cool" defaultOpen={true}>
            <p className="text-[0.95rem] text-foreground leading-relaxed">{content.realWorldWhy}</p>
          </ExampleCard>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setShowWhy(true)}>
            <Eye className="h-3.5 w-3.5 mr-1" /> OK but why should I care? 🤔
          </Button>
        )}
      </div>

      {content.careers && content.careers.length > 0 && (
        <DefinitionCard title="People who use this every day">
          <div className="flex flex-wrap gap-2">
            {content.careers.map((career, i) => (
              <Badge key={i} variant="secondary" className="text-xs px-3 py-1.5 font-medium">{career}</Badge>
            ))}
          </div>
        </DefinitionCard>
      )}
    </div>
  );
};

export default ApplicationBlock;
