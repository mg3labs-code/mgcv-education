import { useMemo } from "react";
import { useArcProgress } from "@/hooks/useArcProgress";
import { realNumbers, type InterestTag } from "@/data/curiosityConcepts/realNumbers";
import InterestPicker from "@/components/curiosity/InterestPicker";
import HookCard from "@/components/curiosity/HookCard";
import TapGuesses from "@/components/curiosity/TapGuesses";
import ReflectInput from "@/components/curiosity/ReflectInput";
import TinyReveal from "@/components/curiosity/TinyReveal";
import YesterdayEcho from "@/components/curiosity/YesterdayEcho";
import BelieveDoubt from "@/components/curiosity/BelieveDoubt";
import ConceptUnfold from "@/components/curiosity/ConceptUnfold";
import ApplyMiniCases from "@/components/curiosity/ApplyMiniCases";
import LoopClose from "@/components/curiosity/LoopClose";
import { Button } from "@/components/ui/button";

const CONCEPT = realNumbers;

export default function CuriosityArc() {
  const { progress, update, loaded } = useArcProgress(CONCEPT.conceptKey);

  const hook = useMemo(() => {
    const tag = (progress.interestTag as InterestTag) || "cricket";
    return CONCEPT.hooks.find((h) => h.tag === tag) ?? CONCEPT.hooks[0];
  }, [progress.interestTag]);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Preparing your arc…</div>
      </div>
    );
  }

  const step = progress.currentStep;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Class 10 · Maths
            </div>
            <h1 className="text-base sm:text-lg font-serif font-semibold">
              {CONCEPT.conceptLabel} · 3-day curiosity loop
            </h1>
          </div>
          <DayPill day={progress.currentDay} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
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
          <HookCard hook={hook} onReady={() => update({ currentStep: "guess" })} />
        )}

        {step === "guess" && (
          <TapGuesses
            guesses={hook.guesses}
            onPick={(guess) => update({ day1Guess: guess, currentStep: "first_thought" })}
          />
        )}

        {step === "first_thought" && (
          <ReflectInput
            conceptKey={CONCEPT.conceptKey}
            step="day1.first_thought"
            interestTag={progress.interestTag}
            prompt="Before any answer — what's the very first thing going through your head about this?"
            placeholder="One sentence is enough."
            ctaLabel="See today's tiny reveal"
            onContinue={(text) =>
              update({ day1FirstThought: text, currentStep: "tiny_reveal" })
            }
          />
        )}

        {step === "tiny_reveal" && (
          <TinyReveal
            line={hook.tinyReveal}
            onClose={() =>
              update({
                currentStep: "yesterday_echo",
                currentDay: 2,
                day1CompletedAt: new Date().toISOString(),
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

function DayPill({ day }: { day: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((d) => (
        <span
          key={d}
          className={`text-xs px-2 py-1 rounded-full border ${
            d === day
              ? "bg-primary text-primary-foreground border-primary"
              : d < day
              ? "bg-primary/10 text-primary border-primary/30"
              : "bg-card text-muted-foreground border-border"
          }`}
        >
          Day {d}
        </span>
      ))}
    </div>
  );
}
