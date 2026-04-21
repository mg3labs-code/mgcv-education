import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, ArrowRight, Check } from "lucide-react";
import { useSoundFx } from "@/hooks/useSoundFx";

/**
 * VibeCheckModal — 3-question adaptive placement, neon game-card style.
 *
 * This is the SINGLE pre-textbook "game" gate. Three rapid-fire vibe questions,
 * then a neon "You're a __!" finalize screen. Replaces the separate in-textbook
 * Mode Select picker — students enter their textbook already placed.
 *
 *   🌱 EXPLORER  — visual, simple words.
 *   🔨 BUILDER   — step-by-step with stories.
 *   🎓 MASTER    — full 7-layer depth.
 *
 * Result is saved to:
 *   1. `student_preferences.difficulty_level` (DB)
 *   2. localStorage (`difficulty_mode`) so DifficultyContext reads it instantly.
 *
 * SFX: hover ping, "correct" chime on each pick, "victory" on finalize.
 */

export type DifficultyMode = "explorer" | "builder" | "master";

const MODE_TO_DB: Record<DifficultyMode, string> = {
  explorer: "easy",
  builder: "medium",
  master: "hard",
};

interface QOption {
  label: string;
  emoji: string;
  desc: string;
  weight: { explorer: number; builder: number; master: number };
}

const QUESTIONS: Array<{ id: string; prompt: string; hint: string; options: QOption[] }> = [
  {
    id: "q1",
    prompt: "When you learn something new, what feels best?",
    hint: "Just pick what sounds fun — there's no wrong answer.",
    options: [
      { label: "Show me with pictures", emoji: "🎨", desc: "Stories, colors, short fun facts", weight: { explorer: 3, builder: 1, master: 0 } },
      { label: "Show me how it works", emoji: "⚙️", desc: "Step by step, with simple examples", weight: { explorer: 1, builder: 3, master: 1 } },
      { label: "Show me WHY it works", emoji: "🔬", desc: "Deep reasons, real proofs, big questions", weight: { explorer: 0, builder: 1, master: 3 } },
    ],
  },
  {
    id: "q2",
    prompt: "How do you feel about big science words like 'photosynthesis'?",
    hint: "Be honest — lots of people find them tricky.",
    options: [
      { label: "Kinda scary 😅", emoji: "🌱", desc: "I want simple words I already know", weight: { explorer: 3, builder: 1, master: 0 } },
      { label: "I'm okay with them", emoji: "🚀", desc: "Explain once and I'll get it", weight: { explorer: 1, builder: 3, master: 1 } },
      { label: "I love big words!", emoji: "🧠", desc: "Throw the technical stuff at me", weight: { explorer: 0, builder: 1, master: 3 } },
    ],
  },
  {
    id: "q3",
    prompt: "Which of these would you read first?",
    hint: "Pick the one that makes you most curious.",
    options: [
      { label: "\"A frog jumps 20× its body length! 🐸\"", emoji: "✨", desc: "Quick, fun, surprising facts", weight: { explorer: 3, builder: 1, master: 0 } },
      { label: "\"Frog legs work like springs — here's how.\"", emoji: "🔧", desc: "Clear explanations, everyday comparisons", weight: { explorer: 1, builder: 3, master: 1 } },
      { label: "\"Frog jumps store elastic potential energy in tendons…\"", emoji: "📐", desc: "Real science, real depth, real challenge", weight: { explorer: 0, builder: 1, master: 3 } },
    ],
  },
];

const MODE_META: Record<DifficultyMode, {
  name: string;
  emoji: string;
  tagline: string;
  intro: string;
  gradient: string;
  glow: string;
  perks: string[];
}> = {
  explorer: {
    name: "Explorer",
    emoji: "🌱",
    tagline: "Quick looks. No pressure. Pure curiosity.",
    intro: "Your textbook starts in Explorer Mode — simple words, vivid pictures, fun facts. Level up anytime.",
    gradient: "from-emerald-400 via-teal-400 to-cyan-400",
    glow: "hsl(160 70% 55%)",
    perks: ["Short & visual", "Core idea only", "Easy to read"],
  },
  builder: {
    name: "Builder",
    emoji: "🔨",
    tagline: "Stories. Patterns. You build it.",
    intro: "Your textbook starts in Builder Mode — step-by-step learning with everyday examples. Perfect balance.",
    gradient: "from-blue-400 via-indigo-400 to-sky-400",
    glow: "hsl(215 80% 60%)",
    perks: ["Case studies", "Reasoning", "Most popular"],
  },
  master: {
    name: "Master",
    emoji: "🎓",
    tagline: "Go deep. Defend your thinking.",
    intro: "Your textbook starts in Master Mode — full depth, real reasoning, Oxford-style defense. Challenge unlocked.",
    gradient: "from-purple-400 via-fuchsia-400 to-pink-400",
    glow: "hsl(285 75% 60%)",
    perks: ["Full 7-layer depth", "Defend ideas", "Real challenge"],
  },
};

const VibeCheckModal = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { play } = useSoundFx();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({ explorer: 0, builder: 0, master: 0 });
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [result, setResult] = useState<DifficultyMode | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: prefs } = useQuery({
    queryKey: ["student_preferences", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("student_preferences")
        .select("difficulty_level, onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (!prefs) return;
    // Already placed (any of our 3 DB values) → skip
    if (["easy", "medium", "hard"].includes(prefs.difficulty_level) && prefs.difficulty_level !== "medium") {
      // medium is the default — only skip if user explicitly picked easy/hard, OR if they completed vibe check before
      // We use a localStorage marker so a one-time placement sticks even if DB still says "medium"
      if (typeof window !== "undefined" && window.localStorage.getItem("vibe_check_done") === "1") return;
    }
    if (typeof window !== "undefined" && window.localStorage.getItem("vibe_check_done") === "1") return;
    if (!prefs.onboarding_completed) return;
    setOpen(true);
  }, [prefs]);

  const activeMode: DifficultyMode = useMemo(() => {
    const ranked = (Object.entries(scores) as Array<[DifficultyMode, number]>).sort((a, b) => b[1] - a[1]);
    return ranked[0][1] === 0 ? "builder" : ranked[0][0];
  }, [scores]);

  const handleAnswer = (optIdx: number) => {
    if (pickedIdx !== null) return;
    setPickedIdx(optIdx);
    play("correct");

    const w = QUESTIONS[step].options[optIdx].weight;
    const next = {
      explorer: scores.explorer + w.explorer,
      builder: scores.builder + w.builder,
      master: scores.master + w.master,
    };

    setTimeout(() => {
      setScores(next);
      if (step < QUESTIONS.length - 1) {
        setStep(step + 1);
        setPickedIdx(null);
      } else {
        const winner = (Object.entries(next) as Array<[DifficultyMode, number]>)
          .sort((a, b) => b[1] - a[1])[0][0];
        setResult(winner);
        play("victory");
      }
    }, 550);
  };

  const handleSkip = () => {
    try {
      window.localStorage.setItem("vibe_check_done", "1");
      // Don't force a difficulty — leave whatever DifficultyContext already has
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  const handleConfirm = async () => {
    if (!result) return;
    setSaving(true);

    // 1. Persist locally so DifficultyContext picks it up immediately
    try {
      window.localStorage.setItem("difficulty_mode", result);
      window.localStorage.setItem("vibe_check_done", "1");
    } catch {
      /* ignore */
    }

    // 2. Persist to DB
    if (user) {
      await supabase
        .from("student_preferences")
        .upsert(
          { user_id: user.id, difficulty_level: MODE_TO_DB[result] },
          { onConflict: "user_id" },
        );
      qc.invalidateQueries({ queryKey: ["student_preferences", user.id] });
    }

    setSaving(false);
    setOpen(false);
  };

  // ---------- RESULT (FINALIZE) SCREEN — neon polished ----------
  if (result) {
    const meta = MODE_META[result];
    return (
      <Dialog open={open} onOpenChange={() => { /* locked until confirm */ }}>
        <DialogContent
          className="sm:max-w-lg p-0 overflow-hidden border-0"
          style={{
            background:
              "radial-gradient(ellipse at top, hsl(225 40% 15%) 0%, hsl(225 45% 8%) 60%, hsl(225 50% 5%) 100%)",
          }}
        >
          {/* Ambient glow blobs */}
          <motion.div
            aria-hidden
            className="absolute top-0 left-1/4 h-[30vh] w-[30vh] rounded-full blur-3xl opacity-50 pointer-events-none"
            style={{ background: meta.glow }}
            animate={{ x: [0, 20, -10, 0], y: [0, 15, -10, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="absolute bottom-0 right-1/4 h-[26vh] w-[26vh] rounded-full blur-3xl opacity-40 pointer-events-none"
            style={{ background: meta.glow }}
            animate={{ x: [0, -15, 10, 0], y: [0, -10, 15, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative p-7 sm:p-9">
            {/* Card frame */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              className="rounded-3xl p-[2px]"
              style={{
                boxShadow: `0 30px 60px -20px ${meta.glow}, 0 0 0 1px ${meta.glow}`,
              }}
            >
              <div
                className={`absolute inset-7 sm:inset-9 rounded-3xl bg-gradient-to-br ${meta.gradient} opacity-80`}
                aria-hidden
              />
              <div
                className="relative rounded-[22px] px-6 py-7 text-center"
                style={{
                  background:
                    "linear-gradient(165deg, hsl(225 40% 14%) 0%, hsl(225 50% 8%) 100%)",
                }}
              >
                {/* Burst ring */}
                <motion.div
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1.4, opacity: [0, 0.7, 0] }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                  className="absolute inset-0 rounded-[22px] pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, ${meta.glow}55 0%, transparent 65%)`,
                  }}
                />

                <motion.div
                  initial={{ scale: 0.4, rotate: -20, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 16, delay: 0.05 }}
                  className="text-7xl mb-3 inline-block"
                  style={{ filter: `drop-shadow(0 8px 30px ${meta.glow})` }}
                >
                  {meta.emoji}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-white/90 text-[10px] font-bold uppercase tracking-widest mb-3"
                >
                  <Sparkles className="h-3 w-3" />
                  Your path is set
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl sm:text-4xl font-black text-white tracking-tight"
                >
                  You're a {meta.name}!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm text-white/70 mt-2 max-w-sm mx-auto leading-relaxed"
                >
                  {meta.tagline}
                </motion.p>

                <motion.ul
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="mt-5 flex flex-wrap items-center justify-center gap-2"
                >
                  {meta.perks.map((p) => (
                    <li
                      key={p}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 text-[12px] text-white/85"
                      style={{ boxShadow: `inset 0 0 0 1px ${meta.glow}55` }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: meta.glow, boxShadow: `0 0 8px ${meta.glow}` }}
                      />
                      {p}
                    </li>
                  ))}
                </motion.ul>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center text-xs text-white/60 mt-5 max-w-md mx-auto leading-relaxed"
            >
              {meta.intro}
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleConfirm}
              disabled={saving}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-white text-base disabled:opacity-60"
              style={{
                background: `linear-gradient(135deg, ${meta.glow}, ${meta.glow}cc)`,
                boxShadow: `0 12px 30px -8px ${meta.glow}, 0 0 0 1px ${meta.glow}`,
              }}
            >
              {saving ? "Saving…" : "Let's go!"}
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ---------- QUESTION SCREEN — neon game-card style ----------
  const q = QUESTIONS[step];
  const previewMeta = MODE_META[activeMode];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleSkip(); }}>
      <DialogContent
        className="sm:max-w-xl p-0 overflow-hidden border-0"
        aria-describedby={undefined}
        style={{
          background:
            "radial-gradient(ellipse at top, hsl(225 40% 15%) 0%, hsl(225 45% 8%) 60%, hsl(225 50% 5%) 100%)",
        }}
      >
        {/* Ambient blobs follow live preview mode */}
        <motion.div
          aria-hidden
          className="absolute top-0 left-1/4 h-[28vh] w-[28vh] rounded-full blur-3xl opacity-40 pointer-events-none"
          style={{ background: previewMeta.glow }}
          animate={{ x: [0, 20, -10, 0], y: [0, 15, -10, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute bottom-0 right-1/4 h-[24vh] w-[24vh] rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ background: previewMeta.glow }}
          animate={{ x: [0, -15, 10, 0], y: [0, -10, 15, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative p-6 sm:p-8">
          {/* Progress segments */}
          <div className="flex items-center justify-center gap-2 mb-5">
            {QUESTIONS.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === step ? 40 : 24,
                  opacity: i <= step ? 1 : 0.35,
                }}
                className="h-1.5 rounded-full"
                style={{
                  background: i <= step ? previewMeta.glow : "rgba(255,255,255,0.25)",
                  boxShadow: i === step ? `0 0 12px ${previewMeta.glow}` : "none",
                }}
              />
            ))}
          </div>

          <div className="text-center mb-5">
            <motion.div
              key={`pill-${step}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-white/90 text-[10px] font-bold uppercase tracking-widest mb-3"
            >
              <Sparkles className="h-3 w-3" />
              Quick vibe check ({step + 1} of {QUESTIONS.length})
            </motion.div>
            <AnimatePresence mode="wait">
              <motion.h2
                key={`q-${step}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-xl sm:text-2xl font-black text-white leading-tight"
              >
                {q.prompt}
              </motion.h2>
            </AnimatePresence>
            <p className="text-xs text-white/60 mt-2">{q.hint}</p>
          </div>

          <div className="space-y-3">
            {q.options.map((opt, i) => {
              const isPicked = pickedIdx === i;
              const isOtherPicked = pickedIdx !== null && pickedIdx !== i;
              // Color hint per option position so cards feel like the 3 modes
              const optColor = i === 0
                ? "hsl(160 70% 55%)"
                : i === 1
                ? "hsl(215 80% 60%)"
                : "hsl(285 75% 60%)";

              return (
                <motion.button
                  key={`${step}-${i}`}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{
                    opacity: isOtherPicked ? 0.3 : 1,
                    y: isPicked ? -4 : 0,
                    scale: isPicked ? 1.02 : 1,
                  }}
                  transition={{ delay: 0.1 + i * 0.07, type: "spring", stiffness: 220, damping: 22 }}
                  whileHover={pickedIdx === null ? { scale: 1.02, y: -2 } : {}}
                  whileTap={pickedIdx === null ? { scale: 0.98 } : {}}
                  onClick={() => handleAnswer(i)}
                  disabled={pickedIdx !== null}
                  className="group relative w-full text-left rounded-2xl p-[2px] cursor-pointer disabled:cursor-default"
                  style={{
                    boxShadow: isPicked
                      ? `0 20px 40px -10px ${optColor}, 0 0 0 1px ${optColor}`
                      : `0 6px 18px -10px ${optColor}66`,
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-2xl opacity-60 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: `linear-gradient(135deg, ${optColor}aa, ${optColor}33)`,
                    }}
                    aria-hidden
                  />
                  <div
                    className="relative rounded-[15px] px-4 py-3.5 flex items-start gap-3"
                    style={{
                      background:
                        "linear-gradient(165deg, hsl(225 40% 14%) 0%, hsl(225 50% 9%) 100%)",
                    }}
                  >
                    <motion.div
                      animate={pickedIdx === null ? { y: [-1, 1, -1] } : {}}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                      className="text-3xl shrink-0"
                      style={{ filter: `drop-shadow(0 4px 14px ${optColor})` }}
                    >
                      {opt.emoji}
                    </motion.div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-white text-[15px] leading-snug">{opt.label}</div>
                      <div className="text-[12px] text-white/65 mt-0.5">{opt.desc}</div>
                    </div>
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all"
                      style={{
                        background: isPicked ? optColor : "rgba(255,255,255,0.08)",
                        boxShadow: isPicked ? `0 0 14px ${optColor}` : "none",
                      }}
                    >
                      <Check
                        className="h-3.5 w-3.5"
                        style={{ color: isPicked ? "white" : "rgba(255,255,255,0.3)" }}
                      />
                    </div>

                    {/* Burst on pick */}
                    <AnimatePresence>
                      {isPicked && (
                        <motion.div
                          key="b"
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1.15 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 rounded-[15px] pointer-events-none"
                          style={{
                            background: `radial-gradient(circle at center, ${optColor}55 0%, transparent 65%)`,
                          }}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <p className="text-center text-[11px] text-white/45 mt-5">
            The game starts the moment you tap. 🎮
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VibeCheckModal;
