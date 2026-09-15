import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, BookOpenCheck, MessageSquareQuote, Sparkles, Users } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import EmptyState from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useTeacherAssignments } from "@/hooks/useTeacherAssignments";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { PILOT_DEMO_ASSIGNMENTS, PILOT_DEMO_EXPLANATIONS, type TeacherExplanation } from "@/data/pilotDemoData";
import { assignmentKey, assignmentLabel } from "@/lib/classIdentity";

type Filter = "all" | "support" | "developing" | "strong";

const normaliseBand = (band: string | null, score: number | null): TeacherExplanation["band"] => {
  if (score !== null) return score >= 80 ? "Strong" : score >= 55 ? "Developing" : "Needs support";
  const value = band?.toLowerCase() ?? "";
  if (value.includes("strong") || value.includes("master")) return "Strong";
  if (value.includes("develop")) return "Developing";
  return "Needs support";
};

const teachingKey = (entry: { board: string; grade: number; section: string; subject: string }) =>
  `${assignmentKey(entry)}::${entry.subject}`;

const TeacherExplanations = () => {
  const { demoMode } = useDemoMode();
  const { entries: realAssignments, loading: assignmentsLoading } = useTeacherAssignments();
  const assignments = demoMode ? PILOT_DEMO_ASSIGNMENTS : realAssignments;
  const [selectedKey, setSelectedKey] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const selected = assignments.find((entry) => teachingKey(entry) === selectedKey) ?? assignments[0];

  const { data: realRows = [], isLoading } = useQuery({
    queryKey: ["teacher-explanations", selected?.board, selected?.grade, selected?.section, selected?.subject],
    enabled: !demoMode && !!selected,
    queryFn: async () => {
      if (!selected) return [];
      const { data, error } = await (supabase as any).rpc("get_teacher_explanations", {
        _board: selected.board,
        _grade: selected.grade,
        _section: selected.section,
        _subject: selected.subject,
      });
      if (error) throw error;
      return (data ?? []).map((row: any): TeacherExplanation => ({
        ...row,
        chapter_title: row.chapter_id.replace(/-/g, " "),
        episode_title: row.episode_id.replace(/-/g, " "),
        score: Number(row.score ?? 0),
        band: normaliseBand(row.band, row.score === null ? null : Number(row.score)),
      }));
    },
  });

  const rows = demoMode ? PILOT_DEMO_EXPLANATIONS : realRows;
  const filtered = useMemo(() => rows.filter((row) => {
    if (filter === "all") return true;
    if (filter === "support") return row.band === "Needs support";
    if (filter === "developing") return row.band === "Developing";
    return row.band === "Strong";
  }), [filter, rows]);

  const counts = useMemo(() => ({
    all: rows.length,
    support: rows.filter((r) => r.band === "Needs support").length,
    developing: rows.filter((r) => r.band === "Developing").length,
    strong: rows.filter((r) => r.band === "Strong").length,
  }), [rows]);

  const opener = rows.find((row) => row.band === "Needs support")?.next_step;

  return (
    <DashboardLayout role="teacher">
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-primary">MGCV Pilot Edition</p>
              <h1 className="mt-1 text-3xl font-bold text-foreground">What my students said</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Read Day 2 explanations before deciding what to teach next.</p>
            </div>
            {selected && (
              <select
                value={teachingKey(selected)}
                onChange={(event) => setSelectedKey(event.target.value)}
                className="min-w-[280px] rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                aria-label="Select teaching assignment"
              >
                {assignments.map((entry) => (
                  <option key={teachingKey(entry)} value={teachingKey(entry)}>
                    {assignmentLabel(entry)} · {entry.subject}
                  </option>
                ))}
              </select>
            )}
          </header>

          {!selected && !assignmentsLoading ? (
            <EmptyState icon={Users} title="Add your class first" description="Add a board, class, section, and subject in My Profile to connect the correct students." />
          ) : (
            <>
              <section className="grid gap-3 sm:grid-cols-3">
                <Card className="p-4"><p className="text-xs text-muted-foreground">Explanations</p><p className="mt-1 text-2xl font-bold">{counts.all}</p></Card>
                <Card className="p-4"><p className="text-xs text-muted-foreground">Needs support</p><p className="mt-1 text-2xl font-bold text-destructive">{counts.support}</p></Card>
                <Card className="p-4"><p className="text-xs text-muted-foreground">Strong</p><p className="mt-1 text-2xl font-bold text-success">{counts.strong}</p></Card>
              </section>

              <section className="flex flex-wrap gap-2" aria-label="Filter explanations">
                {(["all", "support", "developing", "strong"] as Filter[]).map((value) => (
                  <Button key={value} size="sm" variant={filter === value ? "default" : "outline"} onClick={() => setFilter(value)}>
                    {value === "all" ? "All" : value === "support" ? "Needs support" : value[0].toUpperCase() + value.slice(1)} · {counts[value]}
                  </Button>
                ))}
              </section>

              {opener && (
                <Card className="border-primary/30 bg-primary/5 p-5">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
                    <div><p className="text-xs font-bold uppercase text-primary">Generated suggestion for tomorrow</p><p className="mt-1 text-sm text-foreground">{opener}</p></div>
                  </div>
                </Card>
              )}

              {isLoading ? (
                <p className="py-12 text-center text-sm text-muted-foreground">Loading student explanations…</p>
              ) : filtered.length === 0 ? (
                <EmptyState icon={MessageSquareQuote} title="No Day 2 explanations yet" description="Student explanations appear here after the 20-hour gate and Day 2 Build session." />
              ) : (
                <section className="grid gap-4 lg:grid-cols-2">
                  {filtered.map((row) => (
                    <Card key={`${row.student_id}-${row.chapter_id}-${row.episode_id}`} className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div><h2 className="font-semibold text-foreground">{row.student_name}</h2><p className="text-xs text-muted-foreground">{row.chapter_title} · {row.episode_title}</p></div>
                        <Badge variant={row.band === "Needs support" ? "destructive" : row.band === "Strong" ? "default" : "secondary"}>{row.score}% · {row.band}</Badge>
                      </div>
                      <blockquote className="my-4 border-l-2 border-primary pl-4 text-sm leading-6 text-foreground">“{row.explanation}”</blockquote>
                      <div className="space-y-2 rounded-md bg-muted/60 p-3 text-xs">
                        <p><span className="font-semibold">AI mirror:</span> {row.feedback}</p>
                        <p><span className="font-semibold">Try next:</span> {row.next_step}</p>
                      </div>
                    </Card>
                  ))}
                </section>
              )}
            </>
          )}

          <Card className="p-5">
            <div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><h2 className="font-semibold">How to read this screen</h2><p className="mt-1 text-sm text-muted-foreground">Scores are feedback signals from the student’s explanation, not final grades. Review the words before acting on the score.</p></div></div>
          </Card>

          <Button variant="outline" onClick={() => { window.location.href = "/student/textbook/ch1"; }}><BookOpenCheck className="mr-2 h-4 w-4" />Open Class 9 Real Numbers</Button>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default TeacherExplanations;