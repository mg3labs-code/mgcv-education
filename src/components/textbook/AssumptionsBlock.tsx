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

      {content.hiddenAssumptions.map((a, i) => {
        const belief = beliefs[i];
        const isRevealed = expanded[i];

        return (
          <div key={i} className="rounded-xl border-2 border-border/50 bg-card overflow-hidden shadow-sm">
            {/* Statement */}
            <div className="p-4">
              <div className="flex items-start gap-3">
                <span className="h-7 w-7 rounded-full bg-gradient-to-br from-red-200 to-orange-200 dark:from-red-800 dark:to-orange-800 text-red-800 dark:text-red-200 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-[0.95rem] font-medium text-foreground">"{a.assumption}"</p>

                  {/* Believe / Doubt toggle — shown before reveal */}
                  {!belief && (
                    <div className="flex gap-3 mt-3 animate-fade-in">
                      <button onClick={() => handleBelief(i, "believe")}
                        className="flex-1 py-2 rounded-lg border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 font-semibold text-sm hover:bg-blue-100 transition-all flex items-center justify-center gap-1.5">
                        👍 I believe this
                      </button>
                      <button onClick={() => handleBelief(i, "doubt")}
                        className="flex-1 py-2 rounded-lg border-2 border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 font-semibold text-sm hover:bg-orange-100 transition-all flex items-center justify-center gap-1.5">
                        🤔 I doubt this
                      </button>
                    </div>
                  )}

                  {/* After choosing, show reveal button */}
                  {belief && !isRevealed && (
                    <button onClick={() => setExpanded({ ...expanded, [i]: true })}
                      className="mt-3 w-full py-2 rounded-lg border-2 border-dashed border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/10 text-red-700 dark:text-red-400 font-semibold text-sm hover:bg-red-100/50 transition-all flex items-center justify-center gap-2">
                      🔍 Now let's bust this myth!
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {isRevealed && (
              <div className="px-4 pb-4 space-y-3 border-t pt-3">
                {/* Show what they believed */}
                <div className={`rounded-lg px-3 py-2 text-xs font-medium ${
                  belief === "believe" ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400" : "bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400"
                }`}>
                  You said: {belief === "believe" ? "\"I believe this\" 👍" : "\"I doubt this\" 🤔"}
                </div>

                <ImportantNote title="Mind-blowing part">
                  <p className="text-[0.95rem] text-foreground">{a.whyItMatters}</p>
                </ImportantNote>

                {/* Reflection prompt */}
                {!reflections[i] ? (
                  <div className="rounded-lg bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 p-3">
                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-2">💭 Why did you think that?</p>
                    <textarea
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px]"
                      placeholder="Reflect on why you believed or doubted this..."
                      onBlur={(e) => {
                        if (e.target.value.trim()) setReflections(prev => ({ ...prev, [i]: e.target.value }));
                      }}
                    />
                  </div>
                ) : (
                  <div className="rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Great reflection! This builds your Thinking dimension 🧠
                    </p>
                  </div>
                )}

                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                  <p className="text-xs font-semibold text-primary mb-1">🎯 Your mission:</p>
                  <p className="text-[0.95rem] text-foreground">{a.challenge}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}

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
