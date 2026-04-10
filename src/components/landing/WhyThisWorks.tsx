import { motion } from "framer-motion";
import { BookOpen, Brain, Lightbulb, MessageSquare, Shield, Briefcase } from "lucide-react";

const comparison = [
  {
    type: "School",
    teaches: "WHAT to learn",
    emoji: "🏫",
    desc: "Memorize facts, follow syllabus, pass exams",
    color: "border-muted-foreground/30",
    bg: "bg-muted/30",
  },
  {
    type: "Coaching",
    teaches: "HOW TO SCORE",
    emoji: "📝",
    desc: "Tricks, shortcuts, pattern-matching for marks",
    color: "border-amber-300 dark:border-amber-700",
    bg: "bg-amber-50/50 dark:bg-amber-950/20",
  },
  {
    type: "EduTech",
    teaches: "HOW TO THINK",
    emoji: "🧠",
    desc: "Build reasoning, question assumptions, apply knowledge",
    color: "border-primary",
    bg: "bg-primary/5",
    highlight: true,
  },
];

const universityMethods = [
  {
    university: "Oxford Tutorial",
    flag: "🇬🇧",
    method: "Debate & challenge assumptions",
    feature: "What if we're wrong?",
    featureDesc: "Assumptions Block",
    icon: Shield,
    color: "from-red-500/10 to-orange-500/10 dark:from-red-950/30 dark:to-orange-950/20",
    borderColor: "border-red-200 dark:border-red-800",
  },
  {
    university: "Harvard Case Method",
    flag: "🇺🇸",
    method: "Apply theory to real scenarios",
    feature: "Use it in real life",
    featureDesc: "Application Block",
    icon: Briefcase,
    color: "from-blue-500/10 to-indigo-500/10 dark:from-blue-950/30 dark:to-indigo-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  {
    university: "IIT Problem-Based",
    flag: "🇮🇳",
    method: "Break complex problems into first principles",
    feature: "But WHY though?",
    featureDesc: "Reasoning Block",
    icon: Brain,
    color: "from-amber-500/10 to-yellow-500/10 dark:from-amber-950/30 dark:to-yellow-950/20",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  {
    university: "Feynman Technique",
    flag: "🔬",
    method: "Explain it simply to truly understand",
    feature: "Teach your friend",
    featureDesc: "Explain Block",
    icon: MessageSquare,
    color: "from-purple-500/10 to-violet-500/10 dark:from-purple-950/30 dark:to-violet-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
];

const WhyThisWorks = () => {
  return (
    <section className="relative z-10 py-16 md:py-24 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 md:px-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Lightbulb className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Proven Methodology</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Why This <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-info">Actually Works</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            We don't just teach — we integrate the exact methods used by the world's top universities into your daily learning.
          </p>
        </motion.div>

        {/* 3-Column Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16"
        >
          {comparison.map((c, i) => (
            <div key={i} className={`rounded-2xl border-2 ${c.color} ${c.bg} p-6 text-center transition-all ${c.highlight ? "scale-[1.02] shadow-lg ring-2 ring-primary/20" : ""}`}>
              <span className="text-3xl mb-3 block">{c.emoji}</span>
              <h3 className={`text-lg font-bold mb-1 ${c.highlight ? "text-primary" : "text-foreground"}`}>{c.type}</h3>
              <p className={`text-sm font-semibold mb-2 ${c.highlight ? "text-primary" : "text-muted-foreground"}`}>
                Teaches {c.teaches}
              </p>
              <p className="text-xs text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* University Method Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6"
        >
          <h3 className="text-xl md:text-2xl font-bold text-foreground text-center mb-2">
            Elite Methods, Built Into Every Lesson
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Your child practices the same techniques used at IIT, Oxford, and Harvard — every single day.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {universityMethods.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className={`rounded-2xl border ${m.borderColor} bg-gradient-to-br ${m.color} p-5 hover:shadow-md transition-all`}
            >
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-background/80 border border-border/50 flex items-center justify-center shrink-0 shadow-sm">
                  <m.icon className="h-5 w-5 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{m.flag}</span>
                    <h4 className="text-sm font-bold text-foreground">{m.university}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{m.method}</p>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/60 border border-border/50 text-xs font-semibold text-primary">
                    <BookOpen className="h-3 w-3" />
                    {m.feature}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom message */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center text-sm text-muted-foreground mt-10 max-w-lg mx-auto"
        >
          "School teaches <strong className="text-foreground">what</strong> to know. Coaching teaches <strong className="text-foreground">how to score</strong>. We teach <strong className="text-primary">how to think</strong> — and the scores follow naturally."
        </motion.p>
      </div>
    </section>
  );
};

export default WhyThisWorks;
