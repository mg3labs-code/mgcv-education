import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, BookOpen, Clock, MapPin, Lightbulb, FlaskConical, CheckCircle2, Plus, ListTodo } from "lucide-react";
import EmptyState from "@/components/EmptyState";
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
    <DashboardLayout role="teacher" breadcrumbItems={[{ label: "Dashboard", href: "/teacher" }, { label: "Daily Plan" }]}>
      <main className="p-8 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">Today's Teaching Plan</h1>
          <p className="text-muted-foreground">Your daily tasks and class preparation items</p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>{completedCount}/{totalCount} tasks done</span>
            </div>
            <div className="flex-1 max-w-[200px] h-2 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%" }} />
            </div>
          </div>
        </div>

        {/* Todo Items */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          ) : totalCount === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <p className="text-muted-foreground text-lg">No tasks for today yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Tasks can be added from the schedule page.</p>
            </div>
          ) : (
            (todos ?? []).map((item, i) => {
              const isExpanded = expandedSlot === i;
              const color = priorityColors[item.priority] || "#4299e1";

              return (
                <div key={item.id} className="rounded-xl border border-border/60 overflow-hidden transition-all shadow-sm" style={{ borderLeftWidth: "4px", borderLeftColor: color }}>
                  <button
                    onClick={() => toggleSlot(i)}
                    className="w-full flex items-center gap-4 p-5 text-left bg-card hover:bg-accent/30 transition-colors border-none cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground truncate">{item.title}</span>
                        {item.class_name && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{item.class_name}</span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={item.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => { e.stopPropagation(); updateStatus.mutate({ id: item.id, status: e.target.value }); }}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 border-none cursor-pointer ${statusColors[item.status] || ""}`}
                      >
                        {statusOptions.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
                      </select>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </div>
                  </button>

                  {isExpanded && item.description && (
                    <div className="bg-accent/20 border-t border-border/40 p-6 animate-fadeInUp">
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </DashboardLayout>
  );
};

export default TeacherDailyTodo;
