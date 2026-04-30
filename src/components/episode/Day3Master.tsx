import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, ArrowRight, Sparkles, Trophy, Compass, Loader2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEpisodeDay } from "@/contexts/EpisodeDayContext";
import { supabase } from "@/integrations/supabase/client";
import { friendlyLabels } from "@/lib/childFriendlyLabels";
import CompanionVoiceInput from "@/components/student/CompanionVoiceInput";
import { useSoundFx } from "@/hooks/useSoundFx";
import SortTheRebels from "@/components/episode/SortTheRebels";
import ConfidenceLadder from "@/components/episode/ConfidenceLadder";
import type { SortOrderActivity } from "@/data/dayPilotContent";
import type { PilotExplainScore } from "@/hooks/useEpisodeDayUnlock";
import { useGenerateRetentionPrediction, usePeerBenchmark } from "@/hooks/useRetentionPredictions";

export interface MasterSection {
  title: string;
  /** Pre-rendered React node from the actual textbook (e.g. <AssumptionsBlock />, <ImplicationsBlock />). */
  node: ReactNode;
}

interface Props {
  episodeTitle: string;
  chapterId: string;
  episodeId: string;
  conceptKey?: string;
  conceptLabel?: string;
  whyItWorks: string;
  /** Optional rich sections (Assumptions, Implications, etc.) shown right after Why-It-Works, before Prove-It. */
  masterSections?: MasterSection[];
  proveItPrompt: string;
  caseStudy: string;
  growthGains: { label: string; emoji: string; pct: number }[];
  nextEpisodeTitle?: string;
  onNextEpisode?: () => void;
  /** Optional drag-reorder activity before Prove-It. */
  sortActivity?: SortOrderActivity;
  /** Optional Confidence Ladder context — renders an apply-rung warm-up above Why-It-Works. */
  ladder?: {
    chapterId?: string | null;
    episodeId?: string | null;
    conceptKey?: string | null;
    subject?: string | null;
    chapterSlug?: string | null;
  };
  onProgress?: (progress: number) => void;
}

type Screen = "why" | "deeper" | "sort" | "prove" | "case" | "growth";

const Day3Master = ({
  episodeTitle,
  chapterId,
  episodeId,
  conceptKey,
  conceptLabel,
  whyItWorks,
  masterSections,
  proveItPrompt,
  caseStudy,
  growthGains,
  nextEpisodeTitle,
  onNextEpisode,
  sortActivity,
  ladder,
}: Props) => {
  const navigate = useNavigate();
  const { info, setDayState, isSaving } = useEpisodeDay();
  const retentionPrediction = useGenerateRetentionPrediction();
  const peerBenchmark = usePeerBenchmark();
  const { play } = useSoundFx();
  const [screen, setScreen] = useState<Screen>("why");
  const [proveAnswer, setProveAnswer] = useState("");
  const [scoreResult, setScoreResult] = useState<PilotExplainScore | null>(info.state.day3_explain_score);
  const [isScoring, setIsScoring] = useState(false);
  const [confettiOn, setConfettiOn] = useState(false);
  const completionSavedRef = useRef(false);

  const hasMasterSections = !!masterSections && masterSections.length > 0;
  const hasSort = !!sortActivity;
  const totalSteps = 3 + (hasMasterSections ? 1 : 0) + (hasSort ? 1 : 0);

  const handlePeerBenchmark = () => {
    peerBenchmark.mutate({ chapterId, episodeId, conceptKey, conceptLabel });
  };

  useEffect(() => {
    if (screen === "growth" && !completionSavedRef.current) {
      completionSavedRef.current = true;
      setConfettiOn(true);
      play("victory");
      // persist completion
      setDayState({ day3_completed_at: new Date().toISOString() })
        .then(() => retentionPrediction.mutateAsync({ chapterId, episodeId, conceptKey, conceptLabel }))
        .catch(() => {});
    }
  }, [chapterId, conceptKey, conceptLabel, episodeId, retentionPrediction, screen, setDayState, play]);

  const handleScoreProve = async () => {
    const trimmed = proveAnswer.trim();
    if (!trimmed) return;
    setIsScoring(true);
    try {
      const { data, error } = await supabase.functions.invoke("pilot-explain-score", {
        body: {
          episodeTitle,
          day: 3,
          prompt: proveItPrompt,
          answer: trimmed,
        },
      });
      if (error) throw error;
      const result = data as PilotExplainScore;
      setScoreResult(result);
      await setDayState({ day3_prove_answer: trimmed, day3_explain_score: result });
    } catch {
      await setDayState({ day3_prove_answer: trimmed });
      setScreen("case");
    } finally {
      setIsScoring(false);
    }
  };

  if (screen === "why") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-5 animate-fade-in">
          {ladder && (
            <ConfidenceLadder
              day={3}
              chapterId={ladder.chapterId}
              episodeId={ladder.episodeId}
              conceptKey={ladder.conceptKey}
              subject={ladder.subject}
              chapterSlug={ladder.chapterSlug}
            />
          )}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 text-[11px] font-bold uppercase tracking-wide">
              <Sparkles className="h-3 w-3" /> Quick Read
            </div>
          </div>
          <div className="rounded-2xl border-2 border-purple-300 dark:border-purple-700 bg-card p-5">
            <p className="text-base text-foreground leading-relaxed whitespace-pre-line">{whyItWorks}</p>
          </div>
          <Button
            onClick={() => setScreen(hasMasterSections ? "deeper" : hasSort ? "sort" : "prove")}
            size="lg"
            className="w-full gap-1"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">Step 1 of {totalSteps} · {episodeTitle}</p>
        </div>
      </div>
    );
  }

  if (screen === "deeper" && hasMasterSections) {
    return (
      <div className="min-h-[80vh] flex items-start justify-center px-4 py-6">
        <div className="w-full max-w-2xl space-y-4 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 text-[11px] font-bold uppercase tracking-wide">
              <Compass className="h-3 w-3" /> Stretch your thinking
            </div>
          </div>

          <div className="space-y-4">
            {masterSections!.map((sec, i) => (
              <div key={i} className="rounded-2xl border-2 border-purple-200 dark:border-purple-800/60 bg-card p-3 sm:p-4 space-y-2">
                <h3 className="text-sm font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                  {sec.title}
                </h3>
                {sec.node}
              </div>
            ))}
          </div>

          <div className="text-center pt-1">
            <Button onClick={() => setScreen(hasSort ? "sort" : "prove")} size="lg" className="gap-1">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">Step 2 of {totalSteps}</p>
        </div>
      </div>
    );
  }

  if (screen === "sort" && hasSort && sortActivity) {
    const stepNum = hasMasterSections ? 3 : 2;
    return (
      <SortTheRebels
        variant="order"
        title={sortActivity.title}
        subtitle={sortActivity.subtitle}
        correctOrder={sortActivity.correctOrder}
        explainOnRight={sortActivity.explainOnRight}
        explainOnWrong={sortActivity.explainOnWrong}
        onComplete={() => setScreen("prove")}
        stepLabel={`Step ${stepNum} of ${totalSteps}`}
      />
    );
  }

  if (screen === "prove") {
    const stepNum = 1 + (hasMasterSections ? 1 : 0) + (hasSort ? 1 : 0) + 1;
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-5 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 text-[11px] font-bold uppercase tracking-wide">
              <GraduationCap className="h-3 w-3" /> Teach a Younger Student
            </div>
            <p className="text-sm text-muted-foreground">Use your own voice or words.</p>
          </div>
          <div className="rounded-2xl border-2 border-purple-300 dark:border-purple-700 bg-card p-5 space-y-3">
            <p className="text-base font-medium text-foreground">{proveItPrompt}</p>
            <Textarea
              value={proveAnswer}
              onChange={(e) => setProveAnswer(e.target.value)}
              placeholder="Write or speak your defense…"
              rows={5}
              className="resize-none"
            />
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
              <CompanionVoiceInput
                onTranscript={(t) => setProveAnswer((p) => (p ? `${p} ${t}` : t).trim())}
                showLabel
              />
              <Button onClick={handleScoreProve} disabled={!proveAnswer.trim() || isScoring || !!scoreResult} className="min-w-[132px] gap-2">
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
              <Button onClick={() => setScreen("case")} className="w-full gap-1">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          <p className="text-center text-[11px] text-muted-foreground">Step {stepNum} of {totalSteps}</p>
        </div>
      </div>
    );
  }

  if (screen === "case") {
    const stepNum = totalSteps - 1;
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-5 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 text-[11px] font-bold uppercase tracking-wide">
              Your Call
            </div>
          </div>
          <div className="rounded-2xl border-2 border-purple-300 dark:border-purple-700 bg-card p-5">
            <p className="text-base text-foreground leading-relaxed whitespace-pre-line">{caseStudy}</p>
          </div>
          <Button onClick={() => setScreen("growth")} size="lg" className="w-full gap-1" disabled={isSaving}>
            See your growth <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">Step {stepNum} of {totalSteps}</p>
        </div>
      </div>
    );
  }

  // Growth reveal
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {confettiOn && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-ping"
              style={{
                width: Math.random() * 8 + 4,
                height: Math.random() * 8 + 4,
                background: ["#0D9488", "#F59E0B", "#8B5CF6", "#EC4899", "#3B82F6"][i % 5],
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${Math.random() * 2 + 1}s`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      )}
      <div className="w-full max-w-md text-center space-y-6 animate-scale-in relative z-10">
        <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-purple-500/15">
          <Trophy className="h-12 w-12 text-purple-500" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-foreground">{friendlyLabels.growth}</h1>
          <p className="text-sm text-muted-foreground">{episodeTitle}</p>
        </div>
        <div className="rounded-2xl border-2 border-purple-300 dark:border-purple-700 bg-card p-5">
          <div className="grid grid-cols-5 gap-2">
            {growthGains.map((g) => (
              <div key={g.label} className="text-center">
                <div className="text-2xl mb-1">{g.emoji}</div>
                <div className="text-[10px] text-muted-foreground font-medium leading-tight">{g.label}</div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">+{g.pct}%</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-base font-medium text-foreground italic">"You can explain this to anyone now."</p>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3 text-left">
          <Button variant="outline" onClick={handlePeerBenchmark} disabled={peerBenchmark.isPending} className="w-full gap-2">
            {peerBenchmark.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
            Compare with class pattern
          </Button>
          {peerBenchmark.data?.benchmark && (
            <div className="grid grid-cols-3 gap-2 text-center animate-fade-in">
              <div className="rounded-xl bg-muted/50 p-2">
                <p className="text-[10px] text-muted-foreground">Risk</p>
                <p className="text-lg font-bold text-foreground">{peerBenchmark.data.benchmark.student.risk_score}%</p>
                <p className="text-[10px] text-muted-foreground">Class {peerBenchmark.data.benchmark.distribution.avg_risk_score}%</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-2">
                <p className="text-[10px] text-muted-foreground">Explain</p>
                <p className="text-lg font-bold text-foreground">{peerBenchmark.data.benchmark.student.explain_average}%</p>
                <p className="text-[10px] text-muted-foreground">Class {peerBenchmark.data.benchmark.distribution.avg_explain_score}%</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-2">
                <p className="text-[10px] text-muted-foreground">Done</p>
                <p className="text-lg font-bold text-foreground">{peerBenchmark.data.benchmark.student.completion_pct}%</p>
                <p className="text-[10px] text-muted-foreground">{peerBenchmark.data.benchmark.sample_size} students</p>
              </div>
            </div>
          )}
          {peerBenchmark.data?.error && (
            <p className="text-xs text-muted-foreground text-center">{peerBenchmark.data.error}</p>
          )}
        </div>
        {nextEpisodeTitle && (
          <Button
            onClick={() => (onNextEpisode ? onNextEpisode() : navigate("/student/dashboard"))}
            size="lg"
            className="w-full gap-1"
          >
            Up next: {nextEpisodeTitle} <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        <Button variant="outline" onClick={() => navigate("/student/dashboard")} className="w-full">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Day3Master;
