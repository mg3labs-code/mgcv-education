import { ChevronLeft, Flame, Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { dayLabels, type DayNumber } from "@/lib/childFriendlyLabels";
import { useEpisodeDay } from "@/contexts/EpisodeDayContext";
import { useSoundFx } from "@/hooks/useSoundFx";
import CuriosityLadder, { type DepthTrack } from "./CuriosityLadder";

interface Props {
  episodeTitle: string;
  streakDays?: number;
  exitTo?: string;
  pilotPractice2To?: string;
  fullReaderTo?: string;
  /** 0–1 progress through the current day. */
  dayProgress?: number;
  /** Day currently being viewed. */
  viewDay?: DayNumber;
  /** Callback when student jumps to a different day. */
  onChangeDay?: (day: DayNumber) => void;
  /** Adaptive depth track for current rung. */
  depthTrack?: DepthTrack;
}

/**
 * Episode stage topbar — Curiosity Ladder is the visible spine.
 * Day 1/2/3 is encoded inside the 5-rung ladder (Connect/Explain → D1,
 * Trap/Apply → D2, Think Deeper → D3) and surfaced as a single quiet pill.
 */
const StageTopbar = ({
  episodeTitle,
  streakDays = 0,
  exitTo,
  pilotPractice2To,
  fullReaderTo,
  dayProgress = 0,
  viewDay,
  onChangeDay,
  depthTrack,
}: Props) => {
  const navigate = useNavigate();
  const { info } = useEpisodeDay();
  const { muted, toggleMuted } = useSoundFx();
  const day: DayNumber = (viewDay ?? info.currentDay) as DayNumber;
  const dayInfo = dayLabels[day];

  const doneDays = {
    1: info.day1Done,
    2: info.day2Done,
    3: info.day3Done,
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/90 border-b border-border">
      {/* Row 1 — back, title, controls */}
      <div className="max-w-3xl mx-auto px-3 sm:px-4 pt-3 pb-2 flex items-center gap-3">
        <button
          onClick={() => navigate(exitTo || (-1 as never))}
          className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-foreground truncate leading-tight">
            {episodeTitle}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-muted/70 text-muted-foreground text-[11px] font-semibold">
              <span aria-hidden>{dayInfo.emoji}</span>
              Day {day} · {dayInfo.name}
            </span>
          </div>
        </div>

        {pilotPractice2To && (
          <button
            onClick={() => navigate(pilotPractice2To)}
            className="hidden md:inline-flex h-9 items-center px-3 rounded-full bg-accent/10 text-accent border border-accent/20 text-xs font-semibold hover:bg-accent/15 transition-colors"
          >
            7-layer
          </button>
        )}

        {fullReaderTo && (
          <button
            onClick={() => navigate(fullReaderTo)}
            className="hidden md:inline-flex h-9 items-center px-3 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold hover:bg-primary/15 transition-colors"
          >
            Full
          </button>
        )}

        <button
          onClick={toggleMuted}
          className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors"
          aria-label={muted ? "Unmute sounds" : "Mute sounds"}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>

        <div
          className="flex items-center gap-1 h-9 px-3 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-xs font-bold"
          title="Your streak"
        >
          <Flame className="h-3.5 w-3.5" />
          <span className="tabular-nums">{streakDays}</span>
        </div>
      </div>

      {/* Row 2 — Curiosity Ladder (the visible spine) */}
      <CuriosityLadder
        viewDay={day}
        dayProgress={dayProgress}
        doneDays={doneDays}
        onJumpToDay={onChangeDay}
        depthTrack={depthTrack}
      />
    </header>
  );
};

export default StageTopbar;
