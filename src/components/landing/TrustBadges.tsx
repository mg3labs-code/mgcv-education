import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TrustBadges = () => {
  const navigate = useNavigate();

  return (
    <section className="relative z-10 py-12 md:py-16">
      <div className="max-w-[800px] mx-auto px-4 md:px-10 text-center">
        <div className="glass-premium rounded-2xl p-6 md:p-8 flex flex-col items-center gap-4">
          <h3 className="text-lg md:text-xl font-bold text-foreground">
            🎯 See it in action
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Experience how our AI-powered attraction system connects students' interests to real curriculum topics.
          </p>
          <button
            onClick={() => navigate("/attraction-demo")}
            className="group bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold text-sm transition-all hover:shadow-[0_12px_30px_hsl(162_65%_38%/0.35)] hover:-translate-y-0.5 flex items-center gap-2"
          >
            Try Demo
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
