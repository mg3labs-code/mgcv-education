import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { PilotInterest } from "@/data/dayPilotContent";

/**
 * Reads the student's chosen engagement domains (cricket, food, gaming, …)
 * from student_preferences.interest_domains so the Curiosity Arc visuals
 * and hook cards can sync automatically. Falls back to []/null.
 */
export function useStudentInterestDomains() {
  const { user } = useAuth();
  const [domains, setDomains] = useState<PilotInterest[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) { setLoaded(true); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("student_preferences")
        .select("interest_domains")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const raw = (data as { interest_domains?: string[] } | null)?.interest_domains ?? [];
      setDomains(raw as PilotInterest[]);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const save = useCallback(async (next: PilotInterest[]) => {
    setDomains(next);
    if (!user) return;
    await supabase
      .from("student_preferences")
      .update({ interest_domains: next } as never)
      .eq("user_id", user.id);
  }, [user]);

  return {
    domains,
    primary: domains[0] ?? null,
    loaded,
    save,
  };
}
