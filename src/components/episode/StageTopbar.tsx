import { ChevronLeft, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { dayLabels, modeLabels } from "@/lib/childFriendlyLabels";
import { useDifficulty } from "@/contexts/DifficultyContext";
import { useEpisodeDay } from "@/contexts/EpisodeDayContext";

interface Props {
  episodeTitle: string;
  streakDays?: number;
  exitTo?: string;
}

const StageTopbar = ({ episodeTitle, streakDays = 0, exitTo }: Props) => {
  const navigate = useNavigate();
  const { mode } = useDifficulty();
  const { info } = useEpisodeDay();
  const day = info.currentDay;
  const dayInfo = dayLabels[day];
  const modeInfo = modeLabels[mode];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/85 border-b border-border">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2.5 flex items-center gap-2">
        <button
          onClick={() => navigate(exitTo || -1 as never)}
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

        {/* Streak badge */}
        <div
          className="flex items-center gap-1 h-8 px-2.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-[11px] font-bold"
          title="Your streak"
        >
          <Flame className="h-3.5 w-3.5" />
          <span>{streakDays}</span>
        </div>
      </div>
    </header>
  );
};

export default StageTopbar;
