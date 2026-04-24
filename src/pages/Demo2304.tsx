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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  DEMO_2304,
  type Subject,
  type DemoSubjectContent,
} from "@/data/demo2304Content";
import DemoBuddy, { type BuddyContext } from "@/components/demo/DemoBuddy";

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
  c: DemoSubjectContent;
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
  c: DemoSubjectContent;
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
  c: DemoSubjectContent;
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

// ────────────────────────────────────────────────────────────────
// Demo container — orchestrates Day 1 → Day 2 → Day 3 with stepper
// ────────────────────────────────────────────────────────────────
const Demo2304Page = ({ subject }: { subject: Subject }) => {
  const c = DEMO_2304[subject];
  const [day, setDay] = useState<1 | 2 | 3>(1);
  const [hookAnswer] = useState<string>(""); // not persisted — demo replays Day 2 with empty quote

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
              Demo 2304 · {c.subjectEmoji} {c.subjectLabel}
            </p>
            <p className="text-sm font-bold text-foreground leading-tight">{c.episodeTitle}</p>
            <p className="text-[11px] text-muted-foreground">{c.chapterTitle}</p>
          </div>
          <div className="w-12" />
        </div>
        <div className="max-w-3xl mx-auto mt-2">
          <DayStepper current={day} onJump={setDay} />
        </div>
      </header>

      <main className="pb-16">
        {day === 1 && <Day1Demo c={c} onAdvance={() => setDay(2)} />}
        {day === 2 && <Day2Demo c={c} day1Guess={hookAnswer || `(your Day-1 answer would appear here)`} onAdvance={() => setDay(3)} />}
        {day === 3 && <Day3Demo c={c} onRestart={() => setDay(1)} />}
      </main>

      <footer className="border-t border-border py-4 text-center text-[11px] text-muted-foreground">
        Demo 2304 · Standalone preview · Not connected to the live student progress system.
      </footer>
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
        </div>
      </div>
    );
  }

  return <Demo2304Page subject={subject as Subject} />;
};

export default Demo2304;
