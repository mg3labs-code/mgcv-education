import { ChevronLeft, Flame, Volume2, VolumeX, Lock, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { dayLabels, modeLabels, type DayNumber } from "@/lib/childFriendlyLabels";
import { useDifficulty } from "@/contexts/DifficultyContext";
import { useEpisodeDay } from "@/contexts/EpisodeDayContext";
import { useSoundFx } from "@/hooks/useSoundFx";

interface Props {
  episodeTitle: string;
  streakDays?: number;
  exitTo?: string;
  /** 0–1 progress through the current day (sub-step granularity). Optional. */
  dayProgress?: number;
  /** Day currently being viewed (may differ from info.currentDay if user navigated back). */
  viewDay?: DayNumber;
  /** Callback when student picks a different day in the switcher. */
  onChangeDay?: (day: DayNumber) => void;
}

/**
 * Episode stage topbar with animated XP bar.
 *
 * XP logic (deliberately simple so every screen contributes):
 *   each full day = 33.33%. Current day adds up to another 33.33% based on `dayProgress`.
 *   day1Done → 33%, +day2Done → 66%, +day3Done → 100%.
 */
const StageTopbar = ({ episodeTitle, streakDays = 0, exitTo, dayProgress = 0, viewDay, onChangeDay }: Props) => {
  const navigate = useNavigate();
  const { mode } = useDifficulty();
  const { info } = useEpisodeDay();
  const { muted, toggleMuted } = useSoundFx();
  const day: DayNumber = (viewDay ?? info.currentDay) as DayNumber;
  const dayInfo = dayLabels[day];
  const modeInfo = modeLabels[mode];

  // Per-day reachability for the switcher.
  // A day is reachable if: (a) it's day 1, OR (b) the previous day is completed AND this day is not locked by the 20h gate.
  // Demo override (?unlock=all) makes all days reachable.
  const dayReachable: Record<DayNumber, boolean> = {
    1: true,
    2: info.demoOverride || (info.day1Done && !info.day2Locked) || info.day2Done || info.day3Done,
    3: info.demoOverride || (info.day2Done && !info.day3Locked) || info.day3Done,
  };
  const dayDone: Record<DayNumber, boolean> = {
    1: info.day1Done,
    2: info.day2Done,
    3: info.day3Done,
  };

  // XP calc
  const doneDays =
    (info.state.day1_completed_at ? 1 : 0) +
    (info.state.day2_completed_at ? 1 : 0) +
    (info.state.day3_completed_at ? 1 : 0);
  const clamped = Math.max(0, Math.min(1, dayProgress));
  const xpPct = Math.min(100, Math.round((doneDays + clamped) * 33.333));

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/85 border-b border-border">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 pt-2.5 pb-1.5 flex items-center gap-2">
        <button
          onClick={() => navigate(exitTo || (-1 as never))}
          className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold leading-none">
            Day {day} of 3 · {dayInfo.name}
          </p>
          <p className="text-sm font-bold text-foreground truncate leading-tight mt-0.5">{episodeTitle}</p>
        </div>

        {/* Mode indicator pill */}
        <div
          className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-full text-[11px] font-semibold"
          style={{
            background: `${modeInfo.tint}15`,
            color: modeInfo.tint,
            border: `1px solid ${modeInfo.tint}40`,
          }}
          title={`${modeInfo.name} mode`}
        >
          <span>{modeInfo.emoji}</span>
          <span>{modeInfo.name}</span>
        </div>

        {/* Sound toggle */}
        <button
          onClick={toggleMuted}
          className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors"
          aria-label={muted ? "Unmute sounds" : "Mute sounds"}
          title={muted ? "Sounds off" : "Sounds on"}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>

        {/* Streak badge */}
        <div
          className="flex items-center gap-1 h-8 px-2.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-[11px] font-bold"
          title="Your streak"
        >
          <Flame className="h-3.5 w-3.5" />
          <span>{streakDays}</span>
        </div>
      </div>

      {/* XP bar */}
      <div className="max-w-3xl mx-auto px-3 sm:px-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            XP
          </span>
          <div className="relative flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={false}
              animate={{ width: `${xpPct}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, hsl(160 70% 50%), hsl(215 80% 60%) 55%, hsl(285 75% 60%))",
                boxShadow: "0 0 12px hsl(215 80% 60% / 0.35)",
              }}
            />
            {/* Day markers */}
            {[33.33, 66.66].map((mark) => (
              <span
                key={mark}
                className="absolute top-1/2 -translate-y-1/2 h-2.5 w-[2px] bg-background/80 rounded"
                style={{ left: `${mark}%` }}
              />
            ))}
          </div>
          <span className="text-[10px] font-bold text-foreground tabular-nums min-w-[2.5rem] text-right">
            {xpPct}%
          </span>
        </div>
      </div>
    </header>
  );
};

export default StageTopbar;
