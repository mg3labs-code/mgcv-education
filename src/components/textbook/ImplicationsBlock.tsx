import { useState } from "react";
import { ImplicationsContent } from "@/data/textbookData";
import { Compass, Mic, Send, Loader2, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  amber: { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", text: "text-amber-800 dark:text-amber-300" },
  sky: { bg: "bg-sky-50 dark:bg-sky-950/30", border: "border-sky-200 dark:border-sky-800", text: "text-sky-800 dark:text-sky-300" },
  purple: { bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-800", text: "text-purple-800 dark:text-purple-300" },
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
      const { data } = await supabase.functions.invoke("evaluate-answer", {
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
      <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/20 border border-primary/20 p-5">
        <div className="flex items-start gap-3">
          <Compass className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-primary mb-1">🔮 Imagine this...</p>
            <p className="text-base font-semibold font-serif text-foreground">{content.whatIfQuestion}</p>
          </div>
        </div>
      </div>

      {content.implications && content.implications.length > 0 ? (
        <div className="grid gap-4">
          {content.implications.map((imp, i) => {
            const colors = colorMap[imp.color] || colorMap.amber;
            return (
              <div key={i} className={`rounded-xl border p-5 ${colors.bg} ${colors.border}`}>
                <p className={`text-sm font-bold mb-3 flex items-center gap-2 ${colors.text}`}>{imp.icon} {imp.category}</p>
                <ul className="space-y-2">
                  {imp.points.map((point, j) => (
                    <li key={j} className="flex items-start gap-2 text-base text-foreground leading-relaxed">
                      <span className={`mt-1.5 shrink-0 ${colors.text}`}>•</span>{point}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3">🧠 Let these ideas bounce around your brain:</p>
          <div className="space-y-2">
            {content.reflectionPrompts.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-base text-foreground">
                <span className="text-primary mt-0.5 shrink-0">→</span>{p}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-5 py-3">
          <p className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-2">✏️ Your Turn to Think Big</p>
        </div>
        <p className="text-base font-medium text-foreground">{content.essayPrompt}</p>

        {!voiceMode ? (
          <>
            <textarea
              className="w-full rounded-xl border bg-background px-4 py-3 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[140px] leading-relaxed"
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
                  <Mic className="h-3.5 w-3.5 mr-1" /> 🎤 Say it out loud instead
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center">
            <Mic className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">Voice recording coming soon — for now, type your ideas!</p>
            <Button variant="ghost" size="sm" onClick={() => setVoiceMode(false)}>Switch to text</Button>
          </div>
        )}

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
        ) : wordCount >= 5 ? (
          <Button onClick={handleSubmit} disabled={loading} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Evaluating...</> : <><Send className="h-3.5 w-3.5" /> Submit for Feedback</>}
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default ImplicationsBlock;
