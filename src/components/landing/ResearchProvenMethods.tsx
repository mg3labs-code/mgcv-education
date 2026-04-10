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
      { year: "Year 1-2", icon: "🗣️", text: "Every IIT class is a discussion, not a lecture. Professors ASK, students ARGUE. That's your Debate Challenge." },
      { year: "Year 2-3", icon: "🔧", text: "You don't just study thermodynamics — you DESIGN a heat exchanger. Every assignment is 'Use it in real life'." },
      { year: "Year 3-4", icon: "🔬", text: "Research projects where panels question every assumption — exactly like 'What if we're wrong?'" },
      { year: "Career", icon: "🚀", text: "₹15-50 LPA starting. Google, Microsoft, Goldman Sachs recruit on campus. The REAL advantage: they THINK differently." },
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
    name: "Olympiad → MIT / Stanford",
    icon: "🏅",
    lucideIcon: Trophy,
    color: "from-amber-500/10 to-yellow-500/10",
    borderColor: "border-amber-200 dark:border-amber-800",
    accentColor: "text-amber-600",
    stats: "5 lakh start → 6 represent India → top 0.001%",
    timeline: [
      { year: "The Journey", icon: "🧠", text: "No standard method. You INVENT approaches. Every problem combines 'But WHY?' + 'What if we're wrong?' + 'Break It Down'." },
      { year: "University", icon: "🎓", text: "Direct admission to MIT, Stanford, Cambridge. These universities value THINKING over marks — exactly what Inner OS measures." },
      { year: "Career", icon: "🏆", text: "Alumni include Fields Medal winners, Nobel laureates, founders of Dropbox, Quora, Two Sigma." },
      { year: "The Real Prize", icon: "♾️", text: "The HABIT of first-principles thinking. That habit compounds for life." },
    ],
  },
];

/* ============ PART B: University Methods ============ */

const universities = [
  {
    id: "iit",
    name: "IIT",
    flag: "🇮🇳",
    method: "Problem-Based Learning",
    how: "IIT professors present a PROBLEM, students work to solve it, then defend their approach. The professor asks 'Why?' until shallow answers run out.",
    mapping: [
      { edutech: "Debate Challenge", university: "Viva voce / oral examination" },
      { edutech: "Break It Down", university: "First-principles derivation" },
      { edutech: "Use it in real life", university: "Design projects every semester" },
      { edutech: "What if we're wrong?", university: "Engineering failure analysis" },
    ],
    quote: "\"IIT didn't teach me answers. It taught me how to find answers to questions nobody has asked yet.\"",
  },
  {
    id: "oxford",
    name: "Oxford",
    flag: "🇬🇧",
    method: "Tutorial System",
    how: "One student, one professor, one hour, every week. The student writes an essay defending a position, then the professor ATTACKS every argument.",
    mapping: [
      { edutech: "Debate Challenge", university: "Weekly 1-on-1 tutorials" },
      { edutech: "Teach your friend", university: "Essay defence" },
      { edutech: "But WHY though?", university: "The tutorial question" },
      { edutech: "What does this mean?", university: "Philosophical reflection" },
    ],
    quote: "\"The tutorial is where you discover what you DON'T understand. That discomfort is where learning happens.\"",
  },
  {
    id: "harvard",
    name: "Harvard / MIT",
    flag: "🇺🇸",
    method: "Case Method + Research",
    how: "Harvard teaches ENTIRELY through real company cases. MIT emphasizes building things that work. Both prioritize APPLICATION over memorization.",
    mapping: [
      { edutech: "Use it in real life", university: "Case study method" },
      { edutech: "Where else does this appear?", university: "Cross-disciplinary thinking" },
      { edutech: "What if we're wrong?", university: "Hypothesis testing" },
      { edutech: "Try it yourself!", university: "Maker culture / Labs" },
    ],
    quote: "\"The goal of education is not to fill a bucket but to light a fire.\"",
  },
  {
    id: "stanford",
    name: "Stanford",
    flag: "🇺🇸",
    method: "Design Thinking",
    how: "Empathize → Define → Ideate → Prototype → Test. Every problem starts with understanding PEOPLE. This is why Stanford graduates built Google, Instagram, Netflix.",
    mapping: [
      { edutech: "What's the big idea?", university: "Empathize + Define" },
      { edutech: "Try it yourself!", university: "Prototype & Test" },
      { edutech: "What if we're wrong?", university: "Test + Iterate" },
      { edutech: "Where else does this appear?", university: "Cross-pollination" },
    ],
    quote: "\"Most people die at 25 and aren't buried until 75. Stanford wakes you up.\"",
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
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">India's First Research-Proven Platform</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Backed by the World's{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-info">
              Best Teaching Methods
            </span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Not coaching tricks. Not rote learning. The exact pedagogical methods used by IIT, Oxford, Harvard, and Stanford — 
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

        {/* ========== PART B: University Methods Mapping ========== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-xl md:text-2xl font-bold text-foreground text-center mb-2">
            Elite University Methods, Built Into Every Lesson
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-8 max-w-lg mx-auto">
            Your child practices the SAME techniques used at IIT, Oxford, Harvard, and Stanford — every single day.
          </p>

          <Tabs defaultValue="iit" className="w-full">
            <TabsList className="w-full flex h-auto flex-wrap gap-1 bg-muted/50 p-1.5 mb-6">
              {universities.map(u => (
                <TabsTrigger
                  key={u.id}
                  value={u.id}
                  className="flex-1 min-w-[80px] text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {u.flag} {u.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {universities.map(uni => (
              <TabsContent key={uni.id} value={uni.id}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl border border-border bg-card p-5 md:p-7"
                >
                  {/* University header */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{uni.flag}</span>
                    <div>
                      <h4 className="text-base font-bold text-foreground">{uni.name}</h4>
                      <p className="text-xs text-primary font-semibold">{uni.method}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">{uni.how}</p>

                  {/* Mapping table */}
                  <div className="rounded-xl border border-border overflow-hidden mb-5">
                    <div className="grid grid-cols-2 bg-muted/50 border-b border-border">
                      <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">What you learn on EduTech</div>
                      <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">What {uni.name} calls it</div>
                    </div>
                    {uni.mapping.map((m, i) => (
                      <div key={i} className={`grid grid-cols-2 ${i < uni.mapping.length - 1 ? "border-b border-border/50" : ""}`}>
                        <div className="px-3 py-2.5 flex items-center gap-2">
                          <BookOpen className="h-3 w-3 text-primary shrink-0" />
                          <span className="text-xs font-semibold text-primary">{m.edutech}</span>
                        </div>
                        <div className="px-3 py-2.5 flex items-center">
                          <span className="text-xs text-foreground">{m.university}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="border-l-2 border-primary/30 pl-4 py-1">
                    <p className="text-xs text-muted-foreground italic leading-relaxed">{uni.quote}</p>
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
