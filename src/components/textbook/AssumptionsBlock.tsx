import { useState } from "react";
import { AssumptionsContent } from "@/data/textbookData";
import { AlertTriangle, ChevronDown, ChevronUp, Shield, Timer, Send, Loader2, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ExampleCard, ImportantNote } from "@/components/textbook/ContentCards";

interface AssumptionsBlockProps {
  content: AssumptionsContent;
  onStartDefense?: () => void;
}

const AssumptionsBlock = ({ content, onStartDefense }: AssumptionsBlockProps) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [showDefense, setShowDefense] = useState(false);
  const [defenseText, setDefenseText] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const wordCount = defenseText.trim().split(/\s+/).filter(Boolean).length;

  const handleSubmitDefense = async () => {
    if (wordCount < 5) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("inline-evaluate", {
        body: {
          topic: content.concept,
          prompt: content.defensePrompt,
          answer: defenseText,
        },
      });
      if (error) throw error;
      setFeedback(data?.feedback || "Strong defense! You're thinking critically. 🛡️");
    } catch {
      setFeedback("Great effort defending your understanding! Keep questioning assumptions. 💪");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden border-2 border-destructive/30 shadow-sm">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 px-5 py-3 border-b border-red-200 dark:border-red-800">
          <p className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            🕵️ Detective Mode: What if everyone's wrong about {content.concept}?
          </p>
        </div>
        <div className="px-5 py-3 bg-red-50/20 dark:bg-red-950/10">
          <p className="text-sm text-muted-foreground italic">
            Most people believe these without checking. Can YOU spot the trick?
          </p>
        </div>
      </div>

      {content.hiddenAssumptions.map((a, i) => (
        <div key={i} className="rounded-xl border-2 border-border/50 bg-card overflow-hidden shadow-sm">
          <button
            onClick={() => setExpanded({ ...expanded, [i]: !expanded[i] })}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="h-7 w-7 rounded-full bg-gradient-to-br from-red-200 to-orange-200 dark:from-red-800 dark:to-orange-800 text-red-800 dark:text-red-200 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div>
                <p className="text-[0.95rem] font-medium text-foreground">"{a.assumption}"</p>
                <p className="text-xs text-muted-foreground mt-0.5">Tap to bust this myth! 🔍</p>
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
              <ImportantNote title="Mind-blowing part">
                <p className="text-[0.95rem] text-foreground">{a.whyItMatters}</p>
              </ImportantNote>
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                <p className="text-xs font-semibold text-primary mb-1">🎯 Your mission:</p>
                <p className="text-[0.95rem] text-foreground">{a.challenge}</p>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Defense prompt with evaluation */}
      <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-[0.95rem] font-semibold font-serif text-foreground mb-1">⚔️ Can you defend your answer?</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{content.defensePrompt}</p>
            </div>

            {!showDefense ? (
              <Button size="sm" onClick={() => setShowDefense(true)}>
                <Shield className="h-3.5 w-3.5 mr-1" /> I'm ready! Let's go 💪
              </Button>
            ) : feedback ? (
              <ExampleCard title="AI Feedback" defaultOpen={true}>
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-bold">Defense evaluated!</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{feedback}</p>
                <Button variant="ghost" size="sm" onClick={() => { setFeedback(null); setDefenseText(""); }} className="mt-2">
                  <RotateCcw className="h-3 w-3 mr-1" /> Try again
                </Button>
              </ExampleCard>
            ) : (
              <>
                <textarea
                  className="w-full rounded-xl border-2 border-border/50 bg-background px-4 py-3 text-[0.95rem] resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[100px] leading-relaxed"
                  placeholder="Pretend you're explaining to a friend who disagrees..."
                  value={defenseText}
                  onChange={(e) => setDefenseText(e.target.value)}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {wordCount} words {wordCount > 0 && wordCount < 5 ? "(write at least 5 to submit)" : ""}
                  </span>
                  {wordCount >= 5 && (
                    <Button onClick={handleSubmitDefense} disabled={loading} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                      {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Evaluating...</> : <><Send className="h-3.5 w-3.5" /> Submit Defense</>}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Inline Tutorial Defense CTA */}
      {onStartDefense && (
        <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 p-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
              <Shield className="h-6 w-6 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-[0.95rem] font-bold font-serif text-foreground">Think you really get it? Prove it!</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <Timer className="h-3.5 w-3.5" /> 5 min · AI buddy will ask you tricky questions
              </p>
            </div>
            <Button onClick={onStartDefense} className="bg-amber-600 hover:bg-amber-700 text-white shrink-0">
              <Shield className="h-4 w-4 mr-1" /> Start Tutorial Defense
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssumptionsBlock;
