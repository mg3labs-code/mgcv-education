import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  CHAPTER_1_RUNGS,
  applyRegionVariant,
  findAuthoredRungs,
  type ConceptRungSet,
  type Rung,
} from "@/data/conceptRungs";

interface Args {
  chapterId?: string | null;
  episodeId?: string | null;
  conceptKey?: string | null;
  subject?: string | null;
  chapterSlug?: string | null;
  region?: string | null;
}

interface State {
  rungs: Rung[] | null;
  loading: boolean;
  error: string | null;
  source: "authored" | "ai-generated" | "fallback" | null;
}

/**
 * Returns the 5-rung Confidence Ladder for the current concept.
 * Order of resolution:
 *   1. Hand-authored Chapter 1 set (offline, instant)
 *   2. Cached row in `concept_rungs` (any chapter)
 *   3. AI-generated via edge function (one-time, then cached)
 *   4. Universal fallback (so the UI never breaks)
 */
export function useConceptRungs({
  chapterId,
  episodeId,
  conceptKey,
  subject,
  chapterSlug,
  region,
}: Args): State {
  const [state, setState] = useState<State>({
    rungs: null,
    loading: true,
    error: null,
    source: null,
  });

  // Memo authored lookup so it's stable
  const authored: ConceptRungSet | null = useMemo(
    () => findAuthoredRungs({ subject, conceptKey, chapterSlug }),
    [subject, conceptKey, chapterSlug],
  );

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      // 1. Hand-authored
      if (authored) {
        const merged = applyRegionVariant(authored, region);
        if (!cancelled) {
          setState({ rungs: merged.rungs, loading: false, error: null, source: "authored" });
        }
        return;
      }

      if (!chapterId || !episodeId || !conceptKey || !subject) {
        // Not enough info — universal fallback
        if (!cancelled) {
          setState({ rungs: UNIVERSAL_FALLBACK, loading: false, error: null, source: "fallback" });
        }
        return;
      }

      setState((s) => ({ ...s, loading: true }));

      // 2. Cached AI
      try {
        const { data, error } = await supabase
          .from("concept_rungs")
          .select("rung_1, rung_2, rung_3, rung_4, rung_5, source")
          .eq("chapter_id", chapterId)
          .eq("episode_id", episodeId)
          .eq("concept_key", conceptKey)
          .maybeSingle();

        if (!cancelled && !error && data?.source === "ai-generated-7layer-v2") {
          const rungs = [data.rung_1, data.rung_2, data.rung_3, data.rung_4, data.rung_5] as unknown as Rung[];
          if (rungs.every((r) => r && (r as Rung).prompt)) {
            setState({ rungs, loading: false, error: null, source: "ai-generated" });
            return;
          }
        }
      } catch {
        // continue to generate
      }

      // 3. AI-generate
      try {
        const { data, error } = await supabase.functions.invoke("generate-concept-rungs", {
          body: { chapterId, episodeId, conceptKey, subject, region },
        });
        if (!cancelled && !error && data?.rungs?.length === 5) {
          setState({ rungs: data.rungs, loading: false, error: null, source: "ai-generated" });
          return;
        }
      } catch (e) {
        // fall through
      }

      // 4. Fallback
      if (!cancelled) {
        setState({ rungs: UNIVERSAL_FALLBACK, loading: false, error: null, source: "fallback" });
      }
    };

    resolve();
    return () => {
      cancelled = true;
    };
  }, [chapterId, episodeId, conceptKey, subject, region, authored]);

  return state;
}

const UNIVERSAL_FALLBACK: Rung[] = [
  {
    prompt: "Have you ever seen this idea show up in real life?",
    type: "yesno",
    options: ["Yes", "Not sure"],
    correctIndex: 0,
    reveal: "Most ideas in your textbook are hiding in plain sight around you — let's find this one together.",
    clothing: "familiarity",
  },
  {
    prompt: "Could you spot one example of this idea in the next 24 hours?",
    type: "yesno",
    options: ["Yes", "Maybe"],
    correctIndex: 0,
    reveal: "Try it. Once you spot one, you'll start seeing them everywhere.",
    clothing: "stakes",
  },
  {
    prompt: "In your own words, what is this idea about?",
    type: "shortText",
    reveal: "Putting it in your own words is the moment it becomes yours.",
    clothing: "difficulty",
  },
  {
    prompt: "If a friend disagreed with this idea, what would you say to convince them?",
    type: "shortText",
    reveal: "If you can defend it, you understand it.",
    clothing: "social",
  },
  {
    prompt: "Where else (outside this chapter) could this idea be useful?",
    type: "openText",
    reveal: "Transferring an idea to a new place is the highest level of learning.",
    clothing: "difficulty",
  },
];

export const __TEST_AUTHORED_COUNT = CHAPTER_1_RUNGS.length;
