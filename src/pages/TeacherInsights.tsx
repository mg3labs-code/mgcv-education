import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar,
} from "recharts";
import {
  AlertTriangle, TrendingUp, TrendingDown, Minus, Users, Brain, Target,
  Loader2, ArrowLeft, Download,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const TREND_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

const TeacherInsights = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // Fetch common mistakes
  const { data: mistakesData, isLoading: mistakesLoading, refetch: refetchMistakes } = useQuery({
    queryKey: ["common-mistakes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("class-insights", {
        body: { action: "common_mistakes" },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch student growth
  const { data: growthData, isLoading: growthLoading } = useQuery({
    queryKey: ["student-growth", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("class-insights", {
        body: { action: "student_growth" },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const selectedGrowth = growthData?.students?.find((s: any) => s.id === selectedStudent);

  // Build class-wide trend chart data
  const classTrendData = (() => {
    if (!growthData?.students?.length) return [];
    // Collect all assignment names
    const assignmentSet = new Set<string>();
    growthData.students.forEach((s: any) => s.scores.forEach((sc: any) => assignmentSet.add(sc.assignment)));
    const assignments = [...assignmentSet];
    return assignments.map(a => {
      const point: any = { assignment: a.length > 20 ? a.substring(0, 20) + "…" : a };
      growthData.students.slice(0, 8).forEach((s: any) => {
        const sc = s.scores.find((x: any) => x.assignment === a);
        if (sc) point[s.name] = sc.score;
      });
      return point;
    });
  })();

  const frequencyColor: Record<string, string> = {
    High: "bg-red-100 text-red-800",
    Medium: "bg-yellow-100 text-yellow-800",
    Low: "bg-green-100 text-green-800",
  };

  // Export report as text
  const exportReport = () => {
    if (!growthData?.students || !mistakesData) return;
    let report = "=== CLASS INSIGHTS REPORT ===\n\n";
    report += "--- STUDENT GROWTH ---\n";
    growthData.students.forEach((s: any) => {
      report += `${s.name}: Avg ${s.average}%, Trend ${s.trend > 0 ? "+" : ""}${s.trend}%, ${s.totalAssignments} assignments\n`;
    });
    report += "\n--- COMMON MISTAKES ---\n";
    if (mistakesData.analysis?.patterns) {
      mistakesData.analysis.patterns.forEach((p: any) => {
        report += `\n[${p.frequency}] ${p.category}\n`;
        report += `Root cause: ${p.root_cause}\n`;
        report += `Intervention: ${p.intervention}\n`;
      });
    }
    report += `\nSummary: ${mistakesData.analysis?.overall_summary || "N/A"}`;
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "class-insights-report.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout role="teacher" breadcrumbItems={[{ label: "Dashboard", href: "/teacher" }, { label: "Insights" }]}>
      <main className="p-6 max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">🧠 Class Insights</h1>
            <p className="text-muted-foreground">Common mistakes, growth trends & actionable interventions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportReport} className="gap-2">
              <Download className="h-4 w-4" /> Export Report
            </Button>
            <Button variant="ghost" onClick={() => navigate("/teacher")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
            </Button>
          </div>
        </div>

        <Tabs defaultValue="mistakes">
          <TabsList className="mb-6">
            <TabsTrigger value="mistakes" className="gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Common Mistakes
            </TabsTrigger>
            <TabsTrigger value="growth" className="gap-1">
              <TrendingUp className="h-3.5 w-3.5" /> Student Growth
            </TabsTrigger>
          </TabsList>

          {/* COMMON MISTAKES TAB */}
          <TabsContent value="mistakes">
            {mistakesLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Analyzing mistakes with AI...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4 text-center">
                    <Brain className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-bold text-card-foreground">{mistakesData?.totalAnswers || 0}</p>
                    <p className="text-xs text-muted-foreground">Answers Analyzed</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-red-500" />
                    <p className="text-2xl font-bold text-card-foreground">{mistakesData?.totalMistakes || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Mistakes Found</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <Target className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-2xl font-bold text-card-foreground">
                      {mistakesData?.analysis?.patterns?.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Patterns Identified</p>
                  </Card>
                </div>

                {/* AI Analysis */}
                {mistakesData?.analysis && (
                  <>
                    {mistakesData.analysis.overall_summary && (
                      <Card className="p-5 border-l-4 border-primary">
                        <h3 className="font-semibold text-card-foreground mb-1">📋 Overall Summary</h3>
                        <p className="text-sm text-muted-foreground">{mistakesData.analysis.overall_summary}</p>
                        {mistakesData.analysis.priority_focus && (
                          <p className="text-sm mt-2">
                            <strong>🎯 Priority Focus:</strong> {mistakesData.analysis.priority_focus}
                          </p>
                        )}
                      </Card>
                    )}

                    <div className="space-y-3">
                      {mistakesData.analysis.patterns?.map((pattern: any, i: number) => (
                        <Card key={i} className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-card-foreground">{pattern.category}</h4>
                            <Badge className={frequencyColor[pattern.frequency] || "bg-muted text-muted-foreground"}>
                              {pattern.frequency}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-muted-foreground">Examples:</span>
                              <ul className="list-disc ml-5 mt-1 text-muted-foreground">
                                {pattern.examples?.slice(0, 3).map((ex: string, j: number) => (
                                  <li key={j}>{ex}</li>
                                ))}
                              </ul>
                            </div>
                            <p><span className="font-medium text-red-600">Root Cause:</span> {pattern.root_cause}</p>
                            <p><span className="font-medium text-green-600">Intervention:</span> {pattern.intervention}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                )}

                {/* Per-Question Breakdown */}
                {mistakesData?.questionBreakdown?.length > 0 && (
                  <Card className="p-5">
                    <h3 className="font-semibold text-card-foreground mb-4">Per-Question Mistake Count</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={mistakesData.questionBreakdown.map((q: any) => ({
                        question: q.question.length > 30 ? q.question.substring(0, 30) + "…" : q.question,
                        mistakes: q.count,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="question" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="mistakes" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                )}

                {!mistakesData?.analysis && !mistakesData?.questionBreakdown?.length && (
                  <div className="text-center py-16">
                    <Brain className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground">No evaluated submissions yet. Mistakes will appear after students submit answers.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* STUDENT GROWTH TAB */}
          <TabsContent value="growth">
            {growthLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading growth data...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Class-wide Trend Chart */}
                {classTrendData.length > 0 && (
                  <Card className="p-5">
                    <h3 className="font-semibold text-card-foreground mb-4">📈 Class Score Trends</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={classTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="assignment" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        {growthData?.students?.slice(0, 8).map((s: any, i: number) => (
                          <Line
                            key={s.id}
                            type="monotone"
                            dataKey={s.name}
                            stroke={TREND_COLORS[i % TREND_COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                )}

                {/* Student Cards */}
                <div className="grid gap-3">
                  <h3 className="font-semibold text-foreground">Individual Student Growth</h3>
                  {growthData?.students?.map((student: any) => (
                    <Card
                      key={student.id}
                      className={`p-4 cursor-pointer transition-colors hover:border-primary/40 ${
                        selectedStudent === student.id ? "border-primary" : ""
                      }`}
                      onClick={() => setSelectedStudent(selectedStudent === student.id ? null : student.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {student.name?.split(" ").map((n: string) => n[0]).join("")}
                          </div>
                          <div>
                            <span className="font-medium text-card-foreground">{student.name}</span>
                            <p className="text-xs text-muted-foreground">{student.totalAssignments} assignments</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{student.average}% avg</Badge>
                          <div className={`flex items-center gap-1 text-sm font-semibold ${
                            student.trend > 0 ? "text-green-600" : student.trend < 0 ? "text-red-600" : "text-muted-foreground"
                          }`}>
                            {student.trend > 0 ? <TrendingUp className="h-4 w-4" /> :
                             student.trend < 0 ? <TrendingDown className="h-4 w-4" /> :
                             <Minus className="h-4 w-4" />}
                            {student.trend > 0 ? "+" : ""}{student.trend}%
                          </div>
                        </div>
                      </div>

                      {/* Expanded view */}
                      {selectedStudent === student.id && student.scores.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={student.scores.map((s: any) => ({
                              ...s,
                              assignment: s.assignment.length > 15 ? s.assignment.substring(0, 15) + "…" : s.assignment,
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="assignment" tick={{ fontSize: 10 }} />
                              <YAxis domain={[0, 100]} />
                              <Tooltip />
                              <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </Card>
                  ))}
                  {(!growthData?.students || growthData.students.length === 0) && (
                    <div className="text-center py-16">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                      <p className="text-muted-foreground">No student submissions yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </DashboardLayout>
  );
};

export default TeacherInsights;
