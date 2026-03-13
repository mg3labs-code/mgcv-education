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
      <main className="p-8 max-w-[1400px] mx-auto">
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
