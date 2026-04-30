import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, CheckCircle2, Flame, Lock, Image as ImageIcon, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEpisodeDay } from "@/contexts/EpisodeDayContext";
import { friendlyLabels } from "@/lib/childFriendlyLabels";
import CompanionVoiceInput from "@/components/student/CompanionVoiceInput";
import { useSoundFx } from "@/hooks/useSoundFx";
import TrapReveal from "@/components/episode/TrapReveal";
import SortTheRebels from "@/components/episode/SortTheRebels";
import ConfidenceLadder from "@/components/episode/ConfidenceLadder";
import type { SortBucketsActivity } from "@/data/dayPilotContent";
import { toast } from "sonner";

export interface QuickCheckQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explain: string;
}

interface Props {
  episodeTitle: string;
  /** A single hook question for this episode — provided by the page based on episode topic */
  hookQuestion: string;
  /** A short, age-appropriate concept summary (under 80 words) */
  conceptText: string;
  /** Optional: a richer story/illustration node pulled from the real episode (e.g. <VisualAidBlock>, <StoryReadingBlock>). Rendered between Reveal and Detective. */
  storyNode?: ReactNode;
  storyTitle?: string;
  /** Optional: a single-question multiple-choice quick check shown after Detective. */
  quickCheck?: QuickCheckQuestion;
  /** A single Believe/Doubt statement and whether it's true */
  detectiveStatement: string;
  detectiveIsTrue: boolean;
  detectiveExplain: string;
  /** Optional: drag-drop "Sort the Rebels" activity (buckets variant) between story and detective. */
  sortActivity?: SortBucketsActivity;
  /** Optional: Confidence Ladder context — when provided, renders a tiny warm-up rung above the hook. */
  ladder?: {
    chapterId?: string | null;
    episodeId?: string | null;
    conceptKey?: string | null;
    subject?: string | null;
    chapterSlug?: string | null;
  };
  /** Optional: reports 0–1 progress through the day back to parent for XP bar. */
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

type Screen = "hook" | "reveal" | "story" | "sort" | "detective" | "quickcheck" | "done";

const Day1Spark = ({
  episodeTitle,
  hookQuestion,
  conceptText,
  storyNode,
  storyTitle,
  quickCheck,
  detectiveStatement,
  detectiveIsTrue,
  detectiveExplain,
  sortActivity,
  ladder,
  onProgress,
  onComplete,
}: Props) => {
  const navigate = useNavigate();
  const { setDayState, isSaving } = useEpisodeDay();
  const { play } = useSoundFx();
  const [screen, setScreen] = useState<Screen>("hook");
  const [hookAnswer, setHookAnswer] = useState("");
  const [revealReady, setRevealReady] = useState(false);
  const [detective, setDetective] = useState<{ choice: boolean; correct: boolean } | null>(null);
  const [quickPick, setQuickPick] = useState<number | null>(null);
  const [shake, setShake] = useState(false);

  // total ordered steps for footer counter
  const steps: Screen[] = ["hook", "reveal"];
  if (storyNode) steps.push("story");
  if (sortActivity) steps.push("sort");
  steps.push("detective");
  if (quickCheck) steps.push("quickcheck");
  const stepNumber = (s: Screen) => Math.max(1, steps.indexOf(s) + 1);
  const totalSteps = steps.length;

  // Report sub-step progress upward for XP bar
  useEffect(() => {
    if (!onProgress) return;
    const idx = steps.indexOf(screen);
    const frac = idx < 0 ? 0 : Math.min(1, (idx + (screen === "done" ? 1 : 0.5)) / totalSteps);
    onProgress(frac);
     
  }, [screen]);

  // Law 5 — silence is a feature: 3-second pause before "Continue" appears on Reveal
  useEffect(() => {
    if (screen !== "reveal") return;
    setRevealReady(false);
    const id = setTimeout(() => setRevealReady(true), 3000);
    return () => clearTimeout(id);
  }, [screen]);

  const handleSubmitHook = async () => {
    const trimmed = hookAnswer.trim();
    if (trimmed.split(/\s+/).filter(Boolean).length < 2) {
      toast.error("Try a few more words — even a guess works!");
      return;
    }
    await setDayState({ day1_hook_answer: trimmed });
    setScreen("reveal");
  };

  const handleDetective = async (choice: boolean) => {
    const correct = choice === detectiveIsTrue;
    setDetective({ choice, correct });
    play(correct ? "correct" : "wrong");
    if (!correct) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  };

  const retryDetective = () => {
    setDetective(null);
  };

  const advanceFromDetective = () => {
    if (quickCheck) setScreen("quickcheck");
    else handleFinishDay1();
  };

  const handleFinishDay1 = async () => {
    play("victory");
    await setDayState({
      day1_completed_at: new Date().toISOString(),
      day1_detective_correct: detective?.correct ?? null,
    });
    setScreen("done");
    onComplete?.();
  };

  // ─── Screen 1: Hook ─────────────────────────────────────────
  if (screen === "hook") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wide">
              <Sparkles className="h-3 w-3" />
              First Guess
            </div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">{hookQuestion}</h1>
            <p className="text-sm text-muted-foreground">No right answer. Just your honest first thought.</p>
          </div>

          <div className="rounded-2xl border-2 border-primary/30 bg-card p-4 space-y-3">
            <Textarea
              value={hookAnswer}
              onChange={(e) => setHookAnswer(e.target.value)}
              placeholder="Type your guess… or tap the mic to speak"
              rows={4}
              className="resize-none border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              autoFocus
            />
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
              <CompanionVoiceInput
                onTranscript={(t) =>
                  setHookAnswer((prev) => (prev ? `${prev} ${t}` : t).trim())
                }
                showLabel
              />
              <Button onClick={handleSubmitHook} disabled={!hookAnswer.trim() || isSaving} className="gap-1">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            Step 1 of {totalSteps} · {episodeTitle}
          </p>
        </div>
      </div>
    );
  }

  // ─── Screen 2: Reveal ───────────────────────────────────────
  if (screen === "reveal") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-5 animate-fade-in">
          {hookAnswer && (
            <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/40 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                You thought
              </p>
              <p className="text-sm text-foreground italic">"{hookAnswer}"</p>
            </div>
          )}

          <div className="rounded-2xl border-2 border-primary/30 bg-card p-5 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wide">
              <Sparkles className="h-3 w-3" />
              Quick Read
            </div>
            <p className="text-base text-foreground leading-relaxed">{conceptText}</p>
          </div>

          <div className="text-center min-h-[48px]">
            {revealReady ? (
              <Button
                onClick={() => setScreen(storyNode ? "story" : sortActivity ? "sort" : "detective")}
                size="lg"
                className="gap-1 animate-fade-in"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground/70 italic animate-fade-in">Take a moment to read…</p>
            )}
          </div>

          <p className="text-center text-[11px] text-muted-foreground">Step {stepNumber("reveal")} of {totalSteps}</p>
        </div>
      </div>
    );
  }

  // ─── Screen 3 (optional): Story / Visual ───────────────────
  if (screen === "story" && storyNode) {
    return (
      <div className="min-h-[80vh] flex items-start justify-center px-4 py-6">
        <div className="w-full max-w-2xl space-y-4 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-400 text-[11px] font-bold uppercase tracking-wide">
              <ImageIcon className="h-3 w-3" />
              See it in action
            </div>
            {storyTitle && (
              <h2 className="text-lg font-bold text-foreground leading-tight">{storyTitle}</h2>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
            {storyNode}
          </div>

          <div className="text-center pt-1">
            <Button onClick={() => setScreen(sortActivity ? "sort" : "detective")} size="lg" className="gap-1">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">Step {stepNumber("story")} of {totalSteps}</p>
        </div>
      </div>
    );
  }

  // ─── Screen 3.5 (optional): Sort the Rebels ─────────────────
  if (screen === "sort" && sortActivity) {
    return (
      <SortTheRebels
        variant="buckets"
        title={sortActivity.title}
        subtitle={sortActivity.subtitle}
        buckets={sortActivity.buckets}
        items={sortActivity.items}
        explainOnRight={sortActivity.explainOnRight}
        explainOnWrong={sortActivity.explainOnWrong}
        onComplete={() => setScreen("detective")}
        continueLabel="Continue"
        stepLabel={`Step ${stepNumber("sort")} of ${totalSteps}`}
      />
    );
  }

  // ─── Screen 4: Believe / Doubt ──────────────────────────────
  if (screen === "detective") {
    const showFeedback = detective !== null;
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
        <div className={`w-full max-w-lg space-y-5 animate-fade-in ${shake ? "animate-[shake_0.4s_ease-in-out]" : ""}`}>
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wide">
              Spot the Trap
            </div>
            <p className="text-sm text-muted-foreground">Read it once. Trust your gut.</p>
          </div>

          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <p className="text-lg text-foreground leading-relaxed text-center">"{detectiveStatement}"</p>
          </div>

          {!showFeedback ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDetective(true)}
                className="rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 px-4 py-5 text-emerald-700 dark:text-emerald-400 font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <div className="text-2xl mb-1">✅</div>
                I Believe It
              </button>
              <button
                onClick={() => handleDetective(false)}
                className="rounded-2xl border-2 border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20 px-4 py-5 text-orange-700 dark:text-orange-400 font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <div className="text-2xl mb-1">🤔</div>
                I Doubt It
              </button>
            </div>
          ) : (
            <TrapReveal
              isCorrect={detective.correct}
              explain={detectiveExplain}
              onRetry={retryDetective}
              onContinue={advanceFromDetective}
              continueLabel={quickCheck ? "Continue" : "Finish Day 1"}
              disabled={isSaving}
            />
          )}

          <p className="text-center text-[11px] text-muted-foreground">Step {stepNumber("detective")} of {totalSteps}</p>
        </div>
      </div>
    );
  }

  // ─── Screen 5 (optional): Quick Check ───────────────────────
  if (screen === "quickcheck" && quickCheck) {
    const showFeedback = quickPick !== null;
    const isRight = quickPick === quickCheck.correctIndex;
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-5 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wide">
              <HelpCircle className="h-3 w-3" />
              Tiny Exam Check
            </div>
            <p className="text-sm text-muted-foreground">One quick question — no pressure.</p>
          </div>

          <div className="rounded-2xl border-2 border-blue-300 dark:border-blue-700 bg-card p-5 space-y-3">
            <p className="text-base font-medium text-foreground leading-relaxed">{quickCheck.prompt}</p>
            <div className="grid gap-2">
              {quickCheck.options.map((opt, i) => {
                const isSelected = quickPick === i;
                const isCorrect = i === quickCheck.correctIndex;
                let stateClasses = "border-border bg-card hover:border-blue-300 dark:hover:border-blue-700";
                if (showFeedback) {
                  if (isCorrect) stateClasses = "border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400";
                  else if (isSelected) stateClasses = "border-orange-400 bg-orange-50/60 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400";
                  else stateClasses = "border-border bg-muted/30 opacity-60";
                }
                return (
                  <button
                    key={i}
                    disabled={showFeedback}
                    onClick={() => {
                      setQuickPick(i);
                      play(i === quickCheck.correctIndex ? "correct" : "wrong");
                    }}
                    className={`text-left rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${stateClasses}`}
                  >
                    <span className="inline-block w-6 text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {showFeedback && (
              <div className={`rounded-xl border p-3 text-sm leading-relaxed ${isRight ? "border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20 text-foreground" : "border-orange-300 bg-orange-50/40 dark:bg-orange-950/20 text-foreground"}`}>
                <p className="font-semibold mb-1">{isRight ? "Got it!" : "Not quite — here's why:"}</p>
                <p>{quickCheck.explain}</p>
              </div>
            )}
            {showFeedback && (
              <Button onClick={handleFinishDay1} className="w-full gap-1" disabled={isSaving}>
                Finish Day 1 <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          <p className="text-center text-[11px] text-muted-foreground">Step {stepNumber("quickcheck")} of {totalSteps}</p>
        </div>
      </div>
    );
  }

  // ─── Done ───────────────────────────────────────────────────
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center space-y-6 animate-fade-in">
        <div className="relative inline-flex items-center justify-center">
          <div className="h-24 w-24 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          </div>
          <span className="absolute -bottom-1 -right-1 h-10 w-10 rounded-full bg-orange-500 border-2 border-background flex items-center justify-center text-white">
            <Flame className="h-5 w-5" />
          </span>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-foreground">What You Built Today</h1>
          <p className="text-sm text-muted-foreground">{episodeTitle}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-center gap-2 text-orange-600 dark:text-orange-400 font-bold">
            <Flame className="h-5 w-5" />
            <span>You can classify number families.</span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            You learned why natural numbers, whole numbers, and integers exist — and how to catch the zero trap.
          </p>
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Lock className="h-4 w-4" />
            <span>Day 2 unlocks tomorrow</span>
          </div>
          <p className="text-sm text-foreground/80 italic leading-relaxed pt-2 border-t border-border">
            "Tomorrow you'll learn WHY this works."
          </p>
        </div>

        <Button onClick={() => navigate("/student/dashboard")} size="lg" className="w-full">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Day1Spark;
