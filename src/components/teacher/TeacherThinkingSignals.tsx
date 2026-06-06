import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Radio, ChevronUp, Sparkles, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import EmptyState from "@/components/EmptyState";
import { rungToLayer } from "@/lib/sevenLayers";

interface Props {
  className: string;
}

type Signal = {
  id: string;
  kind: "layer" | "thought" | "vibe";
  studentName: string;
  text: string;
  meta?: string;
  at: string;
};

const KIND_META: Record<Signal["kind"], { color: string; bg: string; Icon: typeof Radio; label: string }> = {
  layer:   { color: "text-emerald-600", bg: "bg-emerald-500/10", Icon: ChevronUp,    label: "Reached layer" },
  thought: { color: "text-violet-600",  bg: "bg-violet-500/10",  Icon: MessageCircle, label: "First thought" },
  vibe:    { color: "text-amber-600",   bg: "bg-amber-500/10",   Icon: Sparkles,      label: "Vibe check" },
};

/**
 * Live stream of student thinking signals — layer reaches, first thoughts,
 * vibe-check responses. Realtime subscription on student_rung_state
 * and curiosity_arc_progress, scoped to the teacher's class via RLS.
 *
 * No silent demo data — empty class shows an authentic empty state.
 */
const TeacherThinkingSignals = ({ className }: Props) => {
  const { user } = useAuth();
  const [signals, setSignals] = useState<Signal[]>([]);

  const { data: students, isLoading: studentsLoading } = useQuery({
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
        ...(rungs ?? []).map((r: any) => {
          const layer = rungToLayer(r.current_rung);
          return {
            id: `r-${r.id}`,
            kind: "layer" as const,
            studentName: nameMap.get(r.user_id) ?? "Student",
            text: `Layer ${layer.index} · ${layer.name} · ${r.depth_track}`,
            meta: r.episode_id,
            at: r.updated_at,
          };
        }),
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
          const layer = rungToLayer(r.current_rung);
          setSignals((prev) =>
            [
              {
                id: `r-${r.id}-${Date.now()}`,
                kind: "layer",
                studentName: nameMap.get(r.user_id) ?? "Student",
                text: `Layer ${layer.index} · ${layer.name} · ${r.depth_track}`,
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

  const isEmpty = !studentsLoading && signals.length === 0;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Radio className="h-5 w-5 text-primary animate-pulse" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-foreground">Thinking Signals · Live</h2>
        {!isEmpty && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Layer reaches, first thoughts and vibe-checks from {className} as they happen.
      </p>

      {isEmpty ? (
        <EmptyState
          icon={Radio}
          title="No signals yet in this class"
          description="As soon as a student starts an episode or shares a first thought, you'll see it stream in here in real time."
        />
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
                  className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
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
