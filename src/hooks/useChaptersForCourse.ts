import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ChapterDef } from "@/components/teacher/TeachingCalendar";

/**
 * Loads the chapter + episode list for a specific (board, grade, subject)
 * from `tb_chapters` / `tb_episodes` and reshapes it into the `ChapterDef[]`
 * structure consumed by <TeachingCalendar />.
 *
 * This is what makes each class's schedule unique — previously every teacher
 * (regardless of class/board) saw the same hardcoded Math chapters.
 */
export function useChaptersForCourse(
  board: string | undefined,
  grade: number | undefined,
  subject: string | undefined,
) {
  return useQuery({
    queryKey: ["chapters-for-course", board, grade, subject],
    enabled: !!board && !!grade && !!subject,
    queryFn: async (): Promise<ChapterDef[]> => {
      if (!board || !grade || !subject) return [];

      // 1. Find the matching subject row (case-insensitive on name).
      const { data: subj } = await supabase
        .from("subjects")
        .select("id")
        .eq("board", board)
        .eq("grade", grade)
        .ilike("name", subject)
        .maybeSingle();

      if (!subj?.id) return [];

      // 2. Fetch chapters scoped to that subject AND to (board, grade) so the
      //    newly added per-class scoping is honoured even if a subject row is
      //    later reused across classes.
      const { data: chs, error } = await supabase
        .from("tb_chapters")
        .select(
          "id, slug, number, title, color, periods, tb_episodes(id, slug, number, title, sort_order)",
        )
        .eq("subject_id", subj.id)
        .eq("board", board)
        .eq("grade", grade)
        .order("sort_order");

      if (error || !chs) return [];

      return chs.map((ch: any, idx: number) => {
        const eps = (ch.tb_episodes || []).slice().sort(
          (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
        );
        const teachingDays = Math.max(eps.length, 1);
        const colorHex = ch.color || "#6366f1";
        const cssKey = ch.slug || `ch_${idx}`;
        return {
          id: ch.slug || `ch_${idx}`,
          name: ch.title,
          teachingDays,
          practiceDays: 3,
          testDays: 1,
          colorClass: "bg-indigo-500",
          colorHex,
          topics: eps.map((ep: any) => ({
            key: ep.slug,
            title: ep.title,
            cssClass: cssKey,
          })),
        } as ChapterDef;
      });
    },
  });
}
