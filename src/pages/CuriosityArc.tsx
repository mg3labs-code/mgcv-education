import { useMemo, useState } from "react";
import { useArcProgress } from "@/hooks/useArcProgress";
import { realNumbers, type InterestTag, type MiniCase } from "@/data/curiosityConcepts/realNumbers";
import InterestPicker from "@/components/curiosity/InterestPicker";
import HookShortCard from "@/components/curiosity/HookShortCard";
import ReflectInput from "@/components/curiosity/ReflectInput";
import AhaVisual from "@/components/curiosity/AhaVisual";
import SortActivity from "@/components/curiosity/SortActivity";
import TrapTF from "@/components/curiosity/TrapTF";
import Day1Done from "@/components/curiosity/Day1Done";
import YesterdayEcho from "@/components/curiosity/YesterdayEcho";
import BelieveDoubt from "@/components/curiosity/BelieveDoubt";
import ConceptUnfold from "@/components/curiosity/ConceptUnfold";
import TrickyMcq from "@/components/curiosity/TrickyMcq";
import LoopClose from "@/components/curiosity/LoopClose";
import ArcTopbar from "@/components/curiosity/ArcTopbar";
import ArcNav from "@/components/curiosity/ArcNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CONCEPT = realNumbers;

// Day 1 = ONE MYSTERY in 5 tiny beats (~5 min). No sort, no trap, no long forms.
//   hook(MCQ tap) → first_thought(one free guess) → aha_visual(surprise+reveal)
//   → believe_doubt(one misconception) → day1_done(teaser for tomorrow)
const DAY1_STEPS = [
  "hook",
  "first_thought",
  "aha_visual",
  "believe_doubt",
  "day1_done",
] as const;
// Day 2 = build understanding (~7 min). Yesterday echo → sort/match → unfold
// explanation → tricky misconception MCQ → own-words bridge.
const DAY2_STEPS = [
  "yesterday_echo",
  "sort_activity",
  "unfold",
  "tricky_mcq",
  "own_words",
  "day2_done",
] as const;
// Day 3 = apply + defend + teach (~8 min). Case → defend (trap T/F) → teach a
// friend → loop close.
const DAY3_STEPS = [
  "mini_cases",
  "trap_tf",
  "teach_friend",
  "loop_close",
  "day3_done",
] as const;

const EST_LABEL: Record<1 | 2 | 3, string> = {
  1: "~5 min",
  2: "~7 min",
  3: "~8 min",
};


export default function CuriosityArc() {
  const { progress, update, goBack, canGoBack, loaded } = useArcProgress(CONCEPT.conceptKey);

  // local per-step interaction flags (drive the gated Next button)
  const [stepDone, setStepDone] = useState<Record<string, boolean>>({});
  const markDone = (s: string) => setStepDone((d) => ({ ...d, [s]: true }));
  const clearStep = (s: string) => setStepDone((d) => ({ ...d, [s]: false }));

  const hook = useMemo(() => {
    const tag = (progress.interestTag as InterestTag) || "cricket";
    return CONCEPT.hooks.find((h) => h.tag === tag) ?? CONCEPT.hooks[0];
  }, [progress.interestTag]);

  if (!loaded) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center arc-shell" role="status" aria-live="polite">
        <div className="text-muted-foreground text-sm">Preparing your arc…</div>
      </div>
    );
  }

  const step = progress.currentStep;
  const day = progress.currentDay;
  const stepsForDay =
    day === 1 ? DAY1_STEPS : day === 2 ? DAY2_STEPS : DAY3_STEPS;
  const stepIndex = Math.max(0, (stepsForDay as readonly string[]).indexOf(step));
  const showTopbar = step !== "interest";

  // hook-flavoured Day 3 mini case (single per hook now — synced)
  const miniCase: MiniCase = hook.miniCase;

  // Demo mode: Next is always unlocked — presenters can move freely.
  const canNext = true;

  const advance = (patch: Partial<typeof progress>) => {
    clearStep(step);
    update(patch);
  };

  return (
    <div className="min-h-dvh bg-background text-foreground arc-shell flex flex-col">
      <a
        href="#arc-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      {showTopbar && (
        <ArcTopbar
          currentDay={day}
          stepIndex={stepIndex}
          totalSteps={stepsForDay.length}
          interestEmoji={hook.emoji}
          interestLabel={hook.badgeLabel}
          estLabel={EST_LABEL[day]}
        />
      )}

      <main id="arc-main" aria-live="polite" className="flex-1 px-4 py-6 sm:py-8">
        {step === "interest" && (
          <InterestPicker
            onPick={(tag, custom) =>
              update({
                interestTag: custom ?? tag,
                currentStep: "hook",
                currentDay: 1,
              })
            }
          />
        )}

        {step === "hook" && (
          <HookShortCard
            hook={hook}
            onPickedAndContinue={(picked, correct) => {
              update({
                day1Guess: picked,
                signals: { ...(progress.signals ?? {}), hookCorrect: correct },
                currentStep: "first_thought",
              });
            }}
          />
        )}

        {step === "first_thought" && (
          <ReflectInput
            conceptKey={CONCEPT.conceptKey}
            step="day1.first_thought"
            interestTag={progress.interestTag}
            prompt="Before any answer — what's the very first thing going through your head about this?"
            placeholder="One sentence is enough."
            ctaLabel="See the aha moment →"
            onContinue={(text) =>
              advance({ day1FirstThought: text, currentStep: "aha_visual" })
            }
          />
        )}

        {step === "aha_visual" && (
          <AhaVisual
            guess={progress.day1FirstThought ?? ""}
            aha={hook.aha}
            onContinue={() => advance({ currentStep: "believe_doubt" })}
          />
        )}

        {step === "sort_activity" && (
          <SortActivity
            prompt={hook.sortPrompt}
            items={hook.sortItems}
            onDone={(allCorrect) => {
              markDone("sort_activity");
              advance({
                signals: { ...(progress.signals ?? {}), sortAllCorrect: allCorrect },
                currentStep: "unfold",
              });
            }}
          />
        )}

        {step === "trap_tf" && (
          <TrapTF
            trap={hook.trap}
            onContinue={(pick) => {
              markDone("trap_tf");
              advance({
                signals: { ...(progress.signals ?? {}), trapPick: pick },
                currentStep: "teach_friend",
              });
            }}
          />
        )}

        {step === "day1_done" && (
          <Day1Done
            interestEmoji={hook.emoji}
            onContinue={() =>
              advance({ currentStep: "yesterday_echo", currentDay: 2 })
            }
          />
        )}

        {step === "yesterday_echo" && (
          <YesterdayEcho
            echo={CONCEPT.yesterdayEchoTemplate(progress.day1FirstThought ?? "")}
            onContinue={() => advance({ currentStep: "sort_activity" })}
          />
        )}

        {step === "believe_doubt" && (
          <BelieveDoubt
            claim={CONCEPT.believeDoubtClaim}
            onPick={(choice) => {
              markDone("believe_doubt");
              // Day 1 uses believe/doubt as the misconception beat; Day 2 (if
              // ever routed here) continues into unfold.
              if (progress.currentDay === 1) {
                advance({
                  day2Belief: choice,
                  currentStep: "day1_done",
                  day1CompletedAt: new Date().toISOString(),
                });
              } else {
                advance({ day2Belief: choice, currentStep: "unfold" });
              }
            }}
          />
        )}


        {step === "unfold" && (
          <ConceptUnfold
            steps={CONCEPT.conceptUnfold}
            onDone={() => advance({ currentStep: "tricky_mcq" })}
          />
        )}

        {step === "tricky_mcq" && (
          <TrickyMcq
            data={hook.trickyMcq}
            onPicked={(correct) => {
              markDone("tricky_mcq");
              update({
                signals: { ...(progress.signals ?? {}), trickyCorrect: correct },
              });
            }}
          />
        )}

        {step === "own_words" && (
          <ReflectInput
            conceptKey={CONCEPT.conceptKey}
            step="day2.own_words"
            interestTag={progress.interestTag}
            prompt="In your own words — what does 'real numbers' mean to you right now?"
            placeholder="No textbook words needed."
            ctaLabel="Continue tomorrow →"
            onContinue={(text) =>
              advance({
                day2OwnWords: text,
                currentStep: "mini_cases",
                currentDay: 3,
                day2CompletedAt: new Date().toISOString(),
              })
            }
          />
        )}

        {step === "mini_cases" && (
          <HookMiniCase
            mc={miniCase}
            onContinue={(answer) => {
              markDone("mini_cases");
              advance({
                day3CaseAnswers: { ...(progress.day3CaseAnswers ?? {}), [miniCase.id]: answer },
                currentStep: "trap_tf",
              });
            }}
          />
        )}


        {step === "teach_friend" && (
          <ReflectInput
            conceptKey={CONCEPT.conceptKey}
            step="day3.teach_friend"
            interestTag={progress.interestTag}
            prompt={CONCEPT.teachAFriendPrompt}
            placeholder="Talk like you're really talking to them."
            ctaLabel="Close the loop"
            onContinue={(text) =>
              advance({ day3TeachLine: text, currentStep: "loop_close" })
            }
          />
        )}

        {step === "loop_close" && (
          <LoopClose
            line={CONCEPT.loopCloseLine}
            onRestart={() => {
              localStorage.removeItem(`mgcv:arc:${CONCEPT.conceptKey}`);
              update({
                currentDay: 1,
                currentStep: "interest",
                day1FirstThought: undefined,
                day1Guess: undefined,
                day1CompletedAt: undefined,
                day2Belief: undefined,
                day2OwnWords: undefined,
                day2CompletedAt: undefined,
                day3CaseAnswers: {},
                day3TeachLine: undefined,
                day3CompletedAt: new Date().toISOString(),
              });
            }}
          />
        )}

        <div className="text-center mt-6">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => {
              localStorage.removeItem(`mgcv:arc:${CONCEPT.conceptKey}`);
              window.location.reload();
            }}
          >
            Reset (dev)
          </Button>
        </div>
      </main>

      {showTopbar && (
        <ArcNav
          canBack={canGoBack}
          onBack={goBack}
          canNext={canNext}
          onNext={() => {
            // Default forward — most steps already auto-advance via their own CTA.
            // This is a safety hatch for passive screens (aha, day_done, unfold).
            const order: string[] = [
              "interest",
              ...DAY1_STEPS,
              ...DAY2_STEPS,
              ...DAY3_STEPS,
            ];
            const idx = order.indexOf(step);
            const nextStep = (order[idx + 1] ?? step) as typeof step;
            clearStep(step);
            update({ currentStep: nextStep });
          }}
          nextLabel="Next"
        />
      )}
    </div>
  );
}

// Inline Day-3 mini case component — hook-flavoured + domain example.
function HookMiniCase({
  mc,
  onContinue,
}: {
  mc: MiniCase;
  onContinue: (answer: string) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div className="arc-shell max-w-[480px] mx-auto space-y-3">
      <div className="text-[10px] uppercase tracking-[2px] font-bold text-emerald-700 flex items-center gap-2">
        <span>Day 3 · Try it on something new</span>
        <span aria-hidden="true" className="flex-1 h-px bg-border" />
      </div>
      <Card className="p-4 sm:p-5">
        <p className="arc-display text-[15px] sm:text-base font-extrabold leading-snug mb-2">
          {mc.situation}
        </p>
        <p className="text-[12px] text-muted-foreground italic mb-3">
          Hint: {mc.nudge}
        </p>
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[12px] px-3 py-2 mb-3">
          <span className="font-semibold">In apps you already use → </span>
          {mc.domainExample}
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Write what you think…"
          maxLength={400}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
        />
        <Button
          className="mt-3 w-full"
          disabled={!draft.trim()}
          onClick={() => onContinue(draft.trim())}
        >
          Now teach a friend →
        </Button>
      </Card>
    </div>
  );
}
