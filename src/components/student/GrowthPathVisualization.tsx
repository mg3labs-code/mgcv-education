import { motion } from "framer-motion";

interface GrowthPathProps {
  dimensionScores: { name: string; score: number; icon: string; color: string }[];
}

const pathData = [
  {
    dimension: "Clarity",
    icon: "👁️",
    color: "#0D9488",
    careers: ["Research", "Medicine", "Law"],
    insight: "Surgeons need this precision — seeing complex systems clearly saves lives.",
  },
  {
    dimension: "Thinking",
    icon: "🧠",
    color: "#7C3AED",
    careers: ["JEE Advanced", "PhDs", "Innovation"],
    insight: "Every startup solves unseen problems. Deep reasoning is the founder's edge.",
  },
  {
    dimension: "Attention",
    icon: "🎯",
    color: "#F59E0B",
    careers: ["Deep Work", "Engineering", "Art"],
    insight: "Focus is the #1 career advantage. Cal Newport calls it a superpower.",
  },
  {
    dimension: "Momentum",
    icon: "🚀",
    color: "#3B82F6",
    careers: ["Sports discipline", "Entrepreneurship"],
    insight: "Consistency beats talent. 1% daily improvement = 37× in a year.",
  },
  {
    dimension: "Character",
    icon: "❤️",
    color: "#EC4899",
    careers: ["IIM interviews", "Leadership", "Public service"],
    insight: "Honest self-assessment is the foundation of growth. IIM panels test this.",
  },
];

export default function GrowthPathVisualization({ dimensionScores }: GrowthPathProps) {
  const scoreMap: Record<string, number> = {};
  dimensionScores.forEach(d => {
    scoreMap[d.name] = d.score;
  });

  return (
    <div style={{
      background: "white", borderRadius: 16, border: "1px solid #E7E5E4",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: 24,
    }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 20, fontWeight: 700, color: "#1C1917", margin: 0 }}>
          🌍 Where Your Skills Lead
        </h3>
        <p style={{ fontSize: 13, color: "#78716C", margin: "4px 0 0", fontFamily: "'DM Sans', sans-serif" }}>
          Your Inner OS dimensions map to real-world career advantages
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {pathData.map((p, i) => {
          const score = scoreMap[p.dimension] ?? scoreMap[p.dimension.charAt(0).toUpperCase() + p.dimension.slice(1)] ?? 0;
          return (
            <motion.div
              key={p.dimension}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              style={{ display: "flex", gap: 14, paddingBottom: i < pathData.length - 1 ? 20 : 0 }}
            >
              {/* Timeline line */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 44, flexShrink: 0 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: `${p.color}15`,
                  border: `2px solid ${p.color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, position: "relative",
                }}>
                  {p.icon}
                  {/* Score badge */}
                  <div style={{
                    position: "absolute", top: -6, right: -6,
                    width: 22, height: 22, borderRadius: "50%",
                    background: p.color, color: "white",
                    fontSize: 9, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  }}>
                    {score}
                  </div>
                </div>
                {i < pathData.length - 1 && (
                  <div style={{
                    width: 2, flex: 1, marginTop: 4,
                    background: `linear-gradient(to bottom, ${p.color}30, ${pathData[i + 1].color}30)`,
                  }} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, paddingTop: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14, color: "#1C1917" }}>
                    {p.dimension}
                  </span>
                  <span style={{ fontSize: 10, color: p.color, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                    {score}%
                  </span>
                </div>

                {/* Career tags */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                  {p.careers.map(c => (
                    <span key={c} style={{
                      fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 8,
                      background: `${p.color}10`, color: p.color,
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      {c}
                    </span>
                  ))}
                </div>

                <p style={{ fontSize: 12, color: "#78716C", margin: 0, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
                  {p.insight}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
