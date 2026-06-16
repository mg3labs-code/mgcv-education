import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { TeacherAssignment } from "@/data/teacherSubjects";

// Reads from the new teacher_teaching_map table and projects rows into the legacy
// { class_name, subject } shape that the existing UI consumes.
export function useTeacherAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) { setAssignments([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("teacher_teaching_map")
      .select("subject, grade")
      .eq("teacher_id", user.id);
    const rows = (data ?? []) as Array<{ subject: string; grade: number }>;
    // Deduplicate (subject, grade) since the new table also keys on board+section.
    const seen = new Set<string>();
    const mapped: TeacherAssignment[] = [];
    for (const r of rows) {
      const class_name = `Class ${r.grade}`;
      const key = `${class_name}::${r.subject}`;
      if (seen.has(key)) continue;
      seen.add(key);
      mapped.push({ class_name, subject: r.subject });
    }
    mapped.sort((a, b) => a.class_name.localeCompare(b.class_name));
    setAssignments(mapped);
    setLoading(false);
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);

  const classes = Array.from(new Set(assignments.map(a => a.class_name)));
  const subjectsForClass = (className: string) =>
    assignments.filter(a => a.class_name === className).map(a => a.subject);

  return { assignments, classes, subjectsForClass, loading, refetch };
}
