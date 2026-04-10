import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

const SUBJECT_ICONS: Record<string, { icon: string; color: string }> = {
  Mathematics: { icon: "🔢", color: "#7C3AED" },
  Science: { icon: "🔬", color: "#059669" },
  English: { icon: "📖", color: "#2563EB" },
  "Social Science": { icon: "🌍", color: "#F59E0B" },
  Hindi: { icon: "📝", color: "#EF4444" },
  Telugu: { icon: "📝", color: "#EF4444" },
};

interface TasksTabProps {
  onOpenQuiz?: (subject: string) => void;
}

const TasksTab = ({ onOpenQuiz }: TasksTabProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");

  // Profile for class_name
  const { data: profile } = useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("class_name").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // All assignments (both manual and auto)
  const { data: assignments } = useQuery({
    queryKey: ["tasks-assignments", profile?.class_name],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("*, assignment_questions(id, question_text)")
        .eq("class_name", profile!.class_name!)
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!profile?.class_name,
  });

  // Submissions for current user
  const { data: submissions } = useQuery({
    queryKey: ["tasks-submissions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_submissions")
        .select("*, student_answers(question_id)")
        .eq("student_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // Incomplete episodes
  const { data: incompleteEpisodes } = useQuery({
    queryKey: ["tasks-incomplete", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episode_progress")
        .select("chapter_id, episode_id, completion_pct, started_at")
        .eq("user_id", user!.id)
        .lt("completion_pct", 100)
        .order("started_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // Separate auto homework from manual assignments
  const today = new Date().toISOString().split("T")[0];
  const autoHomework = (assignments ?? []).filter((a: any) => 
    a.source === "auto_homework" && a.schedule_date === today
  );
  const manualAssignments = (assignments ?? []).filter((a: any) => 
    a.source !== "auto_homework"
  );

  // Compute assignment details helper
  const computeItem = (a: any) => {
    const sub = submissions?.find((s: any) => s.assignment_id === a.id);
    const totalQuestions = a.assignment_questions?.length ?? 0;
    const answeredCount = sub?.student_answers?.length ?? 0;
    const isSubmitted = sub?.status === "submitted" || sub?.status === "finalized";
    const dueDate = a.due_date ? new Date(a.due_date) : null;
    const isUrgent = dueDate ? (dueDate.getTime() - Date.now()) < 3 * 24 * 3600 * 1000 && !isSubmitted : false;
    const meta = SUBJECT_ICONS[a.subject] || { icon: "📚", color: "#6366f1" };

    return {
      id: a.id, title: a.title, subject: a.subject,
      icon: meta.icon, color: meta.color,
      questions: totalQuestions, answered: answeredCount,
      questionTexts: a.assignment_questions?.map((q: any) => q.question_text) || [],
      due: dueDate ? dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null,
      status: isSubmitted ? "submitted" : answeredCount > 0 ? "in_progress" : "pending",
      urgent: isUrgent,
    };
  };

  const assignmentItems = manualAssignments.map(computeItem);
  const homeworkItems = autoHomework.map(computeItem);

  const urgentCount = assignmentItems.filter((a) => a.urgent).length;
  const pendingCount = assignmentItems.filter((a) => a.status !== "submitted").length;
  const submittedCount = assignmentItems.filter((a) => a.status === "submitted").length;
  const totalTodo = pendingCount + homeworkItems.filter(h => h.status !== "submitted").length + (incompleteEpisodes?.length ?? 0);

  const dailyChallenges = [
    { title: "Daily Quiz", desc: "5 questions from today's classes — Math & Science", icon: "⚡", reward: "10 gems" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { label: "To Do", value: totalTodo, color: "#EF4444", bg: "#FEF2F2", icon: "📋" },
          { label: "Urgent", value: urgentCount, color: "#F59E0B", bg: "#FEF3C7", icon: "⚠️" },
          { label: "Submitted", value: submittedCount, color: "#10B981", bg: "#F0FDF4", icon: "✅" },
        ].map((s) => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: 14, padding: "16px 12px", textAlign: "center",
            border: "1px solid #E7E5E4",
          }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: "'Source Serif 4', serif" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { id: "all", label: "All" },
          { id: "homework", label: "📝 Homework" },
          { id: "assignments", label: "Assignments" },
          { id: "incomplete", label: "Unfinished" },
          { id: "challenges", label: "Challenges" },
        ].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: "7px 14px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: filter === f.id ? "#0D9488" : "#F5F5F4",
            color: filter === f.id ? "white" : "#78716C",
            fontFamily: "'DM Sans', sans-serif",
          }}>{f.label}</button>
        ))}
      </div>

      {/* Today's Homework (AI-generated from schedule) */}
      {(filter === "all" || filter === "homework") && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, color: "#1C1917", margin: 0 }}>
              📚 Today's Homework
            </h3>
            {homeworkItems.length > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 600, color: "#0D9488", background: "#F0FDF4",
                padding: "3px 10px", borderRadius: 10, fontFamily: "'DM Sans', sans-serif",
              }}>
                {homeworkItems.filter(h => h.status === "submitted").length}/{homeworkItems.length} done
              </span>
            )}
          </div>

          {homeworkItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 16px", color: "#78716C" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
                No homework today — check back after your teacher publishes the schedule!
              </div>
            </div>
          ) : (
            homeworkItems.map((hw) => (
              <div
                key={hw.id}
                style={{
                  borderRadius: 14, border: "1px solid #E7E5E4", marginBottom: 10,
                  background: hw.status === "submitted" ? "#F0FDF4" : "#FAFAF9",
                  overflow: "hidden",
                }}
              >
                {/* Header */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                  borderBottom: "1px solid #F5F5F4",
                }}>
                  <span style={{ fontSize: 22 }}>{hw.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, color: "#1C1917" }}>
                      {hw.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>
                      {hw.subject} · {hw.questions} questions · Due {hw.due}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/student/assignments")}
                    style={{
                      background: hw.status === "submitted" ? "#10B981" : "#0D9488",
                      color: "white", border: "none", padding: "7px 14px", borderRadius: 8,
                      fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {hw.status === "submitted" ? "Done ✓" : hw.answered > 0 ? "Continue" : "Start"}
                  </button>
                </div>

                {/* Inline question preview */}
                {hw.status !== "submitted" && hw.questionTexts.length > 0 && (
                  <div style={{ padding: "10px 16px 12px" }}>
                    {hw.questionTexts.slice(0, 2).map((qt: string, qi: number) => (
                      <div key={qi} style={{
                        display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6,
                        fontSize: 12, color: "#44403C", fontFamily: "'DM Sans', sans-serif",
                        lineHeight: 1.5,
                      }}>
                        <span style={{
                          background: "#E7E5E4", color: "#78716C", borderRadius: 6,
                          width: 20, height: 20, display: "flex", alignItems: "center",
                          justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0,
                          marginTop: 1,
                        }}>
                          {qi + 1}
                        </span>
                        <span>{qt.length > 120 ? qt.slice(0, 120) + "…" : qt}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </Card>
      )}

      {/* Daily Challenges */}
      {(filter === "all" || filter === "challenges") && (
        <Card>
          <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, color: "#1C1917", margin: "0 0 14px" }}>
            ⚡ Today's Challenges
          </h3>
          {dailyChallenges.map((ch, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
              borderRadius: 12, border: "1px solid #E7E5E4", marginBottom: 8,
              background: "#FAFAF9",
            }}>
              <span style={{ fontSize: 28 }}>{ch.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, color: "#1C1917" }}>{ch.title}</div>
                <div style={{ fontSize: 12, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>{ch.desc}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <button onClick={() => onOpenQuiz?.("Mathematics")} style={{
                  background: "#0D9488", color: "white", border: "none", padding: "8px 16px",
                  borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}>Start</button>
                <span style={{ fontSize: 11, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>+{ch.reward}</span>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Teacher Assignments */}
      {(filter === "all" || filter === "assignments") && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, color: "#1C1917", margin: 0 }}>
              📝 Assignments from Teacher
            </h3>
            <span style={{ fontSize: 11, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>
              {assignmentItems.filter(a => a.status !== "submitted").length} pending
            </span>
          </div>

          {assignmentItems.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 16px", color: "#78716C" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📋</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>No assignments yet. Check back soon!</div>
            </div>
          )}

          {assignmentItems.map((a) => (
            <div
              key={a.id}
              onClick={() => navigate("/student/assignments")}
              style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                borderRadius: 12, border: "1px solid #E7E5E4", marginBottom: 8,
                background: a.status === "submitted" ? "#F0FDF4" : "white",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 24 }}>{a.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, color: "#1C1917" }}>{a.title}</span>
                  {a.urgent && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#EF4444", background: "#FEF2F2", padding: "2px 8px", borderRadius: 10 }}>URGENT</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>{a.subject}</div>

                {/* Progress dots */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {Array.from({ length: a.questions }).map((_, qi) => (
                      <div key={qi} style={{
                        width: 24, height: 24, borderRadius: 6,
                        background: qi < a.answered ? "#0D9488" : "#F5F5F4",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 600, color: qi < a.answered ? "white" : "#78716C",
                      }}>
                        {qi < a.answered ? "✓" : qi + 1}
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>{a.answered}/{a.questions} done</span>
                </div>

                {a.due && (
                  <div style={{ fontSize: 11, color: "#78716C", marginTop: 6, fontFamily: "'DM Sans', sans-serif" }}>
                    📅 Due: {a.due}
                  </div>
                )}
              </div>

              <button style={{
                background: a.status === "submitted" ? "#10B981" : a.answered > 0 ? "#0D9488" : a.color,
                color: "white", border: "none", padding: "8px 16px", borderRadius: 8,
                fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {a.status === "submitted" ? "Done ✓" : a.answered > 0 ? "Continue" : "Start"}
              </button>
            </div>
          ))}
        </Card>
      )}

      {/* Incomplete Sections */}
      {(filter === "all" || filter === "incomplete") && incompleteEpisodes && incompleteEpisodes.length > 0 && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, color: "#1C1917", margin: 0 }}>
              ⏸️ You Left These Unfinished
            </h3>
            <span style={{ fontSize: 11, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>
              {incompleteEpisodes.length} items
            </span>
          </div>

          {incompleteEpisodes.map((ep, i) => (
            <div
              key={i}
              onClick={() => navigate(`/student/textbook/${ep.chapter_id}/${ep.episode_id}`)}
              style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                borderRadius: 12, border: "1px solid #E7E5E4", marginBottom: 8,
                cursor: "pointer", background: "white",
              }}
            >
              <span style={{ fontSize: 24 }}>⏸️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, color: "#1C1917" }}>
                  {ep.chapter_id}
                </div>
                <div style={{ fontSize: 12, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>
                  {ep.completion_pct}% complete — {ep.episode_id}
                </div>
              </div>
              <button style={{
                background: "#0D9488", color: "white", border: "none", padding: "8px 16px",
                borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}>Resume</button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

export default TasksTab;
