import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, Trophy, TrendingUp, AlertTriangle } from "lucide-react";

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

const TeacherPerformance = () => {
  const { user } = useAuth();

  // Fetch teacher's assignments
  const { data: assignments } = useQuery({
    queryKey: ["perf-assignments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("id, title, subject, class_name, max_total_score")
        .eq("teacher_id", user!.id)
        .eq("is_published", true);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch all submissions for teacher's assignments
  const { data: submissions } = useQuery({
    queryKey: ["perf-submissions", assignments?.map(a => a.id)],
    queryFn: async () => {
      if (!assignments || assignments.length === 0) return [];
      const { data, error } = await supabase
        .from("student_submissions")
        .select("*, answers:student_answers(ai_score, teacher_score, is_teacher_reviewed, question:assignment_questions!question_id(max_score))")
        .in("assignment_id", assignments.map(a => a.id));
      if (error) throw error;
      return data;
    },
    enabled: !!assignments && assignments.length > 0,
  });

  // Fetch student names
  const { data: studentProfiles } = useQuery({
    queryKey: ["perf-profiles", submissions?.map(s => s.student_id)],
    queryFn: async () => {
      if (!submissions || submissions.length === 0) return [];
      const ids = [...new Set(submissions.map((s: any) => s.student_id))];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", ids);
      if (error) throw error;
      return data;
    },
    enabled: !!submissions && submissions.length > 0,
  });

  const nameMap = useMemo(() => {
    const m: Record<string, string> = {};
    studentProfiles?.forEach((p: any) => { m[p.user_id] = p.full_name; });
    return m;
  }, [studentProfiles]);

  // Per-assignment stats
  const assignmentStats = useMemo(() => {
    if (!assignments || !submissions) return [];
    return assignments.map(a => {
      const subs = submissions.filter((s: any) => s.assignment_id === a.id);
      const scores = subs.map((s: any) => {
        const total = s.answers?.reduce((sum: number, ans: any) => {
          const score = ans.is_teacher_reviewed ? (ans.teacher_score || 0) : (ans.ai_score || 0);
          return sum + score;
        }, 0) || 0;
        const max = s.answers?.reduce((sum: number, ans: any) => sum + (ans.question?.max_score || 0), 0) || a.max_total_score || 1;
        return { percent: Math.round((total / max) * 100), studentId: s.student_id, raw: total, max };
      });
      const avg = scores.length > 0 ? Math.round(scores.reduce((s, x) => s + x.percent, 0) / scores.length) : 0;
      return { ...a, submissions: subs.length, scores, avgScore: avg };
    });
  }, [assignments, submissions]);

  // Per-student aggregated performance
  const studentPerformance = useMemo(() => {
    if (!submissions) return [];
    const map: Record<string, { scores: number[]; name: string }> = {};
    submissions.forEach((s: any) => {
      const total = s.answers?.reduce((sum: number, ans: any) => {
        return sum + (ans.is_teacher_reviewed ? (ans.teacher_score || 0) : (ans.ai_score || 0));
      }, 0) || 0;
      const max = s.answers?.reduce((sum: number, ans: any) => sum + (ans.question?.max_score || 0), 0) || 1;
      const percent = Math.round((total / max) * 100);
      if (!map[s.student_id]) map[s.student_id] = { scores: [], name: nameMap[s.student_id] || "Unknown" };
      map[s.student_id].scores.push(percent);
    });
    return Object.entries(map).map(([id, data]) => ({
      id,
      name: data.name,
      avg: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      exams: data.scores.length,
    })).sort((a, b) => b.avg - a.avg);
  }, [submissions, nameMap]);

  // Grade distribution
  const gradeDist = useMemo(() => {
    const dist = { A: 0, B: 0, C: 0, F: 0 };
    studentPerformance.forEach(s => {
      if (s.avg >= 80) dist.A++;
      else if (s.avg >= 60) dist.B++;
      else if (s.avg >= 40) dist.C++;
      else dist.F++;
    });
    return [
      { name: "A (80%+)", value: dist.A },
      { name: "B (60-79%)", value: dist.B },
      { name: "C (40-59%)", value: dist.C },
      { name: "F (<40%)", value: dist.F },
    ].filter(d => d.value > 0);
  }, [studentPerformance]);

  const overallAvg = studentPerformance.length > 0
    ? Math.round(studentPerformance.reduce((s, p) => s + p.avg, 0) / studentPerformance.length)
    : 0;
  const topPerformers = studentPerformance.filter(s => s.avg >= 80).length;
  const needsSupport = studentPerformance.filter(s => s.avg < 40).length;

  return (
    <DashboardLayout role="teacher">
      <main className="p-6 max-w-[1100px] mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">📊 Performance Report</h1>
          <p className="text-muted-foreground">Overview of student performance across your assignments</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-card-foreground">{studentPerformance.length}</p>
            <p className="text-xs text-muted-foreground">Students</p>
          </Card>
          <Card className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold text-card-foreground">{overallAvg}%</p>
            <p className="text-xs text-muted-foreground">Class Average</p>
          </Card>
          <Card className="p-4 text-center">
            <Trophy className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold text-card-foreground">{topPerformers}</p>
            <p className="text-xs text-muted-foreground">Top Performers</p>
          </Card>
          <Card className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-red-500" />
            <p className="text-2xl font-bold text-card-foreground">{needsSupport}</p>
            <p className="text-xs text-muted-foreground">Need Support</p>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Assignment Performance */}
          <Card className="p-5">
            <h3 className="font-semibold text-card-foreground mb-4">Assignment Averages</h3>
            {assignmentStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={assignmentStats.map(a => ({ name: a.title.substring(0, 15), avg: a.avgScore }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-12">No published assignments yet</p>
            )}
          </Card>

          {/* Grade Distribution */}
          <Card className="p-5">
            <h3 className="font-semibold text-card-foreground mb-4">Grade Distribution</h3>
            {gradeDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={gradeDist} cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} dataKey="value">
                    {gradeDist.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-12">No data yet</p>
            )}
          </Card>
        </div>

        {/* Student Ranking */}
        <Card className="p-5">
          <h3 className="font-semibold text-card-foreground mb-4">Student Rankings</h3>
          <div className="space-y-2">
            {studentPerformance.map((s, i) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? "bg-yellow-100 text-yellow-800" :
                    i === 1 ? "bg-gray-100 text-gray-800" :
                    i === 2 ? "bg-orange-100 text-orange-800" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {i + 1}
                  </span>
                  <span className="font-medium text-card-foreground">{s.name}</span>
                  <span className="text-xs text-muted-foreground">{s.exams} exam{s.exams !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.avg >= 80 ? "bg-green-500" : s.avg >= 60 ? "bg-blue-500" : s.avg >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${s.avg}%` }}
                    />
                  </div>
                  <Badge variant={s.avg >= 80 ? "default" : s.avg >= 60 ? "secondary" : "destructive"} className="text-xs">
                    {s.avg}%
                  </Badge>
                </div>
              </div>
            ))}
            {studentPerformance.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No student data available yet</p>
            )}
          </div>
        </Card>
      </main>
    </DashboardLayout>
  );
};

export default TeacherPerformance;
