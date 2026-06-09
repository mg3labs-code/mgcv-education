import { Lock, Check, RotateCcw } from "lucide-react";

interface Props {
  currentDay: 1 | 2 | 3;
  stepIndex: number;       // 0-based within the day's flow
  totalSteps: number;      // total steps in current day
  interestEmoji: string;
  interestLabel: string;
  estLabel?: string;       // e.g. "~5 min"
  maxUnlockedDay?: 1 | 2 | 3;
  onJumpDay?: (d: 1 | 2 | 3) => void;
}

const dayClasses = (d: 1 | 2 | 3, active: boolean, done: boolean, locked: boolean) => {
  if (locked) return "bg-muted/40 text-muted-foreground border-border opacity-50 cursor-not-allowed";
  if (done) {
    if (d === 1) return "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200";
    if (d === 2) return "bg-sky-100 text-sky-700 border-sky-300 hover:bg-sky-200";
    return "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200";
  }
  if (active) return "bg-foreground text-background border-foreground";
  return "bg-card text-muted-foreground border-border hover:bg-muted";
};

export default function ArcTopbar({
  currentDay,
  stepIndex,
  totalSteps,
  interestEmoji,
  interestLabel,
  estLabel = "~5 min",
  maxUnlockedDay,
  onJumpDay,
}: Props) {
  const days = [1, 2, 3] as const;
  const reachable = maxUnlockedDay ?? currentDay;
  return (
    <div className="arc-shell sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-[480px] mx-auto px-4 py-2.5 flex items-center gap-2">
        <ol className="flex items-center gap-1.5" aria-label={`Day ${currentDay} of 3`}>
          {days.map((d) => {
            const done = d < reachable;
            const active = d === currentDay;
            const locked = d > reachable;
            const clickable = !locked && !!onJumpDay && d !== currentDay;
            const Tag: any = clickable ? "button" : "span";
            return (
              <li key={d}>
                <Tag
                  type={clickable ? "button" : undefined}
                  onClick={clickable ? () => onJumpDay!(d) : undefined}
                  aria-current={active ? "step" : undefined}
                  aria-label={clickable ? `Re-open Day ${d}` : `Day ${d}`}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-colors ${dayClasses(d, active, done, locked)}`}
                >
                  {done && <Check className="h-3 w-3" aria-hidden="true" />}
                  {locked && <Lock className="h-2.5 w-2.5" aria-hidden="true" />}
                  Day {d}
                  {done && clickable && <RotateCcw className="h-2.5 w-2.5 ml-0.5 opacity-70" aria-hidden="true" />}
                </Tag>
              </li>
            );
          })}
        </ol>
        <div className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700 text-[10px] font-bold">
          <span aria-hidden="true">{interestEmoji}</span>
          {interestLabel}
        </div>
      </div>
      {/* progress dots */}
      <div className="max-w-[480px] mx-auto px-4 pb-2 flex items-center gap-2">
        <div className="flex items-center gap-1 flex-1">
          {Array.from({ length: totalSteps }).map((_, i) => {
            const done = i < stepIndex;
            const cur = i === stepIndex;
            return (
              <span
                key={i}
                aria-hidden="true"
                className={`h-1.5 rounded-full transition-all ${
                  cur
                    ? "w-6 bg-foreground"
                    : done
                    ? "w-3 bg-emerald-500"
                    : "w-3 bg-border"
                }`}
              />
            );
          })}
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
          {estLabel}
        </span>
      </div>
    </div>
  );
}
