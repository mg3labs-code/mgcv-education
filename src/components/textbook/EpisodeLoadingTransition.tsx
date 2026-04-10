import { useEffect, useState } from "react";

const TIPS = [
  "🧠 Did you know? Spacing out your study improves memory by 50%!",
  "⚡ Fun fact: Your brain uses 20% of your body's energy!",
  "🎯 Pro tip: Explain concepts aloud to learn 2x faster",
  "💡 The best learners ask 'why?' at every step",
  "🚀 Small daily progress beats cramming every time",
  "🌟 You're about to unlock new knowledge!",
];

const EpisodeLoadingTransition = () => {
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 18 + 8, 95));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #F0FDFA 0%, #ECFDF5 30%, #EFF6FF 60%, #F5F3FF 100%)" }}>

      {/* Simple CSS-animated floating icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {["📚", "🎓", "✨", "🔬"].map((emoji, i) => (
          <div
            key={i}
            className="absolute animate-float-across"
            style={{
              fontSize: 22, opacity: 0.12,
              top: `${20 + i * 18}%`,
              animationDelay: `${i * 0.6}s`,
              animationDuration: `${4 + i * 0.5}s`,
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      {/* Center content */}
      <div className="flex flex-col items-center gap-5 z-10 px-8 max-w-sm text-center animate-fade-in">
        {/* Bouncing runner */}
        <div className="animate-bounce" style={{ fontSize: 44, lineHeight: 1 }}>🏃‍♂️</div>

        <div>
          <h2 style={{
            fontSize: 18, fontWeight: 700, color: "#1C1917",
            fontFamily: "'DM Sans', sans-serif", marginBottom: 4,
          }}>
            Getting your lesson ready...
          </h2>
          <p style={{
            fontSize: 13, color: "#78716C", lineHeight: 1.6,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {tip}
          </p>
        </div>

        {/* Progress bar */}
        <div style={{
          width: "100%", maxWidth: 240, height: 6, borderRadius: 3,
          background: "#E7E5E4", overflow: "hidden",
        }}>
          <div
            style={{
              height: "100%", borderRadius: 3,
              background: "linear-gradient(90deg, #0D9488, #14B8A6, #3B82F6)",
              width: `${progress}%`,
              transition: "width 0.3s ease",
            }}
          />
        </div>

        {/* Bouncing dots via CSS */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                background: "#0D9488",
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes float-across {
          0% { transform: translateX(-60px); }
          100% { transform: translateX(calc(100vw + 60px)); }
        }
        .animate-float-across {
          animation: float-across 5s linear infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default EpisodeLoadingTransition;
