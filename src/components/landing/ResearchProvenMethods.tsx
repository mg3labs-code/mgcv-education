import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, GraduationCap, Stethoscope, Trophy, BookOpen, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

/* ============ PART A: Career Timelines ============ */

const exams = [
  {
    name: "JEE → IIT",
    icon: "🏛️",
    lucideIcon: GraduationCap,
    color: "from-violet-500/10 to-purple-500/10",
    borderColor: "border-violet-200 dark:border-violet-800",
    accentColor: "text-violet-600",
    stats: "12 lakh compete → 10,000 IIT seats → top 0.8%",
    timeline: [
      { year: "Year 1-2", icon: "🗣️", text: "Every class is a discussion, not a lecture. Professors ASK, students ARGUE. That's your Debate Challenge." },
      { year: "Year 2-3", icon: "🔧", text: "You don't just study thermodynamics — you DESIGN a heat exchanger. Every assignment is 'Use it in real life'." },
      { year: "Year 3-4", icon: "🔬", text: "Research projects where panels question every assumption — exactly like 'What if we're wrong?'" },
      { year: "Career", icon: "🚀", text: "₹15-50 LPA starting. Top tech companies recruit on campus. The REAL advantage: they THINK differently." },
    ],
  },
  {
    name: "NEET → AIIMS",
    icon: "⚕️",
    lucideIcon: Stethoscope,
    color: "from-emerald-500/10 to-teal-500/10",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    accentColor: "text-emerald-600",
    stats: "20 lakh compete → 1 lakh seats → top 5%",
    timeline: [
      { year: "Year 1-2", icon: "🏥", text: "Medical school uses CASE-BASED learning — see a patient case, figure out what's wrong. That's 'Use it in real life' with human lives." },
      { year: "Year 3", icon: "🩺", text: "Clinical rotations. Present diagnoses to senior doctors who challenge every conclusion — same as Debate Challenge." },
      { year: "Year 4-5", icon: "🔬", text: "Research why treatments work or fail — 'But WHY though?' becomes your daily life as a medical researcher." },
      { year: "Career", icon: "🌍", text: "₹10-30 LPA starting. Surgeons, researchers, public health leaders. Thinking skills carry into every patient interaction." },
    ],
  },
  {
    name: "Olympiad → Global Top Universities",
    icon: "🏅",
    lucideIcon: Trophy,
    color: "from-amber-500/10 to-yellow-500/10",
    borderColor: "border-amber-200 dark:border-amber-800",
    accentColor: "text-amber-600",
    stats: "5 lakh start → 6 represent India → top 0.001%",
    timeline: [
      { year: "The Journey", icon: "🧠", text: "No standard method. You INVENT approaches. Every problem combines 'But WHY?' + 'What if we're wrong?' + 'Break It Down'." },
      { year: "University", icon: "🎓", text: "Direct admission to top global universities. These institutions value THINKING over marks — exactly what Inner OS measures." },
      { year: "Career", icon: "🏆", text: "Alumni include Fields Medal winners, Nobel laureates, founders of world-changing companies." },
      { year: "The Real Prize", icon: "♾️", text: "The HABIT of first-principles thinking. That habit compounds for life." },
    ],
  },
];

/* ============ PART B: Research-Proven Methods ============ */

const methods = [
  {
    id: "first-principles",
    name: "First Principles",
    icon: "🧬",
    method: "Problem-Based Learning",
    how: "Present a PROBLEM, work to solve it, then defend your approach. The question 'Why?' is asked until shallow answers run out.",
    mapping: [
      { edutech: "Debate Challenge", institution: "Oral examination & viva voce" },
      { edutech: "Break It Down", institution: "First-principles derivation" },
      { edutech: "Use it in real life", institution: "Design projects every semester" },
      { edutech: "What if we're wrong?", institution: "Engineering failure analysis" },
    ],
    quote: "\"The best education doesn't teach answers. It teaches how to find answers to questions nobody has asked yet.\"",
  },
  {
    id: "socratic",
    name: "Socratic Method",
    icon: "🔍",
    method: "Tutorial System",
    how: "One student, one mentor, one hour, every week. The student writes an essay defending a position, then the mentor ATTACKS every argument.",
    mapping: [
      { edutech: "Debate Challenge", institution: "Weekly 1-on-1 tutorials" },
      { edutech: "Teach your friend", institution: "Essay defence" },
      { edutech: "But WHY though?", institution: "The probing question" },
      { edutech: "What does this mean?", institution: "Philosophical reflection" },
    ],
    quote: "\"The tutorial is where you discover what you DON'T understand. That discomfort is where learning happens.\"",
  },
  {
    id: "case-method",
    name: "Case Method",
    icon: "📋",
    method: "Case-Based Learning + Research",
    how: "Teaching ENTIRELY through real-world cases. Emphasizes building things that work. Prioritizes APPLICATION over memorization.",
    mapping: [
      { edutech: "Use it in real life", institution: "Case study method" },
      { edutech: "Where else does this appear?", institution: "Cross-disciplinary thinking" },
      { edutech: "What if we're wrong?", institution: "Hypothesis testing" },
      { edutech: "Try it yourself!", institution: "Maker culture / Labs" },
    ],
    quote: "\"The goal of education is not to fill a bucket but to light a fire.\"",
  },
  {
    id: "design-thinking",
    name: "Design Thinking",
    icon: "🎨",
    method: "Empathy-Driven Innovation",
    how: "Empathize → Define → Ideate → Prototype → Test. Every problem starts with understanding PEOPLE. This method produced the world's most innovative thinkers.",
    mapping: [
      { edutech: "What's the big idea?", institution: "Empathize + Define" },
      { edutech: "Try it yourself!", institution: "Prototype & Test" },
      { edutech: "What if we're wrong?", institution: "Test + Iterate" },
      { edutech: "Where else does this appear?", institution: "Cross-pollination" },
    ],
    quote: "\"Most people die at 25 and aren't buried until 75. Great education wakes you up.\"",
  },
];

const ResearchProvenMethods = () => {
  const navigate = useNavigate();
  const [expandedExam, setExpandedExam] = useState<number | null>(null);

  return (
    <section id="research-methods" className="relative z-10 py-16 md:py-24 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 md:px-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <GraduationCap className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Research-Backed Pedagogy</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Backed by the World's{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-info">
              Best Teaching Methods
            </span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Not coaching tricks. Not rote learning. Evidence-based pedagogical methods backed by decades of cognitive science and metacognitive research — 
            adapted for Indian students from age 14.
          </p>
        </motion.div>

        {/* ========== PART A: What Qualifying Unlocks ========== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-16"
        >
          <h3 className="text-xl md:text-2xl font-bold text-foreground text-center mb-2">
            What Qualifying These Exams Unlocks
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-8 max-w-lg mx-auto">
            The exam is the gate. What's behind it is what matters — and we prepare you for BOTH.
          </p>

          <div className="space-y-3">
            {exams.map((exam, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl border ${exam.borderColor} bg-gradient-to-br ${exam.color} overflow-hidden transition-all`}
              >
                <button
                  onClick={() => setExpandedExam(expandedExam === i ? null : i)}
                  className="w-full flex items-center gap-4 p-4 md:p-5 text-left bg-transparent border-none cursor-pointer"
                >
                  <span className="text-2xl shrink-0">{exam.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-foreground">{exam.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{exam.stats}</p>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-300 ${expandedExam === i ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {expandedExam === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 md:px-5 pb-5 pt-1">
                        <div className="space-y-4">
                          {exam.timeline.map((step, j) => (
                            <div key={j} className="flex gap-3.5">
                              <div className="flex flex-col items-center shrink-0">
                                <div className="w-8 h-8 rounded-full bg-background/80 border border-border/50 flex items-center justify-center text-sm shadow-sm">
                                  {step.icon}
                                </div>
                                {j < exam.timeline.length - 1 && (
                                  <div className="w-0.5 flex-1 bg-border/50 mt-1.5" />
                                )}
                              </div>
                              <div className="pb-2">
                                <p className="text-xs font-bold text-foreground mb-0.5">{step.year}</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">{step.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ========== PART B: Research-Proven Methods Mapping ========== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-xl md:text-2xl font-bold text-foreground text-center mb-2">
            Research-Backed Methods, Built Into Every Lesson
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-8 max-w-lg mx-auto">
            Your child practices techniques rooted in proven learning science used by the world's top institutions — every single day.
          </p>

          <Tabs defaultValue="first-principles" className="w-full">
            <TabsList className="w-full flex h-auto flex-wrap gap-1 bg-muted/50 p-1.5 mb-6">
              {methods.map(m => (
                <TabsTrigger
                  key={m.id}
                  value={m.id}
                  className="flex-1 min-w-[80px] text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {m.icon} {m.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {methods.map(m => (
              <TabsContent key={m.id} value={m.id}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl border border-border bg-card p-5 md:p-7"
                >
                  {/* Method header */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{m.icon}</span>
                    <div>
                      <h4 className="text-base font-bold text-foreground">{m.name}</h4>
                      <p className="text-xs text-primary font-semibold">{m.method}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">{m.how}</p>

                  {/* Mapping table */}
                  <div className="rounded-xl border border-border overflow-hidden mb-5">
                    <div className="grid grid-cols-2 bg-muted/50 border-b border-border">
                      <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">What you learn on EduTech</div>
                      <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">The research method</div>
                    </div>
                    {m.mapping.map((mp, i) => (
                      <div key={i} className={`grid grid-cols-2 ${i < m.mapping.length - 1 ? "border-b border-border/50" : ""}`}>
                        <div className="px-3 py-2.5 flex items-center gap-2">
                          <BookOpen className="h-3 w-3 text-primary shrink-0" />
                          <span className="text-xs font-semibold text-primary">{mp.edutech}</span>
                        </div>
                        <div className="px-3 py-2.5 flex items-center">
                          <span className="text-xs text-foreground">{mp.institution}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="border-l-2 border-primary/30 pl-4 py-1">
                    <p className="text-xs text-muted-foreground italic leading-relaxed">{m.quote}</p>
                  </blockquote>
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>

        {/* CTA to Board vs JEE */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <button
            onClick={() => navigate("/board-vs-jee")}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold text-sm transition-all hover:shadow-[0_8px_25px_hsl(162_65%_38%/0.3)] hover:-translate-y-0.5 group"
          >
            See Board vs JEE Mode in Action
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default ResearchProvenMethods;
