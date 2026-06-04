// Persists the student's 3-day arc progress for one concept.
// Local-first (so the UI never blocks on the network) and writes
// quietly through to Supabase when the user is signed in.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ArcStep =
  | "interest"
  | "hook"
  | "hook_mcq"
  | "first_thought"
  | "aha_visual"
  | "sort_activity"
  | "trap_tf"
  | "day1_done"
  | "yesterday_echo"
  | "believe_doubt"
  | "unfold"
  | "own_words"
  | "day2_done"
  | "mini_cases"
  | "teach_friend"
  | "loop_close"
  | "day3_done";

export interface ArcProgress {
  conceptKey: string;
  currentDay: 1 | 2 | 3;
  currentStep: ArcStep;
  interestTag?: string;
  day1FirstThought?: string;
  day1Guess?: string;
  day1CompletedAt?: string;
  day2Belief?: string;
  day2OwnWords?: string;
  day2CompletedAt?: string;
  day3CaseAnswers?: Record<string, string>;
  day3TeachLine?: string;
  day3CompletedAt?: string;
  signals?: Record<string, unknown>;
}

const lsKey = (conceptKey: string) => `mgcv:arc:${conceptKey}`;

const empty = (conceptKey: string): ArcProgress => ({
  conceptKey,
  currentDay: 1,
  currentStep: "interest",
  signals: {},
});

export function useArcProgress(conceptKey: string) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ArcProgress>(() => {
    if (typeof window === "undefined") return empty(conceptKey);
    try {
      const raw = localStorage.getItem(lsKey(conceptKey));
      return raw ? { ...empty(conceptKey), ...JSON.parse(raw) } : empty(conceptKey);
    } catch {
      return empty(conceptKey);
    }
  });
  const [loaded, setLoaded] = useState(false);

  // Hydrate from server once when user is known
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user) {
        setLoaded(true);
        return;
      }
      const { data } = await supabase
        .from("curiosity_arc_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("concept_key", conceptKey)
        .maybeSingle();
      if (!alive) return;
      if (data) {
        setProgress((prev) => ({
          ...prev,
          conceptKey,
          currentDay: (data.current_day as 1 | 2 | 3) ?? prev.currentDay,
          currentStep: (data.current_step as ArcStep) ?? prev.currentStep,
          interestTag: data.interest_tag ?? prev.interestTag,
          day1FirstThought: data.day1_first_thought ?? prev.day1FirstThought,
          day1Guess: data.day1_guess ?? prev.day1Guess,
          day1CompletedAt: data.day1_completed_at ?? prev.day1CompletedAt,
          day2Belief: data.day2_belief ?? prev.day2Belief,
          day2OwnWords: data.day2_own_words ?? prev.day2OwnWords,
          day2CompletedAt: data.day2_completed_at ?? prev.day2CompletedAt,
          day3CaseAnswers:
            (data.day3_case_answers as Record<string, string>) ?? prev.day3CaseAnswers,
          day3TeachLine: data.day3_teach_line ?? prev.day3TeachLine,
          day3CompletedAt: data.day3_completed_at ?? prev.day3CompletedAt,
          signals: (data.signals as Record<string, unknown>) ?? prev.signals,
        }));
      }
      setLoaded(true);
    })();
    return () => {
      alive = false;
    };
  }, [user, conceptKey]);

  const persist = useCallback(
    async (next: ArcProgress) => {
      try {
        localStorage.setItem(lsKey(conceptKey), JSON.stringify(next));
      } catch {
        /* ignore */
      }
      if (!user) return;
      await supabase.from("curiosity_arc_progress").upsert(
        [
          {
            user_id: user.id,
            concept_key: next.conceptKey,
            current_day: next.currentDay,
            current_step: next.currentStep,
            interest_tag: next.interestTag ?? null,
            day1_first_thought: next.day1FirstThought ?? null,
            day1_guess: next.day1Guess ?? null,
            day1_completed_at: next.day1CompletedAt ?? null,
            day2_belief: next.day2Belief ?? null,
            day2_own_words: next.day2OwnWords ?? null,
            day2_completed_at: next.day2CompletedAt ?? null,
            day3_case_answers: (next.day3CaseAnswers ?? {}) as never,
            day3_teach_line: next.day3TeachLine ?? null,
            day3_completed_at: next.day3CompletedAt ?? null,
            signals: (next.signals ?? {}) as never,
          },
        ],
        { onConflict: "user_id,concept_key" },
      );
    },
    [user, conceptKey],
  );

  const update = useCallback(
    (patch: Partial<ArcProgress>) => {
      setProgress((prev) => {
        const next = { ...prev, ...patch };
        void persist(next);
        return next;
      });
    },
    [persist],
  );

  return { progress, update, loaded };
}
