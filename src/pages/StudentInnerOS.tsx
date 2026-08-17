import { useMemo, useState } from "react";
import { Check, Flame, Lock, Sparkles, Star, Timer, Utensils, ArrowRight, RotateCcw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { FOOD_MODULES, STEP_META, type InnerStep } from "@/data/foodInnerOS";

const XP_PER_STEP = 10;

type Status = "done" | "active" | "locked";

export default function StudentInnerOS() {
  const [moduleIdx, setModuleIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [completed, setCompleted] = useState<Record<string, number>>({});
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [xp, setXp] = useState(0);

  const mod = FOOD_MODULES[moduleIdx];
  const step = mod.steps[stepIdx];
  const isQuestion = step.kind === "guess" || step.kind === "apply";
  const correct = isQuestion && picked === step.answer;
  const progress = Math.round(((stepIdx + (checked ? 1 : 0)) / mod.steps.length) * 100);

  const statusOf = (i: number): Status => {
    if ((completed[FOOD_MODULES[i].id] ?? 0) >= FOOD_MODULES[i].steps.length) return "done";
    if (i === moduleIdx) return "active";
    if (i === 0 || (completed[FOOD_MODULES[i - 1].id] ?? 0) >= FOOD_MODULES[i - 1].steps.length) return "active";
    return "locked";
  };

  const doneCount = useMemo(
    () => FOOD_MODULES.filter((m) => (completed[m.id] ?? 0) >= m.steps.length).length,
    [completed],
  );

  const reset = () => {
    setStepIdx(0);
    setPicked(null);
    setChecked(false);
  };

  const advance = () => {
    setXp((x) => x + XP_PER_STEP);
    const next = stepIdx + 1;
    if (next >= mod.steps.length) {
      setCompleted((c) => ({ ...c, [mod.id]: mod.steps.length }));
      const nextMod = Math.min(moduleIdx + 1, FOOD_MODULES.length - 1);
      setModuleIdx(nextMod);
      reset();
      return;
    }
    setStepIdx(next);
    setPicked(null);
    setChecked(false);
  };

  const tutorLines = buildTutorLines(step, checked, correct);

  return (
    <DashboardLayout role="student">
      <div className="mx-auto grid max-w-[1400px] gap-4 px-4 py-6 md:px-8 lg:grid-cols-[280px_1fr_300px]">
        {/* LEFT: journey path */}
        <aside className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-xl">🍳</div>
              <div>
                <p className="text-sm font-bold text-foreground">Food Lens</p>
                <p className="text-xs text-muted-foreground">Number Systems</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-bold text-foreground">
                <Star className="h-3.5 w-3.5 text-primary" /> {xp} XP
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-bold text-foreground">
                <Flame className="h-3.5 w-3.5 text-destructive" /> {doneCount}
              </span>
            </div>
          </Card>

          <Card className="p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Your kitchen path</p>
            <ol className="space-y-1">
              {FOOD_MODULES.map((m, i) => {
                const st = statusOf(i);
                const isCurrent = i === moduleIdx;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      disabled={st === "locked"}
                      onClick={() => {
                        setModuleIdx(i);
                        reset();
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl p-2 text-left transition",
                        st === "locked" ? "opacity-50" : "hover:bg-muted/60",
                        isCurrent && "bg-muted/70",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm",
                          st === "done" && "border-primary bg-primary text-primary-foreground",
                          st === "active" && isCurrent && "border-primary bg-primary/10",
                          st === "locked" && "border-border bg-muted",
                        )}
                      >
                        {st === "done" ? <Check className="h-4 w-4" /> : st === "locked" ? <Lock className="h-3.5 w-3.5" /> : m.emoji}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-foreground">{m.title}</span>
                        <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          <Timer className="h-3 w-3" /> {m.minutes} min · {m.subtitle}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </Card>
        </aside>

        {/* CENTER: step-by-step session */}
        <section className="space-y-4">
          <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {mod.emoji} {mod.title}
              </h1>
              <p className="text-xs text-muted-foreground">
                Step {stepIdx + 1} of {mod.steps.length} · under {mod.minutes} minutes
              </p>
            </div>
            <div className="flex items-center gap-3 sm:w-64">
              <Progress value={progress} className="h-2 flex-1" />
              <span className="text-xs font-bold text-muted-foreground">{progress}%</span>
            </div>
          </Card>

          <Card
            key={`${mod.id}-${stepIdx}`}
            className="animate-fade-in border-t-4 p-6 md:p-8"
            style={{ borderTopColor: "hsl(var(--primary))" }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" /> {step.label ?? STEP_META[step.kind].tag}
            </span>

            {step.emoji && <div className="mt-4 text-4xl">{step.emoji}</div>}

            {step.title && <h2 className="mt-3 text-xl font-bold text-foreground">{step.title}</h2>}

            {step.text && (
              <p
                className="mt-3 text-base leading-relaxed text-foreground"
                dangerouslySetInnerHTML={{ __html: step.text }}
              />
            )}

            {isQuestion && (
              <>
                <p className="mt-4 text-lg font-semibold leading-snug text-foreground">{step.question}</p>
                <div className="mt-4 grid gap-2">
                  {step.options?.map((opt, i) => {
                    const isPicked = picked === i;
                    const isAnswer = step.answer === i;
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={checked}
                        onClick={() => setPicked(i)}
                        className={cn(
                          "rounded-xl border-2 border-border bg-card px-4 py-3 text-left text-sm font-semibold text-foreground transition",
                          !checked && "hover:border-primary/50 hover:bg-muted/50",
                          !checked && isPicked && "border-primary bg-primary/10",
                          checked && isAnswer && "border-primary bg-primary/10",
                          checked && isPicked && !isAnswer && "border-destructive bg-destructive/10",
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {checked && (
                  <div
                    className={cn(
                      "mt-4 rounded-xl border-l-4 p-4 text-sm font-medium",
                      correct
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-destructive bg-destructive/10 text-foreground",
                    )}
                  >
                    <p className="font-bold">{correct ? "Exactly right." : "Not quite — here's the trick."}</p>
                    {step.explanation && <p className="mt-1">{step.explanation}</p>}
                  </div>
                )}
              </>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {isQuestion && !checked ? (
                <Button disabled={picked === null} onClick={() => setChecked(true)} className="flex-1">
                  Check answer
                </Button>
              ) : (
                <Button onClick={advance} className="flex-1">
                  {stepIdx + 1 >= mod.steps.length ? "Finish session" : "Continue"}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              )}
              {isQuestion && checked && !correct && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setPicked(null);
                    setChecked(false);
                  }}
                >
                  <RotateCcw className="mr-1 h-4 w-4" /> Try again
                </Button>
              )}
            </div>
          </Card>
        </section>

        {/* RIGHT: buddy panel */}
        <aside className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-lg">🤖</span>
              <p className="text-sm font-bold text-foreground">Buddy</p>
            </div>
            <div className="mt-3 space-y-3">
              {tutorLines.map((line, i) => (
                <p
                  key={i}
                  className="animate-fade-in rounded-2xl rounded-tl-sm border border-border bg-muted/40 px-3 py-2 text-sm leading-relaxed text-foreground"
                >
                  {line}
                </p>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Today's plan</p>
            <ul className="mt-2 space-y-2 text-sm text-foreground">
              <li className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-primary" /> 1 food module ({mod.minutes} min)
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> 1 curiosity hook
              </li>
              <li className="flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" /> {mod.steps.length * XP_PER_STEP} XP up for grabs
              </li>
            </ul>
          </Card>
        </aside>
      </div>
    </DashboardLayout>
  );
}

function buildTutorLines(step: InnerStep, checked: boolean, correct: boolean): string[] {
  if (step.kind === "hook") return ["Read the kitchen scene once. Don't solve anything yet — just notice what feels odd."];
  if (step.kind === "reveal") return ["This is the moment the old rule breaks. That's your clue for the next question."];
  if (step.kind === "concept") return ["Say this back in your own words, using pizzas or orders instead of symbols."];
  if (step.kind === "close") return ["Nice loop. You answered the thing you were wondering about at the start."];
  if (!checked) return ["Guess first, even if you're unsure. Guessing makes the answer stick harder."];
  return correct
    ? ["Good — you spotted the pattern, not just the answer."]
    : ["No stress. Re-read the kitchen scene, then pick the option that keeps the food story true."];
}
