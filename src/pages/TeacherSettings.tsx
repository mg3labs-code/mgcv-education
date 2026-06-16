import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import TeacherClassSubjectMatrix from "@/components/teacher/TeacherClassSubjectMatrix";
import { useAuth } from "@/contexts/AuthContext";
import { useTeacherAssignments } from "@/hooks/useTeacherAssignments";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import type { TeachingMapEntry } from "@/data/teacherSubjects";

const keyOf = (e: TeachingMapEntry) => `${e.subject}::${e.board}::${e.grade}::${e.section}`;

const TeacherSettings = () => {
  const { user } = useAuth();
  const { entries, refetch, loading } = useTeacherAssignments();
  const [value, setValue] = useState<TeachingMapEntry[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = useRef<number | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    setValue(entries);
    initialized.current = false; // skip first autosave after a fresh load
  }, [entries]);

  const persist = async (next: TeachingMapEntry[]) => {
    if (!user) return;
    setStatus("saving");
    try {
      const existing = new Set(entries.map(keyOf));
      const desired = new Set(next.map(keyOf));
      const toAdd = next.filter((e) => !existing.has(keyOf(e)));
      const toRemove = entries.filter((e) => !desired.has(keyOf(e)));

      if (toAdd.length > 0) {
        const { error } = await (supabase as any)
          .from("teacher_teaching_map")
          .insert(toAdd.map((e) => ({ teacher_id: user.id, ...e })));
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
      setStatus("saved");
      window.setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 1500);
    } catch (err: any) {
      setStatus("error");
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    }
  };

  // Debounced auto-save on any change
  const onChange = (next: TeachingMapEntry[]) => {
    setValue(next);
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => persist(next), 700);
  };

  return (
    <DashboardLayout role="teacher" breadcrumbItems={[{ label: "Dashboard", href: "/teacher" }, { label: "My Profile" }]}>
      <main className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="text-sm text-muted-foreground">
              Subjects, boards, grades, and sections you teach. Changes save automatically.
            </p>
          </div>
          <div className="text-xs flex items-center gap-1.5 mt-1">
            {status === "saving" && (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>)}
            {status === "saved" && (<span className="text-emerald-600 flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Saved</span>)}
            {status === "error" && <span className="text-destructive">Save failed</span>}
          </div>
        </div>

        {loading ? (
          <div className="text-muted-foreground text-sm">Loading…</div>
        ) : (
          <>
            <TeacherClassSubjectMatrix value={value} onChange={onChange} />
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => persist(value)} disabled={status === "saving"}>
                Save now
              </Button>
            </div>
          </>
        )}
      </main>
    </DashboardLayout>
  );
};

export default TeacherSettings;
