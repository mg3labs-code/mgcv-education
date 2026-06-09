import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import ClassCognitiveProfile from "@/components/teacher/ClassCognitiveProfile";
import LiveIntelligenceHub from "@/components/teacher/LiveIntelligenceHub";
import TeacherInsightsHub from "@/components/teacher/TeacherInsightsHub";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Eye, Brain, Target, Heart, Globe2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

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

          {/* Polished insights hub: skills · retention · weekly summary */}
          <TeacherInsightsHub
            className={selectedClass}
            studentCount={studentCount}
            classMetrics={classMetrics}
          />

          {/* Class Cognitive Profile — radar (deeper view) */}
          <ClassCognitiveProfile
            scores={classMetrics.map((d) => ({ label: d.label, score: d.score }))}
            studentCount={studentCount}
          />


          {/* Know Your World teaser */}
          <Link to="/teacher/know-your-world" className="block group">
            <Card className="p-4 sm:p-5 flex items-center gap-4 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-transparent border-teal-500/30 hover:border-teal-500/60 transition-colors">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shrink-0">
                <Globe2 className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm sm:text-base font-bold text-foreground">Know Your World · weekly digest</div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  Real-world updates & classroom hooks for every subject you teach.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </Card>
          </Link>

          {/* Live Intelligence Hub — 3-tab command center */}
          <LiveIntelligenceHub className={selectedClass} />

        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
