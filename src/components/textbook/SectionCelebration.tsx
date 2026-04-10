import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const CELEBRATIONS = [
  { emoji: "🎉", text: "Nailed it!" },
  { emoji: "🔥", text: "On fire!" },
  { emoji: "💪", text: "Crushing it!" },
  { emoji: "⚡", text: "Lightning fast!" },
  { emoji: "🚀", text: "Blast off!" },
  { emoji: "✨", text: "Brilliant!" },
  { emoji: "🏆", text: "Champion!" },
  { emoji: "🌟", text: "Superstar!" },
];

const SectionCelebration = ({ show, onDone }: { show: boolean; onDone: () => void }) => {
  const [celebration] = useState(() => CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)]);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(onDone, 1400);
      return () => clearTimeout(timer);
    }
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
        >
          {/* Confetti burst */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: Math.random() * 6 + 3,
                  height: Math.random() * 6 + 3,
                  background: ["#0D9488", "#F59E0B", "#8B5CF6", "#EC4899", "#3B82F6", "#10B981"][i % 6],
                  left: "50%",
                  top: "50%",
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{
                  x: (Math.random() - 0.5) * 300,
                  y: (Math.random() - 0.5) * 300,
                  opacity: 0,
                  scale: 1.5,
                }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            ))}
          </div>

          {/* Center text */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="flex flex-col items-center gap-1"
          >
            <motion.span
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 12, delay: 0.1 }}
              style={{ fontSize: 56, lineHeight: 1 }}
            >
              {celebration.emoji}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              style={{
                fontSize: 24, fontWeight: 800, color: "#0D9488",
                fontFamily: "'DM Sans', sans-serif",
                textShadow: "0 2px 10px rgba(13,148,136,0.3)",
              }}
            >
              {celebration.text}
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SectionCelebration;
