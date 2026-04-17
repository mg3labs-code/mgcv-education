import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface EpisodeProgressRow {
  chapter_id: string;
  episode_id: string;
  completion_pct: number;
  completed_at: string | null;
  started_at: string;
  time_spent_seconds: number;
}

/**
 * Fetch all of the current user's episode_progress rows once and key them
 * by `${chapter_id}::${episode_id}`. Components can then look up status
 * for any (chapter, episode) without N extra queries.
 */
export function useUserEpisodeProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["episode_progress", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return new Map<string, EpisodeProgressRow>();
      const { data, error } = await supabase
        .from("episode_progress")
        .select("chapter_id, episode_id, completion_pct, completed_at, started_at, time_spent_seconds")
        .eq("user_id", user.id);

      if (error) throw error;

      const map = new Map<string, EpisodeProgressRow>();
      (data || []).forEach((row: any) => {
        map.set(`${row.chapter_id}::${row.episode_id}`, row as EpisodeProgressRow);
      });
      return map;
    },
    staleTime: 30_000,
  });
}

export type EpisodeStatus = "not-started" | "in-progress" | "completed";

export function getEpisodeStatus(
  progress: Map<string, EpisodeProgressRow> | undefined,
  chapterSlug: string,
  episodeSlug: string
): { status: EpisodeStatus; pct: number } {
  const row = progress?.get(`${chapterSlug}::${episodeSlug}`);
  if (!row) return { status: "not-started", pct: 0 };
  if (row.completed_at || row.completion_pct >= 100) return { status: "completed", pct: 100 };
  if (row.completion_pct > 0) return { status: "in-progress", pct: row.completion_pct };
  return { status: "not-started", pct: 0 };
}

/**
 * Aggregate chapter-level progress from the per-episode map.
 * Returns { completed, total, pct, hasInProgress, resumeEpisodeSlug }.
 */
export function getChapterProgress(
  progress: Map<string, EpisodeProgressRow> | undefined,
  chapterSlug: string,
  episodeSlugs: string[]
) {
  if (episodeSlugs.length === 0) {
    return { completed: 0, total: 0, pct: 0, hasInProgress: false, resumeEpisodeSlug: null as string | null };
  }
  let completed = 0;
  let inProgressSlug: string | null = null;
  for (const slug of episodeSlugs) {
    const { status } = getEpisodeStatus(progress, chapterSlug, slug);
    if (status === "completed") completed += 1;
    else if (status === "in-progress" && !inProgressSlug) inProgressSlug = slug;
  }
  // Resume = first in-progress; else first not-started after the last completed
  let resumeEpisodeSlug = inProgressSlug;
  if (!resumeEpisodeSlug && completed < episodeSlugs.length) {
    resumeEpisodeSlug = episodeSlugs[completed] ?? null;
  }
  const pct = Math.round((completed / episodeSlugs.length) * 100);
  return { completed, total: episodeSlugs.length, pct, hasInProgress: !!inProgressSlug, resumeEpisodeSlug };
}
