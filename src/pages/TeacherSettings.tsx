import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import TeacherClassSubjectMatrix from "@/components/teacher/TeacherClassSubjectMatrix";
import { useAuth } from "@/contexts/AuthContext";
import { useTeacherAssignments } from "@/hooks/useTeacherAssignments";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import type { TeacherAssignment } from "@/data/teacherSubjects";

const TeacherSettings = () => {
  const { user } = useAuth();
  const { assignments, refetch, loading } = useTeacherAssignments();
  const [value, setValue] = useState<TeacherAssignment[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(assignments);
  }, [assignments]);

  const save = async () => {
    if (!user) return;
    if (value.length === 0) {
      toast({ title: "Pick at least one class & subject", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      // Diff existing vs desired.
      const existingKeys = new Set(assignments.map(a => `${a.class_name}::${a.subject}`));
      const desiredKeys = new Set(value.map(a => `${a.class_name}::${a.subject}`));

      const toAdd = value.filter(a => !existingKeys.has(`${a.class_name}::${a.subject}`));
      const toRemove = assignments.filter(a => !desiredKeys.has(`${a.class_name}::${a.subject}`));

      const gradeOf = (cn: string) => parseInt(cn.replace(/\D/g, ""), 10) || 9;
      if (toAdd.length > 0) {
        const { error } = await (supabase as any).from("teacher_teaching_map").insert(
          toAdd.map(a => ({
            teacher_id: user.id,
            subject: a.subject,
            board: "CBSE",
            grade: gradeOf(a.class_name),
            section: "A",
          }))
        );
        if (error) throw error;
      }
      for (const a of toRemove) {
        const { error } = await (supabase as any)
          .from("teacher_teaching_map")
          .delete()
          .eq("teacher_id", user.id)
          .eq("grade", gradeOf(a.class_name))
          .eq("subject", a.subject);
        if (error) throw error;
      }
      await refetch();
      toast({ title: "Saved ✓", description: "Your class & subject access is up to date." });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="teacher" breadcrumbItems={[{ label: "Dashboard", href: "/teacher" }, { label: "Settings" }]}>
      <main className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Teacher Settings</h1>
          <p className="text-sm text-muted-foreground">Classes & subjects you teach. Access to schedules, assignments, and attendance is scoped to these pairs.</p>
        </div>

        {loading ? (
          <div className="text-muted-foreground text-sm">Loading…</div>
        ) : (
          <>
            <TeacherClassSubjectMatrix value={value} onChange={setValue} />
            <div className="flex justify-end">
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </>
        )}
      </main>
    </DashboardLayout>
  );
};

export default TeacherSettings;
