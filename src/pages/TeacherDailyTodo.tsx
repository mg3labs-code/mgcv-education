import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, BookOpen, Clock, MapPin, Lightbulb, FlaskConical, CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";

const statusOptions = ["pending", "in_progress", "completed"] as const;
const priorityOptions = ["low", "medium", "high"] as const;

const statusColors: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600",
  in_progress: "bg-amber-100 text-amber-800 animate-pulse",
  completed: "bg-green-100 text-green-800",
};
const statusLabels: Record<string, string> = { pending: "Next", in_progress: "Now", completed: "Done" };
const priorityColors: Record<string, string> = { low: "#48bb78", medium: "#4299e1", high: "#ed64a6" };

const TeacherDailyTodo = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedSlot, setExpandedSlot] = useState<number | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const { data: todos, isLoading } = useQuery({
    queryKey: ["teacher-todos", user?.id, todayStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_todos")
        .select("*")
        .eq("teacher_id", user!.id)
        .eq("date", todayStr)
        .order("priority", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("teacher_todos").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher-todos"] }),
  });

  const toggleSlot = (i: number) => setExpandedSlot(expandedSlot === i ? null : i);
  const completedCount = (todos ?? []).filter(t => t.status === "completed").length;
  const totalCount = (todos ?? []).length;

  return (
    <DashboardLayout role="teacher">
      <main className="p-8 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">Today's Teaching Plan</h1>
          <p className="text-muted-foreground">Your daily schedule with topic breakdowns for quick revision before each class</p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>{completedCount}/{totalCount} classes done</span>
            </div>
            <div className="flex-1 max-w-[200px] h-2 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(completedCount / totalCount) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Schedule Timeline */}
        <div className="space-y-3">
          {scheduleItems.map((item, i) => {
            const isExpanded = expandedSlot === i;
            const statusLabel = item.status === "completed" ? "Done" : item.status === "current" ? "Now" : "Next";
            const statusClass = item.status === "completed"
              ? "bg-green-100 text-green-800"
              : item.status === "current"
                ? "bg-amber-100 text-amber-800 animate-pulse"
                : "bg-slate-100 text-slate-600";

            return (
              <div key={i} className="rounded-xl border border-border/60 overflow-hidden transition-all shadow-sm" style={{ borderLeftWidth: "4px", borderLeftColor: item.color }}>
                {/* Timeline Row */}
                <button
                  onClick={() => toggleSlot(i)}
                  className="w-full flex items-center gap-4 p-5 text-left bg-card hover:bg-accent/30 transition-colors border-none cursor-pointer"
                >
                  <div className="min-w-[90px]">
                    <div className="font-semibold text-foreground">{item.time}</div>
                    <div className="text-xs text-muted-foreground">{item.endTime}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground truncate">{item.topic}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${activityColors[item.activity]}`}>{item.activity}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{item.class}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.room}</span>
                      <span className="text-muted-foreground/60">• {item.chapter}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${statusClass}`}>{statusLabel}</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                </button>

                {/* Expanded: Topic Breakdown */}
                {isExpanded && (
                  <div className="bg-accent/20 border-t border-border/40 p-6 animate-fadeInUp">
                    <div className="grid md:grid-cols-2 gap-4">
                      {item.breakdown.map((section, si) => (
                        <div key={si} className="bg-card rounded-lg p-4 border border-border/30">
                          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                            <BookOpen className="h-3.5 w-3.5 text-primary" />
                            {section.heading}
                          </h4>
                          <ul className="space-y-1.5">
                            {section.points.map((pt, pi) => (
                              <li key={pi} className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className="text-primary mt-0.5 shrink-0">›</span>
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}

                      {item.keyFormulas && item.keyFormulas.length > 0 && (
                        <div className="bg-card rounded-lg p-4 border border-border/30">
                          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                            <FlaskConical className="h-3.5 w-3.5 text-primary" />
                            Key Formulas
                          </h4>
                          <div className="space-y-1.5">
                            {item.keyFormulas.map((f, fi) => (
                              <div key={fi} className="text-xs bg-primary/5 text-primary font-mono px-3 py-1.5 rounded-md border border-primary/10">
                                {f}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.teachingTip && (
                        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200/50 md:col-span-2">
                          <h4 className="text-sm font-semibold text-amber-800 mb-1 flex items-center gap-2">
                            <Lightbulb className="h-3.5 w-3.5" />
                            Teaching Tip
                          </h4>
                          <p className="text-xs text-amber-700 leading-relaxed">{item.teachingTip}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </DashboardLayout>
  );
};

export default TeacherDailyTodo;
