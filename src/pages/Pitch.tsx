import { useEffect, useState, ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight, Brain, Eye, Target, Heart, Zap, Sparkles, BookOpen,
  Users, School, GraduationCap, LineChart, MessageSquare, Lightbulb,
  CheckCircle2, AlertTriangle, TrendingUp, Layers, Compass, Rocket,
} from "lucide-react";
import ProblemFeatureGrid, { type PFECard } from "@/components/pitch/ProblemFeatureGrid";

// HD screen captures from the Demo Problem→Solution→Screen reference doc.
import interestPicker     from "@/assets/pitch/interest-picker.png.asset.json";
import day1SparkCricket   from "@/assets/pitch/day1-spark-cricket.png.asset.json";
import hookShortCard      from "@/assets/pitch/hook-short-card.png.asset.json";
import hook60s            from "@/assets/pitch/hook-60s.png.asset.json";
import ahaReveal          from "@/assets/pitch/aha-reveal.png.asset.json";
import sort90s            from "@/assets/pitch/sort-90s.png.asset.json";
import spotTheTrap        from "@/assets/pitch/spot-the-trap.png.asset.json";
import day1Done           from "@/assets/pitch/day1-done.png.asset.json";
import layer2Mechanism    from "@/assets/pitch/layer2-mechanism.png.asset.json";
import teachItBack        from "@/assets/pitch/teach-it-back.png.asset.json";
import conceptBridge      from "@/assets/pitch/concept-bridge.png.asset.json";


/* ------------------------------------------------------------------ */
/*  Design tokens (scoped to this deck, not leaked to the app)        */
/* ------------------------------------------------------------------ */
const ink = "#0F172A";
const cream = "#FAF6EE";
const paper = "#FFFBF2";
const teal = "#0E9F7E";
const tealDark = "#0B7C63";
const gold = "#D4A24C";
const rose = "#C24A6A";
const indigo = "#3D4FB8";
const line = "rgba(15,23,42,0.10)";

/* ------------------------------------------------------------------ */
/*  Slide frame                                                       */
/* ------------------------------------------------------------------ */
function Slide({
  id, kicker, title, children, bg = cream, dark = false,
}: {
  id: string; kicker?: string; title?: string; children: ReactNode;
  bg?: string; dark?: boolean;
}) {
  return (
    <section
      id={id}
      className="snap-start min-h-screen w-full flex items-center justify-center px-6 sm:px-10 lg:px-16 py-16 relative"
      style={{ background: bg, color: dark ? cream : ink, scrollMarginTop: 0 }}
    >
      <div className="w-full max-w-[1280px] mx-auto">
        {kicker && (
          <div className="mb-4 inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase font-semibold"
               style={{ color: dark ? "rgba(250,246,238,.7)" : tealDark }}>
            <span className="w-6 h-px" style={{ background: dark ? "rgba(250,246,238,.5)" : tealDark }} />
            {kicker}
          </div>
        )}
        {title && (
          <h2 className="font-serif font-semibold leading-[1.05] tracking-tight text-[34px] sm:text-[44px] lg:text-[56px] mb-8 max-w-[22ch]">
            {title}
          </h2>
        )}
        {children}
      </div>
      <div className="absolute bottom-4 right-6 text-[10px] tracking-widest opacity-40 font-mono">
        MGCV · {id}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Explore-live CTA                                                   */
/* ------------------------------------------------------------------ */
function ExploreLive({ to, label, hint }: { to: string; label: string; hint?: string }) {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-4">
      <a
        href={to} target="_blank" rel="noreferrer"
        className="group inline-flex items-center gap-3 px-5 py-3 rounded-full font-semibold text-[14px] shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
        style={{ background: ink, color: cream }}
      >
        {label}
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </a>
      {hint && <span className="text-[12px] opacity-60">{hint}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable bits                                                      */
/* ------------------------------------------------------------------ */
function Card({ children, accent, className = "" }: { children: ReactNode; accent?: string; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-6 ${className}`}
      style={{
        background: paper,
        border: `1px solid ${line}`,
        borderTop: accent ? `3px solid ${accent}` : `1px solid ${line}`,
      }}
    >
      {children}
    </div>
  );
}

function Pill({ children, color = teal }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide"
      style={{ background: `${color}18`, color }}
    >
      {children}
    </span>
  );
}

/* ================================================================== */
/*  SLIDE 01 — COVER                                                   */
/* ================================================================== */
function S01_Cover() {
  return (
    <Slide id="01-cover" bg={ink} dark>
      <div className="grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
               style={{ background: "rgba(212,162,76,.15)", border: `1px solid ${gold}55` }}>
            <Sparkles className="w-3.5 h-3.5" style={{ color: gold }} />
            <span className="text-[11px] tracking-[0.18em] uppercase font-semibold" style={{ color: gold }}>
              For School Leadership · Confidential
            </span>
          </div>
          <h1 className="font-serif text-[52px] sm:text-[72px] lg:text-[88px] leading-[0.98] tracking-tight mb-6">
            We make students <em style={{ color: teal, fontStyle: "italic" }}>curious</em><br />
            before we make them study.
          </h1>
          <p className="text-[18px] sm:text-[20px] leading-[1.6] max-w-[58ch]" style={{ color: "rgba(250,246,238,.78)" }}>
            MGCV is an AI-powered Student Growth Platform that turns textbook concepts into
            5-minute curiosity journeys — while giving your school live intelligence on how
            students actually <em>think</em>, struggle, and grow.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Pill color={teal}>NEP 2020 aligned</Pill>
            <Pill color={gold}>Class 6 → 10</Pill>
            <Pill color={rose}>CBSE · State Board · JEE bridge</Pill>
            <Pill color={indigo}>White-label ready</Pill>
          </div>
        </div>
        <div className="lg:col-span-5 hidden lg:block">
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden"
               style={{ background: "linear-gradient(135deg,#0B7C63 0%,#0F172A 60%,#3D4FB8 100%)", border: `1px solid ${gold}33` }}>
            <div className="absolute inset-0 grid place-items-center">
              <BrainMark />
            </div>
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-[11px] tracking-widest uppercase" style={{ color: "rgba(250,246,238,.6)" }}>
              <span>Inner OS</span>
              <span>v1.0 · 2026</span>
            </div>
          </div>
        </div>
      </div>
    </Slide>
  );
}

function BrainMark() {
  return (
    <svg viewBox="0 0 200 200" className="w-3/4 h-3/4">
      <defs>
        <radialGradient id="g1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D4A24C" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#D4A24C" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="80" fill="url(#g1)" />
      {[0, 1, 2, 3, 4, 5, 6].map(i => {
        const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
        const x = 100 + Math.cos(a) * 60;
        const y = 100 + Math.sin(a) * 60;
        return (
          <g key={i}>
            <line x1="100" y1="100" x2={x} y2={y} stroke="#FAF6EE" strokeOpacity="0.25" strokeWidth="1" />
            <circle cx={x} cy={y} r="6" fill="#FAF6EE" />
            <text x={x} y={y + 3} fontSize="7" textAnchor="middle" fill={ink} fontWeight="700">{i + 1}</text>
          </g>
        );
      })}
      <circle cx="100" cy="100" r="14" fill={cream} />
      <text x="100" y="104" textAnchor="middle" fontSize="11" fill={ink} fontWeight="800">7L</text>
    </svg>
  );
}

/* ================================================================== */
/*  SLIDE 01B — TWO PARALLEL TRACKS (platform shape at a glance)       */
/* ================================================================== */
function S01B_TwoTracks() {
  const t1 = [
    { i: Lightbulb,     t: "interest-based hooks" },
    { i: Zap,           t: "5-minute daily arc" },
    { i: MessageSquare, t: "never-say-no feedback" },
    { i: Compass,       t: "yesterday-you-thought memory" },
    { i: Heart,         t: "voice or text expression" },
  ];
  const t2 = [
    { i: Users,         t: "teacher productivity" },
    { i: Eye,           t: "misconception visibility" },
    { i: MessageSquare, t: "parent communication" },
    { i: School,        t: "school branding" },
    { i: LineChart,     t: "analytics dashboards" },
  ];
  return (
    <Slide id="01b-two-tracks" kicker="Platform at a glance" bg={cream}
           title="Student curiosity on the front end. School intelligence on the back end.">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-3xl p-7" style={{ background: `${teal}0E`, border: `1px solid ${teal}33` }}>
          <span className="text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: tealDark }}>Track 1</span>
          <h3 className="font-serif text-[26px] mb-5 mt-1">Student Curiosity Engine</h3>
          <ul className="space-y-2.5">
            {t1.map(({ i: Icon, t }) => (
              <li key={t} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "white", border: `1px solid ${line}` }}>
                <span className="w-8 h-8 rounded-full grid place-items-center" style={{ background: `${teal}1A` }}>
                  <Icon className="w-4 h-4" style={{ color: tealDark }} />
                </span>
                <span className="text-[14px] font-medium">{t}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 text-[12px] opacity-70">Makes students open, think, speak, and return.</div>
        </div>
        <div className="rounded-3xl p-7" style={{ background: `${indigo}0E`, border: `1px solid ${indigo}33` }}>
          <span className="text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: indigo }}>Track 2</span>
          <h3 className="font-serif text-[26px] mb-5 mt-1">School Intelligence Platform</h3>
          <ul className="space-y-2.5">
            {t2.map(({ i: Icon, t }) => (
              <li key={t} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "white", border: `1px solid ${line}` }}>
                <span className="w-8 h-8 rounded-full grid place-items-center" style={{ background: `${indigo}1A` }}>
                  <Icon className="w-4 h-4" style={{ color: indigo }} />
                </span>
                <span className="text-[14px] font-medium">{t}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 text-[12px] opacity-70">Helps schools, teachers, and parents see, decide, and act.</div>
        </div>
      </div>

      <div className="mt-10 rounded-3xl p-7" style={{ background: "white", border: `1px solid ${line}` }}>
        <div className="text-[11px] tracking-[0.22em] uppercase font-bold mb-4" style={{ color: tealDark }}>
          Built in 3 product layers
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { c: teal,   n: "Layer 1", t: "Student Engagement Core", icon: Layers,
              items: ["Day 1 Spark", "Day 2 Build", "Day 3 Master", "7 invisible layers", "silent adaptation"] },
            { c: gold,   n: "Layer 2", t: "Teacher Intelligence", icon: Brain,
              items: ["concept dashboard", "misconception detection", "lesson plans", "worksheets", "real-world examples"] },
            { c: indigo, n: "Layer 3", t: "School Operating System", icon: School,
              items: ["branded app", "management insights", "communication", "parent reporting", "enterprise customisation"] },
          ].map(L => (
            <div key={L.n} className="rounded-2xl p-5" style={{ background: `${L.c}08`, border: `1px solid ${L.c}33` }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-full grid place-items-center" style={{ background: L.c, color: "white" }}>
                  <L.icon className="w-3.5 h-3.5" />
                </span>
                <div>
                  <div className="text-[10px] tracking-[0.18em] uppercase font-bold" style={{ color: L.c }}>{L.n}</div>
                  <div className="text-[14px] font-semibold">{L.t}</div>
                </div>
              </div>
              <ul className="mt-3 grid gap-1.5">
                {L.items.map(it => (
                  <li key={it} className="flex items-center gap-2 text-[12px]">
                    <CheckCircle2 className="w-3 h-3" style={{ color: L.c }} />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl p-5 flex items-center gap-4" style={{ background: ink, color: cream }}>
        <Target className="w-5 h-5" style={{ color: gold }} />
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: gold }}>Pitch in one line</div>
          <div className="text-[15px] font-semibold">Not another content app. A student growth platform for students, teachers, and schools.</div>
        </div>
      </div>
    </Slide>
  );
}

/* ================================================================== */
/*  SLIDE 02 — THE REAL PROBLEM                                        */
/* ================================================================== */
function S02_Problem() {
  const cols = [
    {
      who: "Student",
      icon: GraduationCap,
      tint: rose,
      quote: "“Why should I open this — it’s just another boring class.”",
      pains: [
        "Memorises without understanding",
        "Silent in class even when confused",
        "Sees maths/science as disconnected from life",
        "Forgets within weeks of exams",
      ],
    },
    {
      who: "Teacher",
      icon: Users,
      tint: teal,
      quote: "“I know who scored less. I don’t know how they’re thinking.”",
      pains: [
        "Mixed-level classroom, one explanation",
        "Can’t see who copied vs. who understood",
        "Repeats the same remedial 3× a year",
        "Lesson planning eats evenings",
      ],
    },
    {
      who: "School",
      icon: School,
      tint: indigo,
      quote: "“We need real innovation — not another video app.”",
      pains: [
        "Parents ask for evidence beyond marks",
        "No differentiation from neighbour schools",
        "Weak students discovered too late",
        "Management has zero live visibility",
      ],
    },
  ];
  return (
    <Slide id="02-problem" kicker="The real problem"
           title="India doesn’t have a content problem. It has an engagement, understanding & thinking problem.">
      <div className="grid md:grid-cols-3 gap-5">
        {cols.map(c => (
          <Card key={c.who} accent={c.tint}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: `${c.tint}18` }}>
                <c.icon className="w-5 h-5" style={{ color: c.tint }} />
              </div>
              <div className="text-[15px] font-semibold tracking-tight">{c.who}</div>
            </div>
            <p className="font-serif italic text-[18px] leading-[1.4] mb-5" style={{ color: c.tint }}>
              {c.quote}
            </p>
            <ul className="space-y-2.5">
              {c.pains.map(p => (
                <li key={p} className="flex gap-2 text-[14px] leading-snug">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.tint }} />
                  {p}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </Slide>
  );
}

/* ================================================================== */
/*  SLIDE 03 — WHY EDTECH FALLS SHORT                                  */
/* ================================================================== */
function S03_WhyFails() {
  const rows = [
    { has: "Recorded video lectures", missing: "No way to know if the student is curious or confused" },
    { has: "MCQ quizzes & worksheets", missing: "Tests recall — not reasoning, assumptions, or transfer" },
    { has: "AI doubt-solving chat", missing: "Answers questions; doesn’t teach how to ask better ones" },
    { has: "Marks & attendance dashboards", missing: "Measures output; blind to the thinking break" },
    { has: "Generic lesson plans", missing: "Same explanation for the bored, the confused, and the bright" },
  ];
  return (
    <Slide id="03-why-fails" kicker="Why existing tools stall"
           title="They digitise the textbook. They don’t change the thinking.">
      <div className="rounded-3xl overflow-hidden" style={{ border: `1px solid ${line}`, background: paper }}>
        <div className="grid grid-cols-12 px-6 py-4 text-[11px] tracking-[0.18em] uppercase font-semibold"
             style={{ background: "rgba(15,23,42,.04)", color: tealDark }}>
          <div className="col-span-5">What every edtech ships</div>
          <div className="col-span-7">What the school still doesn’t get</div>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-12 px-6 py-5 items-start"
               style={{ borderTop: `1px solid ${line}` }}>
            <div className="col-span-5 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: teal }} />
              <span className="text-[15px]">{r.has}</span>
            </div>
            <div className="col-span-7 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: rose }} />
              <span className="text-[15px]" style={{ color: "rgba(15,23,42,.78)" }}>{r.missing}</span>
            </div>
          </div>
        ))}
      </div>
    </Slide>
  );
}

/* ================================================================== */
/*  SLIDE 04 — OUR THESIS                                              */
/* ================================================================== */
function S04_Thesis() {
  const nep = [
    "Competency-based learning",
    "Critical thinking & inquiry",
    "Experiential learning",
    "Multilingual & inclusive",
    "Holistic 360° report card",
  ];
  return (
    <Slide id="04-thesis" kicker="Our thesis" bg={paper}>
      <div className="grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7">
          <h2 className="font-serif text-[44px] lg:text-[64px] leading-[1.02] tracking-tight">
            Curiosity <span style={{ color: teal }}>before</span> content.<br />
            Thinking <span style={{ color: teal }}>before</span> testing.
          </h2>
          <p className="mt-6 text-[18px] leading-[1.6] max-w-[55ch]" style={{ color: "rgba(15,23,42,.74)" }}>
            We don’t replace the textbook. We open it differently — through what the student already
            cares about — and we capture the seven invisible layers of understanding that decide whether
            a concept actually sticks.
          </p>
        </div>
        <div className="lg:col-span-5">
          <div className="rounded-3xl p-7" style={{ background: ink, color: cream }}>
            <div className="text-[11px] tracking-[0.22em] uppercase font-semibold mb-4" style={{ color: gold }}>
              Aligned to NEP 2020
            </div>
            <ul className="space-y-3">
              {nep.map(n => (
                <li key={n} className="flex items-center gap-3 text-[15px]">
                  <span className="w-7 h-7 rounded-full grid place-items-center text-[11px] font-bold"
                        style={{ background: `${gold}22`, color: gold }}>✓</span>
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Slide>
  );
}

/* ================================================================== */
/*  SLIDE 05 — THE 7-LAYER ENGINE  (★ IP slide)                        */
/* ================================================================== */
const LAYERS = [
  { n: 1, name: "Definition",   does: "Names the concept in own words",        signal: "Vocabulary precision",     hue: teal },
  { n: 2, name: "Mechanism",    does: "Traces how it actually works",          signal: "Process tracing",          hue: teal },
  { n: 3, name: "Reasoning",    does: "Explains why it works that way",        signal: "Causal chaining",          hue: indigo },
  { n: 4, name: "Assumptions",  does: "Spots what’s being taken for granted",  signal: "Critical detection",       hue: gold },
  { n: 5, name: "Connections",  does: "Links to other concepts & subjects",    signal: "Transfer thinking",        hue: gold },
  { n: 6, name: "Applications", does: "Uses it in a real-world scenario",      signal: "Applied reasoning",        hue: rose },
  { n: 7, name: "Implications", does: "Predicts second-order consequences",    signal: "Systems thinking",         hue: rose },
];

function S05_SevenLayer() {
  return (
    <Slide id="05-seven-layer" kicker="Our core IP"
           title="The 7-Layer Concept Engine — how a topic actually becomes understanding.">
      <p className="-mt-4 mb-8 text-[16px] max-w-[68ch]" style={{ color: "rgba(15,23,42,.7)" }}>
        Every chapter, every topic, every episode flows through the same seven layers. Skip one and
        “understanding” silently breaks. We make all seven visible — to the student, the teacher, and you.
      </p>

      <div className="rounded-3xl p-6 lg:p-8" style={{ background: paper, border: `1px solid ${line}` }}>
        <div className="grid grid-cols-12 gap-3 text-[10px] tracking-[0.18em] uppercase font-semibold mb-3"
             style={{ color: "rgba(15,23,42,.5)" }}>
          <div className="col-span-1">#</div>
          <div className="col-span-3">Layer</div>
          <div className="col-span-4">What the student does</div>
          <div className="col-span-4">Signal captured</div>
        </div>
        <div className="space-y-2">
          {LAYERS.map(l => (
            <div key={l.n}
                 className="grid grid-cols-12 gap-3 items-center px-4 py-3 rounded-xl"
                 style={{ background: "white", border: `1px solid ${line}`, borderLeft: `4px solid ${l.hue}` }}>
              <div className="col-span-1 font-mono text-[13px] font-bold" style={{ color: l.hue }}>0{l.n}</div>
              <div className="col-span-3 font-serif text-[18px] font-semibold">{l.name}</div>
              <div className="col-span-4 text-[14px]" style={{ color: "rgba(15,23,42,.78)" }}>{l.does}</div>
              <div className="col-span-4 flex items-center gap-2">
                <span className="text-[14px] font-medium" style={{ color: l.hue }}>{l.signal}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ExploreLive
        to="/student/textbook"
        label="Explore a live 7-layer episode"
        hint="Opens the working reader — pick any chapter → episode → 7-layer mode"
      />
    </Slide>
  );
}

/* ================================================================== */
/*  SLIDE 06 — STUDENT EXPERIENCE                                      */
/* ================================================================== */
/* ---- Phone frame used by the 3-Day Arc ------------------------------ */
function PhoneFrame({
  day, label, color, headline, visual, caption, hookCaption,
}: {
  day: 1 | 2 | 3; label: string; color: string;
  headline: string; visual: string; caption: string; hookCaption: string;
}) {
  return (
    <div className="relative mx-auto" style={{ maxWidth: 280 }}>
      {/* day chip floating above */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.18em] uppercase shadow-sm"
           style={{ background: color, color: "white" }}>
        Day {day} · {label}
      </div>
      {/* phone shell */}
      <div className="rounded-[34px] p-2 shadow-xl"
           style={{ background: ink, border: `1px solid ${ink}` }}>
        <div className="rounded-[28px] overflow-hidden" style={{ background: "white" }}>
          {/* status bar */}
          <div className="flex items-center justify-between px-4 py-1.5 text-[9px] font-semibold" style={{ background: "#F6F4EF", color: ink }}>
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full" style={{ background: ink }} />
              <span className="w-1 h-1 rounded-full" style={{ background: ink }} />
              <span className="w-1 h-1 rounded-full" style={{ background: ink }} />
            </span>
          </div>
          {/* topline */}
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full grid place-items-center" style={{ background: `${color}22` }}>
                <BookOpen className="w-3 h-3" style={{ color }} />
              </div>
              <span className="text-[10px] font-semibold">Real Numbers</span>
            </div>
            <span className="text-[9px] font-mono opacity-50">{day}/3</span>
          </div>
          {/* headline */}
          <div className="px-4 pb-2">
            <p className="font-serif text-[15px] leading-snug" style={{ color: ink }}>
              {headline}
            </p>
          </div>
          {/* hero visual */}
          <div className="relative mx-3 mb-3 rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3", background: "#EFEBE2" }}>
            <img src={visual} alt={hookCaption} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            <div className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-1 rounded-md text-[9px] font-semibold"
                 style={{ background: "rgba(15,23,42,.78)", color: cream, backdropFilter: "blur(4px)" }}>
              {hookCaption}
            </div>
          </div>
          {/* tap row */}
          <div className="px-3 pb-3 flex gap-1.5">
            {(day === 1 ? ["Yes", "No", "Depends"] : day === 2 ? ["Believe", "Doubt"] : ["Record", "Type"]).map(t => (
              <div key={t} className="flex-1 text-center py-1.5 rounded-lg text-[10px] font-semibold"
                   style={{ background: `${color}14`, color, border: `1px solid ${color}33` }}>
                {t}
              </div>
            ))}
          </div>
          {/* caption strip */}
          <div className="px-4 py-2 text-[9px] leading-snug border-t" style={{ borderColor: line, color: "rgba(15,23,42,.6)" }}>
            {caption}
          </div>
        </div>
      </div>
    </div>
  );
}

function S06_Student() {
  const days = [
    {
      day: 1 as const, label: "Spark", color: teal,
      headline: "Can a cricket team's run-rate go negative?",
      visual: day1SparkCricket.url,
      hookCaption: "Hook · cricket scene the child already knows",
      caption: "Tap a guess → first thought captured silently. No wrong answer.",
      time: "0:00 → 4:00",
    },
    {
      day: 2 as const, label: "Build", color: gold,
      headline: "Yesterday you thought negative = losing. Mathematicians disagree.",
      visual: ahaReveal.url,
      hookCaption: "Aha · concept emerges from the child's own guess",
      caption: "Believe-or-doubt + sort-the-rebels. Concept feels discovered.",
      time: "Day 2 · 6 min",
    },
    {
      day: 3 as const, label: "Master", color: indigo,
      headline: "Teach it back — explain it to a younger friend in 1 line.",
      visual: teachItBack.url,
      hookCaption: "Teach-back · proof of mastery, not memorisation",
      caption: "Voice or text. Concept bridges to football, rockets, daily life.",
      time: "Day 3 · 8 min",
    },
  ];

  return (
    <Slide id="06-student" kicker="What the student opens" bg={paper}
           title="A 3-day curiosity arc — Spark, Build, Master.">
      <p className="text-[15px] opacity-70 max-w-[68ch] -mt-4 mb-10">
        Same concept, three deliberate visits. Each day opens with an engagement hook the child
        actually recognises — cricket, an aha image, teach-a-friend — so the textbook never feels like a textbook.
      </p>

      <div className="grid lg:grid-cols-3 gap-10 mb-12">
        {days.map(d => (
          <div key={d.day} className="space-y-5">
            <PhoneFrame
              day={d.day} label={d.label} color={d.color}
              headline={d.headline} visual={d.visual}
              caption={d.caption} hookCaption={d.hookCaption}
            />
            <div className="text-center text-[10px] tracking-[0.2em] uppercase font-mono opacity-50">
              {d.time}
            </div>
          </div>
        ))}
      </div>

      {/* Rung trajectory */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: "white", border: `1px solid ${line}` }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] tracking-[0.2em] uppercase font-semibold" style={{ color: tealDark }}>
              The curiosity ladder
            </div>
            <div className="text-[14px] font-semibold mt-0.5">5 invisible rungs across the 3 days</div>
          </div>
          <Pill color={teal}>Visible to teachers · invisible to students</Pill>
        </div>
        <div className="relative">
          <div className="absolute left-5 right-5 top-5 h-[2px]" style={{ background: line }} />
          <div className="absolute left-5 top-5 h-[2px] rounded-full"
               style={{ width: "100%", background: `linear-gradient(90deg, ${teal}, ${gold}, ${indigo})` }} />
          <div className="grid grid-cols-5 gap-2 relative">
            {[
              { n: 1, label: "Connect", day: 1 },
              { n: 2, label: "Explain", day: 1 },
              { n: 3, label: "Trap",    day: 2 },
              { n: 4, label: "Apply",   day: 2 },
              { n: 5, label: "Deeper",  day: 3 },
            ].map((r, i) => (
              <div key={r.n} className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full grid place-items-center font-bold text-[13px] z-10 shadow-sm"
                     style={{ background: ink, color: cream, border: `2px solid ${i < 2 ? teal : i < 4 ? gold : indigo}` }}>
                  {r.n}
                </div>
                <div className="mt-2 text-[11px] font-semibold">{r.label}</div>
                <div className="text-[10px] opacity-50">Day {r.day}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Silent depth bands */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { l: "Foundational", w: "55%", t: "visual + hint chips + voice", c: teal },
          { l: "Guided",       w: "80%", t: "questions + scaffolded reasoning", c: gold },
          { l: "Challenge",    w: "100%", t: "proof, transfer, system thinking", c: indigo },
        ].map(b => (
          <div key={b.l} className="rounded-xl p-4" style={{ background: "white", border: `1px solid ${line}` }}>
            <div className="flex justify-between text-[12px] mb-2">
              <span className="font-semibold">{b.l}</span>
              <span className="opacity-60">{b.t}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(15,23,42,.08)" }}>
              <div className="h-full rounded-full" style={{ width: b.w, background: b.c }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] opacity-60">Same concept · 3 silent depths · no labels shown to students. Zero embarrassment.</p>

      <ExploreLive to="/student" label="Open the live student dashboard" hint="The phones above are real screens — try one." />
    </Slide>
  );
}

/* ================================================================== */
/*  SLIDE 06B — STUDENT · PROBLEM → FEATURE → SCREEN → EFFECTIVENESS    */
/* ================================================================== */
function S06B_StudentPFE() {
  const cards: PFECard[] = [
    {
      problem: "Generic content feels like everyone else's textbook — irrelevant.",
      feature: "Interest Engine — child picks what they love (cricket, food, gaming, music). Every concept gets a personal way in.",
      image: interestPicker.url,
      outcome: "Personal hook lifts engagement before content is shown.",
      evidence: "ASER 2024: 76% kids use phones for social media vs 57% for learning — we redirect that pull.",
      status: "live", exploreHref: "/student",
    },
    {
      problem: "Same lesson, same boring entry, for 60 different children.",
      feature: "One concept, 8 entry points. The textbook stays — the hook changes per child.",
      image: day1SparkCricket.url,
      outcome: "Same concept, 8 doors in — no labels, no shame.",
      evidence: "NEP 2020: recognise each learner's unique capabilities.",
      status: "live", exploreHref: "/student",
    },
    {
      problem: "The “wait — why?” moment never happens in class.",
      feature: "Short-style Hook Card — one familiar image, an 8-word question, tap to commit.",
      image: hookShortCard.url,
      outcome: "Curiosity before content. Student is already leaning in.",
      status: "live", exploreHref: "/student",
    },
    {
      problem: "Students disengage in 2 minutes, and are afraid of being wrong.",
      feature: "Day 1 Hook + first guess in own words (type or voice). No wrong answer.",
      image: hook60s.url,
      outcome: "First thought captured — the most valuable signal in class.",
      evidence: "NEP 2020: shift from rote testing to formative, expression-based learning.",
      status: "live", exploreHref: "/student",
    },
    {
      problem: "Explanations feel like a lecture the child didn't ask for.",
      feature: "Aha reveal — the concept emerges from the child's own guess, not a teacher talking at them.",
      image: ahaReveal.url,
      outcome: "Concept feels discovered, not delivered.",
      status: "live", exploreHref: "/student",
    },
    {
      problem: "Passive watching — no actual thinking happens.",
      feature: "90-second tap activity — sort real things above and below zero.",
      image: sort90s.url,
      outcome: "Thinking, not scrolling. Visible reasoning per child.",
      status: "live", exploreHref: "/student",
    },
    {
      problem: "Children accept whatever they're told, without questioning.",
      feature: "Spot-the-Trap / Believe-or-Doubt — child must challenge an assumption.",
      image: spotTheTrap.url,
      outcome: "Critical-thinking move built into the daily loop.",
      evidence: "NEP 2020: critical thinking & inquiry as core competency.",
      status: "live", exploreHref: "/student",
    },
    {
      problem: "They finish today and never come back tomorrow.",
      feature: "Finish screen + tomorrow's teaser — “Yesterday you guessed…”",
      image: day1Done.url,
      outcome: "Return hook set on Day 1. Voluntary next-day open.",
      status: "live", exploreHref: "/student",
    },
    {
      problem: "Concept forgotten in 48 hours; the “why” is never understood.",
      feature: "Hidden 7-layer engine — Mechanism → Reasoning on a real puzzle the child wants to solve.",
      image: layer2Mechanism.url,
      outcome: "Layer-by-layer mastery — every layer active, none blank.",
      evidence: "ASER 2024: only 30.7% of Class 5 can do basic division. Recall ≠ understanding.",
      status: "live", exploreHref: "/student/textbook",
    },
    {
      problem: "Memorises the answer but can't explain it.",
      feature: "Teach-it-back on Day 3 — child explains it in own words (voice or text).",
      image: teachItBack.url,
      outcome: "Proof of mastery, not proof of memorisation.",
      status: "live", exploreHref: "/student",
    },
    {
      problem: "Doesn't see why any of it matters beyond the exam.",
      feature: "Concept bridge — same idea shown in football, rockets, daily life.",
      image: conceptBridge.url,
      outcome: "Learning connects to the world the child already lives in.",
      status: "live", exploreHref: "/student",
    },
  ];
  return (
    <Slide id="06b-student-pfe" kicker="Student · live today" bg={paper}
           title="Every classroom problem → the exact feature → the real screen.">
      <ProblemFeatureGrid
        cards={cards}
        columns={3}
        caption="Each card is a real classroom problem, the feature that solves it, and the actual screen from the live app. Open one on a phone and let a student try it — the screens sell, the cards reassure."
      />
    </Slide>
  );
}

/* ================================================================== */
/*  SLIDE 07 — THE 5 INNER OS DIMENSIONS                              */
/* ================================================================== */
const DIMS = [

  { name: "Clarity",    icon: Eye,    color: teal,   captures: ["Re-reads same line", "Pauses on key term", "Definition precision"], rolls: "Concept clarity index" },
  { name: "Thinking",   icon: Brain,  color: indigo, captures: ["Multi-step chains", "‘Why’ depth", "Counter-example use"],          rolls: "Reasoning depth" },
  { name: "Attention",  icon: Target, color: gold,   captures: ["Tab switches", "Time on task", "Re-engage after distraction"],     rolls: "Focus index" },
  { name: "Momentum",   icon: Zap,    color: rose,   captures: ["Daily return", "Streak recovery", "Voluntary extra"],              rolls: "Self-driven learning" },
  { name: "Values",     icon: Heart,  color: tealDark, captures: ["Help-others rate", "Honest ‘I’m stuck’", "Reflection depth"],     rolls: "Character growth" },
];

function S07_Dimensions() {
  return (
    <Slide id="07-dimensions" kicker="Inner OS · 5 dimensions"
           title="We measure five dimensions of growth — built from hundreds of silent signals.">

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Pentagon */}
        <div className="lg:col-span-5">
          <Card>
            <Pentagon />
            <p className="text-center text-[12px] opacity-60 mt-3">
              Live profile shown to teacher; growth summary shown to parent.
            </p>
          </Card>
        </div>

        {/* Signals → dimension → metric */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${line}`, background: paper }}>
            <div className="grid grid-cols-12 px-5 py-3 text-[10px] tracking-[0.18em] uppercase font-semibold"
                 style={{ background: "rgba(15,23,42,.04)", color: tealDark }}>
              <div className="col-span-3">Dimension</div>
              <div className="col-span-6">Micro-signals we capture</div>
              <div className="col-span-3">Rolls up to</div>
            </div>
            {DIMS.map(d => (
              <div key={d.name} className="grid grid-cols-12 px-5 py-4 items-start gap-3"
                   style={{ borderTop: `1px solid ${line}` }}>
                <div className="col-span-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: `${d.color}18` }}>
                    <d.icon className="w-4 h-4" style={{ color: d.color }} />
                  </div>
                  <span className="font-semibold text-[14px]">{d.name}</span>
                </div>
                <div className="col-span-6 flex flex-wrap gap-1.5">
                  {d.captures.map(c => (
                    <span key={c} className="text-[11px] px-2 py-1 rounded-md"
                          style={{ background: "white", border: `1px solid ${line}` }}>{c}</span>
                  ))}
                </div>
                <div className="col-span-3 text-[12px] font-semibold" style={{ color: d.color }}>
                  {d.rolls}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ExploreLive to="/student" label="See a live student growth profile" />
    </Slide>
  );
}

function Pentagon() {
  const w = 320, cx = w / 2, cy = w / 2, r = 110;
  const values = [78, 64, 71, 82, 69]; // demo
  const pts = DIMS.map((_, i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });
  const inner = DIMS.map((_, i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const rr = r * (values[i] / 100);
    return `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${w}`} className="w-full">
      {[0.4, 0.6, 0.8, 1].map(k => (
        <polygon key={k} points={pts.map(p => `${cx + (p.x - cx) * k},${cy + (p.y - cy) * k}`).join(" ")}
                 fill="none" stroke={line} />
      ))}
      <polygon points={inner} fill={`${teal}33`} stroke={teal} strokeWidth="2" />
      {pts.map((p, i) => {
        const D = DIMS[i];
        const lx = cx + (p.x - cx) * 1.22, ly = cy + (p.y - cy) * 1.22;
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill={D.color} />
            <text x={lx} y={ly + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill={ink}>
              {D.name}
            </text>
            <text x={lx} y={ly + 17} textAnchor="middle" fontSize="10" fill={D.color} fontWeight="700">
              {values[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ================================================================== */
/*  SLIDE 08 — HOW GROWTH IS MEASURED (misconception loop)             */
/* ================================================================== */
function S08_Growth() {
  const loop = [
    { t: "Detect",     d: "Tap-guess + first-thought reveals the misconception in 30s",   c: rose },
    { t: "Surface",    d: "Class misconception map updates live for the teacher",         c: gold },
    { t: "Remediate",  d: "Student gets simpler example or peer-voice explanation",       c: teal },
    { t: "Re-test",    d: "Same layer, new context — checks transfer, not just recall",   c: indigo },
    { t: "Grow",       d: "Dimension score moves; parent sees growth, not just marks",    c: tealDark },
  ];
  return (
    <Slide id="08-growth" kicker="How growth actually moves" bg={paper}
           title="We don’t track marks. We track the breaks in thinking — and close them.">
      <div className="grid lg:grid-cols-5 gap-4">
        {loop.map((s, i) => (
          <div key={s.t} className="relative">
            <Card accent={s.c} className="h-full">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full grid place-items-center text-[12px] font-bold"
                      style={{ background: `${s.c}18`, color: s.c }}>{i + 1}</span>
                <span className="font-serif text-[20px] font-semibold">{s.t}</span>
              </div>
              <p className="text-[13px] leading-snug" style={{ color: "rgba(15,23,42,.78)" }}>{s.d}</p>
            </Card>
            {i < loop.length - 1 && (
              <ArrowRight className="hidden lg:block absolute top-1/2 -right-3 w-5 h-5 -translate-y-1/2 z-10"
                          style={{ color: "rgba(15,23,42,.3)" }} />
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-5">
        <Card>
          <div className="text-[11px] tracking-[0.2em] uppercase font-semibold mb-3" style={{ color: rose }}>
            Sample · Misconception map (Class 10 · Real Numbers)
          </div>
          {[
            { m: "“Negative means losing”",         pct: 64, c: rose },
            { m: "“0 is not a rational number”",    pct: 41, c: gold },
            { m: "“Decimals can’t be irrational”",  pct: 28, c: indigo },
          ].map(b => (
            <div key={b.m} className="mb-3">
              <div className="flex justify-between text-[13px] mb-1">
                <span>{b.m}</span><span className="font-mono font-semibold" style={{ color: b.c }}>{b.pct}%</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "rgba(15,23,42,.06)" }}>
                <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: b.c }} />
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <div className="text-[11px] tracking-[0.2em] uppercase font-semibold mb-3" style={{ color: teal }}>
            After 2 remedial loops
          </div>
          {[
            { m: "“Negative means losing”",         pct: 18, c: teal },
            { m: "“0 is not a rational number”",    pct: 9,  c: teal },
            { m: "“Decimals can’t be irrational”",  pct: 11, c: teal },
          ].map(b => (
            <div key={b.m} className="mb-3">
              <div className="flex justify-between text-[13px] mb-1">
                <span>{b.m}</span><span className="font-mono font-semibold" style={{ color: b.c }}>{b.pct}%</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "rgba(15,23,42,.06)" }}>
                <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: b.c }} />
              </div>
            </div>
          ))}
          <div className="mt-3 flex items-center gap-2 text-[12px] font-semibold" style={{ color: teal }}>
            <TrendingUp className="w-4 h-4" /> Real evidence for the parent meeting.
          </div>
        </Card>
      </div>

      <ExploreLive to="/teacher/insights" label="Open the live misconception map" />
    </Slide>
  );
}

/* ================================================================== */
/*  SLIDE 09 — TEACHER CO-PILOT                                        */
/* ================================================================== */
function S09_Teacher() {
  return (
    <Slide id="09-teacher" kicker="For your teachers"
           title="A teacher co-pilot that shows who understood — not just who clicked.">
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[12px] opacity-60">Live · Class 10-A</div>
                <div className="font-serif text-[22px] font-semibold">Class Cognitive Profile</div>
              </div>
              <Pill color={teal}>32 students online</Pill>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                { l: "Clarity",   v: 78, c: teal },
                { l: "Thinking",  v: 64, c: indigo },
                { l: "Focus",     v: 71, c: gold },
                { l: "Character", v: 82, c: rose },
              ].map(m => (
                <div key={m.l} className="p-3 rounded-xl text-center" style={{ background: "white", border: `1px solid ${line}` }}>
                  <div className="text-[11px] uppercase tracking-wider opacity-60">{m.l}</div>
                  <div className="text-[28px] font-bold mt-1" style={{ color: m.c }}>{m.v}%</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[
                { tag: "⚠ Attention",   text: "5 students re-reading question 3 — concept gap likely",  c: rose },
                { tag: "✨ Spark",       text: "“Cricket run-rate” hook lifted engagement +38% vs avg", c: teal },
                { tag: "↻ Remediate",   text: "Aarav, Priya, Karan — push simpler example for Layer 4", c: gold },
              ].map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: `${r.c}10` }}>
                  <span className="text-[11px] font-bold uppercase tracking-wider shrink-0" style={{ color: r.c }}>{r.tag}</span>
                  <span className="text-[13px]">{r.text}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="lg:col-span-5 space-y-4">
          <Card accent={indigo}>
            <Lightbulb className="w-5 h-5 mb-3" style={{ color: indigo }} />
            <div className="font-semibold text-[15px] mb-1">Auto-generated hook for tomorrow</div>
            <p className="text-[13px] opacity-75 mb-3">Drawn from this class’s top interests this week.</p>
            <div className="p-3 rounded-lg font-serif italic text-[15px]" style={{ background: paper }}>
              “If Rohit Sharma’s strike rate is 142, what does that <em>mean</em> mathematically?”
            </div>
          </Card>
          <Card accent={teal}>
            <MessageSquare className="w-5 h-5 mb-3" style={{ color: teal }} />
            <div className="font-semibold text-[15px] mb-1">Parent-ready summary (1-click)</div>
            <p className="text-[13px] opacity-75">
              “Aarav grew +12% in critical thinking this week. He’s most curious about real-world maths.”
            </p>
          </Card>
        </div>
      </div>
      <ExploreLive to="/teacher" label="Open the live teacher dashboard" />
    </Slide>
  );
}

/* ================================================================== */
/*  SLIDE 10 — SCHOOL OS                                               */
/* ================================================================== */
function S10_School() {
  return (
    <Slide id="10-school" kicker="For school leadership" bg={paper}
           title="A learning intelligence layer — branded as your school.">
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div className="font-serif text-[22px] font-semibold">Principal Dashboard · Live</div>
              <Pill color={indigo}>Delhi Public School</Pill>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { l: "Students active today", v: "1,247", s: "+8%", c: teal },
                { l: "Avg. thinking growth",  v: "+12%",  s: "vs last month", c: indigo },
                { l: "At-risk (early)",       v: "23",    s: "flagged in time", c: rose },
                { l: "Parent satisfaction",   v: "4.6",   s: "/ 5", c: gold },
              ].map(m => (
                <div key={m.l} className="p-3 rounded-xl" style={{ background: "white", border: `1px solid ${line}` }}>
                  <div className="text-[11px] uppercase tracking-wider opacity-60">{m.l}</div>
                  <div className="text-[24px] font-bold mt-1" style={{ color: m.c }}>{m.v}</div>
                  <div className="text-[11px] opacity-60">{m.s}</div>
                </div>
              ))}
            </div>
            <div className="text-[11px] tracking-[0.2em] uppercase font-semibold mb-3 opacity-70">
              Subject × Class weak-area heatmap
            </div>
            <Heatmap />
          </Card>
        </div>
        <div className="lg:col-span-4 space-y-4">
          <Card accent={gold}>
            <div className="text-[11px] tracking-[0.2em] uppercase font-semibold mb-2" style={{ color: gold }}>White-label</div>
            <div className="font-semibold text-[15px] mb-2">Your school’s own AI learning app</div>
            <ul className="text-[13px] space-y-1.5 opacity-80">
              <li>· Your logo, your colors, your name</li>
              <li>· Optional custom domain / app icon</li>
              <li>· “Powered by MGCV” footer (small)</li>
            </ul>
          </Card>
          <Card accent={teal}>
            <div className="text-[11px] tracking-[0.2em] uppercase font-semibold mb-2" style={{ color: teal }}>
              Parent monthly report (1 page)
            </div>
            <ul className="text-[13px] space-y-1 opacity-80">
              <li>· Thinking growth, not just marks</li>
              <li>· Curiosity domains discovered</li>
              <li>· Consistency · Confidence · Communication</li>
            </ul>
          </Card>
        </div>
      </div>
      <ExploreLive to="/admin" label="Open the live principal dashboard" />
    </Slide>
  );
}

function Heatmap() {
  const subjects = ["Maths", "Science", "Social", "English"];
  const classes  = ["6", "7", "8", "9", "10"];
  const seed = [
    [2, 1, 3, 2, 4],
    [1, 2, 2, 3, 3],
    [1, 1, 2, 2, 2],
    [0, 1, 1, 2, 3],
  ];
  const heat = (v: number) => ["#E8F5F1", "#A9DBC9", `${gold}55`, `${rose}66`, rose][v];
  return (
    <div className="overflow-x-auto">
      <table className="text-[12px]">
        <thead><tr><th></th>{classes.map(c => <th key={c} className="px-3 py-1 font-semibold opacity-60">Class {c}</th>)}</tr></thead>
        <tbody>
          {subjects.map((s, i) => (
            <tr key={s}>
              <td className="pr-3 py-1 font-semibold">{s}</td>
              {classes.map((_, j) => (
                <td key={j} className="p-1">
                  <div className="w-12 h-9 rounded-md grid place-items-center text-[11px] font-bold"
                       style={{ background: heat(seed[i][j]), color: seed[i][j] >= 3 ? "white" : ink }}>
                    {["low", "low", "med", "high", "high"][seed[i][j]]}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ================================================================== */
/*  SLIDE 11 — NEP 2020 FIT                                            */
/* ================================================================== */
function S11_NEP() {
  const rows = [
    { p: "Competency-based learning",          f: "7-Layer Engine forces depth beyond recall",            evidence: "Layer-wise mastery, not just chapter marks" },
    { p: "Critical thinking & inquiry",        f: "Assumptions + Reasoning layers + tap-guess hooks",     evidence: "Causal-chain depth tracked per student" },
    { p: "Experiential learning",              f: "Cricket / food / movies / local-life hooks per topic", evidence: "Curiosity domain map per student" },
    { p: "Multilingual & inclusive",           f: "Voice answers + English/Hindi/Telugu UI (roadmap)",   evidence: "Voice-explain in own language" },
    { p: "Holistic 360° report card",          f: "5 Inner OS dimensions → monthly parent report",       evidence: "Character + Momentum + Clarity tracked" },
    { p: "Reduce rote, embrace inquiry",       f: "Never-say-no feedback, first-thought capture",         evidence: "Misconception → growth, not red ink" },
  ];
  return (
    <Slide id="11-nep" kicker="Policy alignment"
           title="Every NEP 2020 pillar, mapped to a feature you can click today.">
      <div className="rounded-3xl overflow-hidden" style={{ border: `1px solid ${line}`, background: paper }}>
        <div className="grid grid-cols-12 px-6 py-3 text-[10px] tracking-[0.2em] uppercase font-semibold"
             style={{ background: "rgba(15,23,42,.04)", color: tealDark }}>
          <div className="col-span-4">NEP 2020 pillar</div>
          <div className="col-span-4">MGCV feature that delivers it</div>
          <div className="col-span-4">Evidence the school can show</div>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-12 px-6 py-4 items-start text-[14px]"
               style={{ borderTop: `1px solid ${line}` }}>
            <div className="col-span-4 font-semibold">{r.p}</div>
            <div className="col-span-4" style={{ color: tealDark }}>{r.f}</div>
            <div className="col-span-4 opacity-75">{r.evidence}</div>
          </div>
        ))}
      </div>
    </Slide>
  );
}

/* ================================================================== */
/*  SLIDE 12 — PHASED ROLLOUT                                          */
/* ================================================================== */
function S12_Rollout() {
  const phases = [
    {
      t: "Phase 1 · Pilot",
      w: "6 weeks",
      icon: Rocket,
      c: teal,
      items: ["1 grade · 1 subject", "30–60 students", "Live teacher dashboard", "Weekly insight report"],
      kpi: "+15% return rate · 3 misconceptions surfaced & closed",
    },
    {
      t: "Phase 2 · Full deployment",
      w: "Term 2",
      icon: Layers,
      c: indigo,
      items: ["All Class 6–10", "All core subjects", "Parent monthly reports", "Teacher upskilling kit"],
      kpi: "Thinking-growth scorecard per class, per teacher",
    },
    {
      t: "Phase 3 · School OS",
      w: "Year 2",
      icon: Compass,
      c: gold,
      items: ["White-label branded app", "Principal dashboard", "Parent-teacher comms", "Custom curriculum"],
      kpi: "Differentiated school identity · evidence-backed marketing",
    },
  ];
  return (
    <Slide id="12-rollout" kicker="How we’d roll out at your school" bg={paper}
           title="Low-risk pilot first. Earn the scale.">
      <div className="grid lg:grid-cols-3 gap-5">
        {phases.map(p => (
          <Card key={p.t} accent={p.c} className="h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: `${p.c}18` }}>
                <p.icon className="w-5 h-5" style={{ color: p.c }} />
              </div>
              <span className="text-[11px] font-mono opacity-60">{p.w}</span>
            </div>
            <div className="font-serif text-[22px] font-semibold mb-3">{p.t}</div>
            <ul className="space-y-1.5 text-[14px] mb-4">
              {p.items.map(i => (
                <li key={i} className="flex gap-2"><span className="opacity-40">·</span>{i}</li>
              ))}
            </ul>
            <div className="text-[12px] p-3 rounded-lg" style={{ background: `${p.c}10`, color: p.c, fontWeight: 600 }}>
              Success metric → {p.kpi}
            </div>
          </Card>
        ))}
      </div>
    </Slide>
  );
}

/* ================================================================== */
/*  SLIDE 13 — THE ASK                                                 */
/* ================================================================== */
function S13_Ask() {
  return (
    <Slide id="13-ask" bg={ink} dark>
      <div className="grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7">
          <div className="text-[11px] tracking-[0.22em] uppercase font-semibold mb-4" style={{ color: gold }}>
            What we’d like from your school
          </div>
          <h2 className="font-serif text-[44px] lg:text-[64px] leading-[1.02] tracking-tight">
            One class. One teacher.<br /> Six weeks. <span style={{ color: teal }}>Real evidence.</span>
          </h2>
          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            {[
              { n: "01", t: "1 pilot class", d: "Any grade 6–10, any core subject" },
              { n: "02", t: "1 teacher champion", d: "We co-pilot, you don’t add workload" },
              { n: "03", t: "1 parent comms slot", d: "Brief introduction to families" },
            ].map(a => (
              <div key={a.n} className="p-5 rounded-2xl" style={{ background: "rgba(250,246,238,.06)", border: `1px solid rgba(250,246,238,.12)` }}>
                <div className="text-[11px] font-mono mb-2" style={{ color: gold }}>{a.n}</div>
                <div className="font-semibold text-[16px] mb-1">{a.t}</div>
                <div className="text-[12px]" style={{ color: "rgba(250,246,238,.7)" }}>{a.d}</div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a href="/student" target="_blank" rel="noreferrer"
               className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-[14px]"
               style={{ background: teal, color: cream }}>
              See the live student app <ArrowRight className="w-4 h-4" />
            </a>
            <a href="/teacher" target="_blank" rel="noreferrer"
               className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-[14px]"
               style={{ background: "rgba(250,246,238,.1)", color: cream, border: `1px solid rgba(250,246,238,.25)` }}>
              See the teacher co-pilot
            </a>
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="p-7 rounded-3xl" style={{ background: "rgba(250,246,238,.05)", border: `1px solid rgba(250,246,238,.12)` }}>
            <div className="text-[11px] tracking-[0.22em] uppercase font-semibold mb-3" style={{ color: gold }}>
              Contact
            </div>
            <div className="font-serif text-[24px] font-semibold mb-1">MGCV · Inner OS Team</div>
            <div className="text-[14px]" style={{ color: "rgba(250,246,238,.7)" }}>
              hello@mg3verse.com<br />
              edu.mg3verse.com
            </div>
            <div className="mt-6 pt-6 border-t" style={{ borderColor: "rgba(250,246,238,.15)" }}>
              <div className="text-[11px] tracking-[0.22em] uppercase font-semibold mb-2" style={{ color: gold }}>
                Demo logins (inside live links)
              </div>
              <div className="text-[12px] font-mono" style={{ color: "rgba(250,246,238,.65)" }}>
                student@demo.in · teacher@demo.in · admin@demo.in
              </div>
            </div>
          </div>
        </div>
      </div>
    </Slide>
  );
}

/* ================================================================== */
/*  NAV + PAGE                                                         */
/* ================================================================== */
const SLIDES = [
  { id: "01-cover",       label: "Cover" },
  { id: "02-problem",     label: "Problem" },
  { id: "03-why-fails",   label: "Why edtech fails" },
  { id: "04-thesis",      label: "Our thesis" },
  { id: "05-seven-layer", label: "7-Layer Engine" },
  { id: "06-student",       label: "Student" },
  { id: "06b-student-pfe",  label: "Student · P→F→Screen" },
  { id: "07-dimensions",    label: "5 Dimensions" },
  { id: "08-growth",        label: "Growth measured" },
  { id: "09-teacher",       label: "Teacher" },
  { id: "10-school",        label: "School OS" },
  { id: "11-nep",           label: "NEP 2020" },

  { id: "12-rollout",     label: "Rollout" },
  { id: "13-ask",         label: "The Ask" },
];

function SideNav({ active }: { active: string }) {
  return (
    <nav className="fixed right-5 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-2">
      {SLIDES.map((s, i) => {
        const on = active === s.id;
        return (
          <a key={s.id} href={`#${s.id}`}
             className="group relative flex items-center justify-end gap-3"
             aria-label={s.label}>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-semibold px-2 py-1 rounded-md"
                  style={{ background: ink, color: cream }}>{String(i + 1).padStart(2, "0")} · {s.label}</span>
            <span className="w-2.5 h-2.5 rounded-full transition-all"
                  style={{ background: on ? ink : "rgba(15,23,42,.25)", transform: on ? "scale(1.4)" : "scale(1)" }} />
          </a>
        );
      })}
    </nav>
  );
}

function TopBar() {
  return (
    <div className="fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full"
         style={{ background: "rgba(15,23,42,.92)", color: cream, backdropFilter: "blur(8px)" }}>
      <Sparkles className="w-3.5 h-3.5" style={{ color: gold }} />
      <span className="text-[11px] tracking-[0.18em] uppercase font-semibold">MGCV · Pitch · For School Leadership</span>
    </div>
  );
}

export default function Pitch() {
  const [active, setActive] = useState("01-cover");

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { threshold: [0.4, 0.6] }
    );
    SLIDES.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.title = "MGCV · Pitch for School Leadership";
  }, []);

  return (
    <div className="min-h-screen w-full snap-y snap-mandatory overflow-y-auto"
         style={{ background: cream, color: ink, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .font-serif { font-family: 'Sora', 'Inter', sans-serif; letter-spacing: -0.02em; }
        html { scroll-behavior: smooth; }
      `}</style>
      <TopBar />
      <SideNav active={active} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <S01_Cover />
        <S02_Problem />
        <S03_WhyFails />
        <S04_Thesis />
        <S05_SevenLayer />
        <S06_Student />
        <S06B_StudentPFE />
        <S07_Dimensions />

        <S08_Growth />
        <S09_Teacher />
        <S10_School />
        <S11_NEP />
        <S12_Rollout />
        <S13_Ask />
      </motion.div>
    </div>
  );
}
