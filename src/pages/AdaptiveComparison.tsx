import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Brain, Shield, MessageSquare, Timer, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const sections = [
  {
    id: "concept",
    title: "What's the big idea?",
    icon: "💡",
    board: {
      label: "Board / Understanding Mode",
      items: [
        { type: "concept", icon: "📘", text: "Natural numbers are 1, 2, 3, 4, ... used for counting. Denoted by ℕ." },
        { type: "formula", icon: "📐", text: "ℕ = {1, 2, 3, 4, 5, ...}" },
        { type: "visual", icon: "📊", text: "Number family tree diagram showing ℕ ⊂ W ⊂ ℤ ⊂ ℚ" },
        { type: "insight", icon: "💡", text: "Every natural number is a whole number, but 0 is a whole number that is NOT a natural number." },
        { type: "textbook", icon: "📖", text: "See original textbook text ▼" },
      ],
      feel: "Calm, visual, no pressure. Student absorbs at their pace.",
    },
    jee: {
      label: "JEE / Competitive Mode",
      items: [
        { type: "concept", icon: "📘", text: "Natural numbers are 1, 2, 3, ... Denoted by ℕ. (Same core concept, concise)" },
        { type: "formula", icon: "📐", text: "ℕ ⊂ W ⊂ ℤ ⊂ ℚ ⊂ ℝ" },
        { type: "jee-note", icon: "⚡", text: "Board asks 'define rational number.' JEE asks 'prove √2 is irrational' — same topic, different depth." },
        { type: "trap", icon: "🎯", text: "TRAP ALERT: JEE 2023 Q14 tested whether 0 is natural. 34% got it wrong." },
        { type: "prev-year", icon: "📋", text: "JEE Main 2023: \"Which is not rational? (a) √4 (b) √3 (c) 0.333... (d) 22/7\"" },
      ],
      feel: "Direct, exam-aware. Same concept but with competitive context.",
    },
  },
  {
    id: "recall",
    title: "Can you remember?",
    icon: "🧠",
    board: {
      label: "Board Mode",
      items: [
        { type: "question", icon: "❓", text: "Q1: What is a rational number?" },
        { type: "hint", icon: "💡", text: "Hint: Think of the word 'ratio'" },
        { type: "action", icon: "✅", text: "[ Reveal Answer ]  [ ✓ Got it ]  [ ✗ Not yet ]" },
        { type: "note", icon: "📝", text: "Self-paced. No timer. Hints visible." },
      ],
      feel: "No pressure. Student self-assesses honestly.",
    },
    jee: {
      label: "JEE Mode",
      items: [
        { type: "timer", icon: "⏱", text: "00:45 remaining  |  Target: < 30 seconds per question" },
        { type: "question", icon: "❓", text: "Is 0 a natural number, whole number, integer, or rational number? Select ALL that apply." },
        { type: "action", icon: "☐", text: "☐ Natural  ☐ Whole  ☐ Integer  ☐ Rational  [ Check → -1 for wrong ]" },
        { type: "jee-note", icon: "⚡", text: "This exact question appeared in NEET 2024 and 41% selected 'Natural' incorrectly" },
      ],
      feel: "Time pressure. Negative marking. Exam-realistic.",
    },
  },
  {
    id: "assumptions",
    title: "What if we're wrong?",
    icon: "⚡",
    board: {
      label: "Board Mode",
      items: [
        { type: "myth", icon: "🔮", text: "Myth: \"0.999... is less than 1\"" },
        { type: "action", icon: "🤔", text: "Do you believe this?  [ Yes, it's less ]  [ No, they're equal ]" },
        { type: "explanation", icon: "✨", text: "Actually: 0.999... = 1 exactly. Let x = 0.999..., then 10x = 9.999..., so 9x = 9, giving x = 1." },
        { type: "reflection", icon: "💭", text: "Why did you think they were different?" },
      ],
      feel: "Gentle myth-busting. Focus on understanding.",
    },
    jee: {
      label: "JEE Mode",
      items: [
        { type: "trap", icon: "🎯", text: "TRAP PATTERN: JEE uses this misconception in options" },
        { type: "question", icon: "❓", text: "\"Which is true? (a) 0.999... < 1 (b) 0.999... = 1 (c) 1/3 ≠ 0.333... (d) Both a and c\"" },
        { type: "jee-note", icon: "⚡", text: "Option (d) is the trap — students who believe the myth lose 2 marks" },
        { type: "strategy", icon: "🧭", text: "Strategy: When you see 0.999... in JEE options, it's ALWAYS testing this. Choose = 1, move on." },
      ],
      feel: "Tactical. Identifies exam traps. Teaches test strategy.",
    },
  },
  {
    id: "debate",
    title: "Debate Challenge",
    icon: "🛡️",
    board: {
      label: "Board Mode",
      items: [
        { type: "prompt", icon: "🤖", text: "AI: \"Can you explain why √2 is irrational?\"" },
        { type: "student", icon: "👤", text: "Student: \"Because it can't be written as p/q...\"" },
        { type: "ai", icon: "🤖", text: "AI: \"Good start! But WHY can't it? What happens if you assume it can?\"" },
        { type: "note", icon: "💚", text: "Encouraging, scaffolded. AI guides toward understanding." },
      ],
      feel: "Supportive Socratic dialogue. Building confidence.",
    },
    jee: {
      label: "JEE Mode → IIT Interview Prep",
      items: [
        { type: "prompt", icon: "🤖", text: "AI: \"Prove that √2 is irrational using contradiction.\"" },
        { type: "student", icon: "👤", text: "Student: \"Assume √2 = p/q where p,q are coprime...\"" },
        { type: "ai", icon: "🤖", text: "AI: \"Define coprime. Now, what if I claim √4 is also irrational using your proof? Where does it break?\"" },
        { type: "jee-note", icon: "⚡", text: "This is EXACTLY how IIT interview panels test — they take your proof and try to break it." },
      ],
      feel: "Rigorous, challenging. Prepares for oral examination.",
    },
  },
];

const typeColors: Record<string, string> = {
  concept: "bg-primary/5 border-primary/20",
  formula: "bg-info/5 border-info/20",
  visual: "bg-accent/5 border-accent/20",
  insight: "bg-warning/5 border-warning/20",
  textbook: "bg-muted border-border",
  question: "bg-primary/5 border-primary/20",
  hint: "bg-warning/5 border-warning/20",
  action: "bg-muted border-border",
  note: "bg-muted/50 border-border/50",
  myth: "bg-destructive/5 border-destructive/20",
  explanation: "bg-success/5 border-success/20",
  reflection: "bg-accent/5 border-accent/20",
  prompt: "bg-info/5 border-info/20",
  student: "bg-muted border-border",
  ai: "bg-primary/5 border-primary/20",
  "jee-note": "bg-warning/5 border-warning/20",
  trap: "bg-destructive/5 border-destructive/20",
  "prev-year": "bg-info/5 border-info/20",
  timer: "bg-destructive/5 border-destructive/20",
  strategy: "bg-success/5 border-success/20",
};

const AdaptiveComparison = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("concept");

  const currentSection = sections.find(s => s.id === activeSection)!;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-foreground">Board vs JEE Mode</h1>
            <p className="text-xs text-muted-foreground">Same lesson, two experiences — the content adapts to what you need</p>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-8">
        {/* Section selector tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Tabs value={activeSection} onValueChange={setActiveSection}>
            <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1.5">
              {sections.map(s => (
                <TabsTrigger
                  key={s.id}
                  value={s.id}
                  className="flex-1 min-w-[120px] text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <span className="mr-1.5">{s.icon}</span>
                  <span className="hidden sm:inline">{s.title}</span>
                  <span className="sm:hidden">{s.title.split(" ").slice(0, 2).join(" ")}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Side-by-side comparison */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Board Mode Column */}
          <div className="rounded-2xl border-2 border-primary/20 bg-card overflow-hidden">
            <div className="bg-primary/5 border-b border-primary/20 px-5 py-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">📚 {currentSection.board.label}</h3>
                <p className="text-[10px] text-muted-foreground">Calm, guided, deep understanding</p>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {currentSection.board.items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`rounded-xl border p-3.5 ${typeColors[item.type] || "bg-muted border-border"}`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                    <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
                  </div>
                </motion.div>
              ))}
              <div className="mt-4 px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground italic">
                  <span className="font-semibold text-primary">Feel:</span> {currentSection.board.feel}
                </p>
              </div>
            </div>
          </div>

          {/* JEE Mode Column */}
          <div className="rounded-2xl border-2 border-warning/30 bg-card overflow-hidden">
            <div className="bg-warning/5 border-b border-warning/20 px-5 py-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center">
                <Brain className="h-4 w-4 text-warning" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">🎯 {currentSection.jee.label}</h3>
                <p className="text-[10px] text-muted-foreground">Exam-ready, strategic, time-pressured</p>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {currentSection.jee.items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`rounded-xl border p-3.5 ${typeColors[item.type] || "bg-muted border-border"}`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                    <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
                  </div>
                </motion.div>
              ))}
              <div className="mt-4 px-3 py-2.5 rounded-lg bg-warning/5 border border-warning/10">
                <p className="text-xs text-muted-foreground italic">
                  <span className="font-semibold text-warning">Feel:</span> {currentSection.jee.feel}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom insight */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 text-center max-w-2xl mx-auto"
        >
          <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-info/5 border border-primary/10 p-6 md:p-8">
            <h3 className="text-lg font-bold text-foreground mb-2">The Insight</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The <strong className="text-foreground">content is identical</strong>. The interaction adapts to what the student needs.
              A student preparing for boards gets a calm, exploratory experience. A JEE aspirant gets exam strategy, trap awareness, and time pressure — 
              <strong className="text-primary"> built into the same lesson</strong>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdaptiveComparison;
