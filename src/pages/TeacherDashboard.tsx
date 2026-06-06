import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import ClassCognitiveProfile from "@/components/teacher/ClassCognitiveProfile";
import LiveIntelligenceHub from "@/components/teacher/LiveIntelligenceHub";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Eye, Brain, Target, Heart } from "lucide-react";

const CLASS_OPTIONS = ["Class 10", "Class 9", "Class 8"];

const TeacherDashboard = () => {
  const { fullName } = useAuth();
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

  const studentCount = classAvg?.student_count ?? 0;
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const classMetrics = [
    { label: "Clarity",   score: Math.round(Number(classAvg?.avg_clarity)   || 0), Icon: Eye,    color: "hsl(173 80% 35%)" },
    { label: "Thinking",  score: Math.round(Number(classAvg?.avg_thinking)  || 0), Icon: Brain,  color: "hsl(258 65% 56%)" },
    { label: "Focus",     score: Math.round(Number(classAvg?.avg_attention) || 0), Icon: Target, color: "hsl(38 92% 50%)"  },
    { label: "Character", score: Math.round(Number(classAvg?.avg_character) || 0), Icon: Heart,  color: "hsl(330 81% 60%)" },
  ];

  return (
    <DashboardLayout role="teacher">
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Good morning, {firstName}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {dateStr} · {selectedClass}
                {studentCount > 0 && ` · ${studentCount} students`}
              </p>
            </div>

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

          {/* Class average metric strip */}
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

          {/* Class Cognitive Profile — radar */}
          <ClassCognitiveProfile
            scores={classMetrics.map((d) => ({ label: d.label, score: d.score }))}
            studentCount={studentCount}
          />

          {/* Live Intelligence Hub — 3-tab command center */}
          <LiveIntelligenceHub className={selectedClass} />

        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
