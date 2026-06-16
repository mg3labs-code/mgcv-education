import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import TeacherClassSubjectMatrix from "@/components/teacher/TeacherClassSubjectMatrix";
import { useAuth } from "@/contexts/AuthContext";
import { useTeacherAssignments } from "@/hooks/useTeacherAssignments";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import type { TeachingMapEntry } from "@/data/teacherSubjects";

const keyOf = (e: TeachingMapEntry) => `${e.subject}::${e.board}::${e.grade}::${e.section}`;

const TeacherSettings = () => {
  const { user } = useAuth();
  const { entries, refetch, loading } = useTeacherAssignments();
  const [value, setValue] = useState<TeachingMapEntry[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setValue(entries); }, [entries]);

  const save = async () => {
    if (!user) return;
    if (value.length === 0) {
      toast({ title: "Add at least one teaching preference", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const existing = new Set(entries.map(keyOf));
      const desired = new Set(value.map(keyOf));

      const toAdd = value.filter(e => !existing.has(keyOf(e)));
      const toRemove = entries.filter(e => !desired.has(keyOf(e)));

      if (toAdd.length > 0) {
        const { error } = await (supabase as any).from("teacher_teaching_map").insert(
          toAdd.map(e => ({ teacher_id: user.id, ...e })),
        );
        if (error) throw error;
      }
      for (const e of toRemove) {
        const { error } = await (supabase as any)
          .from("teacher_teaching_map")
          .delete()
          .eq("teacher_id", user.id)
          .eq("subject", e.subject)
          .eq("board", e.board)
          .eq("grade", e.grade)
          .eq("section", e.section);
        if (error) throw error;
      }
      await refetch();
      toast({ title: "Saved ✓", description: "Your teaching access is up to date." });
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
          <p className="text-sm text-muted-foreground">
            Subjects, boards, grades, and sections you teach. Calendar, assignments, and attendance access is scoped to these rows.
          </p>
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
