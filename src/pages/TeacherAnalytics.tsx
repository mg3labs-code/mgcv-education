import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ThinkingNetwork from "@/components/ThinkingNetwork";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Student {
  roll: number;
  name: string;
  score: number;
  performance: string;
  strengths: string;
  weaknesses: string;
}

const studentsData: Student[] = [
  { roll: 123791, name: "Avni Singh", score: 100, performance: "Outstanding", strengths: "Linear Programming, Probability", weaknesses: "None" },
  { roll: 123343, name: "Avni Rathi", score: 91, performance: "Outstanding", strengths: "Determinants, Probability", weaknesses: "None" },
  { roll: 125611, name: "Vivaan Jain", score: 44, performance: "Below Average", strengths: "Vector Algebra, Differential Equations", weaknesses: "None" },
  { roll: 123602, name: "Riya Mishra", score: 86, performance: "Excellent", strengths: "Integrals, Differential Equations", weaknesses: "None" },
  { roll: 127955, name: "Meera Sharma", score: 97, performance: "Outstanding", strengths: "Integrals, Application of Integrals", weaknesses: "None" },
  { roll: 122706, name: "Aarav Mishra", score: 57, performance: "Average", strengths: "Integrals, Differential Equations", weaknesses: "Application of Integrals" },
  { roll: 129522, name: "Meera Rathi", score: 61, performance: "Good", strengths: "Three Dimensional Geometry, Continuity", weaknesses: "Three Dimensional Geometry" },
  { roll: 129892, name: "Avni Jain", score: 72, performance: "Very Good", strengths: "Application of Derivatives, Vector Algebra", weaknesses: "None" },
  { roll: 121625, name: "Rohit Agarwal", score: 63, performance: "Good", strengths: "Differentiability, Matrices", weaknesses: "None" },
  { roll: 126278, name: "Ira Das", score: 45, performance: "Below Average", strengths: "Integrals, Relations and Functions", weaknesses: "None" },
  { roll: 122063, name: "Nikhil Chopra", score: 82, performance: "Excellent", strengths: "Differential Equations, Integrals", weaknesses: "Matrices" },
  { roll: 123198, name: "Vivaan Mehta", score: 96, performance: "Outstanding", strengths: "Continuity, Differentiability", weaknesses: "None" },
  { roll: 122552, name: "Aarav Mehta", score: 59, performance: "Average", strengths: "Determinants, Matrices", weaknesses: "None" },
  { roll: 127285, name: "Sana Agarwal", score: 45, performance: "Below Average", strengths: "Inverse Trigonometric Functions, Continuity", weaknesses: "Continuity" },
  { roll: 127691, name: "Vivaan Chopra", score: 41, performance: "Below Average", strengths: "Application of Integrals, Determinants", weaknesses: "None" },
  { roll: 128220, name: "Aarav Rathi", score: 69, performance: "Good", strengths: "Integrals, Differentiability", weaknesses: "Application of Derivatives" },
  { roll: 126883, name: "Avni Agarwal", score: 40, performance: "Below Average", strengths: "Inverse Trigonometric Functions, Vector Algebra", weaknesses: "None" },
  { roll: 124743, name: "Kunal Bansal", score: 93, performance: "Outstanding", strengths: "Three Dimensional Geometry, Integrals", weaknesses: "Vector Algebra" },
  { roll: 123817, name: "Diya Verma", score: 46, performance: "Below Average", strengths: "Linear Programming, Continuity", weaknesses: "Matrices" },
  { roll: 122849, name: "Kunal Rathi", score: 52, performance: "Average", strengths: "Determinants, Application of Derivatives", weaknesses: "Differentiability" },
  { roll: 128351, name: "Kabir Sharma", score: 46, performance: "Below Average", strengths: "Relations and Functions, Linear Programming", weaknesses: "Relations and Functions" },
  { roll: 122087, name: "Avni Agarwal", score: 54, performance: "Average", strengths: "Differentiability, Inverse Trigonometric Functions", weaknesses: "Application of Derivatives" },
  { roll: 125285, name: "Aarav Rao", score: 97, performance: "Outstanding", strengths: "Application of Integrals, Continuity", weaknesses: "None" },
  { roll: 122690, name: "Aarav Khan", score: 92, performance: "Outstanding", strengths: "Continuity, Determinants", weaknesses: "None" },
  { roll: 128663, name: "Arjun Singh", score: 53, performance: "Average", strengths: "Vector Algebra, Matrices", weaknesses: "Relations and Functions" },
  { roll: 122020, name: "Rehan Mehta", score: 77, performance: "Very Good", strengths: "Application of Integrals, Probability", weaknesses: "None" },
  { roll: 127967, name: "Ananya Agarwal", score: 73, performance: "Very Good", strengths: "Continuity, Three Dimensional Geometry", weaknesses: "None" },
  { roll: 129711, name: "Nikhil Sharma", score: 100, performance: "Outstanding", strengths: "Vector Algebra, Differentiability", weaknesses: "None" },
  { roll: 124449, name: "Aarav Khan", score: 60, performance: "Good", strengths: "Differential Equations, Three Dimensional Geometry", weaknesses: "Integrals" },
  { roll: 125405, name: "Kunal Das", score: 67, performance: "Good", strengths: "Vector Algebra, Differential Equations", weaknesses: "None" },
  { roll: 122305, name: "Aarav Nair", score: 59, performance: "Average", strengths: "Vector Algebra, Three Dimensional Geometry", weaknesses: "None" },
  { roll: 121833, name: "Rohit Nair", score: 56, performance: "Average", strengths: "Integrals, Linear Programming", weaknesses: "Application of Derivatives" },
  { roll: 126677, name: "Avni Khan", score: 73, performance: "Very Good", strengths: "Matrices, Determinants", weaknesses: "Application of Integrals" },
  { roll: 123752, name: "Nikhil Rathi", score: 46, performance: "Below Average", strengths: "Linear Programming, Three Dimensional Geometry", weaknesses: "None" },
  { roll: 127948, name: "Tanya Chopra", score: 80, performance: "Excellent", strengths: "Linear Programming, Relations and Functions", weaknesses: "Differential Equations" },
  { roll: 122407, name: "Riya Jain", score: 82, performance: "Excellent", strengths: "Probability, Relations and Functions", weaknesses: "None" },
  { roll: 122513, name: "Ira Mishra", score: 43, performance: "Below Average", strengths: "Determinants, Probability", weaknesses: "None" },
  { roll: 127267, name: "Tanya Bansal", score: 52, performance: "Average", strengths: "Integrals, Inverse Trigonometric Functions", weaknesses: "Determinants" },
  { roll: 126783, name: "Aarav Sharma", score: 62, performance: "Good", strengths: "Matrices, Three Dimensional Geometry", weaknesses: "Probability" },
  { roll: 121713, name: "Nikhil Sharma", score: 74, performance: "Very Good", strengths: "Determinants, Three Dimensional Geometry", weaknesses: "None" },
  { roll: 125293, name: "Riya Nair", score: 44, performance: "Below Average", strengths: "Application of Integrals, Linear Programming", weaknesses: "None" },
  { roll: 128583, name: "Ananya Khan", score: 91, performance: "Outstanding", strengths: "Differentiability, Differential Equations", weaknesses: "None" },
  { roll: 127698, name: "Rehan Singh", score: 50, performance: "Average", strengths: "Application of Integrals, Matrices", weaknesses: "None" },
  { roll: 126760, name: "Tanya Nair", score: 72, performance: "Very Good", strengths: "Three Dimensional Geometry, Determinants", weaknesses: "None" },
  { roll: 129031, name: "Sana Jain", score: 84, performance: "Excellent", strengths: "Matrices, Determinants", weaknesses: "None" },
  { roll: 121410, name: "Kabir Das", score: 57, performance: "Average", strengths: "Linear Programming, Matrices", weaknesses: "None" },
  { roll: 128442, name: "Arjun Singh", score: 69, performance: "Good", strengths: "Linear Programming, Inverse Trigonometric Functions", weaknesses: "None" },
  { roll: 122435, name: "Avni Khan", score: 43, performance: "Below Average", strengths: "Integrals, Relations and Functions", weaknesses: "Differentiability" },
  { roll: 127006, name: "Ishaan Nair", score: 55, performance: "Average", strengths: "Three Dimensional Geometry, Vector Algebra", weaknesses: "None" },
  { roll: 125351, name: "Kunal Verma", score: 88, performance: "Excellent", strengths: "Continuity, Application of Derivatives", weaknesses: "None" },
  { roll: 124206, name: "Ira Mehta", score: 51, performance: "Average", strengths: "Application of Derivatives, Application of Integrals", weaknesses: "None" },
  { roll: 122420, name: "Avni Jain", score: 97, performance: "Outstanding", strengths: "Probability, Determinants", weaknesses: "Probability" },
  { roll: 129398, name: "Kunal Rathi", score: 85, performance: "Excellent", strengths: "Differential Equations, Differentiability", weaknesses: "Matrices" },
  { roll: 127125, name: "Kabir Sharma", score: 81, performance: "Excellent", strengths: "Matrices, Inverse Trigonometric Functions", weaknesses: "Probability" },
  { roll: 129849, name: "Avni Gupta", score: 40, performance: "Below Average", strengths: "Application of Integrals, Three Dimensional Geometry", weaknesses: "Differential Equations" },
];

const PERF_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  Outstanding: { color: "#059669", bg: "#F0FDF4", label: "⭐ Outstanding" },
  Excellent: { color: "#2563EB", bg: "#EFF6FF", label: "🎯 Excellent" },
  "Very Good": { color: "#0D9488", bg: "#F0FDFA", label: "✅ Very Good" },
  Good: { color: "#F59E0B", bg: "#FEF3C7", label: "👍 Good" },
  Average: { color: "#EA580C", bg: "#FFF7ED", label: "📊 Average" },
  "Below Average": { color: "#DC2626", bg: "#FEF2F2", label: "⚠️ Needs Help" },
};

type FilterType = "all" | "Outstanding" | "Excellent" | "Very Good" | "Good" | "Average" | "Below Average";

const TeacherAnalytics = () => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const stats = useMemo(() => {
    const total = studentsData.length;
    const avg = Math.round(studentsData.reduce((s, st) => s + st.score, 0) / total);
    const top = studentsData.filter(s => s.score >= 80).length;
    const needsHelp = studentsData.filter(s => s.score < 50).length;
    const passRate = Math.round((studentsData.filter(s => s.score >= 60).length / total) * 100);
    return { total, avg, top, needsHelp, passRate };
  }, []);

  const filteredStudents = useMemo(() => {
    let list = [...studentsData];
    if (filter !== "all") list = list.filter(s => s.performance === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.score - a.score);
  }, [filter, searchQuery]);

  const perfGroups = useMemo(() => {
    const groups: Record<string, number> = {};
    studentsData.forEach(s => { groups[s.performance] = (groups[s.performance] || 0) + 1; });
    return Object.entries(groups).sort((a, b) => b[1] - a[1]);
  }, []);

  // Generate mock "thinking" scores for selected student (based on their actual score)
  const studentThinking = useMemo(() => {
    if (!selectedStudent) return [];
    const base = selectedStudent.score;
    return [
      { name: "Clarity", score: Math.min(100, base + Math.round(Math.random() * 10 - 5)), icon: "👁️", color: "#0D9488" },
      { name: "Thinking", score: Math.min(100, base + Math.round(Math.random() * 15 - 8)), icon: "🧠", color: "#7C3AED" },
      { name: "Focus", score: Math.min(100, base + Math.round(Math.random() * 12 - 6)), icon: "🎯", color: "#F59E0B" },
      { name: "Momentum", score: Math.min(100, base + Math.round(Math.random() * 10 - 3)), icon: "⚡", color: "#3B82F6" },
      { name: "Character", score: Math.min(100, base + Math.round(Math.random() * 8 - 2)), icon: "❤️", color: "#EC4899" },
    ];
  }, [selectedStudent]);

  // Score distribution simplified
  const scoreBands = useMemo(() => [
    { range: "90–100", count: studentsData.filter(s => s.score >= 90).length, color: "#059669" },
    { range: "70–89", count: studentsData.filter(s => s.score >= 70 && s.score < 90).length, color: "#0D9488" },
    { range: "50–69", count: studentsData.filter(s => s.score >= 50 && s.score < 70).length, color: "#F59E0B" },
    { range: "Below 50", count: studentsData.filter(s => s.score < 50).length, color: "#DC2626" },
  ], []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "#059669";
    if (score >= 70) return "#0D9488";
    if (score >= 50) return "#F59E0B";
    return "#DC2626";
  };

  return (
    <DashboardLayout role="teacher" breadcrumbItems={[{ label: "Dashboard", href: "/teacher" }, { label: "Analytics" }]}>
      <div style={{ background: "#FFFBF5", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#1C1917" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 26, fontWeight: 700, margin: "0 0 4px" }}>
              📊 Class Analytics
            </h1>
            <p style={{ fontSize: 14, color: "#78716C", margin: 0 }}>
              Simple overview of how your students are performing
            </p>
          </div>

          {/* Quick Stats — 4 simple cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { icon: "👥", value: stats.total, label: "Students", color: "#3B82F6" },
              { icon: "📈", value: `${stats.avg}%`, label: "Class Average", color: "#0D9488" },
              { icon: "⭐", value: stats.top, label: "Scoring 80+", color: "#7C3AED" },
              { icon: "⚠️", value: stats.needsHelp, label: "Need Help (<50)", color: "#DC2626" },
            ].map(s => (
              <div key={s.label} style={{
                background: "white", borderRadius: 14, border: "1px solid #E7E5E4",
                padding: "16px 12px", textAlign: "center", borderLeft: `4px solid ${s.color}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}>
                <div style={{ fontSize: 22 }}>{s.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: "'Source Serif 4', serif", marginTop: 4 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#78716C" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Score Distribution — simple horizontal bars */}
          <div style={{
            background: "white", borderRadius: 16, border: "1px solid #E7E5E4",
            padding: 24, marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, margin: "0 0 16px" }}>
              📈 Score Distribution
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {scoreBands.map(b => (
                <div key={b.range} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1C1917", width: 80, flexShrink: 0 }}>{b.range}</span>
                  <div style={{ flex: 1, height: 28, background: "#F5F5F4", borderRadius: 8, overflow: "hidden", position: "relative" }}>
                    <div style={{
                      width: `${(b.count / stats.total) * 100}%`, height: "100%",
                      background: b.color, borderRadius: 8, minWidth: b.count > 0 ? 24 : 0,
                      transition: "width 0.5s",
                    }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: b.color, width: 40, textAlign: "right" }}>
                    {b.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Groups — simple chips showing counts */}
          <div style={{
            background: "white", borderRadius: 16, border: "1px solid #E7E5E4",
            padding: 24, marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, margin: "0 0 16px" }}>
              🎯 Performance Groups
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {perfGroups.map(([perf, count]) => {
                const cfg = PERF_CONFIG[perf] || { color: "#666", bg: "#F5F5F4", label: perf };
                return (
                  <button key={perf} onClick={() => setFilter(filter === perf ? "all" : perf as FilterType)} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
                    borderRadius: 12, border: filter === perf ? `2px solid ${cfg.color}` : "1px solid #E7E5E4",
                    background: filter === perf ? cfg.bg : "white", cursor: "pointer",
                    transition: "all 0.15s",
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                    <span style={{
                      background: cfg.color, color: "white", fontSize: 12, fontWeight: 700,
                      width: 26, height: 26, borderRadius: "50%", display: "flex",
                      alignItems: "center", justifyContent: "center",
                    }}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Student List — clean searchable list */}
          <div style={{
            background: "white", borderRadius: 16, border: "1px solid #E7E5E4",
            padding: 24, marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, margin: 0 }}>
                👥 Students ({filteredStudents.length})
              </h3>
              <input
                type="text"
                placeholder="Search student..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: "8px 14px", borderRadius: 10, border: "1px solid #E7E5E4",
                  fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none",
                  width: 200, background: "#FAFAF9",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filteredStudents.map(student => {
                const cfg = PERF_CONFIG[student.performance] || { color: "#666", bg: "#F5F5F4", label: student.performance };
                const isSelected = selectedStudent?.roll === student.roll;
                return (
                  <div key={student.roll}>
                    <button
                      onClick={() => setSelectedStudent(isSelected ? null : student)}
                      style={{
                        display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
                        borderRadius: 12, border: isSelected ? `2px solid ${cfg.color}` : "1px solid #E7E5E4",
                        background: isSelected ? cfg.bg : "white", cursor: "pointer",
                        width: "100%", textAlign: "left", transition: "all 0.15s",
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: 38, height: 38, borderRadius: "50%",
                        background: `linear-gradient(135deg, ${getScoreColor(student.score)}20, ${getScoreColor(student.score)}40)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 700, color: getScoreColor(student.score), flexShrink: 0,
                        fontFamily: "'DM Sans', sans-serif",
                      }}>
                        {student.name.split(" ").map(n => n[0]).join("")}
                      </div>

                      {/* Name & strengths */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#1C1917" }}>{student.name}</div>
                        <div style={{ fontSize: 11, color: "#78716C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {student.strengths !== "None" ? student.strengths : "No specific strengths"}
                        </div>
                      </div>

                      {/* Score bar */}
                      <div style={{ width: 80, flexShrink: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: getScoreColor(student.score), fontFamily: "'Source Serif 4', serif" }}>
                            {student.score}%
                          </span>
                        </div>
                        <div style={{ height: 5, background: "#E7E5E4", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${student.score}%`, height: "100%", background: getScoreColor(student.score), borderRadius: 3 }} />
                        </div>
                      </div>

                      {/* Performance badge */}
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
                        background: cfg.bg, color: cfg.color, flexShrink: 0, whiteSpace: "nowrap",
                      }}>
                        {cfg.label}
                      </span>
                    </button>

                    {/* Expanded detail — simplified */}
                    {isSelected && (
                      <div style={{
                        margin: "0 8px", padding: 20, borderRadius: "0 0 16px 16px",
                        border: `1px solid ${cfg.color}30`, borderTop: "none",
                        background: cfg.bg,
                      }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                          {/* Left — Thinking Network */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <h4 style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 700, fontSize: 15, margin: "0 0 8px", color: "#1C1917" }}>
                              🧠 Thinking Profile
                            </h4>
                            <p style={{ fontSize: 12, color: "#78716C", margin: "0 0 12px", textAlign: "center" }}>
                              How {student.name.split(" ")[0]}'s cognitive skills connect
                            </p>
                            <ThinkingNetwork scores={studentThinking} size="sm" />
                          </div>

                          {/* Right — Quick Info */}
                          <div>
                            <div style={{ marginBottom: 16 }}>
                              <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13, margin: "0 0 8px", color: "#059669" }}>💪 Strong In</h4>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {student.strengths !== "None" ? student.strengths.split(", ").map((s, i) => (
                                  <span key={i} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, background: "#F0FDF4", color: "#059669", fontWeight: 600 }}>{s}</span>
                                )) : <span style={{ fontSize: 12, color: "#A8A29E" }}>—</span>}
                              </div>
                            </div>

                            {student.weaknesses !== "None" && (
                              <div style={{ marginBottom: 16 }}>
                                <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13, margin: "0 0 8px", color: "#DC2626" }}>⚠️ Needs Work</h4>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                  {student.weaknesses.split(", ").map((w, i) => (
                                    <span key={i} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, background: "#FEF2F2", color: "#DC2626", fontWeight: 600 }}>{w}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div style={{
                              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12,
                            }}>
                              <div style={{ padding: "10px 12px", borderRadius: 10, background: "white", textAlign: "center" }}>
                                <div style={{ fontSize: 18, fontWeight: 700, color: "#3B82F6", fontFamily: "'Source Serif 4', serif" }}>
                                  #{studentsData.filter(s => s.score > student.score).length + 1}
                                </div>
                                <div style={{ fontSize: 10, color: "#78716C" }}>Class Rank</div>
                              </div>
                              <div style={{ padding: "10px 12px", borderRadius: 10, background: "white", textAlign: "center" }}>
                                <div style={{ fontSize: 18, fontWeight: 700, color: "#7C3AED", fontFamily: "'Source Serif 4', serif" }}>
                                  {student.score >= stats.avg ? "+" : ""}{student.score - stats.avg}
                                </div>
                                <div style={{ fontSize: 10, color: "#78716C" }}>vs Average</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherAnalytics;
