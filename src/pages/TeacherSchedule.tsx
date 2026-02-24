import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import TeachingCalendar, { defaultChapters } from "@/components/teacher/TeachingCalendar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const TeacherSchedule = () => {
  const { user, fullName } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [className, setClassName] = useState("");

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

  const handleSave = async (scheduleData: Record<string, unknown>) => {
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
      const chaptersData = defaultChapters.map(ch => ({
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
    <DashboardLayout role="teacher">
      <main className="p-8 max-w-[1400px] mx-auto">
        {/* Class Name Input */}
        <div className="bg-white/95 backdrop-blur-[10px] rounded-2xl p-6 mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/20">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-lg font-semibold text-[#2d3748]">📚 Publishing for Class:</label>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g. 10th CBSE A"
              className="px-4 py-2 rounded-lg border border-gray-300 text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            />
            <span className="text-sm text-gray-500 italic">Students in this class will see this schedule</span>
          </div>
        </div>

        <TeachingCalendar onSave={handleSave} isSaving={isSaving} />
      </main>
    </DashboardLayout>
  );
};

export default TeacherSchedule;
