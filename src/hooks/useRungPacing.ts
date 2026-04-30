import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Signal = {
  /** Seconds spent on the current rung. */
  timeSec: number;
  /** Wrong attempts on the current rung. */
  wrongAttempts: number;
  /** Times student changed their answer before submitting. */
  answerChanges: number;
  /** Whether final answer was correct. */
  correct: boolean;
};

export type PacingDecision = "climb" | "repeat" | "vibecheck";

interface Args {
  userId?: string | null;
  chapterId?: string | null;
  episodeId?: string | null;
  conceptKey?: string | null;
  /** Day determines starting + max rung (1=Day1: rungs 1-2(+bonus 3), 2=Day2: 3-4, 3=Day3: 5). */
  day: 1 | 2 | 3;
}

const DAY_RANGE: Record<1 | 2 | 3, [number, number, number]> = {
  // [start, normalMax, bonusMax]
  1: [1, 2, 3],
  2: [3, 4, 4],
  3: [5, 5, 5],
};

/**
 * Returns the current rung, a way to record a signal + decide next action,
 * and a flag that says when to surface the optional vibe-check.
 */
export function useRungPacing({ userId, chapterId, episodeId, conceptKey, day }: Args) {
  const [start, normalMax, bonusMax] = DAY_RANGE[day];
  const [currentRung, setCurrentRung] = useState<number>(start);
  const [shouldVibeCheck, setShouldVibeCheck] = useState(false);
  const [vibeShown, setVibeShown] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from DB
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!userId || !chapterId || !episodeId || !conceptKey) {
        setHydrated(true);
        return;
      }
      try {
        const { data } = await supabase
          .from("student_rung_state")
          .select("current_rung, vibe_check_shown_today")
          .eq("user_id", userId)
          .eq("chapter_id", chapterId)
          .eq("episode_id", episodeId)
          .eq("concept_key", conceptKey)
          .maybeSingle();
        if (!cancelled && data) {
          // If saved rung is within today's day range, restore. Otherwise start fresh.
          const saved = data.current_rung ?? start;
          if (saved >= start && saved <= bonusMax) {
            setCurrentRung(saved);
          } else {
            setCurrentRung(start);
          }
          setVibeShown(!!data.vibe_check_shown_today);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setHydrated(true);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userId, chapterId, episodeId, conceptKey, start, bonusMax]);

  const persist = useCallback(
    async (rung: number, signal: Signal | null, vibeShownNow: boolean) => {
      if (!userId || !chapterId || !episodeId || !conceptKey) return;
      try {
        await supabase.from("student_rung_state").upsert(
          {
            user_id: userId,
            chapter_id: chapterId,
            episode_id: episodeId,
            concept_key: conceptKey,
            current_rung: rung,
            last_signal: signal ?? {},
            vibe_check_shown_today: vibeShownNow,
          },
          { onConflict: "user_id,chapter_id,episode_id,concept_key" },
        );
      } catch {
        // non-fatal
      }
    },
    [userId, chapterId, episodeId, conceptKey],
  );

  /** Decide what happens after the student submits an answer for the current rung. */
  const decide = useCallback(
    (signal: Signal): PacingDecision => {
      // Wrong twice → vibe-check
      if (!signal.correct && signal.wrongAttempts >= 2) {
        return vibeShown ? "repeat" : "vibecheck";
      }
      // Wrong once → repeat softly
      if (!signal.correct) return "repeat";

      // Correct, fast, decisive → climb
      if (signal.timeSec <= 25 && signal.answerChanges <= 1) return "climb";

      // Correct but ambiguous → vibe-check (once per day)
      if (!vibeShown && (signal.timeSec > 45 || signal.answerChanges >= 3)) return "vibecheck";

      return "climb";
    },
    [vibeShown],
  );

  /** Apply a decision: advances/repeats the rung. Returns the new rung. */
  const apply = useCallback(
    (decision: PacingDecision, signal?: Signal) => {
      let next = currentRung;
      if (decision === "climb") {
        next = Math.min(currentRung + 1, normalMax);
      }
      // 'repeat' keeps the rung
      if (decision === "vibecheck") {
        setShouldVibeCheck(true);
        return currentRung;
      }
      setCurrentRung(next);
      persist(next, signal ?? null, vibeShown);
      return next;
    },
    [currentRung, normalMax, persist, vibeShown],
  );

  /** Resolve the vibe-check answer. */
  const resolveVibeCheck = useCallback(
    (answer: "easy" | "right" | "hard") => {
      setShouldVibeCheck(false);
      setVibeShown(true);
      let next = currentRung;
      if (answer === "easy") next = Math.min(currentRung + 1, normalMax);
      if (answer === "hard") next = currentRung; // repeat with softer angle
      if (answer === "right") next = Math.min(currentRung + 1, normalMax);
      setCurrentRung(next);
      persist(next, { timeSec: 0, wrongAttempts: 0, answerChanges: 0, correct: true }, true);
    },
    [currentRung, normalMax, persist],
  );

  /** Day 1 only: unlock bonus rung 3 if student is on a winning streak. */
  const unlockBonus = useCallback(() => {
    if (day !== 1) return;
    if (currentRung >= bonusMax) return;
    setCurrentRung(bonusMax);
    persist(bonusMax, null, vibeShown);
  }, [day, bonusMax, currentRung, persist, vibeShown]);

  return {
    currentRung,
    normalMax,
    bonusMax,
    shouldVibeCheck,
    vibeShown,
    hydrated,
    decide,
    apply,
    resolveVibeCheck,
    unlockBonus,
  };
}
