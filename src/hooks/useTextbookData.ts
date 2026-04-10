import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Chapter, Episode, ContentBlock } from "@/data/textbookData";

// Fetch all subjects
export function useSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

// Fetch chapters for a subject
export function useChapters(subjectSlug?: string) {
  return useQuery({
    queryKey: ["tb_chapters", subjectSlug],
    queryFn: async () => {
      let subjectId: string | null = null;
      if (subjectSlug) {
        const { data: subj } = await supabase
          .from("subjects")
          .select("id")
          .ilike("name", subjectSlug)
          .single();
        subjectId = subj?.id ?? null;
      }

      let query = supabase
        .from("tb_chapters")
        .select("*, tb_episodes(id, slug, number, title, subtitle, duration, type, sort_order, is_published)")
        .order("sort_order");

      if (subjectId) {
        query = query.eq("subject_id", subjectId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((ch: any) => ({
        id: ch.slug,
        number: ch.number,
        title: ch.title,
        subtitle: ch.subtitle || "",
        color: ch.color || "#6366f1",
        periods: ch.periods || 0,
        pageRange: ch.page_range || "",
        episodes: (ch.tb_episodes || [])
          .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((ep: any) => ({
            id: ep.slug,
            number: ep.number,
            title: ep.title || "",
            subtitle: ep.subtitle || "",
            duration: ep.duration || "",
            type: ep.type || "Concept",
            blocks: [],
          })),
      })) as Chapter[];
    },
  });
}

// Fetch episodes for a chapter by slug
export function useChapterEpisodes(chapterSlug: string | undefined) {
  return useQuery({
    queryKey: ["tb_episodes", chapterSlug],
    enabled: !!chapterSlug,
    queryFn: async () => {
      if (!chapterSlug) return null;

      const { data: chapter, error: chErr } = await supabase
        .from("tb_chapters")
        .select("*")
        .eq("slug", chapterSlug)
        .single();

      if (chErr || !chapter) return null;

      const { data: episodes, error: epErr } = await supabase
        .from("tb_episodes")
        .select("*")
        .eq("chapter_id", chapter.id)
        .order("sort_order");

      if (epErr) throw epErr;

      const mappedEpisodes: Episode[] = (episodes || []).map((ep: any) => ({
        id: ep.slug,
        number: ep.number,
        title: ep.title,
        subtitle: ep.subtitle || "",
        duration: ep.duration || "8 min",
        type: ep.type as Episode["type"],
        blocks: [],
      }));

      return {
        id: chapter.slug,
        number: chapter.number,
        title: chapter.title,
        subtitle: chapter.subtitle || "",
        color: chapter.color || "#6366f1",
        periods: chapter.periods || 0,
        pageRange: chapter.page_range || "",
        episodes: mappedEpisodes,
      } as Chapter;
    },
  });
}

// Fetch content blocks for an episode by slug
export function useEpisodeBlocks(chapterSlug: string | undefined, episodeSlug: string | undefined, depth: "board" | "all" = "board") {
  return useQuery({
    queryKey: ["content_blocks", chapterSlug, episodeSlug, depth],
    enabled: !!chapterSlug && !!episodeSlug,
    queryFn: async () => {
      if (!chapterSlug || !episodeSlug) return null;

      const { data: episode } = await supabase
        .from("tb_episodes")
        .select("id, slug")
        .eq("slug", episodeSlug)
        .single();

      if (!episode) return [];

      let query = supabase
        .from("content_blocks")
        .select("*")
        .eq("episode_id", episode.id)
        .order("sort_order");

      if (depth === "board") {
        query = query.eq("depth", "board");
      }

      const { data: blocks, error } = await query;

      if (error || !blocks) return [];

      return blocks.map((b: any) => ({
        type: b.block_type as ContentBlock["type"],
        title: b.title || "",
        icon: b.icon || "📖",
        depth: b.depth || "board",
        content: b.content,
      })) as ContentBlock[];
    },
  });
}
