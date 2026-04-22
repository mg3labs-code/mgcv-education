import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { DayNumber } from "@/lib/childFriendlyLabels";

const UNLOCK_HOURS = 20; // 20h not 24h so 8pm Mon → 4pm Tue works after school

export interface EpisodeDayState {
  day1_completed_at: string | null;
  day2_completed_at: string | null;
  day3_completed_at: string | null;
  day1_hook_answer: string | null;
  day1_detective_correct: boolean | null;
  day2_explanation: string | null;
}

const EMPTY: EpisodeDayState = {
  day1_completed_at: null,
  day2_completed_at: null,
  day3_completed_at: null,
  day1_hook_answer: null,
  day1_detective_correct: null,
  day2_explanation: null,
};

export interface UnlockInfo {
  currentDay: DayNumber;
  day1Done: boolean;
  day2Done: boolean;
  day3Done: boolean;
  day2UnlocksAt: Date | null;
  day3UnlocksAt: Date | null;
  day2Locked: boolean;
  day3Locked: boolean;
  msUntilDay2: number;
  msUntilDay3: number;
  state: EpisodeDayState;
  demoOverride: boolean;
}

function computeUnlock(state: EpisodeDayState, demoOverride: boolean): UnlockInfo {
  const now = Date.now();
  const day1Done = !!state.day1_completed_at;
  const day2Done = !!state.day2_completed_at;
  const day3Done = !!state.day3_completed_at;

  const day2UnlocksAt = state.day1_completed_at
    ? new Date(new Date(state.day1_completed_at).getTime() + UNLOCK_HOURS * 3600 * 1000)
    : null;
  const day3UnlocksAt = state.day2_completed_at
    ? new Date(new Date(state.day2_completed_at).getTime() + UNLOCK_HOURS * 3600 * 1000)
    : null;

  const msUntilDay2 = day2UnlocksAt ? Math.max(0, day2UnlocksAt.getTime() - now) : 0;
  const msUntilDay3 = day3UnlocksAt ? Math.max(0, day3UnlocksAt.getTime() - now) : 0;

  const day2Locked = !demoOverride && day1Done && !day2Done && msUntilDay2 > 0;
  const day3Locked = !demoOverride && day2Done && !day3Done && msUntilDay3 > 0;

  let currentDay: DayNumber = 1;
  if (day3Done) currentDay = 3;
  else if (day2Done) currentDay = 3;
  else if (day1Done) currentDay = 2;

  return {
    currentDay,
    day1Done,
    day2Done,
    day3Done,
    day2UnlocksAt,
    day3UnlocksAt,
    day2Locked,
    day3Locked,
    msUntilDay2,
    msUntilDay3,
    state,
    demoOverride,
  };
}

export function useEpisodeDayUnlock(chapterId: string | undefined, episodeId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const demoOverride =
    searchParams.get("unlock") === "all" ||
    (typeof window !== "undefined" && window.localStorage.getItem("dev-unlock-all-days") === "1");

  const queryKey = ["episode_day_state", user?.id, chapterId, episodeId];

  const query = useQuery({
    queryKey,
    enabled: !!user && !!chapterId && !!episodeId,
    queryFn: async () => {
      if (!user || !chapterId || !episodeId) return EMPTY;
      const { data, error } = await supabase
        .from("episode_progress")
        .select("layer_scores")
        .eq("user_id", user.id)
        .eq("chapter_id", chapterId)
        .eq("episode_id", episodeId)
        .maybeSingle();
      if (error) return EMPTY;
      const scores = (data?.layer_scores ?? {}) as Record<string, unknown>;
      return {
        day1_completed_at: (scores.day1_completed_at as string) ?? null,
        day2_completed_at: (scores.day2_completed_at as string) ?? null,
        day3_completed_at: (scores.day3_completed_at as string) ?? null,
        day1_hook_answer: (scores.day1_hook_answer as string) ?? null,
        day1_detective_correct:
          typeof scores.day1_detective_correct === "boolean"
            ? (scores.day1_detective_correct as boolean)
            : null,
        day2_explanation: (scores.day2_explanation as string) ?? null,
      } as EpisodeDayState;
    },
    staleTime: 10_000,
    refetchInterval: 60_000, // re-poll every minute so countdown stays fresh
  });

  const mutate = useMutation({
    mutationFn: async (patch: Partial<EpisodeDayState>) => {
      if (!user || !chapterId || !episodeId) throw new Error("missing user/episode");
      const current = (query.data ?? EMPTY) as EpisodeDayState;
      const next = { ...current, ...patch };
      // Read existing row to preserve other layer_scores fields (understood, completed)
      const { data: existing } = await supabase
        .from("episode_progress")
        .select("layer_scores")
        .eq("user_id", user.id)
        .eq("chapter_id", chapterId)
        .eq("episode_id", episodeId)
        .maybeSingle();
      const existingScores =
        existing?.layer_scores && typeof existing.layer_scores === "object" && !Array.isArray(existing.layer_scores)
          ? (existing.layer_scores as Record<string, unknown>)
          : {};
      const mergedScores = { ...existingScores, ...next };
      // completion_pct: 33 / 66 / 100 based on days done
      const daysDone = [next.day1_completed_at, next.day2_completed_at, next.day3_completed_at].filter(Boolean).length;
      const pct = daysDone === 0 ? 0 : daysDone === 1 ? 33 : daysDone === 2 ? 66 : 100;
      const { error } = await supabase
        .from("episode_progress")
        .upsert(
          {
            user_id: user.id,
            chapter_id: chapterId,
            episode_id: episodeId,
            layer_scores: mergedScores,
            completion_pct: pct,
            completed_at: pct === 100 ? new Date().toISOString() : null,
          },
          { onConflict: "user_id,chapter_id,episode_id" },
        );
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      qc.setQueryData(queryKey, next);
    },
  });

  const info = computeUnlock(query.data ?? EMPTY, demoOverride);

  return {
    isLoading: query.isLoading,
    info,
    setDayState: mutate.mutateAsync,
    isSaving: mutate.isPending,
  };
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "ready";
  const totalMin = Math.floor(ms / 60000);
  const hours = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  if (hours >= 1) return `${hours}h ${min}m`;
  if (min >= 1) return `${min}m`;
  return "less than a minute";
}
