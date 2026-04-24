import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Sparkles,
  Brain,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Trophy,
  Lock,
  ArrowLeft,
  Layers,
  HelpCircle,
  Clock,
  ListOrdered,
  Target,
  AlertTriangle,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  DEMO_2304,
  type Subject,
  type DemoSubjectContent,
  type DemoEpisode1,
  type DemoEpisode2,
} from "@/data/demo2304Content";

// Flattened "view" objects used by inner Day components — combines subject
// metadata with the chosen episode's content. Keeps the existing JSX (which
// expects `c.day1`, `c.episodeTitle`, etc.) working without per-line refactors.
type Ep1View = Pick<
  DemoSubjectContent,
  "subjectLabel" | "subjectEmoji" | "accent" | "chapterTitle"
> &
  Omit<DemoEpisode1, "kind">;

type Ep2View = Pick<
  DemoSubjectContent,
  "subjectLabel" | "subjectEmoji" | "accent" | "chapterTitle"
> &
  Omit<DemoEpisode2, "kind">;

const buildEp1View = (s: DemoSubjectContent): Ep1View => ({
  subjectLabel: s.subjectLabel,
  subjectEmoji: s.subjectEmoji,
  accent: s.accent,
  chapterTitle: s.chapterTitle,
  episodeTitle: s.episodes.ep1.episodeTitle,
  episodeSubtitle: s.episodes.ep1.episodeSubtitle,
  estimatedMinutes: s.episodes.ep1.estimatedMinutes,
  day1: s.episodes.ep1.day1,
  day2: s.episodes.ep1.day2,
  day3: s.episodes.ep1.day3,
});

const buildEp2View = (s: DemoSubjectContent): Ep2View | null =>
  s.episodes.ep2
    ? {
        subjectLabel: s.subjectLabel,
        subjectEmoji: s.subjectEmoji,
        accent: s.accent,
        chapterTitle: s.chapterTitle,
        episodeTitle: s.episodes.ep2.episodeTitle,
        episodeSubtitle: s.episodes.ep2.episodeSubtitle,
        estimatedMinutes: s.episodes.ep2.estimatedMinutes,
        day1: s.episodes.ep2.day1,
        day2: s.episodes.ep2.day2,
        day3: s.episodes.ep2.day3,
      }
    : null;
import DemoBuddy, { type BuddyContext } from "@/components/demo/DemoBuddy";
import DownloadCodeButton from "@/components/DownloadCodeButton";

// Raw source bundles for "Download code" buttons — used so other LLMs (Claude/GPT)
// can read the EXACT UI source for verification & comparison without guessing.
// Demo 2304 bundle (this page + its data + its voice buddy + its edge fn)
import demo2304PageSrc from "./Demo2304.tsx?raw";
import demo2304ContentSrc from "@/data/demo2304Content.ts?raw";
import demoBuddySrc from "@/components/demo/DemoBuddy.tsx?raw";
import demoBuddyEdgeSrc from "../../supabase/functions/demo-buddy-feedback/index.ts?raw";

// Student Explorer/Builder/Mastery bundle (Episode 1 / Episode 2 live flow)
import textbookEpisodeSrc from "./TextbookEpisode.tsx?raw";
import day1SparkSrc from "@/components/episode/Day1Spark.tsx?raw";
import day2BuildSrc from "@/components/episode/Day2Build.tsx?raw";
import day3MasterSrc from "@/components/episode/Day3Master.tsx?raw";
import stageTopbarSrc from "@/components/episode/StageTopbar.tsx?raw";
import dayLockedWallSrc from "@/components/episode/DayLockedWall.tsx?raw";
import devDayToggleSrc from "@/components/episode/DevDayToggle.tsx?raw";
import dayPilotContentSrc from "@/data/dayPilotContent.ts?raw";
import episodeBlocksSrc from "@/components/textbook/EpisodeBlocks.tsx?raw";
import episodeDayContextSrc from "@/contexts/EpisodeDayContext.tsx?raw";
import useEpisodeDayUnlockSrc from "@/hooks/useEpisodeDayUnlock.ts?raw";
import useEpisodeProgressSrc from "@/hooks/useEpisodeProgress.ts?raw";

const DEMO_2304_FILES = [
  { path: "src/pages/Demo2304.tsx", content: demo2304PageSrc },
  { path: "src/data/demo2304Content.ts", content: demo2304ContentSrc },
  { path: "src/components/demo/DemoBuddy.tsx", content: demoBuddySrc },
  { path: "supabase/functions/demo-buddy-feedback/index.ts", content: demoBuddyEdgeSrc },
];

const STUDENT_EBM_FILES = [
  { path: "src/pages/TextbookEpisode.tsx", content: textbookEpisodeSrc },
  { path: "src/components/episode/Day1Spark.tsx", content: day1SparkSrc },
  { path: "src/components/episode/Day2Build.tsx", content: day2BuildSrc },
  { path: "src/components/episode/Day3Master.tsx", content: day3MasterSrc },
  { path: "src/components/episode/StageTopbar.tsx", content: stageTopbarSrc },
  { path: "src/components/episode/DayLockedWall.tsx", content: dayLockedWallSrc },
  { path: "src/components/episode/DevDayToggle.tsx", content: devDayToggleSrc },
  { path: "src/data/dayPilotContent.ts", content: dayPilotContentSrc },
  { path: "src/components/textbook/EpisodeBlocks.tsx", content: episodeBlocksSrc },
  { path: "src/contexts/EpisodeDayContext.tsx", content: episodeDayContextSrc },
  { path: "src/hooks/useEpisodeDayUnlock.ts", content: useEpisodeDayUnlockSrc },
  { path: "src/hooks/useEpisodeProgress.ts", content: useEpisodeProgressSrc },
];

// ────────────────────────────────────────────────────────────────
// Top progress bar (replaces "Step X of Y" labels)
// ────────────────────────────────────────────────────────────────
const ProgressBar = ({ value }: { value: number }) => (
  <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted">
    <div
      className="h-full bg-primary transition-all duration-500"
      style={{ width: `${Math.min(100, Math.max(0, value)) * 100}%` }}
    />
  </div>
);

// ────────────────────────────────────────────────────────────────
// Day Recap header (sets expectation for the day)
// ────────────────────────────────────────────────────────────────
const DayRecapHeader = ({
  day,
  title,
  blurb,
  minutes,
  icon,
  accentBg,
  accentText,
}: {
  day: 1 | 2 | 3;
  title: string;
  blurb: string;
  minutes: number;
  icon: ReactNode;
  accentBg: string;
  accentText: string;
}) => (
  <div className="w-full max-w-2xl mx-auto mb-6 animate-fade-in">
    <div className={`rounded-2xl border-2 ${accentBg} p-4 sm:p-5 flex items-start gap-4`}>
      <div className={`shrink-0 h-12 w-12 rounded-xl ${accentText} bg-background/60 flex items-center justify-center`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <p className={`text-[10px] font-bold uppercase tracking-widest ${accentText}`}>
            Day {day} · {title}
          </p>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" /> ~{minutes} min
          </span>
        </div>
        <p className="text-sm text-foreground/85 mt-1 leading-snug">{blurb}</p>
      </div>
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────────
// Cross-day stepper (Day 1 → Day 2 → Day 3) for the demo header
// ────────────────────────────────────────────────────────────────
const DayStepper = ({
  current,
  onJump,
}: {
  current: 1 | 2 | 3;
  onJump: (d: 1 | 2 | 3) => void;
}) => {
  const items: { day: 1 | 2 | 3; label: string; icon: ReactNode }[] = [
    { day: 1, label: "Spark", icon: <Sparkles className="h-3.5 w-3.5" /> },
    { day: 2, label: "Build", icon: <Brain className="h-3.5 w-3.5" /> },
    { day: 3, label: "Master", icon: <GraduationCap className="h-3.5 w-3.5" /> },
  ];
  return (
    <div className="flex items-center justify-center gap-2 mb-3">
      {items.map((it, idx) => {
        const isActive = it.day === current;
        return (
          <div key={it.day} className="flex items-center gap-2">
            <button
              onClick={() => onJump(it.day)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {it.icon}
              Day {it.day} · {it.label}
            </button>
            {idx < items.length - 1 && <span className="text-muted-foreground/50">›</span>}
          </div>
        );
      })}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────
// Day 1 — Spark (Hook → Reveal → Detective → QuickCheck)
// ────────────────────────────────────────────────────────────────
type Day1Screen = "hook" | "reveal" | "detective" | "quickcheck" | "done";

const Day1Demo = ({
  c,
  onAdvance,
  onContextChange,
}: {
  c: Ep1View;
  onAdvance: () => void;
  onContextChange: (ctx: BuddyContext | null) => void;
}) => {
  const [screen, setScreen] = useState<Day1Screen>("hook");
  const [hookAnswer, setHookAnswer] = useState("");
  const [detective, setDetective] = useState<{ choice: boolean; correct: boolean } | null>(null);
  const [quickPick, setQuickPick] = useState<number | null>(null);

  const order: Day1Screen[] = ["hook", "reveal", "detective", "quickcheck"];
  const progress = (order.indexOf(screen) + 1) / (order.length + 1);

  useEffect(() => {
    if (screen === "hook") {
      onContextChange({
        key: `${c.subjectLabel}-d1-hook`,
        subject: c.subjectLabel,
        question: c.day1.hookQuestion,
        expectedHint: c.day1.conceptText,
      });
    } else if (screen === "detective") {
      onContextChange({
        key: `${c.subjectLabel}-d1-detective`,
        subject: c.subjectLabel,
        question: `Believe it or doubt it: "${c.day1.detective.statement}"`,
        expectedHint: `${c.day1.detective.isTrue ? "It is TRUE." : "It is FALSE."} ${c.day1.detective.explain}`,
      });
    } else if (screen === "quickcheck") {
      onContextChange({
        key: `${c.subjectLabel}-d1-quickcheck`,
        subject: c.subjectLabel,
        question: `${c.day1.quickCheck.prompt} Options: ${c.day1.quickCheck.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(", ")}`,
        expectedHint: `Correct: ${c.day1.quickCheck.options[c.day1.quickCheck.correctIndex]}. ${c.day1.quickCheck.explain}`,
      });
    } else {
      onContextChange(null);
    }
  }, [screen, c, onContextChange]);

  const submitHook = () => {
    if (hookAnswer.trim().split(/\s+/).filter(Boolean).length < 2) {
      toast.error("Try a few words — even a guess works.");
      return;
    }
    setScreen("reveal");
  };

  const handleDetective = (choice: boolean) => {
    setDetective({ choice, correct: choice === c.day1.detective.isTrue });
  };

  const handleQuick = (i: number) => setQuickPick(i);

  return (
    <div className="px-4 py-8">
      <ProgressBar value={progress} />
      <DayRecapHeader
        day={1}
        title="Spark"
        blurb="Today you'll meet a question with no easy answer. Just guess, then see how the idea actually works."
        minutes={c.estimatedMinutes.d1}
        icon={<Sparkles className="h-6 w-6" />}
        accentBg="border-primary/40 bg-primary/5"
        accentText="text-primary"
      />

      {screen === "hook" && (
        <div className="w-full max-w-lg mx-auto space-y-5 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wide">
              <Sparkles className="h-3 w-3" /> Hook Question
            </div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">{c.day1.hookQuestion}</h1>
            <p className="text-sm text-muted-foreground">No right answer. Just your honest first thought.</p>
          </div>
          <div className="rounded-2xl border-2 border-primary/30 bg-card p-4">
            <Textarea
              value={hookAnswer}
              onChange={(e) => setHookAnswer(e.target.value)}
              placeholder="Type your guess…"
              rows={4}
              className="resize-none border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              autoFocus
            />
            <div className="flex justify-end pt-2 border-t border-border">
              <Button onClick={submitHook} disabled={!hookAnswer.trim()} className="gap-1">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {screen === "reveal" && (
        <div className="w-full max-w-lg mx-auto space-y-5 animate-fade-in">
          <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/40 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">You thought</p>
            <p className="text-sm text-foreground italic">"{hookAnswer}"</p>
          </div>
          <div className="rounded-2xl border-2 border-primary/30 bg-card p-5 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wide">
              <Sparkles className="h-3 w-3" /> Here's the idea
            </div>
            <p className="text-base text-foreground leading-relaxed">{c.day1.conceptText}</p>
          </div>
          <div className="text-center">
            <Button onClick={() => setScreen("detective")} size="lg" className="gap-1">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {screen === "detective" && (
        <div className="w-full max-w-lg mx-auto space-y-5 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wide">
              Believe it or doubt it?
            </div>
            <p className="text-sm text-muted-foreground">Read once. Trust your gut.</p>
          </div>
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <p className="text-lg text-foreground leading-relaxed text-center">"{c.day1.detective.statement}"</p>
          </div>
          {!detective ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDetective(true)}
                className="rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 px-4 py-5 text-emerald-700 dark:text-emerald-400 font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <div className="text-2xl mb-1">✅</div> I Believe It
              </button>
              <button
                onClick={() => handleDetective(false)}
                className="rounded-2xl border-2 border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20 px-4 py-5 text-orange-700 dark:text-orange-400 font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <div className="text-2xl mb-1">🤔</div> I Doubt It
              </button>
            </div>
          ) : (
            <div className={`rounded-2xl border-2 p-5 space-y-3 ${detective.correct ? "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20" : "border-orange-400 bg-orange-50/40 dark:bg-orange-950/20"}`}>
              <p className="font-bold text-base">{detective.correct ? "Spot on!" : "Close — here's the twist:"}</p>
              <p className="text-sm text-foreground/90 leading-relaxed">{c.day1.detective.explain}</p>
              <Button onClick={() => setScreen("quickcheck")} className="w-full gap-1">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {screen === "quickcheck" && (
        <div className="w-full max-w-lg mx-auto space-y-5 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wide">
              <HelpCircle className="h-3 w-3" /> Quick check
            </div>
          </div>
          <div className="rounded-2xl border-2 border-blue-300 dark:border-blue-700 bg-card p-5 space-y-3">
            <p className="text-base font-medium text-foreground leading-relaxed">{c.day1.quickCheck.prompt}</p>
            <div className="grid gap-2">
              {c.day1.quickCheck.options.map((opt, i) => {
                const showFeedback = quickPick !== null;
                const isCorrect = i === c.day1.quickCheck.correctIndex;
                const isSelected = quickPick === i;
                let cls = "border-border bg-card hover:border-blue-300";
                if (showFeedback) {
                  if (isCorrect) cls = "border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400";
                  else if (isSelected) cls = "border-orange-400 bg-orange-50/60 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400";
                  else cls = "border-border bg-muted/30 opacity-60";
                }
                return (
                  <button
                    key={i}
                    disabled={quickPick !== null}
                    onClick={() => handleQuick(i)}
                    className={`text-left rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${cls}`}
                  >
                    <span className="inline-block w-6 text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {quickPick !== null && (
              <>
                <div className={`rounded-xl border p-3 text-sm leading-relaxed ${quickPick === c.day1.quickCheck.correctIndex ? "border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20" : "border-orange-300 bg-orange-50/40 dark:bg-orange-950/20"}`}>
                  <p className="font-semibold mb-1">{quickPick === c.day1.quickCheck.correctIndex ? "Got it!" : "Not quite — here's why:"}</p>
                  <p>{c.day1.quickCheck.explain}</p>
                </div>
                <Button onClick={onAdvance} className="w-full gap-1">
                  Finish Day 1 <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────
// Day 2 — Build (Recall → Deep Dive → Build the explanation → Detective)
// Replaces free-text "explain" with drag-to-order to cut typing fatigue.
// ────────────────────────────────────────────────────────────────
type Day2Screen = "recall" | "deepdive" | "build" | "detective" | "done";

const Day2Demo = ({
  c,
  day1Guess,
  onAdvance,
  onContextChange,
}: {
  c: Ep1View;
  day1Guess: string;
  onAdvance: () => void;
  onContextChange: (ctx: BuddyContext | null) => void;
}) => {
  const [screen, setScreen] = useState<Day2Screen>("recall");
  const [order, setOrder] = useState<number[]>(() => {
    const arr = c.day2.buildBlocks.map((_, i) => i);
    return [...arr].sort(() => Math.random() - 0.5);
  });
  const [submitted, setSubmitted] = useState(false);
  const [detective, setDetective] = useState<{ choice: boolean; correct: boolean } | null>(null);

  const screens: Day2Screen[] = ["recall", "deepdive", "build", "detective"];
  const progress = (screens.indexOf(screen) + 1) / (screens.length + 1);

  useEffect(() => {
    if (screen === "recall") {
      onContextChange({
        key: `${c.subjectLabel}-d2-recall`,
        subject: c.subjectLabel,
        question: c.day2.recallPrompt,
        expectedHint: c.day2.deepDiveBody,
      });
    } else if (screen === "build") {
      onContextChange({
        key: `${c.subjectLabel}-d2-build`,
        subject: c.subjectLabel,
        question: `Explain the logical order of these steps in your own words: ${c.day2.buildBlocks.join(" / ")}`,
        expectedHint: c.day2.buildExplain,
      });
    } else if (screen === "detective") {
      onContextChange({
        key: `${c.subjectLabel}-d2-detective`,
        subject: c.subjectLabel,
        question: `Believe or doubt: "${c.day2.detective.statement}"`,
        expectedHint: `${c.day2.detective.isTrue ? "TRUE." : "FALSE."} ${c.day2.detective.explain}`,
      });
    } else {
      onContextChange(null);
    }
  }, [screen, c, onContextChange]);

  const move = (idx: number, dir: -1 | 1) => {
    setOrder((prev) => {
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const isCorrectOrder = useMemo(
    () => JSON.stringify(order) === JSON.stringify(c.day2.buildCorrectOrder),
    [order, c.day2.buildCorrectOrder],
  );

  return (
    <div className="px-4 py-8">
      <ProgressBar value={progress} />
      <DayRecapHeader
        day={2}
        title="Build"
        blurb="Today you'll go one level deeper — then build the explanation step-by-step instead of writing essays."
        minutes={c.estimatedMinutes.d2}
        icon={<Brain className="h-6 w-6" />}
        accentBg="border-blue-300 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-950/20"
        accentText="text-blue-700 dark:text-blue-400"
      />

      {screen === "recall" && (
        <div className="w-full max-w-lg mx-auto space-y-5 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wide">
              <Brain className="h-3 w-3" /> Remember this?
            </div>
          </div>
          <div className="rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-950/20 p-5 space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Yesterday you said</p>
            <p className="text-base text-foreground italic leading-relaxed">"{day1Guess || "(no answer recorded)"}"</p>
          </div>
          <p className="text-center text-foreground font-medium">{c.day2.recallPrompt}</p>
          <Button onClick={() => setScreen("deepdive")} size="lg" className="w-full gap-1">
            Let's go deeper <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {screen === "deepdive" && (
        <div className="w-full max-w-2xl mx-auto space-y-5 animate-fade-in">
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wide">
              <Layers className="h-3 w-3" /> {c.day2.deepDiveTitle}
            </div>
          </div>
          <div className="rounded-2xl border-2 border-blue-300 dark:border-blue-700 bg-card p-5">
            <p className="text-base text-foreground leading-relaxed whitespace-pre-line">{c.day2.deepDiveBody}</p>
          </div>
          <div className="text-center">
            <Button onClick={() => setScreen("build")} size="lg" className="gap-1">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {screen === "build" && (
        <div className="w-full max-w-lg mx-auto space-y-5 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wide">
              <ListOrdered className="h-3 w-3" /> Build the explanation
            </div>
            <p className="text-sm text-muted-foreground">Re-order these steps so they flow logically. Use ↑ ↓ to move.</p>
          </div>

          <div className="space-y-2">
            {order.map((blockIdx, i) => (
              <div
                key={blockIdx}
                className={`rounded-xl border-2 bg-card p-3 flex items-center gap-3 ${
                  submitted
                    ? blockIdx === c.day2.buildCorrectOrder[i]
                      ? "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20"
                      : "border-orange-400 bg-orange-50/40 dark:bg-orange-950/20"
                    : "border-border"
                }`}
              >
                <span className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold">
                  {i + 1}
                </span>
                <p className="flex-1 text-sm text-foreground leading-snug">{c.day2.buildBlocks[blockIdx]}</p>
                {!submitted && (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="h-6 w-6 rounded border border-border text-xs hover:bg-muted disabled:opacity-30"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === order.length - 1}
                      className="h-6 w-6 rounded border border-border text-xs hover:bg-muted disabled:opacity-30"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!submitted ? (
            <Button onClick={() => setSubmitted(true)} className="w-full">
              Check my order
            </Button>
          ) : (
            <div
              className={`rounded-2xl border-2 p-4 space-y-3 ${
                isCorrectOrder
                  ? "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20"
                  : "border-orange-400 bg-orange-50/40 dark:bg-orange-950/20"
              }`}
            >
              <p className="font-bold text-sm">
                {isCorrectOrder ? "Perfect chain!" : "Not quite — here's the logic:"}
              </p>
              <p className="text-sm text-foreground/90 leading-relaxed">{c.day2.buildExplain}</p>
              <div className="flex gap-2">
                {!isCorrectOrder && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSubmitted(false);
                      setOrder([...c.day2.buildBlocks.map((_, i) => i)].sort(() => Math.random() - 0.5));
                    }}
                    className="flex-1"
                  >
                    Try again
                  </Button>
                )}
                <Button onClick={() => setScreen("detective")} className="flex-1 gap-1">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {screen === "detective" && (
        <div className="w-full max-w-lg mx-auto space-y-5 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wide">
              Believe it or doubt it?
            </div>
          </div>
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <p className="text-lg text-foreground leading-relaxed text-center">"{c.day2.detective.statement}"</p>
          </div>
          {!detective ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDetective({ choice: true, correct: c.day2.detective.isTrue === true })}
                className="rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 px-4 py-5 text-emerald-700 dark:text-emerald-400 font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <div className="text-2xl mb-1">✅</div> I Believe It
              </button>
              <button
                onClick={() => setDetective({ choice: false, correct: c.day2.detective.isTrue === false })}
                className="rounded-2xl border-2 border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20 px-4 py-5 text-orange-700 dark:text-orange-400 font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <div className="text-2xl mb-1">🤔</div> I Doubt It
              </button>
            </div>
          ) : (
            <div className={`rounded-2xl border-2 p-5 space-y-3 ${detective.correct ? "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20" : "border-orange-400 bg-orange-50/40 dark:bg-orange-950/20"}`}>
              <p className="font-bold text-base">{detective.correct ? "Yes!" : "Tricky one — here's why:"}</p>
              <p className="text-sm text-foreground/90 leading-relaxed">{c.day2.detective.explain}</p>
              <Button onClick={onAdvance} className="w-full gap-1">
                Finish Day 2 <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────
// Day 3 — Master (Why → Prove It → Real-World → Growth)
// ────────────────────────────────────────────────────────────────
type Day3Screen = "why" | "prove" | "case" | "growth";

const Day3Demo = ({
  c,
  onRestart,
  onContextChange,
}: {
  c: Ep1View;
  onRestart: () => void;
  onContextChange: (ctx: BuddyContext | null) => void;
}) => {
  const [screen, setScreen] = useState<Day3Screen>("why");
  const [proveAnswer, setProveAnswer] = useState("");

  const screens: Day3Screen[] = ["why", "prove", "case", "growth"];
  const progress = (screens.indexOf(screen) + 1) / screens.length;

  useEffect(() => {
    if (screen === "prove") {
      onContextChange({
        key: `${c.subjectLabel}-d3-prove`,
        subject: c.subjectLabel,
        question: c.day3.proveItPrompt,
        expectedHint: c.day3.whyItWorks,
      });
    } else if (screen === "case") {
      onContextChange({
        key: `${c.subjectLabel}-d3-case`,
        subject: c.subjectLabel,
        question: `Real-world challenge: ${c.day3.caseStudy}`,
        expectedHint: c.day3.whyItWorks,
      });
    } else {
      onContextChange(null);
    }
  }, [screen, c, onContextChange]);

  return (
    <div className="px-4 py-8 relative">
      <ProgressBar value={progress} />
      <DayRecapHeader
        day={3}
        title="Master"
        blurb="Today you'll defend your understanding and see exactly how this idea shows up in the real world."
        minutes={c.estimatedMinutes.d3}
        icon={<GraduationCap className="h-6 w-6" />}
        accentBg="border-purple-300 dark:border-purple-700 bg-purple-50/40 dark:bg-purple-950/20"
        accentText="text-purple-700 dark:text-purple-400"
      />

      {screen === "why" && (
        <div className="w-full max-w-lg mx-auto space-y-5 animate-fade-in">
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 text-[11px] font-bold uppercase tracking-wide">
              <Sparkles className="h-3 w-3" /> Why does this REALLY work?
            </div>
          </div>
          <div className="rounded-2xl border-2 border-purple-300 dark:border-purple-700 bg-card p-5">
            <p className="text-base text-foreground leading-relaxed whitespace-pre-line">{c.day3.whyItWorks}</p>
          </div>
          <Button onClick={() => setScreen("prove")} size="lg" className="w-full gap-1">
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {screen === "prove" && (
        <div className="w-full max-w-lg mx-auto space-y-5 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 text-[11px] font-bold uppercase tracking-wide">
              <GraduationCap className="h-3 w-3" /> Prove it
            </div>
            <p className="text-sm text-muted-foreground">Defend your understanding in your own words.</p>
          </div>
          <div className="rounded-2xl border-2 border-purple-300 dark:border-purple-700 bg-card p-5 space-y-3">
            <p className="text-base font-medium text-foreground">{c.day3.proveItPrompt}</p>
            <Textarea
              value={proveAnswer}
              onChange={(e) => setProveAnswer(e.target.value)}
              placeholder="Write your defense…"
              rows={5}
              className="resize-none"
            />
            <div className="flex justify-end pt-2 border-t border-border">
              <Button onClick={() => setScreen("case")} disabled={!proveAnswer.trim()}>
                Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {screen === "case" && (
        <div className="w-full max-w-lg mx-auto space-y-5 animate-fade-in">
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 text-[11px] font-bold uppercase tracking-wide">
              Real World Challenge
            </div>
          </div>
          <div className="rounded-2xl border-2 border-purple-300 dark:border-purple-700 bg-card p-5">
            <p className="text-base text-foreground leading-relaxed whitespace-pre-line">{c.day3.caseStudy}</p>
          </div>
          <Button onClick={() => setScreen("growth")} size="lg" className="w-full gap-1">
            See your growth <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {screen === "growth" && (
        <div className="w-full max-w-md mx-auto text-center space-y-6 animate-scale-in">
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-purple-500/15">
            <Trophy className="h-12 w-12 text-purple-500" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold text-foreground">Your Growth</h1>
            <p className="text-sm text-muted-foreground">{c.episodeTitle}</p>
          </div>
          <div className="rounded-2xl border-2 border-purple-300 dark:border-purple-700 bg-card p-5">
            <div className="grid grid-cols-3 gap-3">
              {c.day3.growth.map((g) => (
                <div key={g.label} className="text-center">
                  <div className="text-2xl mb-1">{g.emoji}</div>
                  <div className="text-xs text-muted-foreground font-medium">{g.label}</div>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">+{g.pct}%</div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-base font-medium text-foreground italic">"You can explain this to anyone now."</p>
          <Button onClick={onRestart} variant="outline" size="lg" className="w-full">
            Restart demo
          </Button>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// EPISODE 2 — NON-INTRO. Builds on Episode 1, no redundant definitions.
//   Day 1 Spark   = APPLIED CHALLENGE first, METHOD reveal second.
//   Day 2 Build   = METHOD MASTERY on a harder case + step-trap detection.
//   Day 3 Master  = SYNTHESIS with another concept + edge-case mastery.
// ════════════════════════════════════════════════════════════════

// ── Ep2 Day 1 ───────────────────────────────────────────────────
type Ep2D1Screen = "challenge" | "reveal" | "detective" | "done";

const Ep2Day1Demo = ({
  c,
  onAdvance,
  onContextChange,
}: {
  c: Ep2View;
  onAdvance: () => void;
  onContextChange: (ctx: BuddyContext | null) => void;
}) => {
  const [screen, setScreen] = useState<Ep2D1Screen>("challenge");
  const [attempt, setAttempt] = useState("");
  const [detective, setDetective] = useState<{ choice: boolean; correct: boolean } | null>(null);

  const screens: Ep2D1Screen[] = ["challenge", "reveal", "detective"];
  const progress = (screens.indexOf(screen) + 1) / (screens.length + 1);

  useEffect(() => {
    if (screen === "challenge") {
      onContextChange({
        key: `${c.subjectLabel}-ep2-d1-challenge`,
        subject: c.subjectLabel,
        question: c.day1.challengePrompt,
        expectedHint: c.day1.expectedAnswer,
      });
    } else if (screen === "reveal") {
      onContextChange({
        key: `${c.subjectLabel}-ep2-d1-reveal`,
        subject: c.subjectLabel,
        question: `Method just revealed: ${c.day1.methodTitle}. The student attempted: "${attempt}". Compare gently.`,
        expectedHint: `${c.day1.methodBody}\n\nExpected: ${c.day1.expectedAnswer}`,
      });
    } else if (screen === "detective") {
      onContextChange({
        key: `${c.subjectLabel}-ep2-d1-detective`,
        subject: c.subjectLabel,
        question: `Believe or doubt: "${c.day1.detective.statement}"`,
        expectedHint: `${c.day1.detective.isTrue ? "TRUE." : "FALSE."} ${c.day1.detective.explain}`,
      });
    } else {
      onContextChange(null);
    }
  }, [screen, c, attempt, onContextChange]);

  const submitAttempt = () => {
    if (attempt.trim().split(/\s+/).filter(Boolean).length < 2) {
      toast.error("Type even a partial idea — try anything!");
      return;
    }
    setScreen("reveal");
  };

  return (
    <div className="px-4 py-8">
      <ProgressBar value={progress} />
      <DayRecapHeader
        day={1}
        title="Apply First"
        blurb="No definitions today — try the problem first with whatever you know. The method comes after your attempt."
        minutes={c.estimatedMinutes.d1}
        icon={<Target className="h-6 w-6" />}
        accentBg="border-primary/40 bg-primary/5"
        accentText="text-primary"
      />

      {screen === "challenge" && (
        <div className="w-full max-w-lg mx-auto space-y-5 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wide">
              <Target className="h-3 w-3" /> Try this first
            </div>
            <h1 className="text-xl font-bold text-foreground leading-tight">
              {c.day1.challengePrompt}
            </h1>
            {c.day1.challengeContext && (
              <p className="text-xs text-muted-foreground italic">{c.day1.challengeContext}</p>
            )}
          </div>
          <div className="rounded-2xl border-2 border-primary/30 bg-card p-4">
            <Textarea
              value={attempt}
              onChange={(e) => setAttempt(e.target.value)}
              placeholder="Show your working — even a partial guess works…"
              rows={5}
              className="resize-none border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              autoFocus
            />
            <div className="flex justify-end pt-2 border-t border-border">
              <Button onClick={submitAttempt} disabled={!attempt.trim()} className="gap-1">
                See the method <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {screen === "reveal" && (
        <div className="w-full max-w-2xl mx-auto space-y-5 animate-fade-in">
          <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/40 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
              Your attempt
            </p>
            <p className="text-sm text-foreground italic whitespace-pre-line">"{attempt}"</p>
          </div>
          <div className="rounded-2xl border-2 border-primary/30 bg-card p-5 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wide">
              <Sparkles className="h-3 w-3" /> {c.day1.methodTitle}
            </div>
            <p className="text-base text-foreground leading-relaxed whitespace-pre-line">
              {c.day1.methodBody}
            </p>
          </div>
          <div className="text-center">
            <Button onClick={() => setScreen("detective")} size="lg" className="gap-1">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {screen === "detective" && (
        <div className="w-full max-w-lg mx-auto space-y-5 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wide">
              Believe it or doubt it?
            </div>
          </div>
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <p className="text-lg text-foreground leading-relaxed text-center">
              "{c.day1.detective.statement}"
            </p>
          </div>
          {!detective ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  setDetective({ choice: true, correct: c.day1.detective.isTrue === true })
                }
                className="rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 px-4 py-5 text-emerald-700 dark:text-emerald-400 font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <div className="text-2xl mb-1">✅</div> I Believe It
              </button>
              <button
                onClick={() =>
                  setDetective({ choice: false, correct: c.day1.detective.isTrue === false })
                }
                className="rounded-2xl border-2 border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20 px-4 py-5 text-orange-700 dark:text-orange-400 font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <div className="text-2xl mb-1">🤔</div> I Doubt It
              </button>
            </div>
          ) : (
            <div
              className={`rounded-2xl border-2 p-5 space-y-3 ${
                detective.correct
                  ? "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20"
                  : "border-orange-400 bg-orange-50/40 dark:bg-orange-950/20"
              }`}
            >
              <p className="font-bold text-base">
                {detective.correct ? "Spot on!" : "Close — here's the twist:"}
              </p>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {c.day1.detective.explain}
              </p>
              <Button onClick={onAdvance} className="w-full gap-1">
                Finish Day 1 <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Ep2 Day 2 — apply method + spot the wrong step ──────────────
type Ep2D2Screen = "recall" | "apply" | "trap" | "detective";

const Ep2Day2Demo = ({
  c,
  onAdvance,
  onContextChange,
}: {
  c: Ep2View;
  onAdvance: () => void;
  onContextChange: (ctx: BuddyContext | null) => void;
}) => {
  const [screen, setScreen] = useState<Ep2D2Screen>("recall");
  const [applyAttempt, setApplyAttempt] = useState("");
  const [trapPick, setTrapPick] = useState<number | null>(null);
  const [detective, setDetective] = useState<{ choice: boolean; correct: boolean } | null>(null);

  const screens: Ep2D2Screen[] = ["recall", "apply", "trap", "detective"];
  const progress = (screens.indexOf(screen) + 1) / (screens.length + 1);

  useEffect(() => {
    if (screen === "apply") {
      onContextChange({
        key: `${c.subjectLabel}-ep2-d2-apply`,
        subject: c.subjectLabel,
        question: c.day2.applyPrompt,
        expectedHint: c.day2.expectedAnswer,
      });
    } else if (screen === "trap") {
      onContextChange({
        key: `${c.subjectLabel}-ep2-d2-trap`,
        subject: c.subjectLabel,
        question: `Spot the wrong step in this chain: ${c.day2.trapSteps.join(" | ")}`,
        expectedHint: `Wrong step #${c.day2.trapWrongIndex + 1}. ${c.day2.trapExplain}`,
      });
    } else if (screen === "detective") {
      onContextChange({
        key: `${c.subjectLabel}-ep2-d2-detective`,
        subject: c.subjectLabel,
        question: `Believe or doubt: "${c.day2.detective.statement}"`,
        expectedHint: `${c.day2.detective.isTrue ? "TRUE." : "FALSE."} ${c.day2.detective.explain}`,
      });
    } else {
      onContextChange(null);
    }
  }, [screen, c, onContextChange]);

  return (
    <div className="px-4 py-8">
      <ProgressBar value={progress} />
      <DayRecapHeader
        day={2}
        title="Method Mastery"
        blurb="The same method, on a tougher case. Then spot the one wrong step in a chain."
        minutes={c.estimatedMinutes.d2}
        icon={<Brain className="h-6 w-6" />}
        accentBg="border-blue-300 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-950/20"
        accentText="text-blue-700 dark:text-blue-400"
      />

      {screen === "recall" && (
        <div className="w-full max-w-lg mx-auto space-y-5 animate-fade-in">
          <div className="rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-950/20 p-5 space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
              Yesterday
            </p>
            <p className="text-base text-foreground leading-relaxed">{c.day2.recallLine}</p>
          </div>
          <Button onClick={() => setScreen("apply")} size="lg" className="w-full gap-1">
            Try the harder one <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {screen === "apply" && (
        <div className="w-full max-w-lg mx-auto space-y-5 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wide">
              <Target className="h-3 w-3" /> Apply the method
            </div>
            <h2 className="text-lg font-bold text-foreground leading-tight">
              {c.day2.applyPrompt}
            </h2>
          </div>
          <div className="rounded-2xl border-2 border-blue-300 dark:border-blue-700 bg-card p-4">
            <Textarea
              value={applyAttempt}
              onChange={(e) => setApplyAttempt(e.target.value)}
              placeholder="Write your full chain of equations…"
              rows={5}
              className="resize-none border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              autoFocus
            />
            <div className="flex justify-end pt-2 border-t border-border">
              <Button
                onClick={() => setScreen("trap")}
                disabled={!applyAttempt.trim()}
                className="gap-1"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">
              Show worked answer (after attempting)
            </summary>
            <p className="mt-2 rounded-xl border border-border bg-muted/30 p-3 text-foreground/80 leading-relaxed">
              {c.day2.expectedAnswer}
            </p>
          </details>
        </div>
      )}

      {screen === "trap" && (
        <div className="w-full max-w-lg mx-auto space-y-5 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wide">
              <AlertTriangle className="h-3 w-3" /> Spot the wrong step
            </div>
            <p className="text-sm text-muted-foreground">
              One line in this chain breaks the rule. Tap it.
            </p>
          </div>
          <div className="space-y-2">
            {c.day2.trapSteps.map((step, i) => {
              const isAnswered = trapPick !== null;
              const isWrong = i === c.day2.trapWrongIndex;
              const isPicked = trapPick === i;
              let cls = "border-border bg-card hover:border-amber-300";
              if (isAnswered) {
                if (isWrong)
                  cls =
                    "border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400";
                else if (isPicked)
                  cls =
                    "border-orange-400 bg-orange-50/60 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400";
                else cls = "border-border bg-muted/30 opacity-60";
              }
              return (
                <button
                  key={i}
                  disabled={isAnswered}
                  onClick={() => setTrapPick(i)}
                  className={`w-full text-left rounded-xl border-2 px-4 py-3 text-sm font-mono transition-all ${cls}`}
                >
                  <span className="inline-block w-6 text-muted-foreground">{i + 1}.</span>
                  {step}
                </button>
              );
            })}
          </div>
          {trapPick !== null && (
            <div
              className={`rounded-2xl border-2 p-4 space-y-2 ${
                trapPick === c.day2.trapWrongIndex
                  ? "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20"
                  : "border-orange-400 bg-orange-50/40 dark:bg-orange-950/20"
              }`}
            >
              <p className="font-bold text-sm">
                {trapPick === c.day2.trapWrongIndex
                  ? "Found it!"
                  : `Not that one — the wrong step was #${c.day2.trapWrongIndex + 1}.`}
              </p>
              <p className="text-sm text-foreground/90 leading-relaxed">{c.day2.trapExplain}</p>
              <Button onClick={() => setScreen("detective")} className="w-full gap-1">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {screen === "detective" && (
        <div className="w-full max-w-lg mx-auto space-y-5 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wide">
              Believe it or doubt it?
            </div>
          </div>
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <p className="text-lg text-foreground leading-relaxed text-center">
              "{c.day2.detective.statement}"
            </p>
          </div>
          {!detective ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  setDetective({ choice: true, correct: c.day2.detective.isTrue === true })
                }
                className="rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 px-4 py-5 text-emerald-700 dark:text-emerald-400 font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <div className="text-2xl mb-1">✅</div> I Believe It
              </button>
              <button
                onClick={() =>
                  setDetective({ choice: false, correct: c.day2.detective.isTrue === false })
                }
                className="rounded-2xl border-2 border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20 px-4 py-5 text-orange-700 dark:text-orange-400 font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <div className="text-2xl mb-1">🤔</div> I Doubt It
              </button>
            </div>
          ) : (
            <div
              className={`rounded-2xl border-2 p-5 space-y-3 ${
                detective.correct
                  ? "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20"
                  : "border-orange-400 bg-orange-50/40 dark:bg-orange-950/20"
              }`}
            >
              <p className="font-bold text-base">
                {detective.correct ? "Yes!" : "Tricky one — here's why:"}
              </p>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {c.day2.detective.explain}
              </p>
              <Button onClick={onAdvance} className="w-full gap-1">
                Finish Day 2 <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Ep2 Day 3 — synthesis + edge case ───────────────────────────
type Ep2D3Screen = "synthesis" | "defend" | "edge" | "growth";

const Ep2Day3Demo = ({
  c,
  onRestart,
  onContextChange,
}: {
  c: Ep2View;
  onRestart: () => void;
  onContextChange: (ctx: BuddyContext | null) => void;
}) => {
  const [screen, setScreen] = useState<Ep2D3Screen>("synthesis");
  const [defendAnswer, setDefendAnswer] = useState("");
  const [edgeAnswer, setEdgeAnswer] = useState("");
  const [edgeRevealed, setEdgeRevealed] = useState(false);

  const screens: Ep2D3Screen[] = ["synthesis", "defend", "edge", "growth"];
  const progress = (screens.indexOf(screen) + 1) / screens.length;

  useEffect(() => {
    if (screen === "defend") {
      onContextChange({
        key: `${c.subjectLabel}-ep2-d3-defend`,
        subject: c.subjectLabel,
        question: c.day3.defendPrompt,
        expectedHint: c.day3.expectedAnswer,
      });
    } else if (screen === "edge") {
      onContextChange({
        key: `${c.subjectLabel}-ep2-d3-edge`,
        subject: c.subjectLabel,
        question: c.day3.edgeCase.prompt,
        expectedHint: `${c.day3.edgeCase.answer} — ${c.day3.edgeCase.explain}`,
      });
    } else {
      onContextChange(null);
    }
  }, [screen, c, onContextChange]);

  return (
    <div className="px-4 py-8 relative">
      <ProgressBar value={progress} />
      <DayRecapHeader
        day={3}
        title="Synthesis"
        blurb="No re-teaching today. Connect this method to other ideas, then handle a tricky edge case."
        minutes={c.estimatedMinutes.d3}
        icon={<GraduationCap className="h-6 w-6" />}
        accentBg="border-purple-300 dark:border-purple-700 bg-purple-50/40 dark:bg-purple-950/20"
        accentText="text-purple-700 dark:text-purple-400"
      />

      {screen === "synthesis" && (
        <div className="w-full max-w-2xl mx-auto space-y-5 animate-fade-in">
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 text-[11px] font-bold uppercase tracking-wide">
              <Link2 className="h-3 w-3" /> {c.day3.synthesisTitle}
            </div>
          </div>
          <div className="rounded-2xl border-2 border-purple-300 dark:border-purple-700 bg-card p-5">
            <p className="text-base text-foreground leading-relaxed whitespace-pre-line">
              {c.day3.synthesisBody}
            </p>
          </div>
          <Button onClick={() => setScreen("defend")} size="lg" className="w-full gap-1">
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {screen === "defend" && (
        <div className="w-full max-w-lg mx-auto space-y-5 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 text-[11px] font-bold uppercase tracking-wide">
              <GraduationCap className="h-3 w-3" /> Defend with reasoning
            </div>
          </div>
          <div className="rounded-2xl border-2 border-purple-300 dark:border-purple-700 bg-card p-5 space-y-3">
            <p className="text-base font-medium text-foreground">{c.day3.defendPrompt}</p>
            <Textarea
              value={defendAnswer}
              onChange={(e) => setDefendAnswer(e.target.value)}
              placeholder="Write your reasoning…"
              rows={5}
              className="resize-none"
            />
            <div className="flex justify-end pt-2 border-t border-border">
              <Button onClick={() => setScreen("edge")} disabled={!defendAnswer.trim()}>
                Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {screen === "edge" && (
        <div className="w-full max-w-lg mx-auto space-y-5 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 text-[11px] font-bold uppercase tracking-wide">
              <AlertTriangle className="h-3 w-3" /> Edge case
            </div>
          </div>
          <div className="rounded-2xl border-2 border-purple-300 dark:border-purple-700 bg-card p-5 space-y-3">
            <p className="text-base font-medium text-foreground">{c.day3.edgeCase.prompt}</p>
            <Textarea
              value={edgeAnswer}
              onChange={(e) => setEdgeAnswer(e.target.value)}
              placeholder="Your answer…"
              rows={3}
              className="resize-none"
              disabled={edgeRevealed}
            />
            {!edgeRevealed ? (
              <Button
                onClick={() => setEdgeRevealed(true)}
                disabled={!edgeAnswer.trim()}
                className="w-full"
              >
                Reveal answer
              </Button>
            ) : (
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 space-y-2">
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  Answer: {c.day3.edgeCase.answer}
                </p>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {c.day3.edgeCase.explain}
                </p>
                <Button onClick={() => setScreen("growth")} className="w-full gap-1">
                  See your growth <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {screen === "growth" && (
        <div className="w-full max-w-md mx-auto text-center space-y-6 animate-scale-in">
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-purple-500/15">
            <Trophy className="h-12 w-12 text-purple-500" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold text-foreground">Episode 2 Complete</h1>
            <p className="text-sm text-muted-foreground">{c.episodeTitle}</p>
          </div>
          <div className="rounded-2xl border-2 border-purple-300 dark:border-purple-700 bg-card p-5">
            <div className="grid grid-cols-3 gap-3">
              {c.day3.growth.map((g) => (
                <div key={g.label} className="text-center">
                  <div className="text-2xl mb-1">{g.emoji}</div>
                  <div className="text-xs text-muted-foreground font-medium">{g.label}</div>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    +{g.pct}%
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-base font-medium text-foreground italic">
            "You can apply, defend, AND extend this method."
          </p>
          <Button onClick={onRestart} variant="outline" size="lg" className="w-full">
            Restart episode
          </Button>
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────
// Episode switcher (Ep 1 ↔ Ep 2). Locked tab if subject has no Ep 2.
// ────────────────────────────────────────────────────────────────
const EpisodeSwitcher = ({
  current,
  hasEp2,
  onSwitch,
}: {
  current: 1 | 2;
  hasEp2: boolean;
  onSwitch: (e: 1 | 2) => void;
}) => (
  <div className="flex items-center justify-center gap-2">
    {([1, 2] as const).map((n) => {
      const isActive = current === n;
      const disabled = n === 2 && !hasEp2;
      return (
        <button
          key={n}
          onClick={() => !disabled && onSwitch(n)}
          disabled={disabled}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition-colors ${
            isActive
              ? "bg-foreground text-background border-foreground"
              : disabled
              ? "bg-muted/30 text-muted-foreground/50 border-border cursor-not-allowed"
              : "bg-card text-foreground border-border hover:bg-muted"
          }`}
          title={disabled ? "Episode 2 not available for this subject yet" : `Switch to Episode ${n}`}
        >
          {disabled && <Lock className="h-3 w-3" />}
          Episode {n} {n === 1 ? "· Intro" : "· Apply & Master"}
        </button>
      );
    })}
  </div>
);

// ────────────────────────────────────────────────────────────────
// Demo container — orchestrates Episode + Day 1 → Day 2 → Day 3
// ────────────────────────────────────────────────────────────────
const Demo2304Page = ({ subject }: { subject: Subject }) => {
  const subjectData = DEMO_2304[subject];
  const ep1View = useMemo(() => buildEp1View(subjectData), [subjectData]);
  const ep2View = useMemo(() => buildEp2View(subjectData), [subjectData]);

  const [episode, setEpisode] = useState<1 | 2>(1);
  const [day, setDay] = useState<1 | 2 | 3>(1);
  const [hookAnswer] = useState<string>("");
  const [buddyContext, setBuddyContext] = useState<BuddyContext | null>(null);

  // Reset Buddy context + day when episode/day changes
  useEffect(() => {
    setBuddyContext(null);
  }, [day, episode]);

  // If user switches to an episode, restart at Day 1 of it
  useEffect(() => {
    setDay(1);
  }, [episode]);

  const activeView: Ep1View | Ep2View = episode === 2 && ep2View ? ep2View : ep1View;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur bg-background/80 border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Home
          </Link>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Demo 2304 · {activeView.subjectEmoji} {activeView.subjectLabel}
            </p>
            <p className="text-sm font-bold text-foreground leading-tight">
              {activeView.episodeTitle}
            </p>
            <p className="text-[11px] text-muted-foreground">{activeView.chapterTitle}</p>
          </div>
          <div className="w-12" />
        </div>
        <div className="max-w-3xl mx-auto mt-2">
          <EpisodeSwitcher current={episode} hasEp2={!!ep2View} onSwitch={setEpisode} />
        </div>
        <div className="max-w-3xl mx-auto mt-2">
          <DayStepper current={day} onJump={setDay} />
        </div>
        <div className="max-w-3xl mx-auto mt-2 flex flex-wrap items-center justify-center gap-2">
          <DownloadCodeButton
            files={DEMO_2304_FILES}
            filename={`demo-2304-${subject}-ui-bundle.txt`}
            label="⬇ Download this demo's UI code"
          />
          <DownloadCodeButton
            files={STUDENT_EBM_FILES}
            filename="student-explorer-builder-mastery-bundle.txt"
            label="⬇ Download student Explorer/Builder/Mastery code"
          />
        </div>
      </header>

      <main className="pb-16">
        {episode === 1 && (
          <>
            {day === 1 && (
              <Day1Demo
                c={ep1View}
                onAdvance={() => setDay(2)}
                onContextChange={setBuddyContext}
              />
            )}
            {day === 2 && (
              <Day2Demo
                c={ep1View}
                day1Guess={hookAnswer || `(your Day-1 answer would appear here)`}
                onAdvance={() => setDay(3)}
                onContextChange={setBuddyContext}
              />
            )}
            {day === 3 && (
              <Day3Demo
                c={ep1View}
                onRestart={() => setDay(1)}
                onContextChange={setBuddyContext}
              />
            )}
          </>
        )}
        {episode === 2 && ep2View && (
          <>
            {day === 1 && (
              <Ep2Day1Demo
                c={ep2View}
                onAdvance={() => setDay(2)}
                onContextChange={setBuddyContext}
              />
            )}
            {day === 2 && (
              <Ep2Day2Demo
                c={ep2View}
                onAdvance={() => setDay(3)}
                onContextChange={setBuddyContext}
              />
            )}
            {day === 3 && (
              <Ep2Day3Demo
                c={ep2View}
                onRestart={() => setDay(1)}
                onContextChange={setBuddyContext}
              />
            )}
          </>
        )}
        {episode === 2 && !ep2View && (
          <div className="px-4 py-16 text-center text-muted-foreground">
            Episode 2 is not yet available for this subject.
          </div>
        )}
      </main>

      <footer className="border-t border-border py-4 text-center text-[11px] text-muted-foreground">
        Demo 2304 · Standalone preview · Not connected to the live student progress system.
      </footer>

      {/* Floating live voice companion — bilingual Telugu/English warm conversation */}
      <DemoBuddy context={buddyContext} />
    </div>
  );
};

// ────────────────────────────────────────────────────────────────
// Route entry — reads :subject param from URL
// ────────────────────────────────────────────────────────────────
const Demo2304 = () => {
  const { subject } = useParams<{ subject: string }>();
  const valid = subject === "math" || subject === "physics" || subject === "chemistry";

  if (!valid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Demo 2304</h1>
          <p className="text-sm text-muted-foreground">Pick a subject to preview the redesigned 3-day flow:</p>
          <div className="grid gap-2">
            <Link to="/demo-2304/math" className="rounded-xl border-2 border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 hover:scale-[1.02] transition-transform">
              <p className="font-bold text-foreground">🔢 Mathematics</p>
              <p className="text-xs text-muted-foreground">Real Numbers</p>
            </Link>
            <Link to="/demo-2304/physics" className="rounded-xl border-2 border-sky-300 bg-sky-50/50 dark:bg-sky-950/20 p-4 hover:scale-[1.02] transition-transform">
              <p className="font-bold text-foreground">⚡ Physics</p>
              <p className="text-xs text-muted-foreground">Electricity</p>
            </Link>
            <Link to="/demo-2304/chemistry" className="rounded-xl border-2 border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 p-4 hover:scale-[1.02] transition-transform">
              <p className="font-bold text-foreground">⚗️ Chemistry</p>
              <p className="text-xs text-muted-foreground">Chemical Reactions</p>
            </Link>
          </div>
          <div className="pt-4 border-t border-border space-y-2">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">For LLM cross-review</p>
            <div className="flex flex-col gap-2">
              <DownloadCodeButton
                files={STUDENT_EBM_FILES}
                filename="student-explorer-builder-mastery-bundle.txt"
                label="⬇ Student Explorer/Builder/Mastery (Ep 1 + Ep 2)"
              />
              <DownloadCodeButton
                files={DEMO_2304_FILES}
                filename="demo-2304-ui-bundle.txt"
                label="⬇ Demo 2304 UI bundle"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <Demo2304Page subject={subject as Subject} />;
};

export default Demo2304;
