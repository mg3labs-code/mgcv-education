import { Check } from "lucide-react";
import { motion } from "framer-motion";
import type { DayNumber } from "@/lib/childFriendlyLabels";

export type RungId = 1 | 2 | 3 | 4 | 5;

const RUNGS: { id: RungId; label: string; day: DayNumber }[] = [
  { id: 1, label: "Connect", day: 1 },
  { id: 2, label: "Explain", day: 1 },
  { id: 3, label: "Trap", day: 2 },
  { id: 4, label: "Apply", day: 2 },
  { id: 5, label: "Think Deeper", day: 3 },
];

interface Props {
  /** Current day the student is viewing (1-3). */
  viewDay: DayNumber;
  /** 0-1 progress through the current day. */
  dayProgress: number;
  /** Completion flags per day. */
  doneDays: { 1: boolean; 2: boolean; 3: boolean };
  /** Jump to a different day when a rung is tapped. */
  onJumpToDay?: (day: DayNumber) => void;
}

/**
 * Resolve the active rung from viewDay + dayProgress.
 * Day 1 → rungs 1,2 (split at 0.5)
 * Day 2 → rungs 3,4 (split at 0.5)
 * Day 3 → rung 5
 */
export function resolveActiveRung(viewDay: DayNumber, dayProgress: number): RungId {
  const p = Math.max(0, Math.min(1, dayProgress));
  if (viewDay === 1) return p < 0.5 ? 1 : 2;
  if (viewDay === 2) return p < 0.5 ? 3 : 4;
  return 5;
}

/**
 * CuriosityLadder — the visible spine of the episode.
 * Shows 5 rungs of thinking depth (Connect → Explain → Trap → Apply → Think Deeper)
 * instead of a calendar. Day labels become a quiet sub-line.
 */
const CuriosityLadder = ({ viewDay, dayProgress, doneDays, onJumpToDay }: Props) => {
  const active = resolveActiveRung(viewDay, dayProgress);

  const isRungDone = (r: RungId) => {
    if (r === 1 || r === 2) return doneDays[1];
    if (r === 3 || r === 4) return doneDays[2];
    return doneDays[5 as never] ?? doneDays[3];
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-3 pb-4">
      {/* Rail */}
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
                <button
                  type="button"
                  onClick={() => onJumpToDay?.(r.day)}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`Rung ${r.id} · ${r.label} (Day ${r.day})`}
                  className={[
                    "relative z-10 h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all",
                    "border-2",
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
                <span
                  className={[
                    "mt-2 text-[11px] sm:text-xs font-semibold text-center leading-tight",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {r.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};

export default CuriosityLadder;
