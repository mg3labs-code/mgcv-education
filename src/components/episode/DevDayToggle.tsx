import { useEffect, useRef, useState } from "react";
import { Wrench, X, Unlock, Lock, FastForward, RotateCcw } from "lucide-react";
import { useEpisodeDay } from "@/contexts/EpisodeDayContext";
import { toast } from "sonner";

const STORAGE_KEY = "dev-unlock-all-days";

/**
 * Floating dev-only toggle to bypass the 20h day-gate during development.
 * - Unlock toggle: persists to localStorage and is read by useEpisodeDayUnlock.
 * - Jump to Day 2 / Day 3: backfills `day1_completed_at` (and `day2_completed_at`)
 *   so the episode renders the desired day immediately.
 * - Reset: clears all day_completed_at flags for this episode.
 *
 * Hidden in production builds (import.meta.env.PROD).
 */
const DevDayToggle = () => {
  const { info, setDayState, isSaving } = useEpisodeDay();
  const [open, setOpen] = useState(false);
  const [unlockAll, setUnlockAll] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY) === "1",
  );

  // Track previous value so we only toast on actual user-initiated changes
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (unlockAll) window.localStorage.setItem(STORAGE_KEY, "1");
    else window.localStorage.removeItem(STORAGE_KEY);

    if (isFirstRun.current) {
      isFirstRun.current = false;
      // Inform on initial mount so devs always know current state
      if (unlockAll) {
        toast.warning("Dev: 20h gate is BYPASSED", {
          description: "All days are unlocked via localStorage flag.",
          duration: 4000,
        });
      }
      return;
    }

    if (unlockAll) {
      toast.warning("Dev: 20h gate BYPASSED", {
        description: "All 3 days are now unlocked for testing.",
        duration: 3500,
      });
    } else {
      toast.success("Dev: 20h gate ENFORCED", {
        description: "Normal day-lock behavior restored.",
        duration: 3500,
      });
    }
  }, [unlockAll]);

  if (import.meta.env.PROD) return null;

  const jumpToDay = async (day: 2 | 3) => {
    const now = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // yesterday
    const patch: Record<string, string> = { day1_completed_at: now };
    if (day === 3) patch.day2_completed_at = now;
    await setDayState(patch);
    toast.success(`Jumped to Day ${day}`);
    // small reload to re-render with new state immediately
    setTimeout(() => window.location.reload(), 200);
  };

  const resetAll = async () => {
    await setDayState({
      day1_completed_at: null,
      day2_completed_at: null,
      day3_completed_at: null,
    } as never);
    toast.success("Reset to Day 1");
    setTimeout(() => window.location.reload(), 200);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2 print:hidden">
      {open && (
        <div className="rounded-xl border border-border bg-card shadow-2xl p-3 w-64 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5 text-primary" /> Dev Day Toggle
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={() => setUnlockAll((v) => !v)}
            className={`w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
              unlockAll
                ? "border-success/40 bg-success/10 text-success"
                : "border-border bg-muted/30 text-foreground hover:bg-muted/50"
            }`}
          >
            <span className="flex items-center gap-1.5 font-medium">
              {unlockAll ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              Unlock all days
            </span>
            <span className="text-[10px] opacity-70">{unlockAll ? "ON" : "OFF"}</span>
          </button>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={resetAll}
              disabled={isSaving}
              className="flex flex-col items-center gap-0.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 px-2 py-2 text-[10px] font-medium text-foreground disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Day 1
            </button>
            <button
              onClick={() => jumpToDay(2)}
              disabled={isSaving}
              className="flex flex-col items-center gap-0.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 px-2 py-2 text-[10px] font-medium text-foreground disabled:opacity-50"
            >
              <FastForward className="h-3.5 w-3.5" />
              Day 2
            </button>
            <button
              onClick={() => jumpToDay(3)}
              disabled={isSaving}
              className="flex flex-col items-center gap-0.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 px-2 py-2 text-[10px] font-medium text-foreground disabled:opacity-50"
            >
              <FastForward className="h-3.5 w-3.5" />
              Day 3
            </button>
          </div>

          <div className="text-[10px] text-muted-foreground leading-snug pt-1 border-t border-border">
            Currently on <span className="font-semibold text-foreground">Day {info.currentDay}</span>
            {unlockAll && " · gate bypassed"}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className={`h-10 w-10 rounded-full shadow-lg flex items-center justify-center transition-all ${
          unlockAll
            ? "bg-success text-success-foreground"
            : "bg-primary text-primary-foreground hover:scale-105"
        }`}
        title="Dev: day toggle"
        aria-label="Dev day toggle"
      >
        <Wrench className="h-4 w-4" />
      </button>
    </div>
  );
};

export default DevDayToggle;
