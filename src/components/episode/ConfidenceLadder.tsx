import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import RungCard from "./RungCard";
import VibeCheck from "./VibeCheck";
import { useConceptRungs } from "@/hooks/useConceptRungs";
import { useRungPacing, type Signal } from "@/hooks/useRungPacing";

interface Props {
  day: 1 | 2 | 3;
  chapterId?: string | null;
  episodeId?: string | null;
  conceptKey?: string | null;
  conceptLabel?: string | null;
  subject?: string | null;
  chapterSlug?: string | null;
  /** Called after the student completes today's rung(s). */
  onComplete?: () => void;
}

/**
 * Confidence Ladder header — invisible-ladder progression that runs at the top
 * of each day before the existing day flow.
 *   Day 1 → Rung 1, then Rung 2 (+ optional bonus Rung 3 for confident students)
 *   Day 2 → Rung 3, then Rung 4
 *   Day 3 → Rung 5
 *
 * Rendered as an additive section. The existing day content stays underneath.
 * If anything fails (no auth, no concept, network), the component renders nothing.
 */
const ConfidenceLadder = ({
  day,
  chapterId,
  episodeId,
  conceptKey,
  conceptLabel,
  subject,
  chapterSlug,
  onComplete,
}: Props) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [bonusOffered, setBonusOffered] = useState(false);
  const [showBonus, setShowBonus] = useState(false);
  const [lastSignal, setLastSignal] = useState<Signal | null>(null);
  const [lastVibe, setLastVibe] = useState<"easy" | "right" | "hard" | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUserId(data.user?.id ?? null);
      if (data.user?.id) {
        supabase
          .from("profiles")
          .select("region")
          .eq("user_id", data.user.id)
          .maybeSingle()
          .then(({ data: p }) => {
            if (!cancelled) setRegion((p?.region as string) ?? null);
          });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const { rungs, loading } = useConceptRungs({
    chapterId,
    episodeId,
    conceptKey,
    subject,
    chapterSlug,
    region,
  });

  const pacing = useRungPacing({ userId, chapterId, episodeId, conceptKey, day });

  if (loading || !rungs || !pacing.hydrated) return null;

  // 1-indexed rung number → 0-indexed array
  const idx = pacing.currentRung - 1;
  const rung = rungs[idx];
  if (!rung) return null;

  const eyebrow = day === 1
    ? (pacing.currentRung === 1 ? "Warm-up" : pacing.currentRung === 2 ? "One step further" : "Bonus — see if this clicks")
    : day === 2
      ? (pacing.currentRung === 3 ? "Say it your way" : "Hold your ground")
      : "Try it somewhere new";

  const isLastForDay = pacing.currentRung >= pacing.normalMax;

  if (done) return null;

  const handleSubmit = (signal: Signal) => {
    setLastSignal(signal);
    // Light telemetry — fire-and-forget
    if (userId && chapterId && episodeId) {
      supabase.from("episode_interactions").insert({
        user_id: userId,
        chapter_id: chapterId,
        episode_id: episodeId,
        block_index: pacing.currentRung,
        block_type: `rung_${pacing.currentRung}`,
        wrong_attempts: signal.wrongAttempts,
        time_spent_seconds: signal.timeSec,
        correct_on_first_try: signal.correct && signal.wrongAttempts === 0,
        answer_changes: signal.answerChanges,
        completed_at: new Date().toISOString(),
      }).then(() => {}, () => {});
    }
  };

  const handleContinue = () => {
    const signal = lastSignal ?? { timeSec: 10, wrongAttempts: 0, answerChanges: 0, correct: true };
    const decision = pacing.decide(signal);
    pacing.apply(decision, signal);
    setLastSignal(null);
    if (decision === "vibecheck" || decision === "repeat") return;

    // If we just finished the day's last normal rung, decide bonus offer (Day 1) or done
    if (isLastForDay) {
      if (day === 1 && !bonusOffered && pacing.currentRung < pacing.bonusMax) {
        setBonusOffered(true);
      } else {
        setDone(true);
        onComplete?.();
      }
    }
  };

  return (
    <div className="mb-6 space-y-4">
      {pacing.shouldVibeCheck ? (
        <VibeCheck
          onPick={(answer) => {
            setLastVibe(answer);
            const nextRung = pacing.resolveVibeCheck(answer);
            if (answer !== "hard" && nextRung >= pacing.normalMax) {
              if (day === 1 && !bonusOffered && nextRung < pacing.bonusMax) {
                setBonusOffered(true);
              } else {
                setDone(true);
                onComplete?.();
              }
            }
          }}
        />
      ) : (
        <RungCard
          rung={rung}
          eyebrow={eyebrow}
          onSubmit={handleSubmit}
          onContinue={handleContinue}
          continueLabel={isLastForDay && !bonusOffered ? "Continue" : "Next"}
          vibeResponse={lastVibe}
        />
      )}

      {bonusOffered && !showBonus && (
        <div className="rounded-3xl border border-dashed border-primary/40 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="text-sm text-foreground/80">
            Want one more — a slightly trickier one before we move on?
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setBonusOffered(false);
                setDone(true);
                onComplete?.();
              }}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => {
                setBonusOffered(false);
                setShowBonus(true);
                pacing.unlockBonus();
              }}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Bring it on
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfidenceLadder;
