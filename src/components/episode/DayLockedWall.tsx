import { useEffect, useState } from "react";
import { Lock, Clock, ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { dayLabels, type DayNumber } from "@/lib/childFriendlyLabels";
import { formatCountdown } from "@/hooks/useEpisodeDayUnlock";

interface Props {
  day: DayNumber;
  unlocksAt: Date;
  episodeTitle: string;
  teaser?: string;
  onBackToDashboard?: () => void;
}

const DayLockedWall = ({ day, unlocksAt, episodeTitle, teaser, onBackToDashboard }: Props) => {
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const ms = Math.max(0, unlocksAt.getTime() - now);
  const dayInfo = dayLabels[day];

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center space-y-6 animate-fade-in">
        <div className="relative inline-flex items-center justify-center">
          <div
            className="h-24 w-24 rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--muted))" }}
          >
            <Lock className="h-10 w-10 text-muted-foreground" />
          </div>
          <span className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-card border-2 border-background flex items-center justify-center text-xl">
            {dayInfo.emoji}
          </span>
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
            Day {day} of 3 · {dayInfo.name}
          </p>
          <h1 className="text-2xl font-bold text-foreground">{episodeTitle}</h1>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-center gap-2 text-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Unlocks in {formatCountdown(ms)}</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {teaser ||
              (day === 2
                ? "Tomorrow you'll learn WHY this works. The idea needs a night to settle."
                : "One more sleep. Then you'll make this idea truly yours.")}
          </p>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span>Coming back daily makes ideas stick 5× better</span>
          </div>
        </div>

        <Button
          onClick={() => (onBackToDashboard ? onBackToDashboard() : navigate("/student/dashboard"))}
          variant="outline"
          className="w-full gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <p className="text-[10px] text-muted-foreground/70">
          Tip: add <code className="px-1 rounded bg-muted">?unlock=all</code> to the URL for demos
        </p>
      </div>
    </div>
  );
};

export default DayLockedWall;
