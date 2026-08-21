import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const innerOsChapterId = (journeyId: string) => `inneros:${journeyId}`;

export interface InnerOSProgressRow {
  chapter_id: string;
  episode_id: string;
  completion_pct: number;
  completed_at: string | null;
  layer_scores: Record<string, any> | null;
}

/**
 * Persists Inner OS module completion in `episode_progress`
 * (chapter_id = "inneros:<journeyId>", episode_id = module id).
 */
export function useInnerOSProgress() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const queryKey = ["inneros_progress", user?.id];

  const { data, isLoading } = useQuery({
    queryKey,
    enabled: !!user,
    staleTime: 15_000,
    queryFn: async () => {
      if (!user) return [] as InnerOSProgressRow[];
      const { data, error } = await supabase
        .from("episode_progress")
        .select("chapter_id, episode_id, completion_pct, completed_at, layer_scores")
        .eq("user_id", user.id)
        .like("chapter_id", "inneros:%");
      if (error) throw error;
      return (data || []) as unknown as InnerOSProgressRow[];
    },
  });

  const rows = data ?? [];

  const completeModule = useMutation({
    mutationFn: async (args: {
      journeyId: string;
      moduleId: string;
      steps: number;
      day?: number;
      xp: number;
    }) => {
      if (!user) return;
      const { error } = await supabase.from("episode_progress").upsert(
        {
          user_id: user.id,
          chapter_id: innerOsChapterId(args.journeyId),
          episode_id: args.moduleId,
          completion_pct: 100,
          completed_at: new Date().toISOString(),
          layer_scores: { day: args.day ?? 1, steps_done: args.steps, xp: args.xp },
        } as any,
        { onConflict: "user_id,chapter_id,episode_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const resetJourney = useMutation({
    mutationFn: async (journeyId: string) => {
      if (!user) return;
      const { error } = await supabase
        .from("episode_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("chapter_id", innerOsChapterId(journeyId));
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const resetModule = useMutation({
    mutationFn: async (args: { journeyId: string; moduleId: string }) => {
      if (!user) return;
      const { error } = await supabase
        .from("episode_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("chapter_id", innerOsChapterId(args.journeyId))
        .eq("episode_id", args.moduleId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const doneByJourney = useMemo(() => {
    const map = new Map<string, Set<string>>();
    rows.forEach((r) => {
      if (!(r.completed_at || r.completion_pct >= 100)) return;
      const jid = r.chapter_id.replace("inneros:", "");
      if (!map.has(jid)) map.set(jid, new Set());
      map.get(jid)!.add(r.episode_id);
    });
    return map;
  }, [rows]);

  const savedXp = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.layer_scores?.xp) || 0), 0),
    [rows],
  );

  const doneIdsFor = useCallback(
    (journeyId: string) => doneByJourney.get(journeyId) ?? new Set<string>(),
    [doneByJourney],
  );

  return {
    isLoading,
    isSignedIn: !!user,
    doneIdsFor,
    savedXp,
    completeModule,
    resetJourney,
    resetModule,
  };
}
