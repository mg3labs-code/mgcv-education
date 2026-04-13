import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import ThinkingNetwork from "@/components/ThinkingNetwork";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const CLASS_OPTIONS = ["Class 10", "Class 9", "Class 8"];

const TeacherDashboard = () => {
  const { fullName, user } = useAuth();
  const navigate = useNavigate();
  const firstName = fullName?.split(" ")[0] || "Teacher";
  const [selectedClass, setSelectedClass] = useState(CLASS_OPTIONS[0]);

  const { data: classAvg } = useQuery({
    queryKey: ["class-averages", selectedClass],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_class_averages", { _class_name: selectedClass });
      if (error) throw error;
      return (data as any)?.[0] ?? null;
    },
  });

  const { data: alerts } = useQuery({
    queryKey: ["teacher-alerts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_alerts")
        .select("*")
        .eq("teacher_id", user!.id)
        .eq("is_dismissed", false)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const studentCount = classAvg?.student_count ?? 0;
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const classMetrics = [
    { label: "Avg Clarity", score: Math.round(Number(classAvg?.avg_clarity) || 0), color: "#0D9488", icon: "👁️", students: studentCount },
    { label: "Avg Thinking", score: Math.round(Number(classAvg?.avg_thinking) || 0), color: "#7C3AED", icon: "🧠", students: studentCount },
    { label: "Avg Focus", score: Math.round(Number(classAvg?.avg_attention) || 0), color: "#F59E0B", icon: "🎯", students: studentCount },
    { label: "Avg Character", score: Math.round(Number(classAvg?.avg_character) || 0), color: "#EC4899", icon: "❤️", students: studentCount },
  ];

  const todayClasses = [
    { time: "9:00", cls: "10-A", subject: "Real Numbers", status: "now", color: "#0D9488" },
    { time: "10:00", cls: "10-B", subject: "Polynomials", status: "next", color: "#7C3AED" },
    { time: "11:30", cls: "9-A", subject: "Number Systems", status: "later", color: "#3B82F6" },
  ];

  const attentionItems = alerts && alerts.length > 0
    ? alerts.map(a => ({
        icon: a.alert_type === "critical" ? "⚠️" : "📝",
        text: a.message,
        action: a.suggested_action || "View",
        urgent: a.alert_type === "critical",
      }))
    : [
        { icon: "📝", text: "5 ungraded submissions — Real Numbers Weekly Assignment", action: "Grade Now", urgent: true },
        { icon: "⚠️", text: "Vivaan Jain scored below average in 3 consecutive assessments", action: "View", urgent: true },
        { icon: "📊", text: "New class insights available — AI found a common mistake pattern", action: "View", urgent: false },
      ];

  const quickActions = [
    { icon: "📝", label: "Create Assignment", bg: "#F0FDFA", color: "#0D9488", path: "/teacher/assignments" },
    { icon: "📊", label: "Class Analytics", bg: "#F5F3FF", color: "#7C3AED", path: "/teacher/analytics" },
    { icon: "📅", label: "Edit Schedule", bg: "#FEF3C7", color: "#92400E", path: "/teacher/schedule" },
  ];

  return (
    <DashboardLayout role="teacher">
      <div style={{
        background: "#FFFBF5", minHeight: "100vh",
        fontFamily: "'DM Sans', sans-serif", color: "#1C1917",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 26, fontWeight: 700, color: "#1C1917" }}>
              Good morning, {firstName}! ☀️
            </div>
            <p style={{ fontSize: 14, color: "#78716C", margin: "4px 0 0" }}>
              {dateStr} • {selectedClass}
            </p>
          </div>

          {/* Class Selector */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {CLASS_OPTIONS.map(cls => (
              <button key={cls} onClick={() => setSelectedClass(cls)} style={{
                padding: "6px 16px", borderRadius: 8, border: "none",
                background: selectedClass === cls ? "#0D9488" : "#F5F5F4",
                color: selectedClass === cls ? "white" : "#78716C",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {cls}
              </button>
            ))}
          </div>

          {/* Class-wide Inner OS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            {classMetrics.map(d => (
              <div key={d.label} style={{
                background: "white", borderRadius: 14, border: "1px solid #E7E5E4",
                padding: "16px 14px", textAlign: "center",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                borderLeft: `4px solid ${d.color}`,
              }}>
                <div style={{ fontSize: 24 }}>{d.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#1C1917", fontFamily: "'Source Serif 4', serif", marginTop: 4 }}>{d.score}%</div>
                <div style={{ fontSize: 12, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>{d.label}</div>
                <div style={{ fontSize: 10, color: "#A8A29E", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{d.students} students</div>
              </div>
            ))}
          </div>

          {/* Today's Classes */}
          <div style={{
            background: "white", borderRadius: 16, border: "1px solid #E7E5E4",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: 24, marginBottom: 20,
          }}>
            <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 20, fontWeight: 700, color: "#1C1917", margin: "0 0 16px" }}>
              📅 Today's Classes
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {todayClasses.map(c => (
                <div key={c.time} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                  borderRadius: 12, background: c.status === "now" ? "#F0FDFA" : "#FAFAF9",
                  borderLeft: `4px solid ${c.color}`,
                }}>
                  <div>
                    <span style={{ fontSize: 13, color: "#78716C", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{c.time} AM</span>
                    {c.status === "now" && (
                      <span style={{
                        marginLeft: 8, fontSize: 10, fontWeight: 700, color: "#059669",
                        fontFamily: "'DM Sans', sans-serif",
                      }}>● LIVE</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: "#1C1917" }}>{c.subject}</div>
                    <div style={{ fontSize: 12, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>Class {c.cls}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Needs Attention */}
          <div style={{
            background: "white", borderRadius: 16, border: "1px solid #E7E5E4",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: 24, marginBottom: 20,
          }}>
            <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 20, fontWeight: 700, color: "#1C1917", margin: "0 0 16px" }}>
              ⚠️ Needs Your Attention
            </h3>
            {attentionItems.map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
                borderBottom: i < attentionItems.length - 1 ? "1px solid #F5F5F4" : "none",
              }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span style={{ flex: 1, fontSize: 13, color: "#1C1917", fontFamily: "'DM Sans', sans-serif" }}>{item.text}</span>
                <button onClick={() => {
                  if (item.action === "Grade Now") navigate("/teacher/assignments");
                  else navigate("/teacher/analytics");
                }} style={{
                  background: item.urgent ? "#0D9488" : "transparent",
                  color: item.urgent ? "white" : "#0D9488",
                  border: item.urgent ? "none" : "1px solid #0D9488",
                  padding: "6px 14px", borderRadius: 8, fontSize: 12,
                  fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  flexShrink: 0,
                }}>
                  {item.action}
                </button>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {quickActions.map(a => (
              <button key={a.label} onClick={() => navigate(a.path)} style={{
                background: a.bg, border: "none", borderRadius: 14,
                padding: "20px 16px", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                transition: "transform 0.15s",
              }}>
                <span style={{ fontSize: 28 }}>{a.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: a.color, fontFamily: "'DM Sans', sans-serif" }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
