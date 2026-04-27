import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDifficulty, type DifficultyMode } from "@/contexts/DifficultyContext";
import { useSoundFx } from "@/hooks/useSoundFx";
import { Sparkles, ArrowRight } from "lucide-react";

/**
 * Neon tilted 3-card mode picker shown on first entry into an episode.
 * Feels like a character-select screen — framer-motion tilt, glow-on-hover,
 * soft sfx on hover, chime on pick, scale-burst on confirm.
 *
 * Persistence: `msg-seen:<episodeKey>` in localStorage → one-time per episode.
 * The student can always change mode later via <DifficultyToggle /> in the topbar.
 */

interface Mode {
  id: DifficultyMode;
  name: string;
  tagline: string;
  emoji: string;
  /** tailwind gradient classes + hex accent used inline for the glow */
  gradient: string;
  glow: string;
  perks: string[];
}

const MODES: Mode[] = [
  {
    id: "explorer",
    name: "Explorer",
    tagline: "Quick looks. No pressure.",
    emoji: "🌱",
    gradient: "from-emerald-400 via-teal-400 to-cyan-400",
    glow: "hsl(160 70% 55%)",
    perks: ["Short & visual", "Core idea only", "4–6 minutes"],
  },
  {
    id: "builder",
    name: "Builder",
    tagline: "Stories. Patterns. You build it.",
    emoji: "🔨",
    gradient: "from-blue-400 via-indigo-400 to-sky-400",
    glow: "hsl(215 80% 60%)",
    perks: ["Case studies", "Reasoning", "Most popular"],
  },
  {
    id: "master",
    name: "Master",
    tagline: "Go deep. Defend your thinking.",
    emoji: "🎓",
    gradient: "from-purple-400 via-fuchsia-400 to-pink-400",
    glow: "hsl(285 75% 60%)",
    perks: ["Full depth", "Oxford-style defense", "8–10 minutes"],
  },
];

interface Props {
  episodeKey: string;
  episodeTitle: string;
  onPicked: () => void;
}

const STORAGE_PREFIX = "msg-seen:";

export function wasModeSelectShown(episodeKey: string) {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + episodeKey) === "1";
  } catch {
    return true;
  }
}

const ModeSelectGameCard = ({ episodeKey, episodeTitle, onPicked }: Props) => {
  const { mode, setMode } = useDifficulty();
  const { play } = useSoundFx();
  const [hoverId, setHoverId] = useState<DifficultyMode | null>(null);
  const [picked, setPicked] = useState<DifficultyMode | null>(null);

  // Pre-select the student's remembered mode so it's not jarring
  useEffect(() => {
    setHoverId(mode);
  }, [mode]);

  const handlePick = (id: DifficultyMode) => {
    if (picked) return;
    setPicked(id);
    setMode(id);
    play("correct");
    try {
      window.localStorage.setItem(STORAGE_PREFIX + episodeKey, "1");
    } catch {
      /* ignore */
    }
    // Let the confirm animation breathe, then move on
    setTimeout(() => {
      onPicked();
    }, 900);
  };

  const activeMode = useMemo(
    () => MODES.find((m) => m.id === (hoverId ?? mode)) ?? MODES[1],
    [hoverId, mode],
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-4 sm:items-center sm:px-4 sm:py-6"
      style={{
        background:
          "radial-gradient(ellipse at top, hsl(225 40% 15%) 0%, hsl(225 45% 8%) 60%, hsl(225 50% 5%) 100%)",
      }}
    >
      {/* Ambient moving blobs */}
      <motion.div
        aria-hidden
        className="absolute top-0 left-1/4 h-[40vh] w-[40vh] rounded-full blur-3xl opacity-40"
        style={{ background: activeMode.glow }}
        animate={{ x: [0, 30, -20, 0], y: [0, 20, -15, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-0 right-1/4 h-[36vh] w-[36vh] rounded-full blur-3xl opacity-30"
        style={{ background: activeMode.glow }}
        animate={{ x: [0, -25, 15, 0], y: [0, -15, 20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative w-full max-w-5xl pb-4 sm:pb-0">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-4 sm:mb-10"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-white/90 text-[11px] font-bold uppercase tracking-widest mb-3">
            <Sparkles className="h-3 w-3" />
            Choose your path
          </div>
          <h1 className="text-[1.7rem] sm:text-4xl font-black text-white leading-tight">
            Pick how you want to learn
          </h1>
          <p className="text-sm sm:text-base text-white/70 mt-2 max-w-lg mx-auto leading-relaxed">
            <span className="font-semibold text-white/90">{episodeTitle}</span>
            <span className="mx-1.5">·</span>
            You can change this anytime in the topbar.
          </p>
        </motion.div>

        {/* The 3 tilted cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
          {MODES.map((m, i) => {
            const isHover = hoverId === m.id;
            const isPicked = picked === m.id;
            const isOtherPicked = picked !== null && picked !== m.id;
            const tiltBase = i === 0 ? -4 : i === 2 ? 4 : 0;

            return (
              <motion.button
                key={m.id}
                onMouseEnter={() => {
                  setHoverId(m.id);
                }}
                onMouseLeave={() => setHoverId(null)}
                onClick={() => handlePick(m.id)}
                disabled={picked !== null}
                initial={{ opacity: 0, y: 40, rotate: tiltBase }}
                animate={{
                  opacity: isOtherPicked ? 0.25 : 1,
                  y: isPicked ? -8 : 0,
                  rotate: 0,
                  scale: isPicked ? 1.02 : isHover ? 1.01 : 1,
                }}
                transition={{
                  duration: 0.45,
                  delay: 0.1 + i * 0.1,
                  type: "spring",
                  stiffness: 220,
                  damping: 22,
                }}
                whileTap={{ scale: 0.97 }}
                className="group relative text-left rounded-2xl sm:rounded-3xl p-[2px] cursor-pointer"
                style={{
                  boxShadow: isHover
                    ? `0 30px 60px -20px ${m.glow}, 0 0 0 1px ${m.glow}`
                    : `0 10px 30px -15px ${m.glow}66`,
                }}
              >
                {/* Gradient frame */}
                <div
                  className={`absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${m.gradient} opacity-80 group-hover:opacity-100 transition-opacity`}
                />
                {/* Inner card */}
                <div
                  className="relative rounded-[18px] sm:rounded-[22px] px-4 py-4 sm:px-5 sm:py-6 h-full min-h-[164px] sm:min-h-[280px] flex flex-col"
                  style={{
                    background:
                      "linear-gradient(165deg, hsl(225 40% 14%) 0%, hsl(225 50% 8%) 100%)",
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <motion.div
                      animate={isHover ? { y: [-2, 2, -2], rotate: [-4, 4, -4] } : {}}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                      className="text-4xl sm:text-5xl"
                      style={{ filter: `drop-shadow(0 6px 20px ${m.glow})` }}
                    >
                      {m.emoji}
                    </motion.div>
                    {mode === m.id && picked === null && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-white/15 text-white/90 backdrop-blur">
                        your last pick
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-normal">{m.name}</h3>
                  <p className="text-sm text-white/70 mt-1 leading-snug">{m.tagline}</p>

                  <ul className="mt-4 space-y-1.5">
                    {m.perks.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-[13px] text-white/80">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: m.glow, boxShadow: `0 0 8px ${m.glow}` }}
                        />
                        {p}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-4 sm:pt-5 flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-white/60">
                      {isPicked ? "Let's go" : "Tap to pick"}
                    </span>
                    <motion.div
                      animate={isHover ? { x: [0, 4, 0] } : {}}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                      className="h-8 w-8 rounded-full flex items-center justify-center"
                      style={{
                        background: m.glow,
                        boxShadow: `0 0 20px ${m.glow}`,
                      }}
                    >
                      <ArrowRight className="h-4 w-4 text-white" />
                    </motion.div>
                  </div>

                  {/* Confirm burst */}
                  <AnimatePresence>
                    {isPicked && (
                      <motion.div
                        key="burst"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1.2 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 rounded-[22px] pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at center, ${m.glow}44 0%, transparent 70%)`,
                        }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Skip hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center text-xs text-white/50 mt-6 sm:mt-8"
        >
          Not sure?  <button
            onClick={() => handlePick("builder")}
            className="underline hover:text-white/80 font-semibold"
          >
            Pick Builder
          </button>
        </motion.p>
      </div>
    </div>
  );
};

export default ModeSelectGameCard;
