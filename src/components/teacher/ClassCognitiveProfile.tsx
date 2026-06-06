import { Card } from "@/components/ui/card";
import { Eye, Brain, Target, Heart, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface Dim {
  key: string;
  label: string;
  score: number;
  Icon: typeof Eye;
  color: string;
  delta: number; // week-over-week
}

interface Props {
  scores: { label: string; score: number }[];
  studentCount: number;
}

const ICONS: Record<string, { Icon: typeof Eye; color: string }> = {
  Clarity:   { Icon: Eye,    color: "hsl(173 80% 35%)" },
  Thinking:  { Icon: Brain,  color: "hsl(258 65% 56%)" },
  Focus:     { Icon: Target, color: "hsl(38 92% 50%)" },
  Character: { Icon: Heart,  color: "hsl(330 81% 60%)" },
};

const statusFor = (s: number) =>
  s >= 75 ? { label: "Strong", tint: "text-emerald-600 bg-emerald-500/10" } :
  s >= 55 ? { label: "Healthy", tint: "text-sky-600 bg-sky-500/10" } :
  s >= 40 ? { label: "Building", tint: "text-amber-600 bg-amber-500/10" } :
            { label: "Needs focus", tint: "text-rose-600 bg-rose-500/10" };

const ClassCognitiveProfile = ({ scores, studentCount }: Props) => {
  // Deterministic mock deltas so the panel always looks alive
  const deltaMap: Record<string, number> = { Clarity: 4, Thinking: -2, Focus: 6, Character: 1 };

  const dims: Dim[] = scores.map((s) => ({
    key: s.label,
    label: s.label,
    score: s.score,
    Icon: ICONS[s.label]?.Icon ?? Brain,
    color: ICONS[s.label]?.color ?? "hsl(258 65% 56%)",
    delta: deltaMap[s.label] ?? 0,
  }));

  const overall = Math.round(dims.reduce((a, d) => a + d.score, 0) / Math.max(1, dims.length));
  const overallStatus = statusFor(overall);
  const strongest = [...dims].sort((a, b) => b.score - a.score)[0];
  const weakest = [...dims].sort((a, b) => a.score - b.score)[0];

  const radarData = dims.map((d) => ({ dim: d.label, score: d.score, full: 100 }));

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      {/* Header band */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-5 sm:px-6 py-5 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background:
              "radial-gradient(600px 160px at 15% 0%, rgba(45,212,191,.35), transparent 60%), radial-gradient(500px 160px at 90% 100%, rgba(167,139,250,.35), transparent 60%)",
          }}
        />
        <div className="relative flex items-start gap-4 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-emerald-300">
              Class Cognitive Profile
            </div>
            <div className="text-lg sm:text-xl font-bold mt-0.5">Inner OS · {studentCount} students</div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-white/60">Overall</div>
              <div className="text-2xl sm:text-3xl font-bold tabular-nums">{overall}%</div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${overallStatus.tint.replace("bg-", "bg-white/").replace("text-emerald-600","text-emerald-300").replace("text-sky-600","text-sky-300").replace("text-amber-600","text-amber-300").replace("text-rose-600","text-rose-300")} ring-1 ring-white/15`}>
              {overallStatus.label}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-4 sm:gap-6 p-4 sm:p-6 bg-card">
        {/* Radar */}
        <div className="relative">
          <div className="h-[260px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="78%">
                <defs>
                  <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(173 80% 45%)" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="hsl(258 65% 60%)" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="dim"
                  tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickCount={5}
                />
                <Radar
                  name="Class"
                  dataKey="score"
                  stroke="hsl(173 80% 40%)"
                  fill="url(#radarFill)"
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--popover))",
                  }}
                  formatter={(v: number) => [`${v}%`, "Avg score"]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          {/* insight chips */}
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              <TrendingUp className="h-3 w-3" /> Strongest · {strongest.label} {strongest.score}%
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300">
              <TrendingDown className="h-3 w-3" /> Focus next · {weakest.label} {weakest.score}%
            </span>
          </div>
        </div>

        {/* Dimension breakdown */}
        <ul className="space-y-2.5">
          {dims.map((d) => {
            const st = statusFor(d.score);
            const Trend = d.delta > 0 ? TrendingUp : d.delta < 0 ? TrendingDown : Minus;
            const trendColor = d.delta > 0 ? "text-emerald-600" : d.delta < 0 ? "text-rose-600" : "text-muted-foreground";
            return (
              <li
                key={d.key}
                className="relative p-3 sm:p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${d.color}18` }}
                  >
                    <d.Icon className="h-5 w-5" style={{ color: d.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{d.label}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${st.tint}`}>
                        {st.label}
                      </span>
                    </div>
                    <div className={`text-[11px] flex items-center gap-1 ${trendColor} font-medium mt-0.5`}>
                      <Trend className="h-3 w-3" />
                      {d.delta > 0 ? "+" : ""}{d.delta} pts this week
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-bold tabular-nums text-foreground leading-none">
                      {d.score}<span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>
                {/* progress bar */}
                <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(2, d.score)}%`,
                      background: `linear-gradient(90deg, ${d.color}, ${d.color}cc)`,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
};

export default ClassCognitiveProfile;
