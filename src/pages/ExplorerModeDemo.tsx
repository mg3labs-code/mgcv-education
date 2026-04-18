import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Rocket, Brain, ArrowRight, Lock, ChevronDown, Trophy, Zap, Eye, Wrench, Microscope, Layers, Replace, LayoutPanelTop, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import DownloadCodeButton from "@/components/DownloadCodeButton";
// Raw source imports — bundled at build time, used by the Download button
import sourceSelf from "./ExplorerModeDemo.tsx?raw";
import sourceDownloadBtn from "@/components/DownloadCodeButton.tsx?raw";

/**
 * Explorer Mode Comparison Demo — 4 render approaches side by side.
 *
 * Render approaches:
 *   A) Toggle inside each block        — same card chrome, mode-aware body
 *   B) Wrapper around each block        — full block stays, summary card precedes/replaces it
 *   C) Replace block content entirely   — Explorer = single tiny "card per layer", no full blocks
 *   D) Top-level page switcher          — Explorer = totally different page layout (snackable feed)
 *
 * Same source-of-truth concept (Reflection of Light) renders in all four,
 * so you can FEEL the difference and pick a winner.
 */

type Mode = "explorer" | "builder" | "master";

const CONCEPT = {
  title: "Reflection of Light",
  subject: "Physics · Class 10",
  layers: [
    {
      id: "definition",
      icon: "💡",
      label: "What it is",
      explorer: { oneLiner: "Light bounces off a mirror like a ball off a wall.", emoji: "🪞" },
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
      explorer: { oneLiner: "The angle going in equals the angle coming out — every single time.", emoji: "📐" },
      builder: {
        story:
          "Think of throwing a tennis ball at a wall. Throw it straight on, it bounces straight back. Throw it at a slant, it bounces off at the same slant. Light does the exact same thing — that's the Law of Reflection.",
      },
      master: {
        title: "Mechanism — Laws of Reflection",
        body:
          "Law 1: angle of incidence (i) equals angle of reflection (r). Law 2: incident ray, normal, and reflected ray are coplanar. Holds for both regular (specular) and irregular (diffuse) reflection.",
      },
    },
    {
      id: "reasoning",
      icon: "🔬",
      label: "Why it works",
      explorer: { oneLiner: "Light is lazy — it always picks the fastest path.", emoji: "⚡" },
      builder: {
        story:
          "Imagine you're a lifeguard and someone's drowning diagonally across the beach. You'd run to the water at the angle that gets you there fastest. Light does the same thing — it picks the path that takes the least time. That's why the angles end up equal.",
      },
      master: {
        title: "Reasoning — Fermat's Principle",
        body:
          "Fermat's principle of least time: light travels along the path which takes the least time. Applied to a reflective surface via calculus of variations, it yields θᵢ = θᵣ. The deeper 'why' behind the empirical Law of Reflection.",
      },
    },
  ],
};

const MODE_META: Record<Mode, { label: string; emoji: string; tagline: string; gradient: string; icon: typeof Sparkles; xp: string }> = {
  explorer: { label: "Explorer", emoji: "🌱", tagline: "Quick fun facts. Easy words. Big curiosity.", gradient: "from-emerald-400 to-teal-500", icon: Sparkles, xp: "+10 XP" },
  builder:  { label: "Builder",  emoji: "🚀", tagline: "Stories and analogies. See how it really works.", gradient: "from-blue-400 to-indigo-500", icon: Rocket, xp: "+25 XP" },
  master:   { label: "Master",   emoji: "🧠", tagline: "Real reasoning. Real depth. Challenge unlocked.", gradient: "from-purple-400 to-pink-500", icon: Brain, xp: "+50 XP" },
};

const ExplorerModeDemo = () => {
  const [mode, setMode] = useState<Mode>("explorer");
  const [showLevelUp, setShowLevelUp] = useState(false);
  const meta = MODE_META[mode];

  const changeMode = (next: Mode) => {
    if (next === mode) return;
    const order: Mode[] = ["explorer", "builder", "master"];
    if (order.indexOf(next) > order.indexOf(mode)) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 2200);
    }
    setMode(next);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-lg shrink-0`}>
              {meta.emoji}
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground truncate">{CONCEPT.subject} · {CONCEPT.title}</div>
              <div className="font-bold text-sm text-foreground truncate">Explorer Mode — 4 Render Approaches</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DownloadCodeButton
              filename="explorer-mode-demo.txt"
              files={[
                { path: "src/pages/ExplorerModeDemo.tsx", content: sourceSelf },
                { path: "src/components/DownloadCodeButton.tsx", content: sourceDownloadBtn },
              ]}
            />
            <Link to="/demo/fallback-strategies" className="hidden sm:flex">
              <Button variant="outline" size="sm" className="gap-1.5">
                See fallback strategies <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Mode pill */}
        <div className="max-w-5xl mx-auto px-4 pb-3">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-muted/60 max-w-md mx-auto">
            {(Object.keys(MODE_META) as Mode[]).map((m) => {
              const mm = MODE_META[m];
              const active = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => changeMode(m)}
                  className={`relative py-2 px-2 rounded-lg text-xs font-semibold transition-all ${active ? "text-white" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {active && (
                    <motion.div layoutId="mode-pill-cmp" className={`absolute inset-0 rounded-lg bg-gradient-to-br ${mm.gradient} shadow-md`} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                  )}
                  <span className="relative flex items-center justify-center gap-1.5">
                    <span>{mm.emoji}</span>
                    <span>{mm.label}</span>
                    <span className="hidden sm:inline text-[10px] opacity-80">· {mm.xp}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-28 left-1/2 -translate-x-1/2 z-40 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-2xl flex items-center gap-2 font-bold text-sm"
          >
            <Trophy className="h-5 w-5" /> Level up! Welcome to {meta.label} Mode {meta.emoji}
          </motion.div>
        )}
      </AnimatePresence>

      {/* === Render approach tabs === */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-5 p-4 rounded-xl bg-muted/40 border border-border">
          <h2 className="font-bold text-foreground mb-1 text-sm">Pick a render approach</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Same concept, four different ways to render it across modes. Switch the mode pill above + the tab below to feel each combination. Pick whichever feels most intuitive.
          </p>
        </div>

        <Tabs defaultValue="toggle" className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto p-1 mb-4">
            <TabsTrigger value="toggle" className="flex-col gap-1 py-2.5 text-xs">
              <ToggleRight className="h-4 w-4" /> A · Toggle
            </TabsTrigger>
            <TabsTrigger value="wrapper" className="flex-col gap-1 py-2.5 text-xs">
              <Layers className="h-4 w-4" /> B · Wrapper
            </TabsTrigger>
            <TabsTrigger value="replace" className="flex-col gap-1 py-2.5 text-xs">
              <Replace className="h-4 w-4" /> C · Replace
            </TabsTrigger>
            <TabsTrigger value="page" className="flex-col gap-1 py-2.5 text-xs">
              <LayoutPanelTop className="h-4 w-4" /> D · Page-level
            </TabsTrigger>
          </TabsList>

          <TabsContent value="toggle" className="mt-0 space-y-3">
            <ApproachLabel title="A · Toggle inside each block" desc="Same card chrome. The body switches based on mode. Clean and consistent — feels like one product." />
            {CONCEPT.layers.map((l, i) => <ToggleBlock key={l.id} layer={l} mode={mode} index={i} onLevelUp={() => changeMode(mode === "explorer" ? "builder" : "master")} canLevelUp={mode !== "master"} />)}
          </TabsContent>

          <TabsContent value="wrapper" className="mt-0 space-y-3">
            <ApproachLabel title="B · Wrapper around each block" desc="In Explorer/Builder, a colorful summary card sits ON TOP of the full block (still collapsed). Tap to expand. Best for students who want to peek at depth." />
            {CONCEPT.layers.map((l, i) => <WrapperBlock key={l.id} layer={l} mode={mode} index={i} />)}
          </TabsContent>

          <TabsContent value="replace" className="mt-0 space-y-3">
            <ApproachLabel title="C · Replace block content entirely" desc="In Explorer mode, full blocks are GONE. Just tiny snackable cards. Builder shows a story. Master shows full blocks. Maximum simplification — risks hiding depth." />
            {mode === "explorer" ? (
              <div className="grid sm:grid-cols-3 gap-3">{CONCEPT.layers.map((l) => <ExplorerSnackCard key={l.id} layer={l} />)}</div>
            ) : mode === "builder" ? (
              CONCEPT.layers.map((l, i) => <BuilderStoryCard key={l.id} layer={l} index={i} />)
            ) : (
              CONCEPT.layers.map((l, i) => <MasterFullBlock key={l.id} layer={l} index={i} />)
            )}
          </TabsContent>

          <TabsContent value="page" className="mt-0">
            <ApproachLabel title="D · Top-level page switcher" desc="Explorer = a totally different page (vertical TikTok-style feed of facts). Builder = current reader. Master = current reader + extras. Maximum differentiation, hardest to maintain." />
            {mode === "explorer" ? (
              <PageLevelExplorerFeed />
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl border border-dashed border-border text-xs text-muted-foreground text-center">
                  ↳ Renders the existing reader (Builder/Master) as-is. Try switching to Explorer mode above to see the dedicated feed.
                </div>
                {CONCEPT.layers.map((l, i) => <ToggleBlock key={l.id} layer={l} mode={mode} index={i} onLevelUp={() => {}} canLevelUp={false} />)}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Recommendation strip */}
        <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🎯</div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground text-sm mb-1">Elite-design recommendation: Approach A (Toggle)</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                Same visual chrome across all 3 modes = one consistent product. Lowest engineering cost. Easiest A/B test. Lets the curiosity-hook ("Want to know HOW? 🔓") shine without hiding depth.
                Approach B is the strong runner-up if students keep wanting to "peek" at master content. Avoid C and D — they fragment the product.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-[10px]">Apple HIG</Badge>
                <Badge variant="secondary" className="text-[10px]">Single visual language</Badge>
                <Badge variant="secondary" className="text-[10px]">Progressive disclosure</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================ shared bits ============================ */

const ApproachLabel = ({ title, desc }: { title: string; desc: string }) => (
  <div className="p-3 rounded-lg bg-card border border-border">
    <div className="font-bold text-sm text-foreground">{title}</div>
    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
  </div>
);

const ModeBadge = ({ mode }: { mode: Mode }) => {
  const m = MODE_META[mode];
  return (
    <Badge variant="secondary" className={`text-[10px] font-semibold bg-gradient-to-br ${m.gradient} text-white border-0 shrink-0`}>
      {m.emoji} {m.label}
    </Badge>
  );
};

const CuriosityHook = ({ text, onClick, disabled }: { text: string; onClick: () => void; disabled?: boolean }) => (
  <button onClick={onClick} disabled={disabled} className="w-full group flex items-center justify-between p-3 rounded-xl border border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
    <span className="flex items-center gap-2 text-xs font-semibold text-primary"><Lock className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />{text}</span>
    <ArrowRight className="h-3.5 w-3.5 text-primary group-hover:translate-x-0.5 transition-transform" />
  </button>
);

/* ============================ A · Toggle ============================ */

const ToggleBlock = ({ layer, mode, index, onLevelUp, canLevelUp }: { layer: typeof CONCEPT.layers[number]; mode: Mode; index: number; onLevelUp: () => void; canLevelUp: boolean }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
    <Card className="overflow-hidden border-border bg-card">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-muted/30">
        <div className="text-xl">{layer.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Layer {index + 1}</div>
          <div className="text-sm font-bold text-foreground">{layer.label}</div>
        </div>
        <ModeBadge mode={mode} />
      </div>
      <div className="p-4">
        <AnimatePresence mode="wait">
          {mode === "explorer" && (
            <motion.div key="exp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/50 dark:border-emerald-800/40">
                <div className="text-3xl shrink-0">{layer.explorer.emoji}</div>
                <p className="text-base font-medium text-foreground leading-snug">{layer.explorer.oneLiner}</p>
              </div>
              <CuriosityHook text="Want to know HOW?" onClick={onLevelUp} disabled={!canLevelUp} />
            </motion.div>
          )}
          {mode === "builder" && (
            <motion.div key="bld" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200/50 dark:border-blue-800/40">
                <div className="flex items-start gap-2 mb-2"><Wrench className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" /><span className="text-[11px] uppercase tracking-wide font-bold text-blue-700 dark:text-blue-300">The Story</span></div>
                <p className="text-sm text-foreground leading-relaxed">{layer.builder.story}</p>
              </div>
              <CuriosityHook text="Want the REAL science?" onClick={onLevelUp} disabled={!canLevelUp} />
            </motion.div>
          )}
          {mode === "master" && (
            <motion.div key="mst" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 border border-purple-200/50 dark:border-purple-800/40">
                <div className="flex items-start gap-2 mb-2"><Microscope className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5" /><span className="text-[11px] uppercase tracking-wide font-bold text-purple-700 dark:text-purple-300">{layer.master.title}</span></div>
                <p className="text-sm text-foreground leading-relaxed">{layer.master.body}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  </motion.div>
);

/* ============================ B · Wrapper ============================ */

const WrapperBlock = ({ layer, mode, index }: { layer: typeof CONCEPT.layers[number]; mode: Mode; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
      <Card className="overflow-hidden border-border bg-card">
        {/* Mode-specific summary on top */}
        {mode === "explorer" && (
          <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border-b border-emerald-200/40">
            <div className="text-3xl">{layer.explorer.emoji}</div>
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-wide font-bold text-emerald-700 dark:text-emerald-300 mb-1">{layer.label}</div>
              <p className="text-base font-medium text-foreground leading-snug">{layer.explorer.oneLiner}</p>
            </div>
          </div>
        )}
        {mode === "builder" && (
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border-b border-blue-200/40">
            <div className="text-[10px] uppercase tracking-wide font-bold text-blue-700 dark:text-blue-300 mb-1.5">{layer.label} — Story</div>
            <p className="text-sm text-foreground leading-relaxed">{layer.builder.story}</p>
          </div>
        )}

        {/* Always-present full master block, collapsible in Explorer/Builder */}
        <button onClick={() => setExpanded((v) => !v)} className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs text-muted-foreground hover:bg-muted/40 transition-colors">
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          {mode === "master" ? <span className="font-semibold text-foreground">{layer.master.title}</span> : <span>Peek at full {layer.master.title}</span>}
        </button>
        <AnimatePresence>
          {(expanded || mode === "master") && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="px-4 pb-4 text-sm text-foreground leading-relaxed">{layer.master.body}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

/* ============================ C · Replace ============================ */

const ExplorerSnackCard = ({ layer }: { layer: typeof CONCEPT.layers[number] }) => (
  <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border-emerald-200/50 dark:border-emerald-800/40">
    <div className="text-3xl mb-2">{layer.explorer.emoji}</div>
    <div className="text-[10px] uppercase tracking-wide font-bold text-emerald-700 dark:text-emerald-300 mb-1">{layer.label}</div>
    <p className="text-sm font-medium text-foreground leading-snug">{layer.explorer.oneLiner}</p>
  </Card>
);

const BuilderStoryCard = ({ layer, index }: { layer: typeof CONCEPT.layers[number]; index: number }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/40">
      <div className="flex items-center gap-2 mb-2"><span className="text-xl">{layer.icon}</span><div className="text-sm font-bold text-foreground">{layer.label}</div></div>
      <p className="text-sm text-foreground leading-relaxed">{layer.builder.story}</p>
    </Card>
  </motion.div>
);

const MasterFullBlock = ({ layer, index }: { layer: typeof CONCEPT.layers[number]; index: number }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
    <Card className="p-4 border-border bg-card">
      <div className="flex items-center gap-2 mb-2"><span className="text-xl">{layer.icon}</span><div className="text-sm font-bold text-foreground">{layer.master.title}</div></div>
      <p className="text-sm text-foreground leading-relaxed">{layer.master.body}</p>
    </Card>
  </motion.div>
);

/* ============================ D · Page-level ============================ */

const PageLevelExplorerFeed = () => (
  <div className="max-w-sm mx-auto">
    <div className="text-xs text-muted-foreground text-center mb-3">↓ Snackable vertical feed (TikTok-style for Explorer)</div>
    <div className="space-y-3">
      {CONCEPT.layers.map((l) => (
        <Card key={l.id} className={`overflow-hidden p-0 border-emerald-200/40 dark:border-emerald-800/40`}>
          <div className="aspect-[4/5] bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 p-6 flex flex-col justify-between text-white">
            <div className="text-xs font-bold uppercase tracking-wide opacity-80">{l.label}</div>
            <div>
              <div className="text-6xl mb-3">{l.explorer.emoji}</div>
              <p className="text-xl font-bold leading-tight">{l.explorer.oneLiner}</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Zap className="h-3.5 w-3.5" /> Swipe up for next
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

export default ExplorerModeDemo;
