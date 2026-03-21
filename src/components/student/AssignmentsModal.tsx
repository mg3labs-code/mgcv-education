import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AssignmentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUBJECT_ICONS: Record<string, string> = {
  Mathematics: "📐", Science: "🔬", English: "📖",
  "Social Science": "🌍", Hindi: "🇮🇳", Sanskrit: "🕉️",
  "Computer Science": "💻", "Physical Education": "🏃",
};

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "#e74c3c", Science: "#e67e22", English: "#2ecc71",
  "Social Science": "#f39c12", Hindi: "#f56565", Sanskrit: "#38b2ac",
  "Computer Science": "#3498db", "Physical Education": "#9b59b6",
};

const statusColor: Record<string, string> = {
  submitted: "#27ae60",
  in_progress: "#f39c12",
  not_started: "#e74c3c",
};

const statusLabel: Record<string, string> = {
  submitted: "SUBMITTED",
  in_progress: "IN PROGRESS",
  not_started: "PENDING",
};

const AssignmentsModal = ({ open, onOpenChange }: AssignmentsModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["student-profile-modal", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("class_name")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user && open,
  });

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["student-assignments-modal", profile?.class_name],
    queryFn: async () => {
      // Fetch published assignments for this class
      const { data: assgns, error } = await supabase
        .from("assignments")
        .select("*, questions:assignment_questions(id)")
        .eq("class_name", profile!.class_name!)
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch student's submissions to determine status
      const { data: submissions } = await supabase
        .from("student_submissions")
        .select("assignment_id, status, total_score, answers:student_answers(id, processing_status)")
        .eq("student_id", user!.id);

      const submissionMap = new Map(
        (submissions || []).map((s: any) => [s.assignment_id, s])
      );

      return (assgns || []).map((a: any) => {
        const sub = submissionMap.get(a.id);
        const questionCount = a.questions?.length || 0;
        const answeredCount = sub?.answers?.length || 0;
        const successCount = sub?.answers?.filter((ans: any) => ans.processing_status === "success").length || 0;
        let status = "not_started";
        if (sub?.status === "submitted" || sub?.status === "finalized") status = "submitted";
        else if (sub) status = "in_progress";

        return {
          ...a,
          questionCount,
          answeredCount,
          successCount,
          studentStatus: status,
          totalScore: sub?.total_score,
        };
      });
    },
    enabled: !!profile?.class_name && open,
  });

  const counts = {
    submitted: assignments?.filter((a) => a.studentStatus === "submitted").length || 0,
    in_progress: assignments?.filter((a) => a.studentStatus === "in_progress").length || 0,
    not_started: assignments?.filter((a) => a.studentStatus === "not_started").length || 0,
  };

  // Upcoming tests from schedule (keep lightweight — just show assignments with due dates)
  const upcomingTests = assignments?.filter(
    (a) => a.due_date && new Date(a.due_date) > new Date()
  ).slice(0, 3);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader className="text-center border-b-[3px] border-primary pb-5">
          <DialogTitle className="text-[28px] text-foreground">📚 MY ASSIGNMENTS</DialogTitle>
          <div className="flex justify-center gap-3 sm:gap-8 mt-4 flex-wrap">
            {[
              { n: counts.submitted, label: "SUBMITTED", color: statusColor.submitted },
              { n: counts.in_progress, label: "IN PROGRESS", color: statusColor.in_progress },
              { n: counts.not_started, label: "PENDING", color: statusColor.not_started },
            ].map((s) => (
              <div key={s.label} className="text-center px-5 py-2.5 bg-primary/10 rounded-xl">
                <span className="block text-2xl font-bold" style={{ color: s.color }}>{s.n}</span>
                <span className="text-xs text-muted-foreground font-semibold uppercase">{s.label}</span>
              </div>
            ))}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading assignments...</span>
          </div>
        ) : !assignments?.length ? (
          <p className="text-center text-muted-foreground py-12">No assignments available yet</p>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-foreground mt-4 mb-3">📝 Current Assignments</h3>
            <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
              {assignments.map((a) => {
                const color = SUBJECT_COLORS[a.subject] || "#3498db";
                const icon = SUBJECT_ICONS[a.subject] || "📋";
                return (
                  <div
                    key={a.id}
                    className="rounded-xl p-5 border-t-4 transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                    style={{ borderTopColor: color, background: `linear-gradient(135deg, ${color}10, ${color}05)` }}
                    onClick={() => { onOpenChange(false); navigate("/student/assignments"); }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{icon}</span>
                      <h4 className="font-bold text-foreground">{a.title}</h4>
                    </div>
                    <div className="flex items-center gap-2 mb-2 text-xs flex-wrap">
                      <span className="text-muted-foreground">{a.subject} • {a.class_name}</span>
                      <span
                        className="px-2 py-0.5 rounded-full text-white font-bold text-[10px]"
                        style={{ background: statusColor[a.studentStatus] }}
                      >
                        {statusLabel[a.studentStatus]}
                      </span>
                    </div>
                    {a.due_date && (
                      <p className="text-xs text-muted-foreground mb-2">
                        📅 Due: {new Date(a.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    )}
                    {a.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{a.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span>📝 {a.questionCount} questions</span>
                      <span>✅ {a.answeredCount} answered</span>
                      {a.totalScore != null && <Badge variant="secondary">Score: {a.totalScore}</Badge>}
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 px-4 rounded-full text-[11px] font-semibold uppercase text-white bg-gradient-to-r from-blue-500 to-blue-400 hover:-translate-y-0.5 hover:shadow-md transition-all border-none cursor-pointer">
                        {a.studentStatus === "not_started" ? "📋 Start" : a.studentStatus === "in_progress" ? "📋 Continue" : "📋 View"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {upcomingTests && upcomingTests.length > 0 && (
              <>
                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">📅 Upcoming Due Dates</h3>
                <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
                  {upcomingTests.map((t) => (
                    <div key={t.id} className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white p-5 rounded-xl shadow-lg hover:-translate-y-1 transition-all">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold">{t.title}</h4>
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-lg">
                          📅 {new Date(t.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <p className="text-sm opacity-90">{t.subject} • {t.questionCount} questions</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentsModal;
