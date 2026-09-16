import { ArrowRight, CheckCircle2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const differences = [
  { generic: "Videos to watch", ours: "Active reasoning" },
  { generic: "Practice questions", ours: "Tutorial Defense" },
  { generic: "Marks tracking", ours: "Cognitive development" },
  { generic: "One-size-fits-all", ours: "Intrinsic motivation" },
];

const TrustBadges = () => {
  const navigate = useNavigate();

  return (
    <section className="relative z-10 py-12 md:py-20">
      <div className="max-w-[1000px] mx-auto px-4 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Not another EdTech app
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            We don't replace teachers — we give them research-backed pedagogy tools.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-2 gap-3 md:gap-4 mb-8"
        >
          {/* Headers */}
          <div className="text-center py-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Generic EdTech</span>
          </div>
          <div className="text-center py-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Student Inner OS</span>
          </div>

          {/* Rows */}
          {differences.map((d, i) => (
            <>
              <div key={`g-${i}`} className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-3 border border-border/30">
                <X className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                <span className="text-sm text-muted-foreground">{d.generic}</span>
              </div>
              <div key={`o-${i}`} className="flex items-center gap-2 bg-primary/5 rounded-xl px-3 py-3 border border-primary/20">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground">{d.ours}</span>
              </div>
            </>
          ))}
        </motion.div>

        {/* Try Demo */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <button
            onClick={() => navigate("/attraction-demo")}
            className="group bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold text-sm transition-all hover:shadow-[0_12px_30px_hsl(162_65%_38%/0.35)] hover:-translate-y-0.5 inline-flex items-center gap-2"
          >
            Try Demo
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Curriculum badges */}
        <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">✓ CBSE</span>
          <span className="flex items-center gap-1">✓ ICSE</span>
          <span className="flex items-center gap-1">✓ IB</span>
          <span className="flex items-center gap-1">✓ 100% Curriculum Coverage</span>
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
