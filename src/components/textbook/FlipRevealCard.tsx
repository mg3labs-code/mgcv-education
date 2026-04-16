import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, RotateCcw, Sparkles, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FlipRevealCardProps {
  /** Challenge question shown on the front */
  challenge: string;
  /** Hint text to nudge thinking */
  hint?: string;
  /** HD image URL for the visual breakdown */
  imageUrl: string;
  /** Alt text for accessibility */
  imageAlt: string;
  /** Short explanation below the image */
  explanation?: string;
  /** Labels/annotations overlaid or listed */
  labels?: string[];
  /** Optional emoji for the front card */
  emoji?: string;
}

const FlipRevealCard = ({
  challenge,
  hint,
  imageUrl,
  imageAlt,
  explanation,
  labels,
  emoji = "🔍",
}: FlipRevealCardProps) => {
  const [flipped, setFlipped] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="perspective-1000 w-full my-4">
      <motion.div
        className="relative w-full preserve-3d cursor-pointer"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* ── FRONT: Challenge ── */}
        <div
          className={`w-full rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-yellow-950/10 p-6 backface-hidden ${
            flipped ? "pointer-events-none" : ""
          }`}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-lg">
              {emoji}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Think First
              </p>
              <p className="text-base md:text-lg font-semibold text-foreground leading-relaxed">
                {challenge}
              </p>
            </div>

            {hint && (
              <div className="flex items-start gap-2 rounded-xl bg-amber-100/60 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-2.5 text-left w-full">
                <HelpCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{hint}</p>
              </div>
            )}

            <Button
              onClick={() => setFlipped(true)}
              className="mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md gap-2"
              size="lg"
            >
              <Eye className="h-4 w-4" />
              Reveal Visual Breakdown
            </Button>

            <p className="text-[10px] text-muted-foreground">
              Try to think about it first before revealing!
            </p>
          </div>
        </div>

        {/* ── BACK: Visual Breakdown ── */}
        <div
          className={`w-full rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/10 p-4 absolute top-0 left-0 backface-hidden ${
            !flipped ? "pointer-events-none" : ""
          }`}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Visual Breakdown
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFlipped(false)}
                className="text-xs gap-1 text-muted-foreground h-7"
              >
                <RotateCcw className="h-3 w-3" /> Flip back
              </Button>
            </div>

            {/* HD Image */}
            <div className="rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-background shadow-inner">
              {!imageLoaded && (
                <div className="w-full h-64 flex items-center justify-center bg-muted animate-pulse">
                  <span className="text-sm text-muted-foreground">Loading HD visual…</span>
                </div>
              )}
              <img
                src={imageUrl}
                alt={imageAlt}
                className={`w-full object-contain max-h-80 ${imageLoaded ? "" : "hidden"}`}
                onLoad={() => setImageLoaded(true)}
                loading="eager"
              />
            </div>

            {/* Explanation */}
            {explanation && (
              <p className="text-sm text-foreground/90 leading-relaxed px-1">{explanation}</p>
            )}

            {/* Labels */}
            {labels && labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-1">
                {labels.map((label, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FlipRevealCard;
