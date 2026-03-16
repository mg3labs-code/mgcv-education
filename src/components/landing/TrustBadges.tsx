import { Shield, Award, Zap, Globe } from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";

const badges = [
  { icon: Shield, label: "Students Empowered", value: 12500, suffix: "+" },
  { icon: Award, label: "Avg Score Uplift", value: 23, suffix: "%" },
  { icon: Zap, label: "Learning Episodes", value: 850, suffix: "+" },
  { icon: Globe, label: "Schools Connected", value: 45, suffix: "+" },
];

const TrustBadges = () => (
  <section className="relative z-10 py-16 md:py-24">
    <div className="max-w-[1200px] mx-auto px-4 md:px-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {badges.map(({ icon: Icon, label, value, suffix }, i) => (
          <div
            key={label}
            className="glass-premium rounded-2xl p-5 md:p-7 text-center group"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
              <AnimatedCounter end={value} suffix={suffix} />
            </div>
            <div className="text-xs md:text-sm text-muted-foreground font-medium">{label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustBadges;
