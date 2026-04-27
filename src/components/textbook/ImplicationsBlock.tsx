import { useState } from "react";
import { ImplicationsContent } from "@/data/textbookData";
import { Compass, AudioLines, Send, Loader2, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { InsightCard, ExampleCard, ImportantNote } from "@/components/textbook/ContentCards";

const colorMap: Record<string, "teal" | "purple" | "amber" | "sky"> = {
  amber: "amber",
  sky: "sky",
  purple: "purple",
};

const ImplicationsBlock = ({ content }: { content: ImplicationsContent }) => {
  const [essay, setEssay] = useState("");
  const wordCount = essay.trim().split(/\s+/).filter(Boolean).length;
  const [voiceMode, setVoiceMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("inline-evaluate", {
        body: { topic: "Implications", prompt: content.essayPrompt, answer: essay },
      });
      setFeedback(data?.feedback || "Impressive thinking! You're connecting ideas beautifully. 🌟");
    } catch {
      setFeedback("Great reflection! Keep thinking about how ideas shape the world. 💡");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <InsightCard title="🔮 Imagine this..." color="purple">
        <div className="flex items-start gap-3 mt-1">
          <Compass className="h-5 w-5 mt-0.5 shrink-0" />
          <p className="text-base font-semibold font-serif text-foreground">{content.whatIfQuestion}</p>
        </div>
      </InsightCard>

      {content.implications && content.implications.length > 0 ? (
        <div className="grid gap-4">
          {content.implications.map((imp, i) => {
            const cardColor = colorMap[imp.color] || "teal";
            return (
              <InsightCard key={i} title={`${imp.icon} ${imp.category}`} color={cardColor}>
                <ul className="space-y-2 mt-1">
                  {imp.points.map((point, j) => (
                    <li key={j} className="flex items-start gap-2 text-[0.95rem] text-foreground leading-relaxed">
                      <span className="mt-1.5 shrink-0">•</span>{point}
                    </li>
                  ))}
                </ul>
              </InsightCard>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3">🧠 Let these ideas bounce around your brain:</p>
          <div className="space-y-2">
            {content.reflectionPrompts.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-[0.95rem] text-foreground">
                <span className="text-primary mt-0.5 shrink-0">→</span>{p}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <ImportantNote title="Your Turn to Think Big">
          <p className="text-[0.95rem] font-medium text-foreground">{content.essayPrompt}</p>
        </ImportantNote>

        {!voiceMode ? (
          <>
            <textarea
              className="w-full rounded-xl border bg-background px-4 py-3 text-[0.95rem] resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[140px] leading-relaxed"
              placeholder="Share your thoughts — even wild ideas are welcome! 🚀"
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">{wordCount} words</span>
              <div className="flex items-center gap-3">
                {content.wordLimit && (
                  <span className={`text-xs ${wordCount > content.wordLimit ? "text-destructive" : "text-muted-foreground"}`}>Limit: {content.wordLimit}</span>
                )}
                <Button variant="outline" size="sm" onClick={() => setVoiceMode(true)}>
                  <AudioLines className="h-3.5 w-3.5 mr-1" /> 🎤 Say it out loud instead
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center">
            <AudioLines className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">Voice recording coming soon — for now, type your ideas!</p>
            <Button variant="ghost" size="sm" onClick={() => setVoiceMode(false)}>Switch to text</Button>
          </div>
        )}

        {/* Submit / Feedback */}
        {feedback ? (
          <ExampleCard title="Answer feedback" defaultOpen={true}>
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-bold">Well done!</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{feedback}</p>
            <Button variant="ghost" size="sm" onClick={() => setFeedback(null)} className="mt-2"><RotateCcw className="h-3 w-3 mr-1" /> Try again</Button>
          </ExampleCard>
        ) : wordCount >= 5 ? (
          <Button onClick={handleSubmit} disabled={loading} size="sm" className="min-w-[132px] bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking...</> : <><Send className="h-3.5 w-3.5" /> Check my answer</>}
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default ImplicationsBlock;
