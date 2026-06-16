import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { TeachingMapEntry } from "@/data/teacherSubjects";

export function useTeacherAssignments() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TeachingMapEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) { setEntries([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("teacher_teaching_map")
      .select("subject, board, grade, section")
      .eq("teacher_id", user.id);
    setEntries(((data ?? []) as TeachingMapEntry[]).slice());
    setLoading(false);
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);

  // Derived legacy helpers — used by TeachingCalendar/TeacherSchedule that key on "Class N".
  const classes = Array.from(new Set(entries.map(e => `Class ${e.grade}`))).sort();
  const subjectsForClass = (className: string) => {
    const g = parseInt(className.replace(/\D/g, ""), 10);
    return Array.from(new Set(entries.filter(e => e.grade === g).map(e => e.subject)));
  };
  // Legacy shape used by some older callers.
  const assignments = Array.from(
    new Map(
      entries.map(e => [`${e.grade}::${e.subject}`, { class_name: `Class ${e.grade}`, subject: e.subject }]),
    ).values(),
  );

  return { entries, assignments, classes, subjectsForClass, loading, refetch };
}
