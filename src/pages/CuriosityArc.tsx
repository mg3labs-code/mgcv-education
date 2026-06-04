import { useMemo } from "react";
import { useArcProgress } from "@/hooks/useArcProgress";
import { realNumbers, type InterestTag } from "@/data/curiosityConcepts/realNumbers";
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
import ApplyMiniCases from "@/components/curiosity/ApplyMiniCases";
import LoopClose from "@/components/curiosity/LoopClose";
import ArcTopbar from "@/components/curiosity/ArcTopbar";
import { Button } from "@/components/ui/button";

const CONCEPT = realNumbers;

// step ordering used to drive the progress dots in the topbar
const DAY1_STEPS = [
  "hook",
  "hook_mcq",
  "first_thought",
  "aha_visual",
  "sort_activity",
  "trap_tf",
  "day1_done",
] as const;
const DAY2_STEPS = [
  "yesterday_echo",
  "believe_doubt",
  "unfold",
  "own_words",
  "day2_done",
] as const;
const DAY3_STEPS = [
  "mini_cases",
  "teach_friend",
  "loop_close",
  "day3_done",
] as const;

const EST_LABEL: Record<1 | 2 | 3, string> = {
  1: "~5 min",
  2: "~6 min",
  3: "~5 min",
};

export default function CuriosityArc() {
  const { progress, update, loaded } = useArcProgress(CONCEPT.conceptKey);

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
  const stepIndex = Math.max(
    0,
    (stepsForDay as readonly string[]).indexOf(step),
  );

  // Interest picker is its own welcome screen (pre-arc)
  const showTopbar = step !== "interest";

  return (
    <div className="min-h-dvh bg-background text-foreground arc-shell">
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

      <main
        id="arc-main"
        aria-live="polite"
        className="px-4 py-6 sm:py-8"
      >
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
            onPickedAndContinue={(picked, correct) =>
              update({
                day1Guess: picked,
                signals: { ...(progress.signals ?? {}), hookCorrect: correct },
                currentStep: "first_thought",
              })
            }
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
              update({ day1FirstThought: text, currentStep: "aha_visual" })
            }
          />
        )}

        {step === "aha_visual" && (
          <AhaVisual
            guess={progress.day1FirstThought ?? ""}
            aha={hook.aha}
            onContinue={() => update({ currentStep: "sort_activity" })}
          />
        )}

        {step === "sort_activity" && (
          <SortActivity
            prompt={hook.sortPrompt}
            items={hook.sortItems}
            onDone={(allCorrect) =>
              update({
                signals: {
                  ...(progress.signals ?? {}),
                  sortAllCorrect: allCorrect,
                },
                currentStep: "trap_tf",
              })
            }
          />
        )}

        {step === "trap_tf" && (
          <TrapTF
            trap={hook.trap}
            onContinue={(pick) =>
              update({
                signals: { ...(progress.signals ?? {}), trapPick: pick },
                currentStep: "day1_done",
                day1CompletedAt: new Date().toISOString(),
              })
            }
          />
        )}

        {step === "day1_done" && (
          <Day1Done
            interestEmoji={hook.emoji}
            onContinue={() =>
              update({
                currentStep: "yesterday_echo",
                currentDay: 2,
              })
            }
          />
        )}

        {step === "yesterday_echo" && (
          <YesterdayEcho
            echo={CONCEPT.yesterdayEchoTemplate(progress.day1FirstThought ?? "")}
            onContinue={() => update({ currentStep: "believe_doubt" })}
          />
        )}

        {step === "believe_doubt" && (
          <BelieveDoubt
            claim={CONCEPT.believeDoubtClaim}
            onPick={(choice) =>
              update({ day2Belief: choice, currentStep: "unfold" })
            }
          />
        )}

        {step === "unfold" && (
          <ConceptUnfold
            steps={CONCEPT.conceptUnfold}
            onDone={() => update({ currentStep: "own_words" })}
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
              update({
                day2OwnWords: text,
                currentStep: "mini_cases",
                currentDay: 3,
                day2CompletedAt: new Date().toISOString(),
              })
            }
          />
        )}

        {step === "mini_cases" && (
          <ApplyMiniCases
            cases={CONCEPT.miniCases}
            onDone={(answers) =>
              update({ day3CaseAnswers: answers, currentStep: "teach_friend" })
            }
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
              update({ day3TeachLine: text, currentStep: "loop_close" })
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

        <div className="text-center mt-8">
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
    </div>
  );
}
