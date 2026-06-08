import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";
import ReasoningBlock from "@/components/textbook/ReasoningBlock";
import { ReasoningContent } from "@/data/textbookData";
import { useDifficulty } from "@/contexts/DifficultyContext";
import {
  useAdaptiveReasoning,
  ReasoningSimplifiedPayload,
} from "@/hooks/useAdaptiveReasoning";

interface Props {
  blockId?: string;
  content: ReasoningContent;
  cachedSimplified?: ReasoningSimplifiedPayload;
  topic?: string;
  onComplete?: () => void;
  onDebugEvent?: (event: string, details?: Record<string, unknown>) => void;
}

const sourceLabel: Record<string, string> = {
  pregen: "Pre-generated",
  ai: "AI-adapted",
  client: "Quick view",
};

const sourceColor: Record<string, string> = {
  pregen:
    "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200",
  ai: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200",
  client:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200",
};

export default function AdaptiveReasoningBlock({ blockId, content, cachedSimplified, topic, onComplete, onDebugEvent }: Props) {
  const { mode } = useDifficulty();
  const { content: adapted, source, emoji, isLoading } = useAdaptiveReasoning(
    blockId,
    content,
    cachedSimplified,
    mode
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <Badge variant="outline" className="text-[10px]">
          {mode === "explorer"
            ? `🌱 Explorer · Kid-friendly questions ${emoji ?? ""}`
            : mode === "builder"
            ? "🔨 Builder · Guided hints"
            : "🎓 Master · Full reasoning depth"}
        </Badge>
        <Badge className={`text-[10px] border ${sourceColor[source]}`}>
          {isLoading ? (
            <span className="flex items-center gap-1">
              <Loader2 className="w-2.5 h-2.5 animate-spin" /> AI loading…
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> {sourceLabel[source]}
            </span>
          )}
        </Badge>
      </div>

      <ReasoningBlock content={adapted} topic={topic} onComplete={onComplete} onDebugEvent={onDebugEvent} />

      {mode !== "master" && (
        <details className="mt-4 group">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform">▸</span>
            Show full reasoning version
          </summary>
          <div className="mt-3 pl-4 border-l-2 border-border">
            <ReasoningBlock content={content} topic={topic} onComplete={onComplete} onDebugEvent={onDebugEvent} />
          </div>
        </details>
      )}
    </div>
  );
}
