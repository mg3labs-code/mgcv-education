import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, Target, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import EmptyState from "@/components/EmptyState";
import { blockToLayer, LAYERS, type Layer } from "@/lib/sevenLayers";

interface Props {
  className: string;
}

type Row = {
  user_id: string;
  chapter_id: string;
  episode_id: string;
  block_type: string;
  block_index: number;
  wrong_attempts: number;
  correct_on_first_try: boolean | null;
  comprehension_result: string | null;
  created_at: string;
};

type RangeKey = "7" | "14" | "30" | "90";
type SeverityKey = "all" | "watch" | "stuck" | "critical";

const RANGE_LABEL: Record<RangeKey, string> = {
  "7": "Last 7 days",
  "14": "Last 14 days",
  "30": "Last 30 days",
  "90": "Last 90 days",
};

const SEVERITY_MIN: Record<SeverityKey, number> = {
  all: 0,
  watch: 0.15,
  stuck: 0.3,
  critical: 0.5,
};

const heatColor = (rate: number) => {
  if (rate >= 0.5) return { bg: "bg-rose-500", hex: "hsl(0 84% 60%)", label: "Critical" };
  if (rate >= 0.3) return { bg: "bg-amber-500", hex: "hsl(38 92% 50%)", label: "Stuck" };
  if (rate >= 0.15) return { bg: "bg-yellow-400", hex: "hsl(48 96% 53%)", label: "Watch" };
  return { bg: "bg-emerald-500", hex: "hsl(160 64% 43%)", label: "Healthy" };
};

const TeacherMisconceptionMap = ({ className }: Props) => {
  const { user } = useAuth();
  const [range, setRange] = useState<RangeKey>("14");
  const [layerFilter, setLayerFilter] = useState<string>("all");
  const [severity, setSeverity] = useState<SeverityKey>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["misconception-map", user?.id, className, range],
    enabled: !!user,
    queryFn: async () => {
      const { data: students } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("class_name", className);
      const ids = (students ?? []).map((s) => s.user_id);
      if (!ids.length) return { rows: [] as Row[], hasStudents: false };
      const days = Number(range);
      const { data } = await supabase
        .from("episode_interactions")
        .select(
          "user_id, chapter_id, episode_id, block_type, block_index, wrong_attempts, correct_on_first_try, comprehension_result, created_at",
        )
        .in("user_id", ids)
        .gte("created_at", new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
      return { rows: (data ?? []) as Row[], hasStudents: true };
    },
  });

  const rows = data?.rows ?? [];
  const hasStudents = data?.hasStudents ?? false;

  const top = useMemo(() => {
    const groups = new Map<
      string,
      { chapter: string; episode: string; block: string; layer: Layer; attempts: number; wrong: number; students: Set<string> }
    >();
    for (const r of rows) {
      const layer = blockToLayer(r.block_type);
      if (layerFilter !== "all" && layer.key !== layerFilter) continue;
      const key = `${r.chapter_id}::${r.episode_id}::${layer.key}`;
      const g = groups.get(key) ?? {
        chapter: r.chapter_id,
        episode: r.episode_id,
        block: r.block_type,
        layer,
        attempts: 0,
        wrong: 0,
        students: new Set<string>(),
      };
      g.attempts += 1;
      g.wrong += Math.max(0, r.wrong_attempts) + (r.correct_on_first_try === false ? 1 : 0);
      g.students.add(r.user_id);
      groups.set(key, g);
    }
    const min = SEVERITY_MIN[severity];
    return Array.from(groups.values())
      .map((g) => ({
        ...g,
        stuckRate: g.attempts ? g.wrong / (g.attempts * 2) : 0,
        studentCount: g.students.size,
      }))
      .filter((g) => g.wrong > 0 && g.stuckRate >= min)
      .sort((a, b) => b.stuckRate - a.stuckRate)
      .slice(0, 10);
  }, [rows, layerFilter, severity]);

  const chartData = top.slice(0, 6).map((g) => ({
    name: `L${g.layer.index} · ${g.episode.replace(/-/g, " ")}`.slice(0, 22),
    rate: Math.round(g.stuckRate * 100),
    color: heatColor(g.stuckRate).hex,
  }));

  const showEmpty = !isLoading && top.length === 0;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Target className="h-5 w-5 text-rose-500" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-foreground">Misconception Map · by Layer</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Where {className} is getting stuck — grouped by the 7 layers of understanding.
      </p>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
          <SelectTrigger className="h-9 text-xs">
            <Filter className="h-3.5 w-3.5 mr-1 opacity-60" />
            <SelectValue placeholder="Range" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(RANGE_LABEL) as RangeKey[]).map((k) => (
              <SelectItem key={k} value={k} className="text-xs">
                {RANGE_LABEL[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={layerFilter} onValueChange={setLayerFilter}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Layer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All 7 layers</SelectItem>
            {LAYERS.map((l) => (
              <SelectItem key={l.key} value={l.key} className="text-xs">
                Layer {l.index} · {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={severity} onValueChange={(v) => setSeverity(v as SeverityKey)}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All severities</SelectItem>
            <SelectItem value="watch" className="text-xs">≥ Watch (15%)</SelectItem>
            <SelectItem value="stuck" className="text-xs">≥ Stuck (30%)</SelectItem>
            <SelectItem value="critical" className="text-xs">≥ Critical (50%)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4 text-[10px] text-muted-foreground">
        {[
          { bg: "bg-emerald-500", label: "Healthy <15%" },
          { bg: "bg-yellow-400", label: "Watch 15–30%" },
          { bg: "bg-amber-500", label: "Stuck 30–50%" },
          { bg: "bg-rose-500", label: "Critical ≥50%" },
        ].map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${l.bg}`} aria-hidden />
            <span className="font-medium">{l.label}</span>
          </span>
        ))}
      </div>

      {isLoading ? (
        <div className="text-xs text-muted-foreground py-8 text-center">Loading misconceptions…</div>
      ) : showEmpty ? (
        <EmptyState
          icon={Target}
          title={hasStudents ? "No misconceptions in this window" : "No students linked to this class yet"}
          description={
            hasStudents
              ? "Great news — nothing has crossed the 'Watch' threshold in this range. Try a wider range, or remove the layer filter."
              : "Add students to this class or run the simulation script to populate authentic signals here."
          }
        />
      ) : (
        <>
          <div className="h-44 -ml-2 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  interval={0}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  angle={-12}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  unit="%"
                  width={32}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--popover))",
                  }}
                  formatter={(v: number) => [`${v}% stuck`, "Struggle"]}
                />
                <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <ul className="space-y-2">
            {top.map((g) => {
              const h = heatColor(g.stuckRate);
              return (
                <li
                  key={`${g.chapter}-${g.episode}-${g.layer.key}`}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 p-3 rounded-xl border border-border bg-card"
                >
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center text-white text-[11px] font-bold ${h.bg}`}
                    title={`${h.label}: ${Math.round(g.stuckRate * 100)}%`}
                  >
                    {Math.round(g.stuckRate * 100)}%
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">
                      {g.episode} ·{" "}
                      <span
                        className="text-[11px] font-bold tracking-wider uppercase rounded px-1.5 py-0.5 ml-1"
                        style={{ background: `hsl(${g.layer.hue} 80% 94%)`, color: `hsl(${g.layer.hue} 60% 35%)` }}
                      >
                        L{g.layer.index} · {g.layer.name}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      Chapter {g.chapter} · {g.studentCount} student
                      {g.studentCount === 1 ? "" : "s"} · {g.wrong} wrong attempt
                      {g.wrong === 1 ? "" : "s"}
                    </div>
                  </div>
                  <AlertTriangle className={`h-4 w-4 shrink-0 ${g.stuckRate >= 0.3 ? "text-rose-500" : "text-amber-500"}`} aria-hidden />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
};

export default TeacherMisconceptionMap;
