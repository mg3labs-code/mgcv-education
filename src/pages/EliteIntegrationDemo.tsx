import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Brain, Lightbulb, Zap, Target, Layers, Code2 } from "lucide-react";

/* ──────────────────────────────────────────────────────────────
   Elite Design Reference: Adaptive Difficulty Integration
   Shows: WHERE the toggle lives × WHICH layers adapt × HOW it's coded
   Inspired by: Apple HIG, Linear, Notion, Khan Academy, Duolingo
   ────────────────────────────────────────────────────────────── */

type Mode = "explorer" | "builder" | "master";

const MODES: { id: Mode; label: string; emoji: string; color: string; tagline: string }[] = [
  { id: "explorer", label: "Explorer", emoji: "🌱", color: "from-emerald-400 to-teal-500", tagline: "Quick & visual" },
  { id: "builder", label: "Builder", emoji: "🔨", color: "from-blue-400 to-indigo-500", tagline: "Story & analogy" },
  { id: "master", label: "Master", emoji: "🎓", color: "from-purple-500 to-pink-500", tagline: "Full depth" },
];

const CONCEPT = {
  title: "Reflection of Light",
  layers: [
    {
      id: "definition", name: "Definition", icon: "📖",
      explorer: { body: "Light bounces off mirrors. ✨", supports: true },
      builder: { body: "Imagine throwing a ball at a wall — it bounces back. Light does the exact same thing when it hits a smooth surface like a mirror.", supports: true },
      master: { body: "Reflection is the change in direction of a light wave at an interface between two different media so that the wave returns into the medium from which it originated. Governed by Fermat's principle of least time.", supports: true },
    },
    {
      id: "mechanism", name: "Mechanism", icon: "⚙️",
      explorer: { body: "Hits flat surface → comes back at same angle. 🔁", supports: true },
      builder: { body: "Picture a pool table. The cue ball hits the cushion at 30°, it bounces off at 30° on the other side. Light follows this exact rule.", supports: true },
      master: { body: "Angle of incidence equals angle of reflection (θᵢ = θᵣ), measured from the normal. Both rays and the normal lie in the same plane (Law 1 & 2 of reflection).", supports: true },
    },
    {
      id: "reasoning", name: "Reasoning (Why?)", icon: "🧠",
      explorer: { body: "🔒 Locked — needs deeper thinking. Switch to Builder or Master to unlock.", supports: false },
      builder: { body: "Why same angle? Because light always takes the fastest path. Bouncing at equal angles = shortest distance = fastest. Nature is lazy in a beautiful way.", supports: true },
      master: { body: "Derives from Fermat's principle: light minimizes optical path length. Using calculus of variations, ∂L/∂x = 0 yields θᵢ = θᵣ. This is also the classical limit of Feynman's path integral formulation.", supports: true },
    },
    {
      id: "assumptions", name: "Hidden Assumptions", icon: "🔍",
      explorer: { body: "🔒 Locked — Master-level reasoning.", supports: false },
      builder: { body: "🔒 Locked — Master-level reasoning.", supports: false },
      master: { body: "We assume: (1) surface is perfectly smooth at wavelength scale, (2) medium is isotropic, (3) light is treated as ray (geometric optics limit), (4) no absorption. Break any → diffuse reflection or absorption.", supports: true },
    },
    {
      id: "connections", name: "Cross-Domain Links", icon: "🔗",
      explorer: { body: "Mirror → selfie → bathroom 📸", supports: true },
      builder: { body: "Same physics in: car side mirrors, periscopes, telescopes, satellite dishes, even your eye's retina.", supports: true },
      master: { body: "Connects to: Snell's law (refraction), Maxwell's equations (EM waves), quantum electrodynamics (photon scattering), Helmholtz acoustic reflection, gravitational lensing analogues.", supports: true },
    },
    {
      id: "application", name: "Real-World Use", icon: "🌍",
      explorer: { body: "Mirrors, periscopes, solar cookers ☀️", supports: true },
      builder: { body: "Solar cooker farmers in Telangana use curved mirrors to focus sunlight and cook food without gas. Same principle as the mirror in your bathroom.", supports: true },
      master: { body: "Engineering: parabolic concentrators (CSP plants), Cassegrain telescopes, fiber optic total internal reflection, LIDAR ranging, MEMS micromirrors in DLP projectors.", supports: true },
    },
    {
      id: "implications", name: "What If?", icon: "💭",
      explorer: { body: "🔒 Locked — Master-level inquiry.", supports: false },
      builder: { body: "What if mirrors didn't reflect perfectly? No telescopes → no astronomy → we'd never have known Earth orbits the Sun.", supports: true },
      master: { body: "Implications span: cosmology (CMB anisotropy mapping), quantum measurement (mirror entanglement experiments), philosophy of perception, surveillance ethics (one-way mirrors).", supports: true },
    },
  ],
};

/* ── Approach 1: GLOBAL PILL (Khan / Duolingo) ── */
const ApproachGlobal = () => {
  const [mode, setMode] = useState<Mode>("builder");
  const visible = CONCEPT.layers.filter((l) => l[mode].supports);
  return (
    <div className="space-y-4">
      <EliteCallout principle="Single Source of Truth" source="Khan Academy, Duolingo"
        rule="One mode for the whole episode. Zero decision fatigue. Switching is rare and intentional." />
      <div className="sticky top-2 z-10 mx-auto w-fit rounded-full border border-border bg-background/95 backdrop-blur-md shadow-lg p-1 flex gap-1">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              mode === m.id ? `bg-gradient-to-r ${m.color} text-white shadow` : "text-muted-foreground hover:text-foreground"
            }`}>
            {m.emoji} {m.label}
          </button>
        ))}
      </div>
      <div className="text-xs text-center text-muted-foreground">
        Showing <strong>{visible.length}</strong> of 7 layers · auto-hides what doesn't fit this mode
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
          {visible.map((l) => <LayerCard key={l.id} layer={l} mode={mode} />)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ── Approach 2: PER-SECTION OVERRIDE (Notion / Linear) ── */
const ApproachPerSection = () => {
  const [globalMode, setGlobalMode] = useState<Mode>("builder");
  const [overrides, setOverrides] = useState<Record<string, Mode>>({});
  const getMode = (id: string): Mode => overrides[id] ?? globalMode;
  return (
    <div className="space-y-4">
      <EliteCallout principle="Progressive Disclosure" source="Apple HIG, Linear, Notion"
        rule="Set a default. Power users can override per-section. Most never will — and that's the point." />
      <div className="sticky top-2 z-10 mx-auto w-fit rounded-full border border-border bg-background/95 backdrop-blur-md shadow-lg p-1 flex gap-1">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => { setGlobalMode(m.id); setOverrides({}); }}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              globalMode === m.id ? `bg-gradient-to-r ${m.color} text-white shadow` : "text-muted-foreground"
            }`}>
            {m.emoji} {m.label}
          </button>
        ))}
      </div>
      <div className="text-xs text-center text-muted-foreground">
        Default: <strong>{globalMode}</strong> · Overrides: <strong>{Object.keys(overrides).length}</strong>
      </div>
      <div className="space-y-3">
        {CONCEPT.layers.map((l) => {
          const m = getMode(l.id);
          if (!l[m].supports) return null;
          return (
            <div key={l.id} className="space-y-1">
              <LayerCard layer={l} mode={m} overridden={!!overrides[l.id]} />
              <div className="flex justify-end gap-1 px-2">
                {MODES.filter((mm) => mm.id !== m && l[mm.id].supports).map((mm) => (
                  <button key={mm.id} onClick={() => setOverrides({ ...overrides, [l.id]: mm.id })}
                    className="text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
                    Switch this section to {mm.emoji} {mm.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Approach 3: SMART AUTO-HIDE (Medium / Snap) ── */
const ApproachSmartAuto = () => {
  const [mode, setMode] = useState<Mode>("explorer");
  const visible = CONCEPT.layers.filter((l) => l[mode].supports);
  const hidden = CONCEPT.layers.filter((l) => !l[mode].supports);
  return (
    <div className="space-y-4">
      <EliteCallout principle="Calm Technology" source="Mark Weiser (Xerox PARC), Medium"
        rule="Show only what's appropriate for the user's current capacity. Locked content becomes a curiosity hook, not a barrier." />
      <div className="sticky top-2 z-10 mx-auto w-fit rounded-full border border-border bg-background/95 backdrop-blur-md shadow-lg p-1 flex gap-1">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              mode === m.id ? `bg-gradient-to-r ${m.color} text-white shadow` : "text-muted-foreground"
            }`}>
            {m.emoji} {m.label}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {visible.map((l) => <LayerCard key={l.id} layer={l} mode={mode} />)}
        {hidden.length > 0 && (
          <Card className="p-4 bg-gradient-to-r from-muted/30 to-muted/10 border-dashed">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <p className="text-xs font-semibold">{hidden.length} deeper layers waiting for you</p>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {hidden.map((l) => <Badge key={l.id} variant="outline" className="text-[10px]">{l.icon} {l.name}</Badge>)}
            </div>
            <Button size="sm" variant="outline" onClick={() => setMode(mode === "explorer" ? "builder" : "master")}>
              <Zap className="h-3 w-3 mr-1.5" /> Level up to unlock
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

const LayerCard = ({ layer, mode, overridden }: { layer: any; mode: Mode; overridden?: boolean }) => {
  const meta = MODES.find((m) => m.id === mode)!;
  return (
    <Card className="p-4 border-l-4 border-l-primary">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{layer.icon}</span>
        <p className="text-sm font-bold">{layer.name}</p>
        <Badge className={`ml-auto text-[10px] bg-gradient-to-r ${meta.color} text-white border-0`}>
          {meta.emoji} {meta.label}
        </Badge>
        {overridden && <Badge variant="outline" className="text-[10px]">overridden</Badge>}
      </div>
      <p className={`leading-relaxed ${mode === "explorer" ? "text-base" : "text-sm"} text-foreground/90`}>{layer[mode].body}</p>
    </Card>
  );
};

const EliteCallout = ({ principle, source, rule }: { principle: string; source: string; rule: string }) => (
  <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-3">
    <div className="flex items-center gap-2 mb-1">
      <Sparkles className="h-3.5 w-3.5 text-amber-600" />
      <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Elite Principle: {principle}</p>
      <span className="ml-auto text-[10px] text-muted-foreground">via {source}</span>
    </div>
    <p className="text-xs text-foreground/80 leading-relaxed">{rule}</p>
  </div>
);

const LAYER_STRATEGIES = [
  { id: "all", name: "All 7 layers adapt", why: "Maximum flexibility. Highest AI generation cost.",
    eliteVerdict: "❌ Overkill. Even Apple doesn't translate everything.",
    map: { Definition: "✅✅✅", Mechanism: "✅✅✅", Reasoning: "✅✅✅", Assumptions: "✅✅✅", Connections: "✅✅✅", Application: "✅✅✅", Implications: "✅✅✅" } },
  { id: "foundational", name: "Only Definition + Mechanism", why: "The 'what' and 'how' get simplified. Deep thinking layers stay Master-only.",
    eliteVerdict: "⭐ Pure but limiting. Explorers can't reach Application.",
    map: { Definition: "✅✅✅", Mechanism: "✅✅✅", Reasoning: "—— ✅", Assumptions: "—— ✅", Connections: "—— ✅", Application: "—— ✅", Implications: "—— ✅" } },
  { id: "smart", name: "Smart: Foundational + Application + Connections", why: "Adapts the layers a beginner CAN handle. Hides 'thinking' layers in Explorer.",
    eliteVerdict: "✅ Elite choice. Mirrors how textbooks evolve from primary to PhD.",
    map: { Definition: "✅✅✅", Mechanism: "✅✅✅", Reasoning: "—— ✅✅", Assumptions: "———— ✅", Connections: "✅✅✅", Application: "✅✅✅", Implications: "—— ✅✅" } },
];

const CODE_PATTERNS = [
  { name: "Context Provider", icon: Layers,
    pros: ["Scales to 100+ blocks", "No prop drilling", "Easy to A/B test"],
    cons: ["Slightly more setup"],
    eliteVerdict: "✅ Elite — what Linear & Notion use",
    snippet: `<DifficultyProvider value={mode}>
  <EpisodeBlocks blocks={blocks} />
</DifficultyProvider>

// Inside any block:
const { mode } = useDifficulty();
return mode === "explorer" ? <Simple/> : <Full/>;` },
  { name: "Adaptive Router", icon: Code2,
    pros: ["Centralized logic", "Easy to swap renderers"],
    cons: ["Block-specific styling lives outside the block"],
    eliteVerdict: "⭐ Good for prototypes",
    snippet: `<AdaptiveBlock block={b} mode={mode} />

function AdaptiveBlock({ block, mode }) {
  if (mode === "explorer") return <ExplorerCard {...block}/>;
  if (mode === "builder")  return <BuilderCard  {...block}/>;
  return <MasterBlock {...block}/>;
}` },
  { name: "Prop Drilling", icon: Target,
    pros: ["Zero new abstractions"],
    cons: ["Pass mode through every wrapper", "Hard to scale"],
    eliteVerdict: "❌ Avoid for production",
    snippet: `<EpisodeBlocks blocks={blocks} mode={mode} />
<DefinitionBlock {...} mode={mode} />
<ReasoningBlock  {...} mode={mode} />
// ...repeat for every block type` },
];

export default function EliteIntegrationDemo() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/demo/explorer-mode">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold">Elite Integration Reference</h1>
            <p className="text-xs text-muted-foreground">How top product designers adapt content depth in real textbooks</p>
          </div>
          <Badge className="ml-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
            <Sparkles className="h-3 w-3 mr-1" /> Reference Demo
          </Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        <Card className="p-5 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <div className="flex items-start gap-3">
            <Brain className="h-6 w-6 text-primary shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold mb-1">Three decisions, three live demos</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Test concept: <strong className="text-foreground">"{CONCEPT.title}"</strong> across all 7 layers.
                Each section below answers ONE question elite designers ask before integration.
                Click through each tab — you'll feel exactly which combo we should ship.
              </p>
            </div>
          </div>
        </Card>

        <section>
          <SectionHeader number={1} title="WHERE does the toggle live?"
            subtitle="Toggle placement determines cognitive load. Three live demos:" />
          <Tabs defaultValue="global" className="mt-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="global">A · Global pill</TabsTrigger>
              <TabsTrigger value="section">B · Per-section override</TabsTrigger>
              <TabsTrigger value="auto">C · Smart auto-hide</TabsTrigger>
            </TabsList>
            <TabsContent value="global" className="mt-4"><ApproachGlobal /></TabsContent>
            <TabsContent value="section" className="mt-4"><ApproachPerSection /></TabsContent>
            <TabsContent value="auto" className="mt-4"><ApproachSmartAuto /></TabsContent>
          </Tabs>
        </section>

        <section>
          <SectionHeader number={2} title="WHICH layers should support all 3 modes?"
            subtitle="Not every layer benefits from simplification. Compare three coverage strategies:" />
          <div className="grid md:grid-cols-3 gap-3 mt-4">
            {LAYER_STRATEGIES.map((s) => (
              <Card key={s.id} className="p-4 space-y-3">
                <div>
                  <p className="font-bold text-sm">{s.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.why}</p>
                </div>
                <div className="space-y-1 border-t pt-2">
                  <div className="grid grid-cols-2 text-[10px] font-mono">
                    <span className="text-muted-foreground">Layer</span>
                    <span className="text-muted-foreground text-right">🌱🔨🎓</span>
                  </div>
                  {Object.entries(s.map).map(([layer, support]) => (
                    <div key={layer} className="grid grid-cols-2 text-[11px]">
                      <span>{layer}</span>
                      <span className="text-right font-mono">{support}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs font-semibold pt-2 border-t">{s.eliteVerdict}</p>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader number={3} title="HOW should it integrate in code?"
            subtitle="Three architecture patterns. Same UX, very different maintainability:" />
          <div className="grid md:grid-cols-3 gap-3 mt-4">
            {CODE_PATTERNS.map((p) => {
              const Icon = p.icon;
              return (
                <Card key={p.name} className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <p className="font-bold text-sm">{p.name}</p>
                  </div>
                  <pre className="text-[10px] bg-muted/50 rounded p-2 overflow-x-auto leading-relaxed">
                    <code>{p.snippet}</code>
                  </pre>
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-600 mb-0.5">PROS</p>
                    <ul className="text-[11px] space-y-0.5">{p.pros.map((x) => <li key={x}>+ {x}</li>)}</ul>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-rose-600 mb-0.5">CONS</p>
                    <ul className="text-[11px] space-y-0.5">{p.cons.map((x) => <li key={x}>− {x}</li>)}</ul>
                  </div>
                  <p className="text-xs font-semibold pt-2 border-t">{p.eliteVerdict}</p>
                </Card>
              );
            })}
          </div>
        </section>

        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800">
          <div className="flex items-start gap-3">
            <Sparkles className="h-6 w-6 text-emerald-600 shrink-0 mt-1" />
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-emerald-700 dark:text-emerald-400">The Elite Recommendation</h2>
              <ul className="space-y-1.5 text-sm">
                <li><strong>Toggle (Q1):</strong> Approach C · Smart auto-hide. Locked layers become curiosity hooks, not friction.</li>
                <li><strong>Coverage (Q2):</strong> Strategy 3 · Foundational + Application + Connections. Mirrors how textbooks evolve K→PhD.</li>
                <li><strong>Code (Q3):</strong> Pattern A · Context Provider. Scales to every block type without prop drilling.</li>
              </ul>
              <p className="text-xs text-muted-foreground pt-2 border-t border-emerald-200 dark:border-emerald-800 mt-3">
                In the real reader: a sticky pill at the top of every TextbookEpisode page.
                Definition + Mechanism + Application + Connections render in the chosen mode.
                Reasoning, Assumptions, Implications stay Master-only with a "🔓 Level up to unlock" hint.
                Mode persists to <code className="text-[10px] bg-muted px-1 rounded">student_preferences.difficulty_level</code>.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

const SectionHeader = ({ number, title, subtitle }: { number: number; title: string; subtitle: string }) => (
  <div className="flex items-start gap-3">
    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
      {number}
    </div>
    <div>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  </div>
);
