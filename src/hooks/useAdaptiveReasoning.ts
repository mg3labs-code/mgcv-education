import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DifficultyMode } from "@/contexts/DifficultyContext";
import { ReasoningContent } from "@/data/textbookData";

export interface ReasoningSimplifiedPayload {
  explorer?: {
    centralQuestion: string;
    emoji: string;
    whyQuestions: { question: string; hint: string }[];
  };
  builder?: {
    centralQuestion: string;
    whyQuestions: { question: string; hint: string }[];
  };
}

export interface AdaptiveReasoningResult {
  content: ReasoningContent;
  source: "pregen" | "ai" | "client";
  emoji?: string;
  isLoading: boolean;
}

/**
 * 3-tier fallback for ReasoningBlock:
 *   1. Pre-gen cache in `block.content.simplified` (DB)
 *   2. AI on-demand via simplify-block edge function (caches back to DB)
 *   3. Client fallback = original content (master) or shallow-trimmed for explorer/builder
 *
 * Master always returns the untouched original content.
 */
export function useAdaptiveReasoning(
  blockId: string | undefined,
  original: ReasoningContent,
  cachedSimplified: ReasoningSimplifiedPayload | undefined,
  mode: DifficultyMode
): AdaptiveReasoningResult {
  const [aiPayload, setAiPayload] = useState<ReasoningSimplifiedPayload | undefined>(
    cachedSimplified
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setAiPayload(cachedSimplified);
  }, [blockId, cachedSimplified]);

  // Only fetch AI if we need it for the current mode and don't have it cached
  useEffect(() => {
    if (mode === "master") return;
    if (!blockId) return;
    const need =
      (mode === "explorer" && !aiPayload?.explorer) ||
      (mode === "builder" && !aiPayload?.builder);
    if (!need) return;

    let cancelled = false;
    setIsLoading(true);
    supabase.functions
      .invoke("simplify-block", { body: { blockId } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn("[adaptive-reasoning] simplify-block failed", error);
        } else if (data?.simplified) {
          setAiPayload(data.simplified as ReasoningSimplifiedPayload);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, blockId, aiPayload?.explorer, aiPayload?.builder]);

  // Resolve content per mode
  if (mode === "master") {
    return { content: original, source: "client", isLoading: false };
  }

  if (mode === "explorer" && aiPayload?.explorer) {
    const ex = aiPayload.explorer;
    return {
      content: {
        centralQuestion: ex.centralQuestion,
        whyQuestions: ex.whyQuestions.map((q, i) => ({
          question: q.question,
          hint: q.hint,
          // Keep deeperInsight from original so the "Aha" reveal stays intact
          deeperInsight:
            original.whyQuestions?.[i]?.deeperInsight ?? "Think it through — you've got this!",
        })),
      },
      source: cachedSimplified?.explorer ? "pregen" : "ai",
      emoji: ex.emoji,
      isLoading: false,
    };
  }

  if (mode === "builder" && aiPayload?.builder) {
    const bu = aiPayload.builder;
    return {
      content: {
        centralQuestion: bu.centralQuestion,
        whyQuestions: bu.whyQuestions.map((q, i) => ({
          question: q.question,
          hint: q.hint,
          deeperInsight:
            original.whyQuestions?.[i]?.deeperInsight ?? "Keep reasoning — the connection matters.",
        })),
      },
      source: cachedSimplified?.builder ? "pregen" : "ai",
      isLoading: false,
    };
  }

  // Client fallback while AI loads — use original; the badge will show "Quick view"
  return { content: original, source: "client", isLoading };
}
