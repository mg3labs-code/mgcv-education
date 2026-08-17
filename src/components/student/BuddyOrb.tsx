import { Mic, Square, Loader2, Volume2 } from "lucide-react";

type State = "idle" | "listening" | "thinking" | "speaking" | "muted";

export default function BuddyOrb({ state, seconds = 0 }: { state: State; seconds?: number }) {
  const ring =
    state === "listening"
      ? "ring-4 ring-destructive/30 animate-pulse"
      : state === "thinking"
        ? "ring-4 ring-primary/20"
        : state === "speaking"
          ? "ring-4 ring-primary/40 animate-pulse"
          : "ring-2 ring-primary/10";

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`relative h-28 w-28 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl transition-all duration-300 ${ring}`}
      >
        {/* inner glow */}
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-md" />

        {state === "listening" && (
          <>
            <span className="absolute -top-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground">
              {seconds}s
            </span>
            <Square className="h-10 w-10 text-primary-foreground relative z-10" />
          </>
        )}
        {state === "thinking" && (
          <Loader2 className="h-10 w-10 text-primary-foreground animate-spin relative z-10" />
        )}
        {state === "speaking" && (
          <Volume2 className="h-10 w-10 text-primary-foreground relative z-10 animate-bounce" />
        )}
        {(state === "idle" || state === "muted") && (
          <Mic className="h-10 w-10 text-primary-foreground relative z-10" />
        )}
      </div>

      <p className="text-xs font-medium text-muted-foreground">
        {state === "idle" && "Tap the mic to talk to Buddy"}
        {state === "muted" && "Sound is muted — tap the speaker to unmute"}
        {state === "listening" && "Listening... tap to send"}
        {state === "thinking" && "Buddy is thinking..."}
        {state === "speaking" && "Buddy is speaking..."}
      </p>
    </div>
  );
}
