import { useState } from "react";
import { Sparkles, ChevronRight, Lock, Mic, Send, Trophy, Brain, Eye, Lightbulb, Heart, TrendingUp, Menu, X, Flame } from "lucide-react";

type Option = "A" | "B" | "C";

const Demo2605 = () => {
  const [option, setOption] = useState<Option>("A");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/70 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">MGCV Elite · Daily Loop Concepts</h1>
            <p className="text-xs text-slate-400">Compare three structural options side-by-side</p>
          </div>
          <div className="flex gap-2 bg-slate-800/50 p-1 rounded-full border border-slate-700">
            {(["A", "B", "C"] as Option[]).map((o) => (
              <button
                key={o}
                onClick={() => setOption(o)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  option === o
                    ? "bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Option {o}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Intro */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        {option === "A" && <OptionIntro title="Option A — Ruthless Simplification" subtitle="One button. One job. Everything else hidden." color="emerald" />}
        {option === "B" && <OptionIntro title="Option B — Daily Loop as new default" subtitle="New /today home, old features stay in 'More' tab." color="sky" />}
        {option === "C" && <OptionIntro title="Refined 6-Step Loop (the content itself)" subtitle="The actual flow that runs inside Option A or B." color="violet" />}
      </div>

      {/* Mock phone */}
      <div className="max-w-6xl mx-auto px-4 py-8 flex justify-center">
        <div className="w-full max-w-[380px] bg-slate-900 rounded-[2.5rem] border-8 border-slate-800 shadow-2xl shadow-black/50 overflow-hidden">
          <div className="bg-slate-950 px-6 py-2 flex justify-between text-[10px] text-slate-500">
            <span>9:41</span>
            <span>MGCV Elite</span>
          </div>
          {option === "A" && <MockOptionA />}
          {option === "B" && <MockOptionB />}
          {option === "C" && <MockOptionC />}
        </div>
      </div>

      {/* Explanation */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        {option === "A" && <ExplainA />}
        {option === "B" && <ExplainB />}
        {option === "C" && <ExplainC />}
      </div>
    </div>
  );
};

const OptionIntro = ({ title, subtitle, color }: { title: string; subtitle: string; color: string }) => (
  <div className="text-center mb-6">
    <div className={`inline-block px-3 py-1 rounded-full bg-${color}-500/10 border border-${color}-500/30 text-${color}-400 text-[10px] font-bold tracking-wider mb-3`}>
      CONCEPT PREVIEW
    </div>
    <h2 className="text-2xl md:text-3xl font-bold mb-2">{title}</h2>
    <p className="text-sm text-slate-400">{subtitle}</p>
  </div>
);

// ──────────────────────────────────────────────────────────
// OPTION A — Ruthless Simplification
// ──────────────────────────────────────────────────────────
const MockOptionA = () => (
  <div className="bg-gradient-to-b from-slate-900 to-slate-950 min-h-[600px] p-6 flex flex-col">
    <div className="flex justify-between items-center mb-8">
      <div>
        <p className="text-xs text-slate-500">Hi, Arjun</p>
        <p className="text-sm font-semibold flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-orange-400" /> 7-day streak
        </p>
      </div>
      <button className="text-slate-500 text-xs">More</button>
    </div>

    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <div className="w-44 h-44 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center mb-6 shadow-2xl shadow-teal-500/40 animate-pulse">
        <Sparkles className="w-20 h-20 text-white" />
      </div>
      <p className="text-xs text-teal-400 font-bold tracking-widest mb-2">TODAY'S SPARK</p>
      <h3 className="text-xl font-bold mb-2">Why does Maggi cook<br />faster in a pressure cooker?</h3>
      <p className="text-xs text-slate-500 mb-8">Class 8 · Physics · 5 minutes</p>

      <button className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-4 rounded-2xl text-base shadow-xl shadow-teal-500/30 flex items-center justify-center gap-2">
        Start <ChevronRight className="w-5 h-5" />
      </button>
      <p className="text-[10px] text-slate-600 mt-3">Come back tomorrow for a new spark</p>
    </div>
  </div>
);

const ExplainA = () => (
  <div className="max-w-2xl mx-auto bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
    <h3 className="font-bold text-emerald-400">What you see in Option A</h3>
    <ul className="space-y-2 text-sm text-slate-300">
      <li>• Home screen has <b>ONE</b> primary button: today's 5-minute spark</li>
      <li>• Streak shown subtly top-left (no XP, no leaderboard)</li>
      <li>• Everything else (textbook, episodes, exam room, JEE boost) lives under tiny "More" link</li>
      <li>• Once spark is done → screen says "Come back tomorrow" — no infinite scroll</li>
    </ul>
    <div className="pt-3 border-t border-slate-800 text-xs text-slate-400">
      <b className="text-slate-200">Best for:</b> Building a habit. Students will not feel overwhelmed. Trade-off: parents/teachers may feel app is "too thin".
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────
// OPTION B — Daily Loop + everything kept
// ──────────────────────────────────────────────────────────
const MockOptionB = () => (
  <div className="bg-slate-950 min-h-[600px] flex flex-col">
    <div className="p-5 border-b border-slate-800 flex justify-between items-center">
      <div>
        <p className="text-xs text-slate-500">Tuesday, May 26</p>
        <p className="font-bold">Today</p>
      </div>
      <Menu className="w-5 h-5 text-slate-400" />
    </div>

    {/* Hero today card */}
    <div className="p-4">
      <div className="rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-700 p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <p className="text-[10px] font-bold tracking-widest text-sky-100">TODAY'S SPARK · 5 MIN</p>
        </div>
        <h3 className="font-bold text-white text-lg mb-1 leading-snug">Why does Maggi cook faster in a pressure cooker?</h3>
        <p className="text-xs text-sky-200 mb-4">Physics · Heat & Pressure</p>
        <button className="bg-white text-indigo-700 font-bold py-2.5 px-5 rounded-xl text-sm">
          Begin →
        </button>
      </div>
    </div>

    {/* Secondary — collapsed older features */}
    <div className="px-4 pb-4 space-y-2">
      <p className="text-[10px] font-bold tracking-widest text-slate-500 px-1 mt-2">CONTINUE WHEN YOU WANT</p>
      <SecondaryItem icon="📘" label="Textbook" sub="NCERT Class 8 · Ch 6" />
      <SecondaryItem icon="🎯" label="Exam Room" sub="Mock test ready" />
      <SecondaryItem icon="⚡" label="JEE Boost" sub="Unlocked level 2" />
      <SecondaryItem icon="📊" label="Your Growth" sub="Up 14% this week" />
    </div>

    <div className="mt-auto border-t border-slate-800 bg-slate-900 flex justify-around py-2">
      {["Today", "Learn", "Growth", "More"].map((t, i) => (
        <button key={t} className={`text-[10px] flex flex-col items-center gap-1 px-3 py-1 ${i === 0 ? "text-sky-400" : "text-slate-500"}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-sky-400" : "bg-transparent"}`} />
          {t}
        </button>
      ))}
    </div>
  </div>
);

const SecondaryItem = ({ icon, label, sub }: { icon: string; label: string; sub: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
    <div className="text-xl">{icon}</div>
    <div className="flex-1">
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-[10px] text-slate-500">{sub}</p>
    </div>
    <ChevronRight className="w-4 h-4 text-slate-600" />
  </div>
);

const ExplainB = () => (
  <div className="max-w-2xl mx-auto bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
    <h3 className="font-bold text-sky-400">What you see in Option B</h3>
    <ul className="space-y-2 text-sm text-slate-300">
      <li>• <b>/today</b> becomes the new home — big hero card for the daily spark</li>
      <li>• Old features (textbook, exam room, JEE boost, growth) listed below as small secondary tiles</li>
      <li>• Bottom tab gives access to "More" for everything we've built</li>
      <li>• Nothing deleted — just re-prioritized</li>
    </ul>
    <div className="pt-3 border-t border-slate-800 text-xs text-slate-400">
      <b className="text-slate-200">Best for:</b> Keeping all stakeholders happy (parents see depth, students see one clear focus). Trade-off: still some choice-paralysis.
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────
// OPTION C — The 6-Step Loop itself (what runs inside A or B)
// ──────────────────────────────────────────────────────────
const steps = [
  { n: 1, icon: Lightbulb, name: "Hook", sub: "30 sec", desc: "Real-world curiosity trigger", color: "from-amber-500 to-orange-500" },
  { n: 2, icon: Brain, name: "Guess", sub: "45 sec", desc: "One-tap or voice answer", color: "from-rose-500 to-pink-500" },
  { n: 3, icon: Eye, name: "Reveal", sub: "2 min", desc: "Compare your guess vs science", color: "from-violet-500 to-purple-500" },
  { n: 4, icon: Mic, name: "Make it Yours", sub: "2 min", desc: "Self-explain in your words", color: "from-sky-500 to-blue-500" },
  { n: 5, icon: Heart, name: "Memory", sub: "1 min", desc: "Callback to yesterday's thinking", color: "from-emerald-500 to-teal-500" },
  { n: 6, icon: TrendingUp, name: "Progress", sub: "30 sec", desc: "Quiet markers, no pressure", color: "from-indigo-500 to-violet-500" },
];

const MockOptionC = () => {
  const [active, setActive] = useState(0);
  const step = steps[active];
  return (
    <div className="bg-slate-950 min-h-[600px] flex flex-col">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <button onClick={() => setActive(Math.max(0, active - 1))} className="text-xs text-slate-500">← Back</button>
        <p className="text-[10px] tracking-widest text-slate-500">STEP {step.n} OF 6</p>
        <button onClick={() => setActive(Math.min(5, active + 1))} className="text-xs text-teal-400">Next →</button>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 px-4 py-3">
        {steps.map((s, i) => (
          <div key={s.n} className={`h-1 flex-1 rounded-full ${i <= active ? "bg-teal-400" : "bg-slate-800"}`} />
        ))}
      </div>

      <div className="flex-1 p-6 flex flex-col">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 shadow-lg`}>
          <step.icon className="w-8 h-8 text-white" />
        </div>
        <p className="text-[10px] font-bold tracking-widest text-slate-500 mb-1">{step.sub.toUpperCase()}</p>
        <h3 className="text-2xl font-bold mb-2">{step.name}</h3>
        <p className="text-sm text-slate-400 mb-6">{step.desc}</p>

        <StepContent step={active} />
      </div>

      <div className="px-4 pb-4 flex gap-1.5 justify-center">
        {steps.map((s, i) => (
          <button key={s.n} onClick={() => setActive(i)} className={`w-2 h-2 rounded-full ${i === active ? "bg-teal-400" : "bg-slate-700"}`} />
        ))}
      </div>
    </div>
  );
};

const StepContent = ({ step }: { step: number }) => {
  if (step === 0) return (
    <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4">
      <p className="text-sm text-amber-100 leading-relaxed">"Your mom's pressure cooker whistles 3 times before rice is ready. Why not just boil it in a normal pot?"</p>
    </div>
  );
  if (step === 1) return (
    <div className="space-y-2">
      {["Pressure makes water hotter", "It traps the steam", "I'm not sure"].map(o => (
        <button key={o} className="w-full text-left p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-rose-400 text-sm">{o}</button>
      ))}
      <button className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-sm"><Mic className="w-4 h-4" /> Or speak your guess</button>
    </div>
  );
  if (step === 2) return (
    <div className="rounded-2xl bg-violet-500/10 border border-violet-500/30 p-4 space-y-2">
      <p className="text-xs text-violet-300 font-semibold">You said: "Pressure makes water hotter" ✓</p>
      <p className="text-sm text-violet-100">Exactly — high pressure raises water's boiling point above 100°C, so food cooks faster.</p>
    </div>
  );
  if (step === 3) return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">Explain it like you'd tell your younger sibling:</p>
      <div className="rounded-xl bg-slate-900 border border-slate-700 p-3 min-h-[80px]">
        <p className="text-xs text-slate-600 italic">Type or tap mic to record...</p>
      </div>
      <button className="w-full p-3 rounded-xl bg-sky-500 text-white text-sm font-bold flex items-center justify-center gap-2"><Mic className="w-4 h-4" /> Record</button>
    </div>
  );
  if (step === 4) return (
    <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 space-y-3">
      <p className="text-xs text-emerald-300 font-semibold">Yesterday you wondered:</p>
      <p className="text-sm italic text-emerald-100">"Why does ice float?"</p>
      <p className="text-xs text-slate-400">Both today and yesterday were about how molecules behave under different conditions. You're building a pattern.</p>
    </div>
  );
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 flex items-center justify-between">
        <span className="text-xs text-slate-400">Day streak</span>
        <span className="text-sm font-bold text-orange-400">8 days 🔥</span>
      </div>
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 flex items-center justify-between">
        <span className="text-xs text-slate-400">Concepts connected</span>
        <span className="text-sm font-bold text-teal-400">23</span>
      </div>
      <p className="text-xs text-slate-500 text-center pt-2">No leaderboards. No XP. Just your story.</p>
    </div>
  );
};

const ExplainC = () => (
  <div className="max-w-2xl mx-auto bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
    <h3 className="font-bold text-violet-400">What is Option C?</h3>
    <p className="text-sm text-slate-300">
      This is <b>NOT a separate option</b> — it's the <b>actual content engine</b> that runs inside Option A or Option B.
      Tap the dots at the bottom of the phone to walk through all 6 steps.
    </p>
    <div className="grid grid-cols-2 gap-2 pt-2">
      {steps.map(s => (
        <div key={s.n} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
          <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${s.color} flex items-center justify-center`}>
            <s.icon className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{s.n}. {s.name}</p>
            <p className="text-[10px] text-slate-500">{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
    <div className="pt-3 border-t border-slate-800 text-xs text-slate-400">
      <b className="text-slate-200">Decision needed:</b> Pick A or B for the <b>shell</b>, then we refine these 6 steps further.
    </div>
  </div>
);

export default Demo2605;
