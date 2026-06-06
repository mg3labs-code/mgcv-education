import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Layers, Sparkles, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { DEMO_DEPTH } from "./demoData";

interface Props {
  className: string;
}

type Row = {
  user_id: string;
  chapter_id: string;
  episode_id: string;
  current_rung: number;
  depth_track: "foundation" | "core" | "advanced";
  updated_at: string;
  profiles?: { full_name: string | null } | null;
};

const TRACK_COLORS: Record<Row["depth_track"], { bg: string; text: string; ring: string; label: string }> = {
  foundation: { bg: "bg-sky-500",     text: "text-sky-700 dark:text-sky-300",     ring: "ring-sky-500/30",     label: "Foundation" },
  core:       { bg: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-500/30", label: "Core" },
  advanced:   { bg: "bg-violet-500",  text: "text-violet-700 dark:text-violet-300", ring: "ring-violet-500/30",  label: "Advanced" },
};

/**
 * Teacher widget — class-wide depth track distribution + per-student per-episode
 * progression read straight from student_rung_state. RLS already scopes to
 * the teacher's students.
 */
const ClassDepthProgression = ({ className }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["class-depth-progression", user?.id, className],
    enabled: !!user,
    queryFn: async () => {
      // First grab the students of this class (RLS lets teachers see them).
      const { data: students } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .eq("class_name", className);
      const ids = (students ?? []).map((s) => s.user_id);
      if (ids.length === 0) return { rows: [] as Row[], nameMap: new Map<string, string>() };

      const { data: rows, error } = await supabase
        .from("student_rung_state")
        .select("user_id, chapter_id, episode_id, current_rung, depth_track, updated_at")
        .in("user_id", ids)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const nameMap = new Map(students!.map((s) => [s.user_id, s.full_name ?? "Student"]));
      return { rows: (rows ?? []) as Row[], nameMap };
    },
  });

  const rows = data?.rows ?? [];
  const nameMap = data?.nameMap ?? new Map<string, string>();

  // Distribution (latest row per student per episode = already from query order)
  const seen = new Set<string>();
  const latest: Row[] = [];
  for (const r of rows) {
    const k = `${r.user_id}::${r.chapter_id}::${r.episode_id}`;
    if (!seen.has(k)) {
      seen.add(k);
      latest.push(r);
    }
  }
  const total = latest.length || 1;
  const dist = {
    foundation: latest.filter((r) => r.depth_track === "foundation").length,
    core: latest.filter((r) => r.depth_track === "core").length,
    advanced: latest.filter((r) => r.depth_track === "advanced").length,
  };
  const pct = (n: number) => Math.round((n / total) * 100);

  // Group latest by chapter → student rows
  const byChapter = new Map<string, Row[]>();
  for (const r of latest) {
    const arr = byChapter.get(r.chapter_id) ?? [];
    arr.push(r);
    byChapter.set(r.chapter_id, arr);
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Layers className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-foreground">Depth Progression</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        How students in {className} are pacing across Foundation → Core → Advanced, per episode.
      </p>

      {/* Distribution — donut + legend */}
      <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[140px_1fr] gap-4 items-center mb-5">
        <div className="relative h-[120px] sm:h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: "Foundation", value: dist.foundation },
                  { name: "Core", value: dist.core },
                  { name: "Advanced", value: dist.advanced },
                ]}
                dataKey="value"
                innerRadius="60%"
                outerRadius="92%"
                stroke="hsl(var(--background))"
                strokeWidth={2}
                paddingAngle={2}
              >
                <Cell fill="hsl(199 89% 48%)" />
                <Cell fill="hsl(160 64% 43%)" />
                <Cell fill="hsl(258 65% 56%)" />
              </Pie>
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--popover))",
                }}
                formatter={(v: number, n: string) => [`${v} · ${pct(Number(v))}%`, n]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl sm:text-2xl font-bold text-foreground tabular-nums leading-none">{total}</span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">Episodes</span>
          </div>
        </div>

        <ul className="space-y-1.5 text-xs">
          {(["foundation", "core", "advanced"] as const).map((k) => {
            const meta = TRACK_COLORS[k];
            return (
              <li key={k} className="flex items-center gap-2 min-w-0">
                <span className={`h-3 w-3 rounded-sm ${meta.bg} shrink-0`} aria-hidden />
                <span className="font-semibold text-foreground truncate">{meta.label}</span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="ml-auto tabular-nums text-muted-foreground"
                >
                  {dist[k]} · {pct(dist[k])}%
                </motion.span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Per-chapter per-student rows */}
      {isLoading ? (
        <div className="text-xs text-muted-foreground">Loading depth data…</div>
      ) : latest.length === 0 ? (
        <div className="text-xs text-muted-foreground py-4 text-center">
          No episode depth recorded yet. Once students start an episode their pacing shows up here.
        </div>
      ) : (
        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
          {Array.from(byChapter.entries()).map(([chapter, items]) => (
            <div key={chapter}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] uppercase tracking-wide font-bold text-muted-foreground">
                  Chapter
                </span>
                <span className="text-sm font-semibold text-foreground truncate">{chapter}</span>
                <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
                  {items.length} student{items.length === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                {items.map((r) => {
                  const meta = TRACK_COLORS[r.depth_track];
                  return (
                    <li
                      key={`${r.user_id}-${r.episode_id}`}
                      className="flex items-center gap-3 p-3 bg-card hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() => navigate(`/teacher/student/${r.user_id}`)}
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${meta.bg} ring-2 ${meta.ring}`}>
                        {(nameMap.get(r.user_id) ?? "S").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-foreground truncate">
                          {nameMap.get(r.user_id) ?? "Student"}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          Ep. {r.episode_id} · Rung {r.current_rung}/5
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.06em] text-white ${meta.bg} shadow-sm`}
                      >
                        <Sparkles className="h-2.5 w-2.5" />
                        {meta.label}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default ClassDepthProgression;
