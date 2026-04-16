import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Lightbulb, CheckCircle2 } from "lucide-react";
import CompanionVoiceInput from "@/components/student/CompanionVoiceInput";

interface BrainstormBlockProps {
  topic: string;
  prompt?: string;
  minIdeas?: number;
  onComplete?: (ideaCount: number) => void;
}

const DEFAULT_PROMPTS = [
  "List 3 different ways this idea could be wrong or fail",
  "What 3 questions would you ask the inventor of this concept?",
  "Where else in daily life have you seen something similar?",
  "If you had to teach this to a 5-year-old, what would you say?",
];

const BrainstormBlock = ({ topic, prompt, minIdeas = 3, onComplete }: BrainstormBlockProps) => {
  const [ideas, setIdeas] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const finalPrompt = prompt || DEFAULT_PROMPTS[Math.floor(Math.random() * DEFAULT_PROMPTS.length)];
  const ideaCount = ideas.split(/[\n.]+/).filter(s => s.trim().length > 4).length;

  const handleSubmit = () => {
    setSubmitted(true);
    onComplete?.(ideaCount);
  };

  return (
    <div className="rounded-2xl border-2 border-amber-300/40 bg-gradient-to-br from-amber-50/50 via-background to-orange-50/30 dark:from-amber-950/30 dark:to-orange-950/20 p-5 space-y-4 my-4">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            🧠 Brainstorm Challenge
          </p>
          <h3 className="text-sm font-bold text-foreground leading-snug">{topic}</h3>
        </div>
      </div>

      <div className="bg-card/70 rounded-xl p-3 border border-amber-200/50">
        <div className="flex items-start gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/90 font-medium leading-relaxed">{finalPrompt}</p>
        </div>
      </div>

      {!submitted ? (
        <>
          <Textarea
            value={ideas}
            onChange={(e) => setIdeas(e.target.value)}
            placeholder={`Type ${minIdeas}+ different ideas (one per line)...`}
            className="min-h-[100px] text-sm bg-card/50 border-amber-200/40"
          />
          <div className="flex items-center justify-between gap-2">
            <CompanionVoiceInput
              onTranscript={(text) => setIdeas(prev => prev ? `${prev}\n${text}` : text)}
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {ideaCount} idea{ideaCount !== 1 ? "s" : ""}
              </span>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={ideaCount < 1}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Submit
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-3 space-y-2">
          <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500" />
          <p className="text-sm font-semibold text-foreground">
            {ideaCount >= minIdeas ? `🎉 Great thinking — ${ideaCount} ideas!` : `Good start — ${ideaCount} idea${ideaCount > 1 ? "s" : ""}.`}
          </p>
          <p className="text-xs text-muted-foreground">
            {ideaCount >= minIdeas
              ? "This kind of divergent thinking is what JEE toppers practice."
              : `Aim for ${minIdeas}+ next time to flex your brainstorming muscle.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default BrainstormBlock;
