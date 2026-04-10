import { AlertTriangle, Calendar, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ExamInfo {
  title: string;
  date: string;
  daysLeft: number;
  subject: string;
}

const ExamAlertBanner = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<ExamInfo[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchUpcomingExams = async () => {
      // Check assignments with future due dates (exams/tests)
      const { data: profile } = await supabase
        .from("profiles")
        .select("class_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile?.class_name) return;

      const now = new Date();
      const { data: assignments } = await supabase
        .from("assignments")
        .select("title, due_date, subject")
        .eq("class_name", profile.class_name)
        .eq("is_published", true)
        .gte("due_date", now.toISOString())
        .order("due_date", { ascending: true })
        .limit(3);

      if (assignments && assignments.length > 0) {
        const mapped = assignments
          .filter(a => a.due_date)
          .map(a => {
            const dueDate = new Date(a.due_date!);
            const diffMs = dueDate.getTime() - now.getTime();
            const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            return {
              title: a.title,
              date: dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
              daysLeft,
              subject: a.subject,
            };
          });
        setExams(mapped);
      }
    };

    fetchUpcomingExams();
  }, [user]);

  // If no real exams, show a placeholder reminder
  const displayExams = exams.length > 0 ? exams : [
    {
      title: "Unit Test - Mathematics",
      date: new Date(Date.now() + 7 * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      daysLeft: 7,
      subject: "Mathematics",
    },
    {
      title: "Science Quarterly Exam",
      date: new Date(Date.now() + 14 * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      daysLeft: 14,
      subject: "Science",
    },
  ];

  const getUrgencyStyle = (daysLeft: number) => {
    if (daysLeft <= 3) return { bg: "#FEF2F2", border: "#FECACA", color: "#DC2626", icon: "🔴" };
    if (daysLeft <= 7) return { bg: "#FFFBEB", border: "#FDE68A", color: "#D97706", icon: "🟡" };
    return { bg: "#F0FDF4", border: "#BBF7D0", color: "#16A34A", icon: "🟢" };
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
      }}>
        <AlertTriangle style={{ width: 18, height: 18, color: "#D97706" }} />
        <h3 style={{
          fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700,
          color: "#1C1917", margin: 0,
        }}>
          📋 Upcoming Exams & Tests
        </h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {displayExams.map((exam, i) => {
          const style = getUrgencyStyle(exam.daysLeft);
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 18px", borderRadius: 14,
              background: style.bg, border: `1.5px solid ${style.border}`,
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 20 }}>{style.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 14, fontWeight: 600, color: "#1C1917", margin: 0,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {exam.title}
                </p>
                <div style={{
                  display: "flex", alignItems: "center", gap: 12, marginTop: 4,
                }}>
                  <span style={{
                    display: "flex", alignItems: "center", gap: 4,
                    fontSize: 12, color: "#78716C",
                  }}>
                    <Calendar style={{ width: 12, height: 12 }} />
                    {exam.date}
                  </span>
                  <span style={{
                    display: "flex", alignItems: "center", gap: 4,
                    fontSize: 12, color: "#78716C",
                  }}>
                    {exam.subject}
                  </span>
                </div>
              </div>
              <div style={{
                background: style.color + "15", color: style.color,
                padding: "6px 14px", borderRadius: 20,
                fontSize: 12, fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                whiteSpace: "nowrap",
              }}>
                <Clock style={{ width: 12, height: 12, display: "inline", marginRight: 4, verticalAlign: "middle" }} />
                {exam.daysLeft === 1 ? "Tomorrow!" : `${exam.daysLeft} days left`}
              </div>
            </div>
          );
        })}
      </div>

      <p style={{
        fontSize: 12, color: "#78716C", marginTop: 10, textAlign: "center",
        fontStyle: "italic",
      }}>
        💡 Prepare well — consistent daily practice beats last-minute cramming!
      </p>
    </div>
  );
};

export default ExamAlertBanner;
