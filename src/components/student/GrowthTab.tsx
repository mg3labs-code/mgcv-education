import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useChapters } from "@/hooks/useTextbookData";

interface DimensionScore {
  name: string;
  score: number;
  icon: string;
  color: string;
  prev: number;
}

interface GrowthTabProps {
  dimensionScores: DimensionScore[];
  streakDays: number;
  episodeCount: number;
  methodCounts: Record<string, number>;
  breakthroughs: { id: string; title: string; description: string | null; icon: string; dimension: string | null; created_at: string; xp_earned: number }[];
  weeklyGrowth: number;
}

// ============ CARD / SECTION TITLE ============

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "white", borderRadius: 16, border: "1px solid #E7E5E4",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: 24, ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 20, fontWeight: 700, color: "#1C1917", margin: 0 }}>
        {icon} {title}
      </h3>
      {subtitle && <p style={{ fontSize: 13, color: "#78716C", margin: "4px 0 0", fontFamily: "'DM Sans', sans-serif" }}>{subtitle}</p>}
    </div>
  );
}

// ============ ACTIVITY HEATMAP ============

function ActivityHeatmap({ userId, streakDays }: { userId: string; streakDays: number }) {
  const [hoveredDay, setHoveredDay] = useState<any>(null);

  const { data: activityData } = useQuery({
    queryKey: ["growth-heatmap", userId],
    queryFn: async () => {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const { data, error } = await supabase
        .from("daily_activity")
        .select("activity_date, episodes_completed, time_spent_seconds, methods_used")
        .eq("user_id", userId)
        .gte("activity_date", ninetyDaysAgo.toISOString().split("T")[0])
        .order("activity_date");
      if (error) throw error;
      return data ?? [];
    },
  });

  const heatmapData = useMemo(() => {
    const map = new Map<string, number>();
    (activityData ?? []).forEach(d => {
      const total = (d.episodes_completed || 0) + (d.methods_used || 0);
      const intensity = total >= 3 ? 3 : total >= 2 ? 2 : total >= 1 ? 1 : (d.time_spent_seconds > 0 ? 1 : 0);
      map.set(d.activity_date, intensity);
    });

    const data = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split("T")[0];
      data.push({
        date,
        day: date.getDate(),
        month: date.getMonth(),
        dayOfWeek: date.getDay(),
        intensity: map.get(key) ?? 0,
        label: date.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      });
    }
    return data;
  }, [activityData]);

  // Group into weeks
  const weeks: (typeof heatmapData[0] | null)[][] = [];
  let currentWeek: (typeof heatmapData[0] | null)[] = [];
  const firstDay = heatmapData[0]?.dayOfWeek ?? 0;
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) currentWeek.push(null);
  heatmapData.forEach(d => {
    const dow = d.dayOfWeek === 0 ? 6 : d.dayOfWeek - 1;
    currentWeek.push(d);
    if (dow === 6) { weeks.push(currentWeek); currentWeek = []; }
  });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const colors = ["#EBEDF0", "#BBF7D0", "#4ADE80", "#16A34A", "#15803D"];
  const dayLabels = ["Mon", "", "Wed", "", "Fri", "", ""];
  const activeDays = heatmapData.filter(d => d.intensity > 0).length;

  return (
    <Card>
      <SectionTitle icon="📅" title="Activity & Streaks" subtitle="Your study consistency over 90 days" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Current Streak", value: `${streakDays} days`, icon: "🔥", color: "#F59E0B", bg: "#FEF3C7" },
          { label: "Longest Streak", value: `${Math.max(streakDays, 7)} days`, icon: "🏆", color: "#7C3AED", bg: "#F5F3FF" },
          { label: "Active Days", value: `${activeDays}/90`, icon: "📅", color: "#0D9488", bg: "#F0FDFA" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center", padding: "14px 8px", borderRadius: 12, background: s.bg }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: "'Source Serif 4', serif", marginTop: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ overflowX: "auto", paddingBottom: 8 }}>
        <div style={{ display: "flex", gap: 3 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, marginRight: 4, paddingTop: 18 }}>
            {dayLabels.map((d, i) => (
              <div key={i} style={{ height: 12, fontSize: 9, color: "#A8A29E", lineHeight: "12px", fontFamily: "'DM Sans', sans-serif" }}>{d}</div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ height: 14, fontSize: 9, color: "#A8A29E", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>
                {week.find(d => d && d.day <= 7) ? week.find(d => d && d.day <= 7)!.date.toLocaleDateString("en-IN", { month: "short" }) : ""}
              </div>
              {Array.from({ length: 7 }).map((_, di) => {
                const d = week[di];
                if (!d) return <div key={di} style={{ width: 12, height: 12 }} />;
                return (
                  <div key={di}
                    onMouseEnter={() => setHoveredDay(d)}
                    onMouseLeave={() => setHoveredDay(null)}
                    style={{
                      width: 12, height: 12, borderRadius: 2,
                      background: colors[d.intensity],
                      cursor: "pointer",
                      transition: "transform 0.1s",
                      transform: hoveredDay === d ? "scale(1.4)" : "scale(1)",
                      outline: hoveredDay === d ? "2px solid #0D9488" : "none",
                      outlineOffset: 1,
                    }}
                    title={`${d.label}: ${d.intensity === 0 ? "No activity" : `${d.intensity} session${d.intensity > 1 ? "s" : ""}`}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", marginTop: 8, fontSize: 10, color: "#A8A29E", fontFamily: "'DM Sans', sans-serif" }}>
        Less
        {colors.map((c, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: c }} />
        ))}
        More
      </div>

      {hoveredDay && (
        <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>
          {hoveredDay.label} •{" "}
          <span style={{ color: hoveredDay.intensity > 0 ? "#4ADE80" : "#EF4444" }}>
            {hoveredDay.intensity === 0 ? "No activity" : `${hoveredDay.intensity} study session${hoveredDay.intensity > 1 ? "s" : ""}`}
          </span>
        </div>
      )}
    </Card>
  );
}

// ============ INNER OS TRENDS ============

const INNER_OS_WEEKS_BASE = [
  { week: "Week 1", clarity: 28, thinking: 25, focus: 30, momentum: 20, character: 30 },
  { week: "Week 2", clarity: 32, thinking: 30, focus: 33, momentum: 25, character: 33 },
  { week: "Week 3", clarity: 36, thinking: 34, focus: 35, momentum: 30, character: 36 },
  { week: "Week 4", clarity: 40, thinking: 38, focus: 38, momentum: 33, character: 40 },
  { week: "Week 5", clarity: 43, thinking: 42, focus: 40, momentum: 35, character: 41 },
];

function InnerOSTrends({ dimensionScores }: { dimensionScores: DimensionScore[] }) {
  const [selectedDim, setSelectedDim] = useState<string | null>(null);

  const dimensions = [
    { key: "clarity", name: "Clarity", icon: "👁️", color: "#0D9488" },
    { key: "thinking", name: "Thinking", icon: "🧠", color: "#7C3AED" },
    { key: "focus", name: "Focus", icon: "🎯", color: "#F59E0B" },
    { key: "momentum", name: "Momentum", icon: "⚡", color: "#3B82F6" },
    { key: "character", name: "Character", icon: "❤️", color: "#EC4899" },
  ];

  // Splice real current scores into the last week
  const INNER_OS_WEEKS = useMemo(() => {
    const scoreMap: Record<string, number> = {};
    dimensionScores.forEach(d => { scoreMap[d.name.toLowerCase()] = d.score; });
    return [
      ...INNER_OS_WEEKS_BASE,
      { week: "Now", clarity: scoreMap.clarity ?? 45, thinking: scoreMap.thinking ?? 48, focus: scoreMap.focus ?? 42, momentum: scoreMap.momentum ?? 38, character: scoreMap.character ?? 44 },
    ];
  }, [dimensionScores]);

  const latest = INNER_OS_WEEKS[INNER_OS_WEEKS.length - 1];
  const first = INNER_OS_WEEKS[0];

  const chartW = 520, chartH = 160, padL = 30, padR = 10, padT = 10, padB = 24;
  const plotW = chartW - padL - padR, plotH = chartH - padT - padB;

  const drawLine = (dim: typeof dimensions[0]) => {
    return INNER_OS_WEEKS.map((w, i) => {
      const x = padL + (i / (INNER_OS_WEEKS.length - 1)) * plotW;
      const y = padT + plotH - (((w as any)[dim.key] - 15) / 40) * plotH;
      return `${x},${y}`;
    }).join(" ");
  };

  const activeDims = selectedDim ? [dimensions.find(d => d.key === selectedDim)!] : dimensions;

  return (
    <Card>
      <SectionTitle icon="📈" title="Your Growth Over Time" subtitle="How your Inner OS dimensions have evolved" />

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        <button onClick={() => setSelectedDim(null)} style={{
          padding: "5px 12px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
          background: !selectedDim ? "#1C1917" : "#F5F5F4", color: !selectedDim ? "white" : "#78716C",
        }}>All</button>
        {dimensions.map(d => (
          <button key={d.key} onClick={() => setSelectedDim(selectedDim === d.key ? null : d.key)} style={{
            padding: "5px 12px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: selectedDim === d.key ? d.color : "#F5F5F4",
            color: selectedDim === d.key ? "white" : "#78716C",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            {d.icon} {d.name}
          </button>
        ))}
      </div>

      <div style={{ overflowX: "auto" }}>
        <svg width={chartW} height={chartH} style={{ display: "block" }}>
          {[20, 30, 40, 50].map(v => {
            const y = padT + plotH - ((v - 15) / 40) * plotH;
            return (
              <g key={v}>
                <line x1={padL} x2={chartW - padR} y1={y} y2={y} stroke="#E7E5E4" strokeDasharray="4" />
                <text x={4} y={y + 3} fontSize={9} fill="#A8A29E" fontFamily="'DM Sans', sans-serif">{v}%</text>
              </g>
            );
          })}
          {INNER_OS_WEEKS.map((w, i) => {
            const x = padL + (i / (INNER_OS_WEEKS.length - 1)) * plotW;
            return <text key={i} x={x} y={chartH - 4} textAnchor="middle" fontSize={9} fill="#A8A29E" fontFamily="'DM Sans', sans-serif">{w.week}</text>;
          })}
          {activeDims.map(dim => (
            <polyline key={dim.key} points={drawLine(dim)} fill="none" stroke={dim.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {activeDims.map(dim => {
            const x = padL + plotW;
            const y = padT + plotH - (((latest as any)[dim.key] - 15) / 40) * plotH;
            return (
              <g key={`dot-${dim.key}`}>
                <circle cx={x} cy={y} r={4} fill={dim.color} />
                <text x={x + 8} y={y + 4} fontSize={10} fill={dim.color} fontWeight={700} fontFamily="'DM Sans', sans-serif">{(latest as any)[dim.key]}%</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginTop: 16 }}>
        {dimensions.map(d => {
          const change = (latest as any)[d.key] - (first as any)[d.key];
          return (
            <div key={d.key} onClick={() => setSelectedDim(selectedDim === d.key ? null : d.key)} style={{
              textAlign: "center", padding: "10px 4px", borderRadius: 10, cursor: "pointer",
              background: selectedDim === d.key ? `${d.color}10` : "#FAFAF9",
              border: selectedDim === d.key ? `1.5px solid ${d.color}40` : "1.5px solid transparent",
              transition: "all 0.15s",
            }}>
              <div style={{ fontSize: 20 }}>{d.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1C1917", fontFamily: "'Source Serif 4', serif" }}>{(latest as any)[d.key]}%</div>
              <div style={{ fontSize: 11, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>{d.name}</div>
              <div style={{ fontSize: 10, color: "#059669", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>↑ +{change}%</div>
              <div style={{ fontSize: 9, color: "#A8A29E", fontFamily: "'DM Sans', sans-serif" }}>since start</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ============ BREAKTHROUGHS ============

function BreakthroughsSection({ breakthroughs }: { breakthroughs: GrowthTabProps["breakthroughs"] }) {
  const dimColors: Record<string, string> = { Thinking: "#7C3AED", Clarity: "#0D9488", Momentum: "#3B82F6", Focus: "#F59E0B", Character: "#EC4899" };

  const items = breakthroughs.length > 0 ? breakthroughs.map(b => ({
    date: new Date(b.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    icon: b.icon, title: b.title, desc: b.description || "", dimension: b.dimension || "Growth", change: `+${b.xp_earned} XP`,
  })) : [
    { date: "—", icon: "🌟", title: "Your First Breakthrough Awaits", desc: "Complete episodes and use Scholar Methods to unlock breakthroughs!", dimension: "Growth", change: "" },
  ];

  return (
    <Card>
      <SectionTitle icon="⚡" title="Your Breakthroughs" subtitle="Moments of significant improvement" />
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {items.map((b, i) => (
          <div key={i} style={{ display: "flex", gap: 14, paddingBottom: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 40 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: (dimColors[b.dimension] ?? "#0D9488") + "15",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
              }}>{b.icon}</div>
              {i < items.length - 1 && <div style={{ width: 2, flex: 1, background: "#E7E5E4", marginTop: 4 }} />}
            </div>
            <div style={{ flex: 1, paddingBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, color: "#1C1917" }}>{b.title}</span>
                {b.change && <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", fontFamily: "'DM Sans', sans-serif" }}>{b.change}</span>}
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10,
                  background: (dimColors[b.dimension] ?? "#0D9488") + "15",
                  color: dimColors[b.dimension] ?? "#0D9488", fontFamily: "'DM Sans', sans-serif",
                }}>{b.dimension}</span>
              </div>
              <p style={{ fontSize: 13, color: "#78716C", margin: "4px 0 0", fontFamily: "'DM Sans', sans-serif" }}>{b.desc}</p>
              <span style={{ fontSize: 11, color: "#A8A29E", fontFamily: "'DM Sans', sans-serif" }}>{b.date}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ============ LEARNING STATS ============

function LearningStats({ episodeCount, methodCounts, streakDays }: { episodeCount: number; methodCounts: Record<string, number>; streakDays: number }) {
  const totalMethods = Object.values(methodCounts).reduce((a, b) => a + b, 0);
  const estimatedHours = ((episodeCount * 8 * 60 + totalMethods * 5 * 60) / 3600).toFixed(1);

  return (
    <Card>
      <SectionTitle icon="📊" title="Learning Stats" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { value: String(episodeCount), label: "Episodes\nCompleted", icon: "📖", color: "#0D9488" },
          { value: `${estimatedHours}h`, label: "Total Study\nTime", icon: "⏱", color: "#7C3AED" },
          { value: String(totalMethods), label: "Methods\nUsed", icon: "🎓", color: "#3B82F6" },
          { value: String(episodeCount * 5 + totalMethods * 10), label: "Gems\nEarned", icon: "💎", color: "#F59E0B" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center", padding: "16px 8px", borderRadius: 12, background: "#FAFAF9" }}>
            <div style={{ fontSize: 24 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'Source Serif 4', serif", marginTop: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#78716C", whiteSpace: "pre-line", fontFamily: "'DM Sans', sans-serif" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ============ CHAPTER PROGRESS ============

function ChapterProgressSection({ userId }: { userId: string }) {
  const { data: chapters } = useChapters();

  const { data: chapterProgress } = useQuery({
    queryKey: ["growth-chapter-progress", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episode_progress")
        .select("chapter_id, completion_pct")
        .eq("user_id", userId);
      if (error) throw error;
      const map: Record<string, { total: number; completed: number }> = {};
      (data ?? []).forEach(ep => {
        if (!map[ep.chapter_id]) map[ep.chapter_id] = { total: 0, completed: 0 };
        map[ep.chapter_id].total++;
        if (ep.completion_pct >= 100) map[ep.chapter_id].completed++;
      });
      return map;
    },
  });

  const subjectColors: Record<string, string> = {
    Mathematics: "#7C3AED", Science: "#059669", English: "#2563EB",
    "Social Science": "#F59E0B", Hindi: "#f56565", Telugu: "#38b2ac",
  };

  if (!chapters || chapters.length === 0) return null;

  // Only show chapters that have some progress
  const chaptersWithProgress = chapters.filter(ch => chapterProgress?.[ch.id]);
  if (chaptersWithProgress.length === 0) {
    return (
      <Card>
        <SectionTitle icon="📚" title="Chapter Progress" subtitle="Start studying to track chapter completion" />
        <div style={{ textAlign: "center", padding: "24px 0", color: "#A8A29E", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
          No chapters started yet. Head to the Learn tab to begin!
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle icon="📚" title="Chapter Progress" subtitle="Your journey through the curriculum" />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {chaptersWithProgress.slice(0, 8).map((ch, i) => {
          const prog = chapterProgress?.[ch.id] ?? { total: 0, completed: 0 };
          const pct = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;
          const totalEpisodes = ch.episodes?.length ?? prog.total;
          return (
            <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 12, border: "1px solid #E7E5E4" }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: ch.color || "#7C3AED",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontSize: 14, fontWeight: 700, fontFamily: "'Source Serif 4', serif", flexShrink: 0,
              }}>{ch.number}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, color: "#1C1917" }}>{ch.title}</span>
                  <span style={{ fontSize: 11, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>{prog.completed}/{totalEpisodes} lessons</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <div style={{ flex: 1, height: 6, background: "#E7E5E4", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: ch.color || "#7C3AED", borderRadius: 3, transition: "width 0.3s" }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: ch.color || "#7C3AED", fontFamily: "'DM Sans', sans-serif", minWidth: 32 }}>{pct}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ============ SCHOLAR METHODS PERFORMANCE ============

function ScholarMethodsStats({ methodCounts, userId }: { methodCounts: Record<string, number>; userId: string }) {
  const { data: methodDetails } = useQuery({
    queryKey: ["growth-method-details", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("method_sessions")
        .select("method_type, score, chapter_id, completed")
        .eq("user_id", userId);
      if (error) throw error;
      const stats: Record<string, { sessions: number; totalScore: number; scored: number; best: string }> = {};
      (data ?? []).forEach(s => {
        if (!stats[s.method_type]) stats[s.method_type] = { sessions: 0, totalScore: 0, scored: 0, best: "" };
        stats[s.method_type].sessions++;
        if (s.score != null) { stats[s.method_type].totalScore += s.score; stats[s.method_type].scored++; }
        if (s.chapter_id) stats[s.method_type].best = s.chapter_id;
      });
      return stats;
    },
  });

  const methods = [
    { key: "tutorial_defense", name: "Debate Challenge", icon: "🛡️", color: "#0D9488" },
    { key: "first_principles", name: "Break It Down", icon: "🔬", color: "#7C3AED" },
    { key: "case_study", name: "Case Study", icon: "📋", color: "#2563EB" },
  ];

  const debateSessions = methodCounts?.["tutorial_defense"] ?? 0;

  return (
    <Card>
      <SectionTitle icon="🎓" title="Scholar Methods Performance" subtitle="How you're using each thinking tool" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {methods.map(m => {
          const detail = methodDetails?.[m.key];
          const sessions = detail?.sessions ?? methodCounts?.[m.key] ?? 0;
          const avgScore = detail && detail.scored > 0 ? Math.round(detail.totalScore / detail.scored) : 0;
          return (
            <div key={m.key} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
              borderRadius: 12, border: "1px solid #E7E5E4", background: "white",
            }}>
              <span style={{ fontSize: 28 }}>{m.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, color: "#1C1917" }}>{m.name}</div>
                {detail?.best && <div style={{ fontSize: 11, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>Best: {detail.best}</div>}
              </div>
              <div style={{ textAlign: "center", padding: "0 10px" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: m.color, fontFamily: "'Source Serif 4', serif" }}>{avgScore > 0 ? `${avgScore}%` : "—"}</div>
                <div style={{ fontSize: 10, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>avg score</div>
              </div>
              <div style={{ textAlign: "center", padding: "0 10px" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1C1917", fontFamily: "'Source Serif 4', serif" }}>{sessions}</div>
                <div style={{ fontSize: 10, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>sessions</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginTop: 16,
        padding: "12px 16px", borderRadius: 12, background: "#F0FDFA", border: "1px solid #CCFBF1",
      }}>
        <span style={{ fontSize: 24 }}>🎤</span>
        <span style={{ fontSize: 13, color: "#0D9488", fontFamily: "'DM Sans', sans-serif" }}>
          <strong>Teach It</strong> mode unlocks after completing 5 Debate Challenges. You've done {debateSessions} — {debateSessions >= 5 ? "Unlocked! 🎉" : `${5 - debateSessions} more to go!`}
        </span>
      </div>
    </Card>
  );
}

// ============ DAILY QUIZ PROGRESS ============

function DailyQuizProgress({ userId }: { userId: string }) {
  const { data: recentActivity } = useQuery({
    queryKey: ["growth-daily-quiz", userId],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data, error } = await supabase
        .from("daily_activity")
        .select("activity_date, episodes_completed, methods_used, time_spent_seconds")
        .eq("user_id", userId)
        .gte("activity_date", sevenDaysAgo.toISOString().split("T")[0])
        .order("activity_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const days = useMemo(() => {
    const result = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const activity = (recentActivity ?? []).find(a => a.activity_date === key);
      const score = activity ? Math.min((activity.episodes_completed + activity.methods_used) * 20, 100) : 0;
      result.push({
        label: d.toLocaleDateString("en-IN", { weekday: "short" }),
        date: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        score,
        done: score > 0,
      });
    }
    return result;
  }, [recentActivity]);

  const todayDone = days[days.length - 1]?.done ?? false;
  const quizStreak = (() => {
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].done) streak++;
      else break;
    }
    return streak;
  })();
  const bestScore = Math.max(...days.map(d => d.score), 0);
  const avgScore = days.filter(d => d.done).length > 0
    ? Math.round(days.filter(d => d.done).reduce((a, d) => a + d.score, 0) / days.filter(d => d.done).length)
    : 0;
  const maxBarHeight = 56;

  return (
    <Card>
      <SectionTitle icon="⚡" title="Daily Quiz Progress" subtitle="Your daily learning activity over the past week" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Today", value: todayDone ? "✅ Done" : "⏳ Pending", color: todayDone ? "#059669" : "#F59E0B", bg: todayDone ? "#F0FDF4" : "#FEF3C7" },
          { label: "Best Score", value: `${bestScore}%`, color: "#7C3AED", bg: "#F5F3FF" },
          { label: "Average", value: `${avgScore}%`, color: "#0D9488", bg: "#F0FDFA" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center", padding: "14px 8px", borderRadius: 12, background: s.bg }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: "'Source Serif 4', serif" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8, padding: "0 4px" }}>
        {days.map((d, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: d.done ? "#0D9488" : "#A8A29E", fontFamily: "'DM Sans', sans-serif" }}>
              {d.score > 0 ? `${d.score}%` : "—"}
            </div>
            <div style={{
              width: "100%", maxWidth: 28, height: d.score > 0 ? (d.score / 100) * maxBarHeight : 4,
              background: d.done ? "linear-gradient(to top, #0D9488, #5EEAD4)" : "#E7E5E4",
              borderRadius: 4, transition: "height 0.3s",
            }} />
            <div style={{ fontSize: 10, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>{d.label}</div>
          </div>
        ))}
      </div>

      {quizStreak > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginTop: 16,
          padding: "10px 14px", borderRadius: 10, background: "#FEF3C7", border: "1px solid #FDE68A",
        }}>
          <span style={{ fontSize: 18 }}>🔥</span>
          <span style={{ fontSize: 13, color: "#92400E", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
            {quizStreak}-day quiz streak! Keep it going!
          </span>
        </div>
      )}
    </Card>
  );
}

// ============ WEEKLY ASSIGNMENTS PROGRESS ============

function WeeklyAssignmentsProgress({ userId }: { userId: string }) {
  const { data: profile } = useQuery({
    queryKey: ["growth-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("class_name").eq("user_id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ["growth-assignments", profile?.class_name],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("id, title, subject, due_date, max_total_score, assignment_questions(id)")
        .eq("class_name", profile!.class_name!)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!profile?.class_name,
  });

  const { data: submissions } = useQuery({
    queryKey: ["growth-submissions", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_submissions")
        .select("assignment_id, status, total_score, student_answers(question_id)")
        .eq("student_id", userId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const SUBJECT_ICONS: Record<string, { icon: string; color: string }> = {
    Mathematics: { icon: "🔢", color: "#7C3AED" },
    Science: { icon: "🔬", color: "#059669" },
    English: { icon: "📖", color: "#2563EB" },
    "Social Science": { icon: "🌍", color: "#F59E0B" },
    Hindi: { icon: "📝", color: "#EF4444" },
    Telugu: { icon: "📝", color: "#EF4444" },
  };

  const items = (assignments ?? []).map((a: any) => {
    const sub = (submissions ?? []).find((s: any) => s.assignment_id === a.id);
    const isSubmitted = sub?.status === "submitted" || sub?.status === "finalized";
    const isGraded = sub?.total_score != null;
    const meta = SUBJECT_ICONS[a.subject] || { icon: "📚", color: "#6366f1" };
    return {
      id: a.id, title: a.title, subject: a.subject,
      icon: meta.icon, color: meta.color,
      status: isGraded ? "graded" : isSubmitted ? "submitted" : "pending",
      score: isGraded ? sub.total_score : null,
      maxScore: a.max_total_score,
    };
  });

  const total = items.length;
  const submitted = items.filter(a => a.status !== "pending").length;
  const graded = items.filter(a => a.status === "graded").length;
  const submittedPct = total > 0 ? Math.round((submitted / total) * 100) : 0;

  return (
    <Card>
      <SectionTitle icon="📝" title="Assignments Progress" subtitle="Your submission and grading status" />

      {total === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 0", color: "#A8A29E", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
          No assignments yet. Check back soon!
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            {[
              { label: "Total", value: total, color: "#3B82F6", bg: "#EFF6FF" },
              { label: "Submitted", value: submitted, color: "#0D9488", bg: "#F0FDFA" },
              { label: "Graded", value: graded, color: "#7C3AED", bg: "#F5F3FF" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center", padding: "12px 8px", borderRadius: 12, background: s.bg }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: "'Source Serif 4', serif" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#78716C", fontFamily: "'DM Sans', sans-serif", marginBottom: 6 }}>
              <span>Completion</span>
              <span>{submittedPct}%</span>
            </div>
            <div style={{ height: 8, background: "#E7E5E4", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${submittedPct}%`, height: "100%", background: "linear-gradient(90deg, #0D9488, #5EEAD4)", borderRadius: 4, transition: "width 0.3s" }} />
            </div>
          </div>

          {/* Assignment cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.slice(0, 5).map(a => (
              <div key={a.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                borderRadius: 12, border: "1px solid #E7E5E4",
                background: a.status === "graded" ? "#F0FDF4" : a.status === "submitted" ? "#F0FDFA" : "white",
              }}>
                <span style={{ fontSize: 22 }}>{a.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, color: "#1C1917", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>{a.subject}</div>
                </div>
                {a.status === "graded" && a.score != null ? (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#059669", fontFamily: "'Source Serif 4', serif" }}>
                      {a.score}{a.maxScore ? `/${a.maxScore}` : ""}
                    </div>
                    <div style={{ fontSize: 10, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>score</div>
                  </div>
                ) : (
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 10,
                    background: a.status === "submitted" ? "#CCFBF1" : "#FEF3C7",
                    color: a.status === "submitted" ? "#0D9488" : "#92400E",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {a.status === "submitted" ? "Submitted" : "Pending"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

// ============ MAIN GROWTH TAB ============

export default function GrowthTab({ dimensionScores, streakDays, episodeCount, methodCounts, breakthroughs, weeklyGrowth }: GrowthTabProps) {
  const { user } = useAuth();
  const avgScore = Math.round(dimensionScores.reduce((a, d) => a + d.score, 0) / dimensionScores.length);

  if (!user) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Page header */}
      <div>
        <h2 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 26, fontWeight: 700, color: "#1C1917", margin: 0 }}>
          📊 My Growth
        </h2>
        <p style={{ fontSize: 14, color: "#78716C", margin: "4px 0 0", fontFamily: "'DM Sans', sans-serif" }}>
          Track how your thinking is evolving over time
        </p>
      </div>

      {/* Overall Inner OS Score banner */}
      <div style={{
        background: "linear-gradient(135deg, #0D9488, #134E4A)",
        borderRadius: 16, padding: "24px 28px", color: "white",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: "'DM Sans', sans-serif" }}>Overall Inner OS Score</div>
          <div style={{ fontSize: 36, fontWeight: 700, fontFamily: "'Source Serif 4', serif" }}>{avgScore}%</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Source Serif 4', serif" }}>+{Math.max(avgScore - 28, 0)}%</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "'DM Sans', sans-serif" }}>since start</div>
          </div>
          <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.2)" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Source Serif 4', serif" }}>+{weeklyGrowth}%</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "'DM Sans', sans-serif" }}>this week</div>
          </div>
        </div>
      </div>

      <ActivityHeatmap userId={user.id} streakDays={streakDays} />
      <DailyQuizProgress userId={user.id} />
      <InnerOSTrends dimensionScores={dimensionScores} />
      <BreakthroughsSection breakthroughs={breakthroughs} />
      <LearningStats episodeCount={episodeCount} methodCounts={methodCounts} streakDays={streakDays} />
      <WeeklyAssignmentsProgress userId={user.id} />
      <ChapterProgressSection userId={user.id} />
      <ScholarMethodsStats methodCounts={methodCounts} userId={user.id} />
    </div>
  );
}
