import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DifficultyMode } from "@/contexts/DifficultyContext";

export interface AdaptiveVariant {
  /** Short headline / one-liner */
  headline: string;
  /** Body / story / formal text */
  body: string;
  /** Optional emoji decoration */
  emoji?: string;
  /** Where this came from (for debugging + transparency) */
  source: "pregen" | "ai" | "client";
}

interface SimplifiedPayload {
  explorer?: { oneLiner: string; emoji: string };
  builder?: { story: string };
}

/* ──────────────────────────────────────────────────────────
   Tier 3 — CLIENT FALLBACK
   Cheap, instant, never fails. Used while AI loads.
   ────────────────────────────────────────────────────────── */
const clientFallback = (
  blockTitle: string,
  rawText: string,
  mode: DifficultyMode
): AdaptiveVariant => {
  const stripped = rawText.replace(/\s+/g, " ").trim();
  const firstSentence = stripped.split(/[.!?]/)[0] || stripped;

  if (mode === "explorer") {
    return {
      headline: blockTitle,
      body: firstSentence.length > 140 ? firstSentence.slice(0, 137) + "…" : firstSentence,
      emoji: "✨",
      source: "client",
    };
  }
  if (mode === "master") {
    return {
      headline: blockTitle,
      body: stripped,
      source: "client",
    };
  }
  // builder
  return {
    headline: blockTitle,
    body: stripped.length > 480 ? stripped.slice(0, 477) + "…" : stripped,
    source: "client",
  };
};

/* ──────────────────────────────────────────────────────────
   Tier 1 + 2 — PRE-GEN cache → AI on-demand
   Reads `content.simplified` from the DB block. If missing,
   invokes the simplify-block edge function (which writes the
   cache back). Returns immediately with client fallback if
   the AI is still loading.
   ────────────────────────────────────────────────────────── */
export function useAdaptiveContent(
  blockId: string | undefined,
  blockTitle: string,
  rawText: string,
  cachedSimplified: SimplifiedPayload | undefined,
  mode: DifficultyMode
): { variant: AdaptiveVariant; isLoading: boolean } {
  const [aiPayload, setAiPayload] = useState<SimplifiedPayload | undefined>(cachedSimplified);
  const [isLoading, setIsLoading] = useState(false);

  // Reset when block changes
  useEffect(() => {
    setAiPayload(cachedSimplified);
  }, [blockId, cachedSimplified]);

  // Builder + Master need NO AI — builder uses raw text, master uses raw text
  // Only Explorer needs the simplified payload. Trigger AI lazily.
  useEffect(() => {
    if (mode !== "explorer") return;
    if (!blockId) return;
    if (aiPayload?.explorer) return; // already cached
    let cancelled = false;
    setIsLoading(true);
    supabase.functions
      .invoke("simplify-block", { body: { blockId } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn("[adaptive] simplify-block failed, using client fallback", error);
        } else if (data?.simplified) {
          setAiPayload(data.simplified as SimplifiedPayload);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, blockId, aiPayload?.explorer]);

  // Resolve variant by mode
  if (mode === "explorer") {
    if (aiPayload?.explorer) {
      return {
        variant: {
          headline: blockTitle,
          body: aiPayload.explorer.oneLiner,
          emoji: aiPayload.explorer.emoji,
          source: cachedSimplified?.explorer ? "pregen" : "ai",
        },
        isLoading: false,
      };
    }
    // Fallback while AI loads
    return { variant: clientFallback(blockTitle, rawText, mode), isLoading };
  }

  if (mode === "builder") {
    if (aiPayload?.builder?.story) {
      return {
        variant: {
          headline: blockTitle,
          body: aiPayload.builder.story,
          source: cachedSimplified?.builder ? "pregen" : "ai",
        },
        isLoading: false,
      };
    }
    return { variant: clientFallback(blockTitle, rawText, mode), isLoading: false };
  }

  // master = raw textbook content
  return { variant: clientFallback(blockTitle, rawText, mode), isLoading: false };
}
