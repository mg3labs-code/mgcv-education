import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { DayNumber } from "@/lib/childFriendlyLabels";

export type RungId = 1 | 2 | 3 | 4 | 5;
export type DepthTrack = "foundation" | "core" | "advanced";

const RUNGS: { id: RungId; label: string; day: DayNumber }[] = [
  { id: 1, label: "Connect", day: 1 },
  { id: 2, label: "Explain", day: 1 },
  { id: 3, label: "Trap", day: 2 },
  { id: 4, label: "Apply", day: 2 },
  { id: 5, label: "Think Deeper", day: 3 },
];

const TRACK_META: Record<DepthTrack, { label: string; cls: string }> = {
  foundation: {
    label: "Foundation",
    cls: "bg-sky-500 text-white border-sky-600 shadow-sm shadow-sky-500/30 dark:bg-sky-500/90",
  },
  core: {
    label: "Core",
    cls: "bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/30 dark:bg-emerald-500/90",
  },
  advanced: {
    label: "Advanced",
    cls: "bg-violet-500 text-white border-violet-600 shadow-sm shadow-violet-500/30 dark:bg-violet-500/90",
  },
};

interface Props {
  viewDay: DayNumber;
  dayProgress: number;
  doneDays: { 1: boolean; 2: boolean; 3: boolean };
  onJumpToDay?: (day: DayNumber) => void;
  /** Optional adaptive depth track for the current rung. */
  depthTrack?: DepthTrack;
}

export function resolveActiveRung(viewDay: DayNumber, dayProgress: number): RungId {
  const p = Math.max(0, Math.min(1, dayProgress));
  if (viewDay === 1) return p < 0.5 ? 1 : 2;
  if (viewDay === 2) return p < 0.5 ? 3 : 4;
  return 5;
}

/**
 * CuriosityLadder — the visible spine of the episode.
 * 5 rungs of thinking depth, with an optional depth-track badge on the active rung,
 * and a brief sparkle celebration when the rung changes.
 */
const CuriosityLadder = ({ viewDay, dayProgress, doneDays, onJumpToDay, depthTrack = "core" }: Props) => {
  const active = resolveActiveRung(viewDay, dayProgress);
  const [celebrate, setCelebrate] = useState<RungId | null>(null);

  // Trigger a 1.5s sparkle when the active rung changes.
  useEffect(() => {
    setCelebrate(active);
    const t = setTimeout(() => setCelebrate(null), 1500);
    return () => clearTimeout(t);
  }, [active]);

  const isRungDone = (r: RungId) => {
    if (r === 1 || r === 2) return doneDays[1];
    if (r === 3 || r === 4) return doneDays[2];
    return doneDays[3];
  };

  const track = TRACK_META[depthTrack];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-3 pb-4">
      <div className="relative">
        {/* base line */}
        <div className="absolute left-5 right-5 top-5 h-[2px] bg-border" aria-hidden />
        {/* progress line */}
        <motion.div
          aria-hidden
          initial={false}
          animate={{ width: `calc(${((active - 1) / (RUNGS.length - 1)) * 100}% )` }}
          transition={{ type: "spring", stiffness: 120, damping: 22 }}
          className="absolute left-5 top-5 h-[2px] rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-violet-500"
        />

        <ol className="relative grid grid-cols-5 gap-1">
          {RUNGS.map((r) => {
            const done = isRungDone(r.id) && r.id < active;
            const isActive = r.id === active;
            const upcoming = r.id > active;
            return (
              <li key={r.id} className="flex flex-col items-center">
                <div className="relative">
                  {/* celebration ring on active rung change */}
                  <AnimatePresence>
                    {isActive && celebrate === r.id && (
                      <motion.span
                        key="ring"
                        initial={{ scale: 0.6, opacity: 0.9 }}
                        animate={{ scale: 1.9, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.1, ease: "easeOut" }}
                        className="absolute inset-0 -m-1 rounded-full border-2 border-emerald-400/70 pointer-events-none"
                        aria-hidden
                      />
                    )}
                  </AnimatePresence>
                  <button
                    type="button"
                    onClick={() => onJumpToDay?.(r.day)}
                    aria-current={isActive ? "step" : undefined}
                    aria-label={`Rung ${r.id} · ${r.label} (Day ${r.day})`}
                    className={[
                      "relative z-10 h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all border-2",
                      isActive
                        ? "bg-foreground text-background border-foreground shadow-lg scale-110"
                        : done
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : upcoming
                            ? "bg-background text-muted-foreground border-border"
                            : "bg-background text-foreground border-foreground/40",
                    ].join(" ")}
                  >
                    {done ? <Check className="h-4 w-4" /> : r.id}
                  </button>
                </div>
                <span
                  className={[
                    "mt-2 text-[11px] sm:text-xs font-semibold text-center leading-tight",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {r.label}
                </span>
                {/* Depth track badge only under the active rung */}
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={[
                      "mt-1.5 inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[10px] font-bold uppercase tracking-[0.06em] border whitespace-nowrap leading-none",
                      track.cls,
                    ].join(" ")}
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    {track.label}
                  </motion.span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};

export default CuriosityLadder;
