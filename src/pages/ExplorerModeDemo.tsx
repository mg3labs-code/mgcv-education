import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Rocket, Brain, ArrowRight, Lock, ChevronDown, Trophy, Zap, Eye, Wrench, Microscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Explorer Mode Demo — applies elite product-design thinking to difficulty rendering.
 *
 * 5 design principles in play:
 *  1) Progressive disclosure (Apple/Notion): one concept, three depths, pull more on demand.
 *  2) Curiosity unlock (Duolingo): every card ends with a hook, never dead-ends.
 *  3) Speed-first fallback (Linear): client-rendered instant version, AI quietly improves cache later.
 *  4) Single visual language (Apple HIG): same card chrome, only depth changes — feels like one product.
 *  5) Identity, not setting (Duolingo leagues): mode is a celebrated badge, never buried in settings.
 */

type Mode = "explorer" | "builder" | "master";

// Real concept rendered three ways. Same source-of-truth, three depths.
const CONCEPT = {
  title: "Reflection of Light",
  subject: "Physics · Class 10",
  layers: [
    {
      id: "definition",
      icon: "💡",
      label: "What it is",
      explorer: {
        oneLiner: "Light bounces off a mirror like a ball off a wall.",
        emoji: "🪞",
      },
      builder: {
        story:
          "Imagine you're shining your phone torch at a smooth bathroom mirror. The light doesn't get absorbed or pass through — it bounces straight back. That bouncing is what we call reflection.",
      },
      master: {
        title: "Definition",
        body:
          "Reflection is the phenomenon by which light, on striking a smooth polished surface, returns to the same medium following well-defined geometric laws. The incident ray, normal, and reflected ray are coplanar.",
      },
    },
    {
      id: "mechanism",
      icon: "⚙️",
      label: "How it works",
      explorer: {
        oneLiner: "The angle going in equals the angle coming out — every single time.",
        emoji: "📐",
      },
      builder: {
        story:
          "Think of throwing a tennis ball at a wall. If you throw it straight on, it bounces straight back. If you throw it at a slant, it bounces off at the same slant on the other side. Light does the exact same thing — that's the Law of Reflection.",
      },
      master: {
        title: "Mechanism — Laws of Reflection",
        body:
          "Law 1: The angle of incidence (i) equals the angle of reflection (r). Law 2: The incident ray, the normal at the point of incidence, and the reflected ray all lie in the same plane. These hold for both regular (specular) and irregular (diffuse) reflection.",
      },
    },
    {
      id: "reasoning",
      icon: "🔬",
      label: "Why it works",
      explorer: {
        oneLiner: "Light is lazy — it always picks the fastest path.",
        emoji: "⚡",
      },
      builder: {
        story:
          "There's actually a deeper reason. Imagine you're a lifeguard and someone's drowning diagonally across the beach. You'd run to the water at just the right angle to reach them fastest, right? Light does the same thing — it picks the path that takes the least time. That's why the angles end up equal.",
      },
      master: {
        title: "Reasoning — Fermat's Principle",
        body:
          "Fermat's principle of least time states that light travels along the path which takes the least time between two points. When applied to a reflective surface, the calculus of variations yields exactly the result that θᵢ = θᵣ. This is the deeper 'why' behind the empirical Law of Reflection.",
      },
    },
  ],
};

const MODE_META: Record<Mode, { label: string; emoji: string; tagline: string; gradient: string; icon: typeof Sparkles; xp: string }> = {
  explorer: {
    label: "Explorer",
    emoji: "🌱",
    tagline: "Quick fun facts. Easy words. Big curiosity.",
    gradient: "from-emerald-400 to-teal-500",
    icon: Sparkles,
    xp: "+10 XP per card",
  },
  builder: {
    label: "Builder",
    emoji: "🚀",
    tagline: "Stories and analogies. See how things really work.",
    gradient: "from-blue-400 to-indigo-500",
    icon: Rocket,
    xp: "+25 XP per card",
  },
  master: {
    label: "Master",
    emoji: "🧠",
    tagline: "Real reasoning. Real depth. Challenge unlocked.",
    gradient: "from-purple-400 to-pink-500",
    icon: Brain,
    xp: "+50 XP per card",
  },
};

const ExplorerModeDemo = () => {
  const [mode, setMode] = useState<Mode>("explorer");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [showLevelUp, setShowLevelUp] = useState(false);

  const meta = MODE_META[mode];
  const ModeIcon = meta.icon;

  const handleReveal = (layerId: string) => {
    setRevealed((p) => ({ ...p, [layerId]: true }));
  };

  const handleModeChange = (next: Mode) => {
    if (next === mode) return;
    const order: Mode[] = ["explorer", "builder", "master"];
    if (order.indexOf(next) > order.indexOf(mode)) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 2200);
    }
    setMode(next);
    setRevealed({}); // reset progressive disclosure on mode change
  };

  return (
    <div className="min-h-screen bg-background">
      {/* === HEADER: identity badge, not a setting === */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-lg shrink-0`}>
              {meta.emoji}
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground truncate">{CONCEPT.subject}</div>
              <div className="font-bold text-sm text-foreground truncate">{CONCEPT.title}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold shrink-0">
            <Zap className="h-3 w-3" />
            {meta.xp}
          </div>
        </div>

        {/* Mode switcher pill — single visual language */}
        <div className="max-w-3xl mx-auto px-4 pb-3">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-muted/60">
            {(Object.keys(MODE_META) as Mode[]).map((m) => {
              const mm = MODE_META[m];
              const active = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => handleModeChange(m)}
                  className={`relative py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                    active ? "text-white shadow-md" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="mode-pill"
                      className={`absolute inset-0 rounded-lg bg-gradient-to-br ${mm.gradient}`}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative flex items-center justify-center gap-1.5">
                    <span>{mm.emoji}</span>
                    <span>{mm.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* === LEVEL-UP CELEBRATION === */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-40 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-2xl flex items-center gap-2 font-bold text-sm"
          >
            <Trophy className="h-5 w-5" />
            Level up! Welcome to {meta.label} Mode {meta.emoji}
          </motion.div>
        )}
      </AnimatePresence>

      {/* === CONTENT === */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Tagline strip */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border">
          <ModeIcon className={`h-4 w-4 mt-0.5 shrink-0 text-primary`} />
          <p className="text-xs text-muted-foreground leading-relaxed">{meta.tagline}</p>
        </div>

        {CONCEPT.layers.map((layer, idx) => (
          <LayerCard
            key={layer.id}
            layer={layer}
            mode={mode}
            index={idx}
            isRevealed={!!revealed[layer.id]}
            onReveal={() => handleReveal(layer.id)}
            onLevelUp={() => handleModeChange(mode === "explorer" ? "builder" : "master")}
            canLevelUp={mode !== "master"}
          />
        ))}

        {/* End-of-section curiosity hook */}
        <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 text-center">
          <div className="text-3xl mb-2">{mode === "master" ? "🏆" : "🔓"}</div>
          {mode === "master" ? (
            <>
              <h3 className="font-bold text-foreground mb-1">You've reached Master depth.</h3>
              <p className="text-xs text-muted-foreground mb-3">Try the Q-Bank to test what you've absorbed.</p>
              <Button size="sm">Go to Q-Bank →</Button>
            </>
          ) : (
            <>
              <h3 className="font-bold text-foreground mb-1">Want to go deeper?</h3>
              <p className="text-xs text-muted-foreground mb-3">
                {mode === "explorer"
                  ? "Builder mode shows you HOW it really works with stories."
                  : "Master mode unlocks the real science with deep reasoning."}
              </p>
              <Button
                size="sm"
                onClick={() => handleModeChange(mode === "explorer" ? "builder" : "master")}
                className="gap-1.5"
              >
                Level up to {mode === "explorer" ? "Builder" : "Master"} {mode === "explorer" ? "🚀" : "🧠"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ===========================================================
   LayerCard — single visual language, mode-aware rendering.
   =========================================================== */
const LayerCard = ({
  layer,
  mode,
  index,
  isRevealed,
  onReveal,
  onLevelUp,
  canLevelUp,
}: {
  layer: typeof CONCEPT.layers[number];
  mode: Mode;
  index: number;
  isRevealed: boolean;
  onReveal: () => void;
  onLevelUp: () => void;
  canLevelUp: boolean;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <Card className="overflow-hidden border-border bg-card">
        {/* Layer header — same in all modes */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-muted/30">
          <div className="text-xl">{layer.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
              Layer {index + 1}
            </div>
            <div className="text-sm font-bold text-foreground">{layer.label}</div>
          </div>
          <ModeBadge mode={mode} />
        </div>

        {/* Mode-aware body */}
        <div className="p-4">
          <AnimatePresence mode="wait">
            {mode === "explorer" && (
              <motion.div
                key="explorer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/50 dark:border-emerald-800/40">
                  <div className="text-3xl shrink-0">{layer.explorer.emoji}</div>
                  <p className="text-base font-medium text-foreground leading-snug">
                    {layer.explorer.oneLiner}
                  </p>
                </div>
                <CuriosityHook
                  text="Want to know HOW?"
                  onClick={onLevelUp}
                  disabled={!canLevelUp}
                />
              </motion.div>
            )}

            {mode === "builder" && (
              <motion.div
                key="builder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200/50 dark:border-blue-800/40">
                  <div className="flex items-start gap-2 mb-2">
                    <Wrench className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <span className="text-[11px] uppercase tracking-wide font-bold text-blue-700 dark:text-blue-300">
                      The Story
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{layer.builder.story}</p>
                </div>
                <CuriosityHook
                  text="Want the REAL science?"
                  onClick={onLevelUp}
                  disabled={!canLevelUp}
                />
              </motion.div>
            )}

            {mode === "master" && (
              <motion.div
                key="master"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 border border-purple-200/50 dark:border-purple-800/40">
                  <div className="flex items-start gap-2 mb-2">
                    <Microscope className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                    <span className="text-[11px] uppercase tracking-wide font-bold text-purple-700 dark:text-purple-300">
                      {layer.master.title}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{layer.master.body}</p>
                </div>
                {/* In Master mode the curiosity hook becomes "go practice" — no more depth to reveal */}
                {!isRevealed ? (
                  <button
                    onClick={onReveal}
                    className="w-full p-3 rounded-xl border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-xs text-muted-foreground flex items-center justify-center gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Show worked example
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-3 rounded-xl bg-muted/40 text-xs text-muted-foreground leading-relaxed"
                  >
                    <strong className="text-foreground">Worked example:</strong> A ray hits a mirror at
                    35° from the normal. By the Law of Reflection, the reflected ray emerges at 35° on
                    the opposite side of the normal. If the mirror tilts by 5°, the reflected ray
                    rotates by 10° — a key result used in galvanometer mirrors.
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
};

const ModeBadge = ({ mode }: { mode: Mode }) => {
  const m = MODE_META[mode];
  return (
    <Badge
      variant="secondary"
      className={`text-[10px] font-semibold bg-gradient-to-br ${m.gradient} text-white border-0 shrink-0`}
    >
      {m.emoji} {m.label}
    </Badge>
  );
};

const CuriosityHook = ({
  text,
  onClick,
  disabled,
}: {
  text: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full group flex items-center justify-between p-3 rounded-xl border border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
  >
    <span className="flex items-center gap-2 text-xs font-semibold text-primary">
      <Lock className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
      {text}
    </span>
    <ArrowRight className="h-3.5 w-3.5 text-primary group-hover:translate-x-0.5 transition-transform" />
  </button>
);

export default ExplorerModeDemo;
