import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import ThinkingNetwork from "@/components/ThinkingNetwork";
import LiveIntelligenceHub from "@/components/teacher/LiveIntelligenceHub";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Brain,
  Target,
  Heart,
  Calendar,
  AlertTriangle,
  FileText,
  BarChart3,
  CalendarDays,
  ClipboardList,
} from "lucide-react";

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
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const classMetrics = [
    { label: "Clarity", score: Math.round(Number(classAvg?.avg_clarity) || 0), Icon: Eye, color: "hsl(173 80% 35%)" },
    { label: "Thinking", score: Math.round(Number(classAvg?.avg_thinking) || 0), Icon: Brain, color: "hsl(258 65% 56%)" },
    { label: "Focus", score: Math.round(Number(classAvg?.avg_attention) || 0), Icon: Target, color: "hsl(38 92% 50%)" },
    { label: "Character", score: Math.round(Number(classAvg?.avg_character) || 0), Icon: Heart, color: "hsl(330 81% 60%)" },
  ];

  const todayClasses = [
    { time: "9:00 AM", cls: "10-A", subject: "Real Numbers", status: "now", color: "hsl(173 80% 35%)" },
    { time: "10:00 AM", cls: "10-B", subject: "Polynomials", status: "next", color: "hsl(258 65% 56%)" },
    { time: "11:30 AM", cls: "9-A", subject: "Number Systems", status: "later", color: "hsl(217 91% 60%)" },
  ];

  const attentionItems = alerts && alerts.length > 0
    ? alerts.map((a) => ({
        icon: a.alert_type === "critical" ? AlertTriangle : FileText,
        text: a.message,
        action: a.suggested_action || "View",
        urgent: a.alert_type === "critical",
      }))
    : [
        { icon: FileText, text: "5 ungraded submissions — Real Numbers Weekly Assignment", action: "Grade Now", urgent: true },
        { icon: AlertTriangle, text: "Vivaan Jain scored below average in 3 consecutive assessments", action: "View", urgent: true },
        { icon: BarChart3, text: "New class insights available — AI found a common mistake pattern", action: "View", urgent: false },
      ];

  const quickActions = [
    { Icon: ClipboardList, label: "Create Assignment", path: "/teacher/assignments" },
    { Icon: BarChart3, label: "Class Analytics", path: "/teacher/analytics" },
    { Icon: CalendarDays, label: "Edit Schedule", path: "/teacher/schedule" },
  ];

  return (
    <DashboardLayout role="teacher">
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Good morning, {firstName} <span aria-hidden>☀️</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {dateStr} · {selectedClass}
              </p>
            </div>

            {/* Class selector — segmented pills */}
            <div
              role="tablist"
              aria-label="Select class"
              className="inline-flex p-1 rounded-xl bg-muted/60 border border-border self-start md:self-auto"
            >
              {CLASS_OPTIONS.map((cls) => {
                const active = selectedClass === cls;
                return (
                  <button
                    key={cls}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedClass(cls)}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cls}
                  </button>
                );
              })}
            </div>
          </header>

          {/* Metric cards — consistent icon container sizes */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {classMetrics.map((m) => (
              <Card key={m.label} className="p-4 flex items-center gap-3">
                <div
                  className="h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${m.color}15` }}
                  aria-hidden="true"
                >
                  <m.Icon className="h-5 w-5 md:h-6 md:w-6" style={{ color: m.color }} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-muted-foreground truncate">
                    Avg {m.label}
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-foreground tabular-nums">
                    {m.score}
                    <span className="text-sm font-semibold text-muted-foreground ml-0.5">%</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Class Thinking Network */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-foreground">Class Thinking Profile</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Average cognitive dimensions across {studentCount} students
            </p>
            <div className="flex justify-center">
              <ThinkingNetwork
                scores={classMetrics.map((d) => ({
                  name: d.label,
                  score: d.score,
                  icon: "",
                  color: d.color,
                }))}
                size="md"
              />
            </div>
          </Card>

          {/* Live Intelligence Hub — premium organized panel for all four live widgets */}
          <LiveIntelligenceHub className={selectedClass} />



          {/* Today's Classes */}

          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-foreground">Today's Classes</h2>
            </div>
            <ul className="space-y-2">
              {todayClasses.map((c) => (
                <li
                  key={c.time}
                  className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-muted/40 border-l-4"
                  style={{ borderLeftColor: c.color }}
                >
                  <div className="w-20 sm:w-24 shrink-0">
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                      {c.time}
                    </div>
                    {c.status === "now" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm sm:text-base font-semibold text-foreground truncate">
                      {c.subject}
                    </div>
                    <div className="text-xs text-muted-foreground">Class {c.cls}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {/* Needs Attention */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-foreground">Needs Your Attention</h2>
            </div>
            <ul className="divide-y divide-border">
              {attentionItems.map((item, i) => (
                <li key={i} className="flex items-center gap-3 py-3">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <item.icon
                      className={`h-4 w-4 ${item.urgent ? "text-amber-600" : "text-muted-foreground"}`}
                      aria-hidden="true"
                    />
                  </div>
                  <span className="flex-1 text-sm text-foreground">{item.text}</span>
                  <Button
                    size="sm"
                    variant={item.urgent ? "default" : "outline"}
                    onClick={() => {
                      if (item.action === "Grade Now") navigate("/teacher/assignments");
                      else navigate("/teacher/analytics");
                    }}
                    className="shrink-0"
                  >
                    {item.action}
                  </Button>
                </li>
              ))}
            </ul>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                className="group flex items-center sm:flex-col gap-3 sm:gap-2 p-4 sm:p-5 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all text-left sm:text-center"
              >
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                  <a.Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
