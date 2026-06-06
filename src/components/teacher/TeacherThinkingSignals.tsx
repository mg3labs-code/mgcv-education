import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Radio, ChevronUp, Sparkles, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Props {
  className: string;
}

type Signal = {
  id: string;
  kind: "rung" | "thought" | "vibe";
  studentName: string;
  text: string;
  meta?: string;
  at: string;
};

const KIND_META: Record<Signal["kind"], { color: string; bg: string; Icon: typeof Radio; label: string }> = {
  rung: { color: "text-emerald-600", bg: "bg-emerald-500/10", Icon: ChevronUp, label: "Climbed" },
  thought: { color: "text-violet-600", bg: "bg-violet-500/10", Icon: MessageCircle, label: "First thought" },
  vibe: { color: "text-amber-600", bg: "bg-amber-500/10", Icon: Sparkles, label: "Vibe check" },
};

/**
 * Live stream of student thinking signals — rung climbs, first thoughts,
 * vibe-check responses. Realtime subscription on student_rung_state
 * and curiosity_arc_progress, scoped to the teacher's class via RLS.
 */
const TeacherThinkingSignals = ({ className }: Props) => {
  const { user } = useAuth();
  const [signals, setSignals] = useState<Signal[]>([]);

  // Get class student ids + names (RLS scopes to teacher's class).
  const { data: students } = useQuery({
    queryKey: ["class-students-min", user?.id, className],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .eq("class_name", className);
      return data ?? [];
    },
  });

  const nameMap = new Map((students ?? []).map((s) => [s.user_id, s.full_name ?? "Student"]));
  const ids = (students ?? []).map((s) => s.user_id);

  // Seed with recent rows
  useEffect(() => {
    if (ids.length === 0) {
      setSignals([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const [{ data: rungs }, { data: arcs }] = await Promise.all([
        supabase
          .from("student_rung_state")
          .select("id, user_id, current_rung, depth_track, updated_at, episode_id")
          .in("user_id", ids)
          .order("updated_at", { ascending: false })
          .limit(15),
        supabase
          .from("curiosity_arc_progress")
          .select("id, user_id, day1_first_thought, updated_at, concept_key")
          .in("user_id", ids)
          .not("day1_first_thought", "is", null)
          .order("updated_at", { ascending: false })
          .limit(10),
      ]);
      if (cancelled) return;
      const merged: Signal[] = [
        ...(rungs ?? []).map((r: any) => ({
          id: `r-${r.id}`,
          kind: "rung" as const,
          studentName: nameMap.get(r.user_id) ?? "Student",
          text: `Rung ${r.current_rung}/5 · ${r.depth_track}`,
          meta: r.episode_id,
          at: r.updated_at,
        })),
        ...(arcs ?? []).map((a: any) => ({
          id: `a-${a.id}`,
          kind: "thought" as const,
          studentName: nameMap.get(a.user_id) ?? "Student",
          text: a.day1_first_thought,
          meta: a.concept_key,
          at: a.updated_at,
        })),
      ].sort((a, b) => +new Date(b.at) - +new Date(a.at));
      setSignals(merged.slice(0, 25));
    })();
    return () => { cancelled = true; };
  }, [ids.join(",")]);

  // Realtime
  useEffect(() => {
    if (ids.length === 0) return;
    const ch = supabase
      .channel("teacher-thinking-signals")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "student_rung_state" },
        (payload) => {
          const r: any = payload.new;
          if (!r || !ids.includes(r.user_id)) return;
          setSignals((prev) =>
            [
              {
                id: `r-${r.id}-${Date.now()}`,
                kind: "rung",
                studentName: nameMap.get(r.user_id) ?? "Student",
                text: `Rung ${r.current_rung}/5 · ${r.depth_track}`,
                meta: r.episode_id,
                at: r.updated_at ?? new Date().toISOString(),
              } as Signal,
              ...prev,
            ].slice(0, 30),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "curiosity_arc_progress" },
        (payload) => {
          const a: any = payload.new;
          if (!a || !ids.includes(a.user_id) || !a.day1_first_thought) return;
          setSignals((prev) =>
            [
              {
                id: `a-${a.id}-${Date.now()}`,
                kind: "thought",
                studentName: nameMap.get(a.user_id) ?? "Student",
                text: a.day1_first_thought,
                meta: a.concept_key,
                at: a.updated_at ?? new Date().toISOString(),
              } as Signal,
              ...prev,
            ].slice(0, 30),
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [ids.join(",")]);

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Radio className="h-5 w-5 text-primary animate-pulse" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-foreground">Thinking Signals · Live</h2>
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Rung climbs, first thoughts and vibe-checks from {className} as they happen.
      </p>
      {signals.length === 0 ? (
        <div className="text-xs text-muted-foreground py-6 text-center">
          Waiting for the first signal… open a student session to test.
        </div>
      ) : (
        <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {signals.map((s) => {
              const m = KIND_META[s.kind];
              return (
                <motion.li
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card"
                >
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${m.bg}`}>
                    <m.Icon className={`h-4 w-4 ${m.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">{s.studentName}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${m.color}`}>{m.label}</span>
                    </div>
                    <div className="text-sm text-foreground/90 line-clamp-2">{s.text}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {s.meta ? <span className="mr-2">{s.meta}</span> : null}
                      {formatDistanceToNow(new Date(s.at), { addSuffix: true })}
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </Card>
  );
};

export default TeacherThinkingSignals;
