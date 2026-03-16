import { Brain, BookOpenCheck, BarChart3, Sparkles, Users, Shield } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Brain,
    title: "AI Study Companion",
    desc: "Personalized tutoring that adapts to each student's thinking style and pace.",
    gradient: "from-primary/20 to-info/10",
  },
  {
    icon: BookOpenCheck,
    title: "7-Layer Textbook",
    desc: "Multi-dimensional content from first principles to real-world applications.",
    gradient: "from-warning/20 to-gold/10",
  },
  {
    icon: BarChart3,
    title: "Inner OS Analytics",
    desc: "Deep cognitive metrics — clarity, attention, momentum, and character scores.",
    gradient: "from-info/20 to-primary/10",
  },
  {
    icon: Sparkles,
    title: "Attraction System",
    desc: "Voice-powered interactive learning that makes concepts unforgettable.",
    gradient: "from-accent/20 to-success/10",
  },
  {
    icon: Users,
    title: "Teacher Intelligence",
    desc: "Class insights, daily planning, and parent connect — all in one command center.",
    gradient: "from-navy/20 to-info/10",
  },
  {
    icon: Shield,
    title: "Exam-Ready",
    desc: "AI-evaluated assignments, pop quizzes, and tutorial defense sessions.",
    gradient: "from-destructive/15 to-warning/10",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const FeatureShowcase = () => (
  <section className="relative z-10 py-16 md:py-28">
    <div className="max-w-[1200px] mx-auto px-4 md:px-10">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
          Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-info">Deep Learning</span>
        </h2>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
          Not just another LMS. A thinking platform that builds cognitive muscle.
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6"
      >
        {features.map(({ icon: Icon, title, desc, gradient }) => (
          <motion.div
            key={title}
            variants={item}
            className="glass-premium rounded-2xl p-6 md:p-8 card-hover-lift group cursor-default"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="h-6 w-6 text-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default FeatureShowcase;
