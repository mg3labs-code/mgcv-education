import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Trophy,
  BarChart3,
  BookOpen,
  ArrowRight,
} from "lucide-react";

const statusConfig: Record<string, { label: string; icon: JSX.Element; badgeClass: string }> = {
  not_started: {
    label: "Not Started",
    icon: <Clock className="h-4 w-4" />,
    badgeClass: "bg-muted text-muted-foreground",
  },
  in_progress: {
    label: "In Progress",
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    badgeClass: "bg-warning/15 text-warning",
  },
  submitted: {
    label: "Submitted",
    icon: <CheckCircle className="h-4 w-4" />,
    badgeClass: "bg-info/15 text-info",
  },
  finalized: {
    label: "Evaluated",
    icon: <Trophy className="h-4 w-4" />,
    badgeClass: "bg-success/15 text-success",
  },
};

const subjectIcons: Record<string, string> = {
  Mathematics: "📐",
  Science: "🔬",
  English: "📖",
  "Social Science": "🌍",
  Hindi: "📝",
};

const StudentExamRoom = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "pending" | "evaluated">("all");

  const { data: profile } = useQuery({
    queryKey: ["exam-room-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("class_name")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: examData, isLoading } = useQuery({
    queryKey: ["exam-room-data", profile?.class_name],
    queryFn: async () => {
      // Fetch published assignments with questions
      const { data: assignments, error: aErr } = await supabase
        .from("assignments")
        .select("*, questions:assignment_questions(id, question_text, max_score)")
        .eq("class_name", profile!.class_name!)
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (aErr) throw aErr;

      // Fetch student submissions with answers
      const { data: submissions, error: sErr } = await supabase
        .from("student_submissions")
        .select("*, answers:student_answers(id, question_id, ai_score, ai_confidence, teacher_score, is_teacher_reviewed, processing_status)")
        .eq("student_id", user!.id);
      if (sErr) throw sErr;

      // Merge
      const submissionMap = new Map(
        (submissions || []).map((s: any) => [s.assignment_id, s])
      );

      return (assignments || []).map((a: any) => {
        const sub = submissionMap.get(a.id);
        const totalQuestions = a.questions?.length || 0;
        const answeredCount = sub?.answers?.length || 0;
        const evaluatedCount =
          sub?.answers?.filter((ans: any) => ans.processing_status === "success").length || 0;
        const totalMaxScore = a.questions?.reduce((s: number, q: any) => s + (q.max_score || 0), 0) || 0;
        const aiTotalScore =
          sub?.answers?.reduce((s: number, ans: any) => s + (ans.ai_score || 0), 0) || 0;
        const teacherTotalScore =
          sub?.answers?.reduce((s: number, ans: any) => s + (ans.teacher_score || 0), 0) || 0;
        const hasTeacherReview = sub?.answers?.some((ans: any) => ans.is_teacher_reviewed);

        let status = "not_started";
        if (sub?.status === "finalized") status = "finalized";
        else if (sub?.status === "submitted") status = "submitted";
        else if (sub) status = "in_progress";

        return {
          ...a,
          submission: sub,
          status,
          totalQuestions,
          answeredCount,
          evaluatedCount,
          totalMaxScore,
          aiTotalScore,
          teacherTotalScore,
          hasTeacherReview,
          scorePercent: totalMaxScore > 0
            ? Math.round(((hasTeacherReview ? teacherTotalScore : aiTotalScore) / totalMaxScore) * 100)
            : null,
        };
      });
    },
    enabled: !!profile?.class_name && !!user,
  });

  const filtered = examData?.filter((e: any) => {
    if (filter === "pending") return e.status === "not_started" || e.status === "in_progress";
    if (filter === "evaluated") return e.status === "submitted" || e.status === "finalized";
    return true;
  });

  const stats = {
    total: examData?.length || 0,
    completed: examData?.filter((e: any) => e.status === "submitted" || e.status === "finalized").length || 0,
    pending: examData?.filter((e: any) => e.status === "not_started" || e.status === "in_progress").length || 0,
    avgScore: (() => {
      const scored = examData?.filter((e: any) => e.scorePercent !== null) || [];
      if (scored.length === 0) return null;
      return Math.round(scored.reduce((s: number, e: any) => s + e.scorePercent, 0) / scored.length);
    })(),
  };

  return (
    <DashboardLayout role="teacher">
      <main className="p-6 max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            🏫 Exam Room
          </h1>
          <p className="text-muted-foreground mt-1">
            Take exams, view AI evaluations & teacher feedback
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center">
            <BookOpen className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-card-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Exams</p>
          </Card>
          <Card className="p-4 text-center">
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold text-card-foreground">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </Card>
          <Card className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
            <p className="text-2xl font-bold text-card-foreground">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </Card>
          <Card className="p-4 text-center">
            <BarChart3 className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold text-card-foreground">
              {stats.avgScore !== null ? `${stats.avgScore}%` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Avg Score</p>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(["all", "pending", "evaluated"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f === "all" ? "All Exams" : f === "pending" ? "Pending" : "Evaluated"}
            </Button>
          ))}
        </div>

        {/* Exam Cards */}
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading exams...
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered?.map((exam: any) => {
              const cfg = statusConfig[exam.status] || statusConfig.not_started;
              return (
                <Card key={exam.id} className="p-5 hover:border-primary/40 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-lg">
                          {subjectIcons[exam.subject] || "📄"}
                        </span>
                        <h3 className="font-semibold text-lg text-card-foreground truncate">
                          {exam.title}
                        </h3>
                        <Badge className={cfg.badgeClass}>
                          <span className="flex items-center gap-1">
                            {cfg.icon} {cfg.label}
                          </span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {exam.subject} • {exam.class_name} • {exam.totalQuestions} questions • {exam.totalMaxScore} marks
                      </p>
                      {exam.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{exam.description}</p>
                      )}
                      {exam.due_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {new Date(exam.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {/* Score Display */}
                      {exam.scorePercent !== null && (
                        <div className={`text-center px-3 py-1.5 rounded-lg ${
                          exam.scorePercent >= 75
                            ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300"
                            : exam.scorePercent >= 50
                            ? "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300"
                            : "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
                        }`}>
                          <p className="text-xl font-bold">{exam.scorePercent}%</p>
                          <p className="text-[10px] uppercase tracking-wider font-medium">
                            {exam.hasTeacherReview ? "Teacher" : "AI"} Score
                          </p>
                        </div>
                      )}

                      {/* Progress indicator */}
                      {exam.status === "in_progress" && (
                        <p className="text-xs text-muted-foreground">
                          {exam.answeredCount}/{exam.totalQuestions} answered
                        </p>
                      )}

                      {exam.status === "submitted" && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <AlertTriangle className="h-3 w-3" />
                          Awaiting teacher review
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant={exam.status === "not_started" ? "default" : "outline"}
                        className="gap-1"
                        onClick={() => navigate("/student/assignments")}
                      >
                        {exam.status === "not_started"
                          ? "Start Exam"
                          : exam.status === "in_progress"
                          ? "Continue"
                          : "View Results"}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Evaluation Progress Bar */}
                  {exam.answeredCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                        <span>Evaluation Progress</span>
                        <span>{exam.evaluatedCount}/{exam.answeredCount} evaluated</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{
                            width: `${exam.answeredCount > 0 ? (exam.evaluatedCount / exam.answeredCount) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
            {(!filtered || filtered.length === 0) && (
              <div className="text-center py-16">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">
                  {filter === "all"
                    ? "No exams available yet"
                    : filter === "pending"
                    ? "All exams completed! 🎉"
                    : "No evaluated exams yet"}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </DashboardLayout>
  );
};

export default StudentExamRoom;
