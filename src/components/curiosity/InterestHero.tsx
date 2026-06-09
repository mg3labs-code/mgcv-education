import { getInterestVisual } from "@/data/interestVisuals";
import { Sparkles } from "lucide-react";

interface Props {
  interestTag?: string | null;
  day: 1 | 2 | 3;
  /** Optional override caption; falls back to per-day scene caption. */
  caption?: string;
  /** Optional headline shown over the image. */
  headline?: string;
  className?: string;
  /** Compact mode for inline use (smaller height). */
  compact?: boolean;
}

const dayMeta = {
  1: { label: "Day 1 · Spark", chip: "60 seconds", emojiFallback: "✨" },
  2: { label: "Day 2 · Build", chip: "Go deeper", emojiFallback: "🔨" },
  3: { label: "Day 3 · Master", chip: "Make it yours", emojiFallback: "🎓" },
} as const;

/**
 * Interest-themed hero card used across the 3-day arc.
 * Photo background → gradient overlay → motif confetti → day badge → scene caption.
 * The visuals stay synced to whatever the student picked (cricket, food, …).
 */
export default function InterestHero({
  interestTag,
  day,
  caption,
  headline,
  className = "",
  compact = false,
}: Props) {
  const v = getInterestVisual(interestTag);
  const meta = dayMeta[day];
  const scene = v.scenes[day];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl shadow-xl ${className}`}
      style={{ minHeight: compact ? 180 : 280 }}
    >
      {/* photo */}
      <img
        src={v.image}
        alt={`${v.label} scene`}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover scale-105"
      />
      {/* overlay */}
      <div className="absolute inset-0" style={{ background: v.overlay }} aria-hidden />
      {/* motif confetti */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {v.motifs.map((m, i) => (
          <span
            key={i}
            className="absolute opacity-25 select-none"
            style={{
              fontSize: `${28 + i * 6}px`,
              top: `${10 + (i * 23) % 70}%`,
              left: `${(i * 31) % 80 + 5}%`,
              transform: `rotate(${(i * 17) % 40 - 20}deg)`,
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))",
            }}
          >
            {m}
          </span>
        ))}
      </div>

      {/* big scene emoji center */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden
      >
        <span
          className="text-[140px] sm:text-[180px] opacity-35 select-none"
          style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.5))" }}
        >
          {scene.emoji || meta.emojiFallback}
        </span>
      </div>

      {/* content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide backdrop-blur-sm"
            style={{
              background: v.accentSoft,
              color: v.accent,
              border: `0.5px solid ${v.accent}55`,
            }}
          >
            <Sparkles className="h-3 w-3" />
            {meta.label}
          </span>
          <span
            className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white/85"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}
          >
            <span aria-hidden>{v.emoji}</span> {v.label}
          </span>
        </div>

        <div className="space-y-1.5 mt-auto">
          {headline && (
            <h3 className="text-white font-extrabold leading-tight text-[18px] sm:text-[22px] drop-shadow-lg">
              {headline}
            </h3>
          )}
          <p
            className="text-white/95 text-[13px] sm:text-[14px] leading-snug font-medium"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
          >
            {caption ?? scene.caption}
          </p>
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-white/70 mt-1">
            {meta.chip}
          </span>
        </div>
      </div>
    </div>
  );
}
