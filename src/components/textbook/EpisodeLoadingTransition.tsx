import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const TIPS = [
  "🧠 Did you know? Spacing out your study improves memory by 50%!",
  "⚡ Fun fact: Your brain uses 20% of your body's energy!",
  "🎯 Pro tip: Explain concepts aloud to learn 2x faster",
  "💡 The best learners ask 'why?' at every step",
  "🚀 Small daily progress beats cramming every time",
  "🌟 You're about to unlock new knowledge!",
];

const EMOJIS = ["📚", "🎓", "✨", "🔬", "🧪", "📐", "🎨", "💻"];

const EpisodeLoadingTransition = () => {
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 15 + 5, 95));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #F0FDFA 0%, #ECFDF5 30%, #EFF6FF 60%, #F5F3FF 100%)" }}>

      {/* Floating emoji runner */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {EMOJIS.map((emoji, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ fontSize: 20 + Math.random() * 12, opacity: 0.15 }}
            initial={{ x: -60, y: 80 + i * 70 }}
            animate={{ x: typeof window !== "undefined" ? window.innerWidth + 60 : 1200 }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "linear",
            }}
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      {/* Center content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-6 z-10 px-8 max-w-sm text-center"
      >
        {/* Running character */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ fontSize: 48, lineHeight: 1 }}
        >
          🏃‍♂️
        </motion.div>

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
          <motion.div
            style={{
              height: "100%", borderRadius: 3,
              background: "linear-gradient(90deg, #0D9488, #14B8A6, #3B82F6)",
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Bouncing dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: "#0D9488" }}
              animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default EpisodeLoadingTransition;
