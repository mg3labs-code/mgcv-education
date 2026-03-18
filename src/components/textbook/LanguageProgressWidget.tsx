import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Flame, TrendingUp, BookOpen, PenLine } from "lucide-react";

const LanguageProgressWidget = ({ subjectName }: { subjectName: string }) => {
  const { user } = useAuth();

  const { data: progress } = useQuery({
    queryKey: ["language_progress", user?.id, subjectName],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("language_progress")
        .select("*")
        .eq("user_id", user!.id)
        .eq("subject_name", subjectName)
        .order("progress_date", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
  });

  const totalWords = progress?.reduce((sum, d) => sum + (d.words_learned || 0), 0) || 0;
  const totalSentences = progress?.reduce((sum, d) => sum + (d.sentences_written || 0), 0) || 0;
  const totalPassages = progress?.reduce((sum, d) => sum + (d.passages_read || 0), 0) || 0;
  const streakDays = progress?.length || 0;

  // Compound growth milestones
  const milestones = [
    { day: "Day 1", words: 5, icon: "🌱" },
    { day: "Week 1", words: 35, icon: "🌿" },
    { day: "Month 1", words: 150, icon: "🌳" },
    { day: "Month 3", words: 500, icon: "🏆" },
  ];

  const currentMilestone = milestones.findIndex(m => totalWords < m.words);
  const activeMilestone = currentMilestone === -1 ? milestones.length - 1 : Math.max(0, currentMilestone - 1);

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-r from-amber-50/60 via-emerald-50/40 to-sky-50/60 dark:from-amber-950/20 dark:via-emerald-950/10 dark:to-sky-950/20 p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-base font-bold text-foreground">
          📈 Your {subjectName} Journey
        </h3>
        {streakDays > 0 && (
          <span className="ml-auto flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
            <Flame className="h-3 w-3" /> {streakDays} day streak
          </span>
        )}
      </div>

      {/* Milestone timeline */}
      <div className="flex items-center justify-between mb-4 overflow-x-auto gap-1">
        {milestones.map((m, i) => (
          <div key={m.day} className="flex items-center min-w-0">
            <div className={`flex flex-col items-center text-center min-w-[70px] ${i <= activeMilestone ? "opacity-100" : "opacity-40"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 ${
                i <= activeMilestone 
                  ? "bg-primary/10 border-primary shadow-sm" 
                  : "bg-muted border-border"
              }`}>
                {m.icon}
              </div>
              <span className="text-[10px] font-semibold text-foreground mt-1">{m.day}</span>
              <span className="text-[10px] text-muted-foreground">{m.words} words</span>
            </div>
            {i < milestones.length - 1 && (
              <div className={`h-0.5 w-6 shrink-0 mx-1 ${i < activeMilestone ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card/80 rounded-xl p-3 text-center border border-border">
          <BookOpen className="h-4 w-4 text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{totalWords}</p>
          <p className="text-[10px] text-muted-foreground">Words learned</p>
        </div>
        <div className="bg-card/80 rounded-xl p-3 text-center border border-border">
          <PenLine className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{totalSentences}</p>
          <p className="text-[10px] text-muted-foreground">Sentences written</p>
        </div>
        <div className="bg-card/80 rounded-xl p-3 text-center border border-border">
          <BookOpen className="h-4 w-4 text-purple-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{totalPassages}</p>
          <p className="text-[10px] text-muted-foreground">Passages read</p>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center mt-3 italic">
        🌱 Small daily practice compounds into fluency — just 5 words a day = 150+ words in a month!
      </p>
    </div>
  );
};

export default LanguageProgressWidget;
