import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDifficulty, DifficultyMode } from "@/contexts/DifficultyContext";
import { Sparkles, Check } from "lucide-react";

const MODES: { id: DifficultyMode; label: string; emoji: string; tag: string }[] = [
  { id: "explorer", label: "Explorer", emoji: "🌱", tag: "Quick & visual" },
  { id: "builder", label: "Builder", emoji: "🔨", tag: "Story & analogy" },
  { id: "master", label: "Master", emoji: "🎓", tag: "Full textbook depth" },
];

/**
 * Smart auto-hide pill toggle.
 * - Shows expanded for the first 4s
 * - Collapses to a tiny chip after first interaction or timeout
 * - Re-expands on hover/click
 *
 * Inspired by Linear's command bar and Notion's slash menu — calm by default, deep on demand.
 */
export default function DifficultyToggle() {
  const { mode, setMode, hasInteracted } = useDifficulty();
  const [expanded, setExpanded] = useState(true);

  // Auto-collapse after 4s if user doesn't engage
  useEffect(() => {
    if (hasInteracted) return;
    const t = setTimeout(() => setExpanded(false), 4000);
    return () => clearTimeout(t);
  }, [hasInteracted]);

  // Collapse after pick
  useEffect(() => {
    if (hasInteracted) {
      const t = setTimeout(() => setExpanded(false), 1200);
      return () => clearTimeout(t);
    }
  }, [hasInteracted, mode]);

  const current = MODES.find((m) => m.id === mode)!;

  return (
    <div
      className="inline-flex items-center"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => hasInteracted && setExpanded(false)}
    >
      <AnimatePresence mode="wait" initial={false}>
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1 p-1 rounded-full bg-background border border-border shadow-sm overflow-hidden"
          >
            <span className="hidden sm:inline-flex items-center gap-1 px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> Depth
            </span>
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1 whitespace-nowrap ${
                  mode === m.id
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                }`}
                title={m.tag}
              >
                <span>{m.emoji}</span>
                <span className="hidden sm:inline">{m.label}</span>
                {mode === m.id && <Check className="w-3 h-3" />}
              </button>
            ))}
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.18 }}
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background border border-border shadow-sm text-xs font-semibold hover:bg-muted transition"
            title={`Currently ${current.label} — tap to change depth`}
          >
            <span>{current.emoji}</span>
            <span className="text-foreground">{current.label}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
