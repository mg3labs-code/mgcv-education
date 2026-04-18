import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles, Eye, Cpu, Layers, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Mode = "explorer" | "builder" | "master";

const modeStyles: Record<Mode, { label: string; ring: string; chip: string; bg: string }> = {
  explorer: {
    label: "Explorer",
    ring: "ring-emerald-400",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
    bg: "from-emerald-50/40 to-transparent",
  },
  builder: {
    label: "Builder",
    ring: "ring-blue-400",
    chip: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300",
    bg: "from-blue-50/40 to-transparent",
  },
  master: {
    label: "Master",
    ring: "ring-purple-400",
    chip: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300",
    bg: "from-purple-50/40 to-transparent",
  },
};

const acts = [
  { id: 1, label: "What students see", sub: "Content variants", icon: Eye },
  { id: 2, label: "How we generate it", sub: "Source pipeline", icon: Cpu },
  { id: 3, label: "Where it lives", sub: "Reader integration", icon: Layers },
];

// Act 1 sample content — same definition, three depths
const definitionVariants: Record<Mode, { title: string; body: string; tag: string }> = {
  explorer: {
    title: "Reflection",
    body: "When light hits a smooth surface like a mirror, it bounces back. That bouncing is called reflection.",
    tag: "1 sentence · 2 grade levels simpler",
  },
  builder: {
    title: "Reflection of Light",
    body: "Reflection is the change in direction of a light ray when it hits a surface and returns into the same medium. The angle of incidence equals the angle of reflection, both measured from the normal.",
    tag: "Standard textbook depth",
  },
  master: {
    title: "Reflection — formal definition",
    body: "Reflection is the phenomenon in which an electromagnetic wave incident on the boundary between two media returns into the original medium, governed by the laws θᵢ = θᵣ and coplanarity of incident ray, reflected ray, and normal.",
    tag: "Includes formal notation + EM framing",
  },
};

// Act 2 — three sources for the SAME explorer card
const sources = [
  {
    name: "Client Simplifier",
    chip: "Instant · Free",
    color: "emerald",
    pros: ["0ms latency", "No API call", "Works offline"],
    cons: ["Loses nuance", "Rule-based only"],
    when: "First render — show something now",
  },
  {
    name: "AI on-demand + Cache",
    chip: "~1.2s first time · Free after",
    color: "blue",
    pros: ["High quality", "Cached forever", "Adapts to context"],
    cons: ["First call costs", "Needs network"],
    when: "Student taps Explorer for the first time",
  },
  {
    name: "Pre-generated Cache",
    chip: "0ms · Pre-baked",
    color: "purple",
    pros: ["Instant", "Highest quality", "Editor-reviewed"],
    cons: ["Build-time cost", "Stale if textbook changes"],
    when: "Hot chapters (Ch1, exam topics)",
  },
];

// Act 3 — three integration points
const integrations = [
  {
    where: "Global pill (top of episode)",
    diagram: "🟢 Builder ↓\n────────────\n  Definition\n  Mechanism\n  Reasoning ...",
    pros: "One decision, applies everywhere",
    cons: "Can't mix depths within one episode",
    elite: false,
  },
  {
    where: "Smart auto-hide",
    diagram: "🟢 Explorer ↓\n────────────\n  Definition  ✓\n  Mechanism   ✓\n  Application ✓\n  🔒 Reasoning  (unlock in Master)",
    pros: "Reduces cognitive load. Locked layers create curiosity.",
    cons: "Less explicit than per-section toggle",
    elite: true,
  },
  {
    where: "Per-block toggle",
    diagram: "  Definition  [E·B·M]\n  Mechanism   [E·B·M]\n  Reasoning   [E·B·M]",
    pros: "Maximum control",
    cons: "Toggle fatigue. 21 decisions per episode.",
    elite: false,
  },
];

const eliteStack = [
  { layer: "WHAT students see", choice: "3 modes (Explorer · Builder · Master)", route: "/demo/explorer-mode" },
  { layer: "HOW we generate it", choice: "Pre-gen cache → AI on-demand → Client fallback", route: "/demo/fallback-strategies" },
  { layer: "WHERE it lives", choice: "Smart auto-hide + Context Provider hook", route: "/demo/elite-integration" },
];

export default function AdaptiveSystemHub() {
  const [mode, setMode] = useState<Mode>("builder");
  const [activeAct, setActiveAct] = useState(1);
  const actRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  // Scroll-spy: which act is currently in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = actRefs.findIndex((r) => r.current === entry.target);
            if (idx >= 0 && idx <= 3) setActiveAct(Math.max(1, idx));
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );
    actRefs.forEach((r) => r.current && observer.observe(r.current));
    return () => observer.disconnect();
  }, []);

  const scrollToAct = (idx: number) => {
    actRefs[idx]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Top bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h1 className="text-sm sm:text-base font-bold">Adaptive Learning System</h1>
          </div>
          <Badge variant="outline" className="text-[10px]">3-act tour</Badge>
        </div>

        {/* Progress rail */}
        <div className="border-t border-border/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-1 sm:gap-2 overflow-x-auto">
            {acts.map((act, idx) => {
              const Icon = act.icon;
              const isActive = activeAct === act.id;
              const isDone = activeAct > act.id;
              return (
                <button
                  key={act.id}
                  onClick={() => scrollToAct(act.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : isDone
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  <span>Act {act.id}</span>
                  <span className="hidden sm:inline opacity-70">· {act.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16 text-center">
        <Badge variant="outline" className="mb-4">One adaptive system · Three decisions</Badge>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
          How we make every textbook page
          <br />
          <span className="bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            adapt to every student
          </span>
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Three demos used to live separately. They actually answer one story:
          <strong className="text-foreground"> what </strong>students see,
          <strong className="text-foreground"> how </strong>we generate it, and
          <strong className="text-foreground"> where </strong>it lives in the reader.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          <Button onClick={() => scrollToAct(1)} size="lg" className="gap-2">
            Begin the tour <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* ACT 1 — WHAT */}
      <section ref={actRefs[1]} className="max-w-6xl mx-auto px-4 sm:px-6 py-16 scroll-mt-32">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">1</div>
          <Badge variant="outline" className="text-[10px]">ACT ONE</Badge>
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold mb-2">What students actually see</h3>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          Same concept, three depths. The student picks once — every block adapts.
        </p>

        {/* Mode picker */}
        <div className="inline-flex p-1 rounded-full bg-muted border border-border mb-6">
          {(["explorer", "builder", "master"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                mode === m ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {modeStyles[m].label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className={`p-6 sm:p-8 rounded-2xl bg-gradient-to-br ${modeStyles[mode].bg} border-2 ${modeStyles[mode].ring} ring-2 ring-offset-2 ring-offset-background`}
          >
            <Badge className={`${modeStyles[mode].chip} mb-3 border`}>
              {modeStyles[mode].label} mode
            </Badge>
            <h4 className="text-xl sm:text-2xl font-bold mb-3">{definitionVariants[mode].title}</h4>
            <p className="text-base sm:text-lg leading-relaxed text-foreground/90 mb-4">
              {definitionVariants[mode].body}
            </p>
            <p className="text-xs text-muted-foreground italic">{definitionVariants[mode].tag}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-muted-foreground">
            Want the full reader walkthrough?
          </p>
          <Link to="/demo/explorer-mode">
            <Button variant="ghost" size="sm" className="gap-2">
              Open deep-dive demo <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ACT 2 — HOW */}
      <section ref={actRefs[2]} className="bg-muted/30 py-16 scroll-mt-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">2</div>
            <Badge variant="outline" className="text-[10px]">ACT TWO</Badge>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold mb-2">How that Explorer card gets generated</h3>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Three sources. We layer them so the student always sees something instantly, but the quality keeps improving in the background.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {sources.map((s, i) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-5 rounded-xl bg-card border border-border hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted-foreground">SOURCE {i + 1}</span>
                  <Badge variant="outline" className="text-[10px]">{s.chip}</Badge>
                </div>
                <h4 className="font-bold text-lg mb-3">{s.name}</h4>
                <div className="space-y-1.5 mb-3">
                  {s.pros.map((p) => (
                    <div key={p} className="flex items-start gap-2 text-sm">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{p}</span>
                    </div>
                  ))}
                  {s.cons.map((c) => (
                    <div key={c} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-3.5 h-3.5 text-center shrink-0">·</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
                <div className="text-xs p-2 rounded bg-muted/60 text-foreground/80">
                  <strong>When:</strong> {s.when}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Layered strategy */}
          <div className="mt-8 p-5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 border border-border">
            <p className="text-sm font-semibold mb-2">⚡ Elite strategy — layer all three:</p>
            <p className="text-sm text-muted-foreground">
              <span className="font-mono bg-background/60 px-2 py-0.5 rounded">Pre-gen cache</span> → falls through to{" "}
              <span className="font-mono bg-background/60 px-2 py-0.5 rounded">AI on-demand</span> → falls through to{" "}
              <span className="font-mono bg-background/60 px-2 py-0.5 rounded">Client simplifier</span>. Student never waits, quality always improves.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-end">
            <Link to="/demo/fallback-strategies">
              <Button variant="ghost" size="sm" className="gap-2">
                Open deep-dive demo <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ACT 3 — WHERE */}
      <section ref={actRefs[3]} className="max-w-6xl mx-auto px-4 sm:px-6 py-16 scroll-mt-32">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">3</div>
          <Badge variant="outline" className="text-[10px]">ACT THREE</Badge>
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold mb-2">Where the toggle actually lives</h3>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          Same content, three integration patterns. Elite teams pick the one that respects student attention.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          {integrations.map((it) => (
            <div
              key={it.where}
              className={`p-5 rounded-xl border transition ${
                it.elite
                  ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-400/40"
                  : "bg-card border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold">{it.where}</h4>
                {it.elite && <Badge className="bg-emerald-500 text-white text-[10px]">RECOMMENDED</Badge>}
              </div>
              <pre className="text-[11px] font-mono p-3 rounded bg-muted/60 text-foreground/80 mb-3 whitespace-pre-wrap">
                {it.diagram}
              </pre>
              <div className="text-sm">
                <p className="text-emerald-700 dark:text-emerald-400 mb-1">+ {it.pros}</p>
                <p className="text-muted-foreground">− {it.cons}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-end">
          <Link to="/demo/elite-integration">
            <Button variant="ghost" size="sm" className="gap-2">
              Open deep-dive demo <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FINAL — Recommended stack */}
      <section className="bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10 py-16 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Badge className="mb-4 bg-foreground text-background">THE ELITE STACK</Badge>
          <h3 className="text-2xl sm:text-3xl font-bold mb-3">All three decisions, one recommended answer</h3>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            This is the combination Apple/Linear/Stripe-style teams would ship. Calm by default, deep on demand.
          </p>

          <div className="space-y-3 text-left">
            {eliteStack.map((s, i) => (
              <div key={s.layer} className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border">
                <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-sm shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">{s.layer}</p>
                  <p className="font-semibold">{s.choice}</p>
                </div>
                <Link to={s.route} className="shrink-0">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    Deep-dive <ExternalLink className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/student/textbook">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                See it live in the textbook <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" onClick={() => scrollToAct(1)} className="w-full sm:w-auto">
              Restart tour
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
