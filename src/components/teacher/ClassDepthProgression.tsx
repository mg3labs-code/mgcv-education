import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Layers, Sparkles, ChevronRight, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import EmptyState from "@/components/EmptyState";
import { rungToLayer } from "@/lib/sevenLayers";

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
};

const TRACK_COLORS: Record<Row["depth_track"], { bg: string; ring: string; label: string }> = {
  foundation: { bg: "bg-sky-500",     ring: "ring-sky-500/30",     label: "Foundation" },
  core:       { bg: "bg-emerald-500", ring: "ring-emerald-500/30", label: "Core" },
  advanced:   { bg: "bg-violet-500",  ring: "ring-violet-500/30",  label: "Advanced" },
};

/**
 * Teacher widget — class-wide depth track distribution + per-student layer
 * progression read straight from student_rung_state. RLS already scopes to
 * the teacher's students. No demo fallbacks — empty class shows authentic
 * empty state.
 */
const ClassDepthProgression = ({ className }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["class-depth-progression", user?.id, className],
    enabled: !!user,
    queryFn: async () => {
      const { data: students } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .eq("class_name", className);
      const ids = (students ?? []).map((s) => s.user_id);
      if (ids.length === 0) return { rows: [] as Row[], nameMap: new Map<string, string>(), hasStudents: false };

      const { data: rows, error } = await supabase
        .from("student_rung_state")
        .select("user_id, chapter_id, episode_id, current_rung, depth_track, updated_at")
        .in("user_id", ids)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const nameMap = new Map(students!.map((s) => [s.user_id, s.full_name ?? "Student"]));
      return { rows: (rows ?? []) as Row[], nameMap, hasStudents: true };
    },
  });

  const rows = data?.rows ?? [];
  const nameMap = data?.nameMap ?? new Map<string, string>();
  const hasStudents = data?.hasStudents ?? false;

  const seen = new Set<string>();
  const latest: Row[] = [];
  for (const r of rows) {
    const k = `${r.user_id}::${r.chapter_id}::${r.episode_id}`;
    if (!seen.has(k)) {
      seen.add(k);
      latest.push(r);
    }
  }

  const dist = {
    foundation: latest.filter((r) => r.depth_track === "foundation").length,
    core: latest.filter((r) => r.depth_track === "core").length,
    advanced: latest.filter((r) => r.depth_track === "advanced").length,
  };
  const total = latest.length || 1;
  const pct = (n: number) => Math.round((n / total) * 100);

  const byChapter = new Map<string, Row[]>();
  for (const r of latest) {
    const arr = byChapter.get(r.chapter_id) ?? [];
    arr.push(r);
    byChapter.set(r.chapter_id, arr);
  }

  const isEmpty = !isLoading && latest.length === 0;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Layers className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-foreground">Depth Progression · per Student</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        How students in {className} are pacing across Foundation → Core → Advanced, and which of the 7 layers they have reached.
      </p>

      {isLoading ? (
        <div className="text-xs text-muted-foreground py-8 text-center">Loading depth data…</div>
      ) : isEmpty ? (
        <EmptyState
          icon={hasStudents ? Layers : Users}
          title={hasStudents ? "No episodes started yet" : "No students linked to this class yet"}
          description={
            hasStudents
              ? "Once a student opens their first episode, their layer progression will appear here."
              : "Add students to this class or run the seed simulation to populate authentic depth data."
          }
        />
      ) : (
        <>
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
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {Array.from(byChapter.entries()).map(([chapter, items]) => (
              <div key={chapter}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] uppercase tracking-wide font-bold text-muted-foreground">
                    Chapter
                  </span>
                  <span className="text-sm font-semibold text-foreground truncate capitalize">
                    {chapter.replace(/-/g, " ")}
                  </span>
                  <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
                    {items.length} student{items.length === 1 ? "" : "s"}
                  </span>
                </div>
                <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                  {items.map((r) => {
                    const meta = TRACK_COLORS[r.depth_track];
                    const layer = rungToLayer(r.current_rung);
                    const displayName = nameMap.get(r.user_id) ?? "Student";
                    return (
                      <li
                        key={`${r.user_id}-${r.episode_id}`}
                        className="flex items-center gap-3 p-3 bg-card hover:bg-muted/40 transition-colors cursor-pointer"
                        onClick={() => navigate(`/teacher/student/${r.user_id}`)}
                      >
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${meta.bg} ring-2 ${meta.ring}`}>
                          {displayName.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-foreground truncate">
                            {displayName}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            Ep. {r.episode_id} ·{" "}
                            <span
                              className="font-semibold"
                              style={{ color: `hsl(${layer.hue} 60% 40%)` }}
                            >
                              Layer {layer.index} · {layer.name}
                            </span>
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
        </>
      )}
    </Card>
  );
};

export default ClassDepthProgression;
