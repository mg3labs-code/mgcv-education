import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { TeacherAssignment } from "@/data/teacherSubjects";

export function useTeacherAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) { setAssignments([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("teacher_assignments")
      .select("class_name, subject")
      .eq("teacher_id", user.id)
      .order("class_name");
    setAssignments(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);

  // Derived helpers
  const classes = Array.from(new Set(assignments.map(a => a.class_name)));
  const subjectsForClass = (className: string) =>
    assignments.filter(a => a.class_name === className).map(a => a.subject);

  return { assignments, classes, subjectsForClass, loading, refetch };
}
