import { useState } from "react";
import { ApplicationContent } from "@/data/textbookData";
import { Briefcase, Eye, Rocket, Send, Loader2, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

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
      const { data, error } = await supabase.functions.invoke("inline-evaluate", {
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
      <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Rocket className="h-5 w-5 text-amber-700 dark:text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">🚀 Real Life Mission</span>
        </div>
        <div className="flex items-start gap-3">
          <Briefcase className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-base font-bold font-serif text-foreground mb-1">{content.harvardLabel || content.scenario}</p>
            <p className="text-base text-muted-foreground leading-relaxed">{content.context}</p>
          </div>
        </div>
      </div>

      {content.questions.map((q, i) => (
        <div key={i} className="rounded-xl border bg-card p-5">
          <p className="text-base font-medium text-foreground mb-2 flex items-start gap-2">
            <span className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
            {q.question}
          </p>
          {q.hint && <p className="text-sm text-muted-foreground italic ml-9 mb-2">💡 {q.hint}</p>}
          <textarea
            className="w-full ml-9 max-w-[calc(100%-2.25rem)] rounded-lg border bg-background px-3 py-2.5 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            rows={2}
            placeholder="Write your answer here — there's no wrong answer! ✍️"
            value={answers[i] || ""}
            onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
          />
        </div>
      ))}

      {/* Submit / Feedback */}
      {feedback ? (
        <div className="rounded-xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 space-y-2">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-bold">AI Feedback</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{feedback}</p>
          <Button variant="ghost" size="sm" onClick={() => setFeedback(null)}><RotateCcw className="h-3 w-3 mr-1" /> Try again</Button>
        </div>
      ) : canSubmit ? (
        <Button onClick={handleSubmit} disabled={loading} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Evaluating...</> : <><Send className="h-3.5 w-3.5" /> Submit for Feedback</>}
        </Button>
      ) : null}

      <div className="rounded-xl border-2 border-dashed border-accent bg-accent/10 p-5">
        {showWhy ? (
          <div>
            <p className="text-xs font-semibold text-primary mb-1">🌍 Here's why this is actually cool:</p>
            <p className="text-base text-foreground leading-relaxed">{content.realWorldWhy}</p>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setShowWhy(true)}>
            <Eye className="h-3.5 w-3.5 mr-1" /> OK but why should I care? 🤔
          </Button>
        )}
      </div>

      {content.careers && content.careers.length > 0 && (
        <div className="rounded-xl bg-muted/40 border border-border p-5">
          <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">🦸 People who use this every day</p>
          <div className="flex flex-wrap gap-2">
            {content.careers.map((career, i) => (
              <Badge key={i} variant="secondary" className="text-xs px-3 py-1 font-medium">{career}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationBlock;
