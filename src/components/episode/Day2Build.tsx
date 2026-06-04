import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, ArrowRight, CheckCircle2, Flame, Lock, Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEpisodeDay } from "@/contexts/EpisodeDayContext";
import { supabase } from "@/integrations/supabase/client";
import { friendlyLabels } from "@/lib/childFriendlyLabels";
import CompanionVoiceInput from "@/components/student/CompanionVoiceInput";
import { useSoundFx } from "@/hooks/useSoundFx";
import TrapReveal from "@/components/episode/TrapReveal";
import SortTheRebels from "@/components/episode/SortTheRebels";
import ConfidenceLadder from "@/components/episode/ConfidenceLadder";
import type { SortPairsActivity } from "@/data/dayPilotContent";
import type { PilotExplainScore } from "@/hooks/useEpisodeDayUnlock";
import { toast } from "sonner";

export interface DeepDiveSection {
  title: string;
  /** Pre-rendered React node from the actual textbook (e.g. <ReasoningBlock />, <ConnectionsBlock />). */
  node: ReactNode;
}

interface Props {
  episodeTitle: string;
  /** Fallback plain text shown when no rich sections are provided. */
  deepDiveText: string;
  /** Optional rich sections pulled from the episode's content_blocks (mode-filtered upstream). */
  deepDiveSections?: DeepDiveSection[];
  detective1: { statement: string; isTrue: boolean; explain: string };
  detective2: { statement: string; isTrue: boolean; explain: string };
  /** Optional drag-drop pairs activity between deep-dive and explain. */
  sortActivity?: SortPairsActivity;
  /** Optional Confidence Ladder context — renders an explain-rung warm-up above recall. */
  ladder?: {
    chapterId?: string | null;
    episodeId?: string | null;
    conceptKey?: string | null;
    subject?: string | null;
    chapterSlug?: string | null;
  };
  onProgress?: (progress: number) => void;
}

type Screen = "recall" | "deepdive" | "sort" | "explain" | "det1" | "det2" | "done";

const Day2Build = ({ episodeTitle, deepDiveText, deepDiveSections, detective1, detective2, sortActivity, ladder, onProgress }: Props) => {
  const navigate = useNavigate();
  const { info, setDayState, isSaving } = useEpisodeDay();
  const { play } = useSoundFx();
  const day1Guess = info.state.day1_hook_answer;

  const [screen, setScreen] = useState<Screen>("recall");
  const [explanation, setExplanation] = useState("");
  const [scoreResult, setScoreResult] = useState<PilotExplainScore | null>(info.state.day2_explain_score);
  const [isScoring, setIsScoring] = useState(false);
  const [det1, setDet1] = useState<boolean | null>(null);
  const [det2, setDet2] = useState<boolean | null>(null);

  const handleSubmitExplanation = async () => {
    if (explanation.trim().split(/\s+/).filter(Boolean).length < 5) {
      toast.error("Try at least a sentence — your words matter!");
      return;
    }
    setIsScoring(true);
    try {
      const { data, error } = await supabase.functions.invoke("pilot-explain-score", {
        body: {
          episodeTitle,
          day: 2,
          prompt: "Explain why negative numbers were needed.",
          answer: explanation.trim(),
        },
      });
      if (error) throw error;
      const result = data as PilotExplainScore;
      setScoreResult(result);
      await setDayState({ day2_explanation: explanation.trim(), day2_explain_score: result });
    } catch {
      toast.error("Scoring paused — your answer is saved, and you can continue.");
      await setDayState({ day2_explanation: explanation.trim() });
      setScreen("det1");
    } finally {
      setIsScoring(false);
    }
  };

  const handleFinishDay2 = async () => {
    play("victory");
    await setDayState({ day2_completed_at: new Date().toISOString() });
    setScreen("done");
  };

  const pickAnswer = (which: "det1" | "det2", choice: boolean) => {
    const d = which === "det1" ? detective1 : detective2;
    const correct = choice === d.isTrue;
    play(correct ? "correct" : "wrong");
    if (which === "det1") setDet1(choice);
    else setDet2(choice);
  };

  // Recall
  if (screen === "recall") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-5 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wide">
              <Brain className="h-3 w-3" /> Remember this?
            </div>
            <p className="text-sm text-muted-foreground">Yesterday you guessed:</p>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-950/20 p-5">
            <p className="text-base text-foreground italic leading-relaxed">
              "{day1Guess || "(no answer recorded)"}"
            </p>
          </div>

          <p className="text-center text-foreground font-medium">
            Still think the same? Or has something shifted?
          </p>

          <Button onClick={() => setScreen("deepdive")} size="lg" className="w-full gap-1">
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">Step 1 of 5 · {episodeTitle}</p>
        </div>
      </div>
    );
  }

  // Deep Dive — uses real DB sections when available, falls back to plain text
  if (screen === "deepdive") {
    const hasRich = !!deepDiveSections && deepDiveSections.length > 0;
    return (
      <div className="min-h-[80vh] flex items-start justify-center px-4 py-6">
        <div className="w-full max-w-2xl space-y-4 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wide">
              <Layers className="h-3 w-3" /> Quick Read
            </div>
          </div>

          {hasRich ? (
            <div className="space-y-4">
              {deepDiveSections!.map((sec, i) => (
                <div key={i} className="rounded-2xl border-2 border-blue-200 dark:border-blue-800/60 bg-card p-3 sm:p-4 space-y-2">
                  <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                    {sec.title}
                  </h3>
                  {sec.node}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-blue-300 dark:border-blue-700 bg-card p-5">
              <p className="text-base text-foreground leading-relaxed whitespace-pre-line">{deepDiveText}</p>
            </div>
          )}

          <div className="text-center pt-1">
            <Button onClick={() => setScreen(sortActivity ? "sort" : "explain")} size="lg" className="gap-1">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">Step 2 of {sortActivity ? 6 : 5}</p>
        </div>
      </div>
    );
  }

  // Sort the Rebels (pairs) — optional
  if (screen === "sort" && sortActivity) {
    return (
      <SortTheRebels
        variant="pairs"
        title={sortActivity.title}
        subtitle={sortActivity.subtitle}
        leftItems={sortActivity.leftItems}
        rightItems={sortActivity.rightItems}
        explainOnRight={sortActivity.explainOnRight}
        explainOnWrong={sortActivity.explainOnWrong}
        onComplete={() => setScreen("explain")}
        stepLabel="Step 3 of 6"
      />
    );
  }

  // Explain in own words
  if (screen === "explain") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-5 animate-fade-in">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">Explain It Your Way</h2>
            <p className="text-sm text-muted-foreground">Why were negative numbers needed?</p>
          </div>
          <div className="rounded-2xl border-2 border-blue-300 dark:border-blue-700 bg-card p-4 space-y-3">
            <Textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="In your own words…"
              rows={5}
              className="resize-none border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              autoFocus
            />
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
              <CompanionVoiceInput
                onTranscript={(t) => setExplanation((p) => (p ? `${p} ${t}` : t).trim())}
                showLabel
              />
              <Button onClick={handleSubmitExplanation} disabled={!explanation.trim() || isSaving || isScoring || !!scoreResult} className="min-w-[132px] gap-2">
                {isScoring ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                {isScoring ? "Checking..." : "Check my answer"}
              </Button>
            </div>
          </div>
          {scoreResult && (
            <div className="rounded-2xl border-2 border-primary/25 bg-primary/5 p-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Answer check</p>
                  <p className="text-sm font-semibold text-foreground">{scoreResult.band}</p>
                </div>
                <div className="text-2xl font-bold text-primary tabular-nums">{scoreResult.score}%</div>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">{scoreResult.feedback}</p>
              <p className="text-xs text-muted-foreground">Next: {scoreResult.next_step}</p>
              <Button onClick={() => setScreen("det1")} className="w-full gap-1">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          <p className="text-center text-[11px] text-muted-foreground">Step 3 of 5</p>
        </div>
      </div>
    );
  }

  // Detective 1 / 2
  if (screen === "det1" || screen === "det2") {
    const isFirst = screen === "det1";
    const d = isFirst ? detective1 : detective2;
    const value = isFirst ? det1 : det2;
    const setValue = isFirst ? setDet1 : setDet2;
    const goNext = () => (isFirst ? setScreen("det2") : handleFinishDay2());

    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-5 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wide">
              Spot the Mistake
            </div>
          </div>
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <p className="text-lg text-foreground leading-relaxed text-center">"{d.statement}"</p>
          </div>

          {value === null ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => pickAnswer(screen as "det1" | "det2", true)}
                className="rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 px-4 py-5 text-emerald-700 dark:text-emerald-400 font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <div className="text-2xl mb-1">✅</div> I Believe It
              </button>
              <button
                onClick={() => pickAnswer(screen as "det1" | "det2", false)}
                className="rounded-2xl border-2 border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20 px-4 py-5 text-orange-700 dark:text-orange-400 font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <div className="text-2xl mb-1">🤔</div> I Doubt It
              </button>
            </div>
          ) : (
            <TrapReveal
              isCorrect={value === d.isTrue}
              explain={d.explain}
              onRetry={() => setValue(null)}
              onContinue={goNext}
              continueLabel={isFirst ? "Next" : "Finish Day 2"}
              disabled={isSaving}
            />
          )}
          <p className="text-center text-[11px] text-muted-foreground">Step {isFirst ? 4 : 5} of 5</p>
        </div>
      </div>
    );
  }

  // Done
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center space-y-6 animate-fade-in">
        <div className="relative inline-flex items-center justify-center">
          <div className="h-24 w-24 rounded-full bg-blue-500/15 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-blue-500" />
          </div>
          <span className="absolute -bottom-1 -right-1 h-10 w-10 rounded-full bg-orange-500 border-2 border-background flex items-center justify-center text-white">
            <Flame className="h-5 w-5" />
          </span>
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-foreground">What Changed in Your Thinking</h1>
          <p className="text-sm text-muted-foreground">{episodeTitle}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <p className="text-sm text-foreground/80 leading-relaxed">
            You can now explain why number families grow and catch common mistakes instead of only choosing answers.
          </p>
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm border-t border-border pt-3">
            <Lock className="h-4 w-4" /> Day 3 unlocks tomorrow
          </div>
          <p className="text-sm text-foreground/80 italic leading-relaxed pt-2 border-t border-border">
            "Tomorrow you'll prove it — and make it truly yours."
          </p>
        </div>
        <Button onClick={() => navigate("/student/dashboard")} size="lg" className="w-full">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Day2Build;
