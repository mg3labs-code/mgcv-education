import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import TeachingCalendar, { type ChapterDef, type ScheduleItem } from "@/components/teacher/TeachingCalendar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const TeacherSchedule = () => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [className, setClassName] = useState("Class 10");
  const [autoHomework, setAutoHomework] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("class_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.class_name) setClassName(data.class_name);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async (scheduleData: Record<string, ScheduleItem>, chaptersArr: ChapterDef[]) => {
    if (!user) return;
    if (!className.trim()) {
      toast({
        title: "Class name required",
        description: "Please enter a class name before publishing.",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      const chaptersData = chaptersArr.map(ch => ({
        id: ch.id,
        name: ch.name,
        colorHex: ch.colorHex,
      }));

      const { data: existing } = await supabase
        .from("teaching_schedules")
        .select("id")
        .eq("teacher_id", user.id)
        .eq("class_name", className)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("teaching_schedules")
          .update({
            schedule_data: scheduleData as any,
            chapters_data: chaptersData as any,
            subject: "Mathematics",
          })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("teaching_schedules")
          .insert({
            teacher_id: user.id,
            subject: "Mathematics",
            class_name: className,
            schedule_data: scheduleData as any,
            chapters_data: chaptersData as any,
          });
      }

      toast({
        title: "Schedule Published! 🎉",
        description: `Students in "${className}" can now see the updated schedule.`,
      });

      // Auto-generate homework for today's topic if enabled
      if (autoHomework) {
        const today = new Date().toISOString().split("T")[0];
        const todayItem = scheduleData[today];
        
        if (todayItem && todayItem.type === "topic" && todayItem.title) {
          // Find the chapter name for this topic
          const chapter = chaptersArr.find(ch => ch.id === todayItem.chapterId);
          
          try {
            const { data: hwResult, error: hwError } = await supabase.functions.invoke(
              "generate-daily-homework",
              {
                body: {
                  class_name: className,
                  subject: "Mathematics",
                  teacher_id: user.id,
                  topic_key: todayItem.key || todayItem.title,
                  topic_title: todayItem.title,
                  chapter_name: chapter?.name || "Mathematics",
                },
              }
            );

            if (hwError) {
              console.error("Homework generation error:", hwError);
            } else if (hwResult?.success) {
              toast({
                title: "📝 Homework Generated!",
                description: `"${hwResult.title}" — ${hwResult.question_count} questions auto-created for students.`,
              });
            } else if (hwResult?.skipped) {
              // Already exists, no action needed
            }
          } catch (err) {
            console.error("Failed to generate homework:", err);
          }
        }
      }
    } catch (error) {
      toast({
        title: "Error saving schedule",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout role="teacher" breadcrumbItems={[{ label: "Dashboard", href: "/teacher" }, { label: "Schedule" }]}>
      <main className="p-4 md:p-8 max-w-[1400px] mx-auto">
        {/* Auto Homework Toggle */}
        <div className="flex items-center justify-end gap-3 mb-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-sm text-muted-foreground font-medium">
              📝 Auto-generate daily homework
            </span>
            <button
              onClick={() => setAutoHomework(!autoHomework)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                autoHomework ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  autoHomework ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </label>
        </div>

        <TeachingCalendar 
          onSave={handleSave} 
          isSaving={isSaving} 
          selectedClass={className}
          onClassChange={setClassName}
        />
      </main>
    </DashboardLayout>
  );
};

export default TeacherSchedule;
