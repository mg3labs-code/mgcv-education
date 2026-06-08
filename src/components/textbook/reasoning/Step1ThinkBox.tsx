import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, RotateCcw, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import CompanionVoiceInput from "@/components/student/CompanionVoiceInput";
import { supabase } from "@/integrations/supabase/client";

const Step1ThinkBox = ({
  centralQuestion,
  topic = "Reasoning",
  onComplete,
  onDebugEvent,
}: {
  centralQuestion: string;
  topic?: string;
  onComplete?: () => void;
  onDebugEvent?: (event: string, details?: Record<string, unknown>) => void;
}) => {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (answer.trim().length < 5 || loading) return;
    setLoading(true);
    setError(null);
    onDebugEvent?.("reasoning_submit_start", { step: 1, prompt: centralQuestion, answerLength: answer.trim().length });
    try {
      const { data, error: evalError } = await supabase.functions.invoke("inline-evaluate", {
        body: { topic, prompt: centralQuestion, answer },
      });
      if (evalError) throw evalError;
      const nextFeedback = data?.feedback || "Good start. Add one clear reason and one example to make your thinking stronger.";
      setFeedback(nextFeedback);
      setSubmitted(true);
      onComplete?.();
      onDebugEvent?.("reasoning_submit_success", { step: 1, feedbackLength: nextFeedback.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Evaluation failed";
      setError(message);
      onDebugEvent?.("reasoning_submit_error", { step: 1, message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Big Question Card */}
      <div className="rounded-xl bg-muted/50 p-4 border border-border/50">
        <p className="text-xs font-bold text-primary mb-1">🎯 The Big Question</p>
        <p className="text-[0.95rem] text-foreground leading-relaxed">{centralQuestion}</p>
      </div>

      {submitted ? (
        <div className="rounded-xl bg-card border-2 border-primary/30 p-4 space-y-3">
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs font-bold text-primary mb-1">Your thinking</p>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{answer}</p>
          </div>
          {feedback && (
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
              <div className="flex items-center gap-2 text-primary mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <p className="text-xs font-bold">AI feedback</p>
              </div>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{feedback}</p>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => { setSubmitted(false); setFeedback(null); }}>
            <RotateCcw className="h-3 w-3 mr-1" /> Improve answer
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">✍️ Write or speak your answer:</p>
          <div className="relative">
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="What do you think and why?"
              className="min-h-[80px] pr-12 text-sm resize-none"
            />
            <div className="absolute right-2 bottom-2">
              <CompanionVoiceInput
                onTranscript={(text) => setAnswer((prev) => (prev ? prev + " " + text : text))}
                disabled={false}
              />
            </div>
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>Evaluation did not run: {error}</span>
            </div>
          )}
          <Button size="sm" onClick={handleSubmit} disabled={answer.trim().length < 5 || loading} className="w-full">
            {loading ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-2" />}
            {loading ? "Evaluating..." : "Submit and evaluate"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Step1ThinkBox;
