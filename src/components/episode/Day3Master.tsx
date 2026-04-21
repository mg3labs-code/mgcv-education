import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, ArrowRight, Sparkles, Trophy, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEpisodeDay } from "@/contexts/EpisodeDayContext";
import { friendlyLabels } from "@/lib/childFriendlyLabels";
import CompanionVoiceInput from "@/components/student/CompanionVoiceInput";
import { useSoundFx } from "@/hooks/useSoundFx";
import SortTheRebels from "@/components/episode/SortTheRebels";
import type { SortOrderActivity } from "@/data/dayPilotContent";

export interface MasterSection {
  title: string;
  /** Pre-rendered React node from the actual textbook (e.g. <AssumptionsBlock />, <ImplicationsBlock />). */
  node: ReactNode;
}

interface Props {
  episodeTitle: string;
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
  onProgress?: (progress: number) => void;
}

type Screen = "why" | "deeper" | "sort" | "prove" | "case" | "growth";

const Day3Master = ({
  episodeTitle,
  whyItWorks,
  masterSections,
  proveItPrompt,
  caseStudy,
  growthGains,
  nextEpisodeTitle,
  onNextEpisode,
  sortActivity,
}: Props) => {
  const navigate = useNavigate();
  const { setDayState, isSaving } = useEpisodeDay();
  const { play } = useSoundFx();
  const [screen, setScreen] = useState<Screen>("why");
  const [proveAnswer, setProveAnswer] = useState("");
  const [confettiOn, setConfettiOn] = useState(false);

  const hasMasterSections = !!masterSections && masterSections.length > 0;
  const hasSort = !!sortActivity;
  const totalSteps = 3 + (hasMasterSections ? 1 : 0) + (hasSort ? 1 : 0);

  useEffect(() => {
    if (screen === "growth") {
      setConfettiOn(true);
      play("victory");
      // persist completion
      setDayState({ day3_completed_at: new Date().toISOString() }).catch(() => {});
    }
  }, [screen, setDayState, play]);

  if (screen === "why") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-5 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 text-[11px] font-bold uppercase tracking-wide">
              <Sparkles className="h-3 w-3" /> Why does this REALLY work?
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
              <GraduationCap className="h-3 w-3" /> {friendlyLabels.prove}
            </div>
            <p className="text-sm text-muted-foreground">Defend your understanding in your own words.</p>
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
              <Button onClick={() => setScreen("case")} disabled={!proveAnswer.trim()}>
                Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
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
              Real World Challenge
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
          <div className="grid grid-cols-3 gap-3">
            {growthGains.map((g) => (
              <div key={g.label} className="text-center">
                <div className="text-2xl mb-1">{g.emoji}</div>
                <div className="text-xs text-muted-foreground font-medium">{g.label}</div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">+{g.pct}%</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-base font-medium text-foreground italic">"You can explain this to anyone now."</p>
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
