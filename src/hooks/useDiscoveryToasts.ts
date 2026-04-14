import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DiscoveryContext {
  userId: string | undefined;
  episodeCount: number;
  streakDays: number;
  hasUsedScholarMethod: boolean;
  hasSubmission: boolean;
}

const MILESTONES = [
  { key: "first_episode", check: (c: DiscoveryContext) => c.episodeCount >= 1, message: "🔥 1 day streak! Keep going tomorrow", duration: 5000 },
  { key: "inner_os_unlocked", check: (c: DiscoveryContext) => c.episodeCount >= 3, message: "📊 Your Learning Strengths are ready! Check your dashboard", duration: 6000 },
  { key: "first_assignment", check: (c: DiscoveryContext) => c.hasSubmission, message: "✅ Your teacher can see your work now", duration: 5000 },
  { key: "scholar_unlocked", check: (c: DiscoveryContext) => c.episodeCount >= 5 && c.hasUsedScholarMethod, message: "🎓 Scholar Methods unlocked! Try the Debate Challenge", duration: 6000 },
  { key: "growth_ready", check: (c: DiscoveryContext) => c.streakDays >= 7, message: "📈 My Growth is ready — see your week!", duration: 6000 },
] as const;

export function useDiscoveryToasts(context: DiscoveryContext) {
  const firedRef = useRef<Set<string>>(new Set());
  const loadedRef = useRef(false);

  // Load milestones_seen from DB once
  useEffect(() => {
    if (!context.userId || loadedRef.current) return;
    loadedRef.current = true;

    supabase
      .from("student_preferences")
      .select("milestones_seen")
      .eq("user_id", context.userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.milestones_seen && typeof data.milestones_seen === "object") {
          const seen = data.milestones_seen as Record<string, boolean>;
          Object.keys(seen).forEach(k => firedRef.current.add(k));
        }
      });
  }, [context.userId]);

  // Check milestones
  useEffect(() => {
    if (!context.userId) return;

    const toFire: typeof MILESTONES[number][] = [];

    for (const milestone of MILESTONES) {
      if (firedRef.current.has(milestone.key)) continue;
      if (milestone.check(context)) {
        toFire.push(milestone);
        firedRef.current.add(milestone.key);
      }
    }

    if (toFire.length === 0) return;

    // Fire toasts with staggered timing
    toFire.forEach((m, i) => {
      setTimeout(() => {
        toast.success(m.message, { duration: m.duration });
      }, (i + 1) * 1500);
    });

    // Persist to DB
    const seenObj: Record<string, boolean> = {};
    firedRef.current.forEach(k => { seenObj[k] = true; });

    supabase
      .from("student_preferences")
      .update({ milestones_seen: seenObj } as any)
      .eq("user_id", context.userId)
      .then(() => {});
  }, [context]);
}
