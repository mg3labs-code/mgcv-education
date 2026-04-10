import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { chapters as hardcodedChapters, Chapter, Episode, ContentBlock } from "@/data/textbookData";

// Types matching DB schema
interface DBSubject {
  id: string;
  name: string;
  board: string;
  grade: number;
  color: string;
  icon: string;
  sort_order: number;
}

interface DBChapter {
  id: string;
  subject_id: string;
  slug: string;
  number: number;
  title: string;
  subtitle: string | null;
  color: string;
  periods: number;
  page_range: string | null;
  sort_order: number;
  is_published: boolean;
  episode_count?: number;
  episodes?: DBEpisode[];
}

interface DBEpisode {
  id: string;
  chapter_id: string;
  slug: string;
  number: number;
  title: string;
  subtitle: string | null;
  duration: string;
  type: string;
  sort_order: number;
  is_published: boolean;
  blocks?: DBContentBlock[];
}

interface DBContentBlock {
  id: string;
  episode_id: string;
  block_type: string;
  title: string | null;
  icon: string | null;
  content: any;
  sort_order: number;
}

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
      return data as DBSubject[];
    },
  });
}

// Fetch chapters for a subject, with episode counts
export function useChapters(subjectSlug?: string) {
  return useQuery({
    queryKey: ["tb_chapters", subjectSlug],
    queryFn: async () => {
      // First get subject
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

      // Map to Chapter interface for compatibility
      const dbChapters: Chapter[] = (data || []).map((ch: any) => ({
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
      }));

      // Merge: prefer DB data, fall back to hardcoded for chapters with content
      const mergedChapters = dbChapters.map((dbCh) => {
        const hardcoded = hardcodedChapters.find((h) => h.id === dbCh.id);
        if (hardcoded && hardcoded.episodes.length > 0 && dbCh.episodes.length === 0) {
          return hardcoded;
        }
        // If DB has episodes, use DB chapter but we need real episode data
        if (hardcoded && hardcoded.episodes.length > 0) {
          return { ...dbCh, episodes: hardcoded.episodes };
        }
        return dbCh;
      });

      // Append any hardcoded chapters not already matched by DB rows
      // Only append hardcoded (Math) chapters when viewing Mathematics
      const isMathSubject = !subjectSlug || subjectSlug.toLowerCase() === "mathematics";
      const dbSlugs = new Set(mergedChapters.map((c) => c.id));
      const unmatchedHardcoded = isMathSubject
        ? hardcodedChapters.filter((h) => !dbSlugs.has(h.id))
        : [];

      return [...mergedChapters, ...unmatchedHardcoded];
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

      // Get chapter from DB
      const { data: chapter, error: chErr } = await supabase
        .from("tb_chapters")
        .select("*")
        .eq("slug", chapterSlug)
        .single();

      if (chErr || !chapter) {
        // Fall back to hardcoded
        const hc = hardcodedChapters.find((c) => c.id === chapterSlug);
        return hc || null;
      }

      // Get episodes
      const { data: episodes, error: epErr } = await supabase
        .from("tb_episodes")
        .select("*")
        .eq("chapter_id", chapter.id)
        .order("sort_order");

      if (epErr) throw epErr;

      // Check if hardcoded has richer episode data
      const hardcoded = hardcodedChapters.find((c) => c.id === chapterSlug);

      const mappedEpisodes: Episode[] = (episodes || []).map((ep: any) => {
        // Try to find matching hardcoded episode for blocks
        const hcEp = hardcoded?.episodes.find((h) => h.id === ep.slug);
        return {
          id: ep.slug,
          number: ep.number,
          title: ep.title,
          subtitle: ep.subtitle || "",
          duration: ep.duration || "8 min",
          type: ep.type as Episode["type"],
          blocks: hcEp?.blocks || [],
        };
      });

      // If DB has no episodes but hardcoded does, use hardcoded episodes
      const finalEpisodes = mappedEpisodes.length > 0 ? mappedEpisodes : (hardcoded?.episodes || []);

      return {
        id: chapter.slug,
        number: chapter.number,
        title: chapter.title,
        subtitle: chapter.subtitle || "",
        color: chapter.color || "#6366f1",
        periods: chapter.periods || 0,
        pageRange: chapter.page_range || "",
        episodes: finalEpisodes,
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

      // Get episode from DB
      const { data: episode } = await supabase
        .from("tb_episodes")
        .select("id, slug")
        .eq("slug", episodeSlug)
        .single();

      if (episode) {
        // Get content blocks from DB
        let query = supabase
          .from("content_blocks")
          .select("*")
          .eq("episode_id", episode.id)
          .order("sort_order");

        // Filter by depth: 'board' shows only board blocks, 'all' shows everything
        if (depth === "board") {
          query = query.eq("depth", "board");
        }

        const { data: blocks, error } = await query;

        if (!error && blocks && blocks.length > 0) {
          // Map DB blocks to ContentBlock interface
          const contentBlocks: ContentBlock[] = blocks.map((b: any) => ({
            type: b.block_type as ContentBlock["type"],
            title: b.title || "",
            icon: b.icon || "📖",
            depth: b.depth || "board",
            content: b.content,
          }));
          return contentBlocks;
        }
      }

      // Fall back to hardcoded
      const hardcoded = hardcodedChapters.find((c) => c.id === chapterSlug);
      const hcEp = hardcoded?.episodes.find((e) => e.id === episodeSlug);
      return hcEp?.blocks || [];
    },
  });
}
