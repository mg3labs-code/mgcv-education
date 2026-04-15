import { useState } from "react";
import { Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import CompanionVoiceInput from "@/components/student/CompanionVoiceInput";

const Step1ThinkBox = ({ centralQuestion }: { centralQuestion: string }) => {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="space-y-3">
      {/* Big Question Card */}
      <div className="rounded-xl bg-muted/50 p-4 border border-border/50">
        <p className="text-xs font-bold text-primary mb-1">🎯 The Big Question</p>
        <p className="text-[0.95rem] text-foreground leading-relaxed">{centralQuestion}</p>
      </div>

      {submitted ? (
        <div className="rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border-2 border-emerald-300 dark:border-emerald-700 p-4 space-y-2">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">✅ Your thinking:</p>
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{answer}</p>
          <p className="text-xs text-muted-foreground italic">Great! Now explore the next steps to compare.</p>
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
          <Button size="sm" onClick={() => setSubmitted(true)} disabled={answer.trim().length < 5} className="w-full">
            <Send className="h-3.5 w-3.5 mr-2" /> Submit my thinking
          </Button>
        </div>
      )}
    </div>
  );
};

export default Step1ThinkBox;
