import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ConceptContent } from "@/data/textbookData";
import { ConceptBlock } from "@/components/textbook/EpisodeBlocks";
import { useDifficulty } from "@/contexts/DifficultyContext";
import { useAdaptiveContent } from "@/hooks/useAdaptiveContent";
import { Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  blockId?: string;
  blockTitle: string;
  content: ConceptContent;
  /** Optional cached simplified payload from DB (block.content.simplified) */
  cachedSimplified?: { explorer?: { oneLiner: string; emoji: string }; builder?: { story: string } };
  onComplete?: () => void;
}

const sourceLabel: Record<string, string> = {
  pregen: "Pre-generated",
  ai: "AI-adapted",
  client: "Quick view",
};

const sourceColor: Record<string, string> = {
  pregen: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200",
  ai: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200",
  client: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200",
};

export default function AdaptiveConceptBlock({
  blockId,
  blockTitle,
  content,
  cachedSimplified,
  onComplete,
}: Props) {
  const { mode } = useDifficulty();

  // Build the raw text for fallback / AI input
  const rawText = useMemo(
    () =>
      (content?.sections || [])
        .map((s) => `${s.heading ? s.heading + ". " : ""}${s.body}`)
        .join(" "),
    [content]
  );

  const { variant, isLoading } = useAdaptiveContent(
    blockId,
    blockTitle,
    rawText,
    cachedSimplified,
    mode
  );

  // Master mode = original textbook content rendered as-is
  if (mode === "master") {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className="text-[10px]">
            🎓 Master · Full textbook depth
          </Badge>
          <Badge className={`text-[10px] border ${sourceColor.client}`}>
            From textbook
          </Badge>
        </div>
        <ConceptBlock content={content} onComplete={onComplete} />
      </div>
    );
  }

  // Explorer + Builder = adapted view
  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <Badge variant="outline" className="text-[10px]">
          {mode === "explorer" ? "🌱 Explorer · 1-line + analogy" : "🔨 Builder · Story format"}
        </Badge>
        <Badge className={`text-[10px] border ${sourceColor[variant.source]}`}>
          {isLoading ? (
            <span className="flex items-center gap-1">
              <Loader2 className="w-2.5 h-2.5 animate-spin" /> AI loading…
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> {sourceLabel[variant.source]}
            </span>
          )}
        </Badge>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${mode}-${variant.source}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className={`rounded-2xl p-5 sm:p-6 border-2 ${
            mode === "explorer"
              ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
              : "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
          }`}
        >
          {variant.emoji && mode === "explorer" && (
            <div className="text-5xl mb-3 leading-none">{variant.emoji}</div>
          )}
          <p
            className={`text-foreground/90 leading-relaxed ${
              mode === "explorer" ? "text-lg sm:text-xl font-medium" : "text-base sm:text-lg"
            }`}
          >
            {variant.body}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* "Show full version" peek for curious students */}
      <details className="mt-4 group">
        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition flex items-center gap-1">
          <span className="group-open:rotate-90 transition-transform">▸</span>
          Show full textbook version
        </summary>
        <div className="mt-3 pl-4 border-l-2 border-border">
          <ConceptBlock content={content} onComplete={onComplete} />
        </div>
      </details>
    </div>
  );
}
