import { motion } from "framer-motion";

interface ThinkingNetworkProps {
  scores: { name: string; score: number; icon: string; color: string }[];
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  animate?: boolean;
}

/**
 * A simplified "neural network" style visualization showing how the 5 Inner OS
 * dimensions connect — like nodes in a brain. Clean, intuitive, no complex charts.
 */
export default function ThinkingNetwork({ scores, size = "md", showLabels = true, animate = true }: ThinkingNetworkProps) {
  const dims = size === "sm" ? { w: 260, h: 240, r: 80, nodeR: 28, centerR: 24 }
    : size === "lg" ? { w: 400, h: 380, r: 140, nodeR: 38, centerR: 32 }
    : { w: 320, h: 300, r: 110, nodeR: 32, centerR: 28 };

  const cx = dims.w / 2;
  const cy = dims.h / 2;

  // Position nodes in a pentagon around center
  const nodes = scores.map((s, i) => {
    const angle = (i * (2 * Math.PI) / scores.length) - Math.PI / 2;
    return {
      ...s,
      x: cx + dims.r * Math.cos(angle),
      y: cy + dims.r * Math.sin(angle),
    };
  });

  const avgScore = Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length);

  // Connection strength based on score similarity (closer scores = stronger connection)
  const getConnectionOpacity = (s1: number, s2: number) => {
    const diff = Math.abs(s1 - s2);
    return Math.max(0.08, 0.4 - diff * 0.005);
  };

  // Pulse ring radius based on score
  const getPulseR = (score: number) => dims.nodeR + 4 + (score / 100) * 8;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={dims.w} height={dims.h} style={{ overflow: "visible" }}>
        {/* Connections between all nodes */}
        {nodes.map((n1, i) =>
          nodes.map((n2, j) => {
            if (j <= i) return null;
            const opacity = getConnectionOpacity(n1.score, n2.score);
            return (
              <motion.line
                key={`${i}-${j}`}
                x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
                stroke="#94A3B8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                initial={animate ? { opacity: 0 } : { opacity }}
                animate={{ opacity }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }}
              />
            );
          })
        )}

        {/* Connections from nodes to center */}
        {nodes.map((n, i) => (
          <motion.line
            key={`center-${i}`}
            x1={cx} y1={cy} x2={n.x} y2={n.y}
            stroke={n.color}
            strokeWidth={2}
            strokeOpacity={0.25}
            initial={animate ? { pathLength: 0, opacity: 0 } : {}}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
          />
        ))}

        {/* Center node — overall score */}
        <motion.circle
          cx={cx} cy={cy} r={dims.centerR}
          fill="#1C1917"
          initial={animate ? { scale: 0 } : {}}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={size === "sm" ? 14 : 18} fontWeight={700} fill="white" fontFamily="'Source Serif 4', serif">
          {avgScore}%
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.6)" fontFamily="'DM Sans', sans-serif">
          OVERALL
        </text>

        {/* Dimension nodes */}
        {nodes.map((n, i) => (
          <motion.g
            key={n.name}
            initial={animate ? { opacity: 0, scale: 0 } : {}}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", delay: 0.3 + i * 0.1 }}
          >
            {/* Pulse ring — bigger for higher scores */}
            <circle
              cx={n.x} cy={n.y} r={getPulseR(n.score)}
              fill="none"
              stroke={n.color}
              strokeWidth={1.5}
              strokeOpacity={0.15}
              strokeDasharray={`${(n.score / 100) * (2 * Math.PI * getPulseR(n.score))} ${2 * Math.PI * getPulseR(n.score)}`}
              transform={`rotate(-90 ${n.x} ${n.y})`}
            />

            {/* Score arc — fills proportionally */}
            <circle
              cx={n.x} cy={n.y} r={dims.nodeR}
              fill="white"
              stroke="#E7E5E4"
              strokeWidth={1}
            />
            <circle
              cx={n.x} cy={n.y} r={dims.nodeR}
              fill="none"
              stroke={n.color}
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={`${(n.score / 100) * (2 * Math.PI * dims.nodeR)} ${2 * Math.PI * dims.nodeR}`}
              transform={`rotate(-90 ${n.x} ${n.y})`}
            />

            {/* Icon */}
            <text x={n.x} y={n.y - 2} textAnchor="middle" fontSize={size === "sm" ? 14 : 18} dominantBaseline="central">
              {n.icon}
            </text>

            {/* Score text */}
            <text
              x={n.x} y={n.y + (size === "sm" ? 12 : 16)}
              textAnchor="middle"
              fontSize={size === "sm" ? 9 : 11}
              fontWeight={700}
              fill={n.color}
              fontFamily="'DM Sans', sans-serif"
            >
              {n.score}%
            </text>

            {/* Label below */}
            {showLabels && (
              <text
                x={n.x}
                y={n.y + dims.nodeR + (size === "sm" ? 14 : 18)}
                textAnchor="middle"
                fontSize={size === "sm" ? 9 : 11}
                fill="#78716C"
                fontFamily="'DM Sans', sans-serif"
                fontWeight={600}
              >
                {n.name}
              </text>
            )}
          </motion.g>
        ))}
      </svg>
    </div>
  );
}
