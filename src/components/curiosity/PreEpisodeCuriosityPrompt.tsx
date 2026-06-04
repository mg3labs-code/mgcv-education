import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  emoji: string;
  interestLabel: string;
  conceptLabel: string; // e.g. "real numbers"
  chapterId: string;
  episodeId: string;
  conceptKey: string;
  onContinue: () => void;
}

/**
 * One-screen curiosity prompt shown right before Day 1 Spark.
 * Captures the student's free-text "what are you wondering about" and persists it
 * to curiosity_arc_progress.day1_first_thought. Skippable.
 */
export default function PreEpisodeCuriosityPrompt({
  emoji,
  interestLabel,
  conceptLabel,
  chapterId,
  episodeId,
  conceptKey,
  onContinue,
}: Props) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (thought: string | null) => {
    if (!user) { onContinue(); return; }
    setSaving(true);
    try {
      await supabase.from("curiosity_arc_progress").upsert(
        {
          user_id: user.id,
          concept_key: conceptKey,
          day1_first_thought: thought,
          interest_tag: interestLabel.toLowerCase(),
        },
        { onConflict: "user_id,concept_key" } as never,
      );
    } catch { /* non-blocking */ }
    setSaving(false);
    onContinue();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg space-y-5 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wide">
            <Sparkles className="h-3 w-3" /> Quick thought before we start
          </div>
          <h1 className="text-2xl font-bold text-foreground leading-snug">
            <span aria-hidden>{emoji} </span>
            What's the trickiest thing about{" "}
            <span className="text-primary">{conceptLabel}</span> in {interestLabel.toLowerCase()} you've ever wondered?
          </h1>
          <p className="text-sm text-muted-foreground">
            One line is enough. We'll bring it back tomorrow.
          </p>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 120))}
          placeholder={`e.g. "How can a team win but have negative run-rate?"`}
          rows={3}
          className="w-full rounded-xl border-2 border-border bg-card p-3 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{text.length}/120</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={saving}
            onClick={() => save(null)}
          >
            Skip
          </Button>
          <Button
            type="button"
            className="flex-1"
            disabled={saving || !text.trim()}
            onClick={() => save(text.trim())}
          >
            Save & start <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
