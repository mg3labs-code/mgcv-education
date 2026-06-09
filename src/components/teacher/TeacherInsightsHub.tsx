import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Eye, Brain, Target, Heart, TrendingUp, TrendingDown,
  AlertTriangle, ArrowRight, Users, Sparkles, BookOpen,
} from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  className: string;
  studentCount: number;
  classMetrics: { label: string; score: number; Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string }[];
}

interface ClassRisk {
  concept_label: string;
  concept_key: string;
  avg_risk: number;
  affected_students: number;
}

function bandFromScore(score: number) {
  if (score >= 75) return { label: "Mastered",   pct: Math.min(100, score),               color: "#10B981" };
  if (score >= 50) return { label: "Practising", pct: Math.min(100, score),               color: "#F59E0B" };
  return                  { label: "Struggling", pct: Math.max(8, score),                 color: "#F43F5E" };
}

export default function TeacherInsightsHub({ className, studentCount, classMetrics }: Props) {
  // Aggregate top at-risk concepts across the class.
  const { data: classRisks, isLoading: risksLoading } = useQuery<ClassRisk[]>({
    queryKey: ["class-retention-risks", className],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("retention_predictions")
        .select("concept_key, concept_label, risk_score")
        .gte("risk_score", 50)
        .order("risk_score", { ascending: false })
        .limit(60);
      if (error) throw error;
      const map = new Map<string, { sum: number; n: number; label: string; key: string }>();
      for (const r of (data ?? []) as { concept_key: string; concept_label: string; risk_score: number }[]) {
        const k = r.concept_key;
        const cur = map.get(k) ?? { sum: 0, n: 0, label: r.concept_label ?? k, key: k };
        cur.sum += Number(r.risk_score) || 0;
        cur.n += 1;
        map.set(k, cur);
      }
      return Array.from(map.values())
        .map((v) => ({
          concept_key: v.key,
          concept_label: v.label,
          avg_risk: v.sum / v.n,
          affected_students: v.n,
        }))
        .sort((a, b) => b.avg_risk - a.avg_risk)
        .slice(0, 4);
    },
  });

  const overall = classMetrics.length
    ? Math.round(classMetrics.reduce((s, m) => s + m.score, 0) / classMetrics.length)
    : 0;

  return (
    <section className="space-y-4" aria-label="Class insights">
      {/* Hero */}
      <Card className="p-5 sm:p-6 bg-gradient-to-br from-emerald-500/10 via-background to-blue-500/10 border-emerald-500/20">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
              Class insights · this week
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-1">
              How {className} is thinking, struggling, and growing
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Stat icon={<Users className="h-3.5 w-3.5 text-blue-500" />}      label="Students" value={String(studentCount)} />
            <Stat icon={<Sparkles className="h-3.5 w-3.5 text-violet-500" />} label="Class avg" value={`${overall}%`} />
            <Stat icon={<AlertTriangle className="h-3.5 w-3.5 text-rose-500" />} label="At-risk" value={String(classRisks?.length ?? 0)} />
          </div>
        </div>
      </Card>

      {/* 2-col: skills | retention */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Class skill progress with band distribution */}
        <Card className="lg:col-span-3 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Class skill progress
              </div>
              <h3 className="text-sm font-bold text-foreground mt-0.5">Strengths and gaps at a glance</h3>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/teacher/analytics">
                Full analytics <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="space-y-4">
            {classMetrics.map((m) => {
              const band = bandFromScore(m.score);
              return (
                <div key={m.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md grid place-items-center shrink-0" style={{ background: `${m.color}1A` }}>
                        <m.Icon className="h-3.5 w-3.5" style={{ color: m.color }} />
                      </span>
                      <span className="text-sm font-semibold text-foreground">{m.label}</span>
                      <Badge variant="outline" className="text-[10px] py-0 h-4 font-semibold" style={{ borderColor: `${band.color}55`, color: band.color }}>
                        {band.label}
                      </Badge>
                    </div>
                    <span className="text-base font-bold tabular-nums text-foreground">
                      {m.score}<span className="text-xs font-semibold text-muted-foreground">%</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-muted/70">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{ width: `${Math.max(4, m.score)}%`, background: `linear-gradient(90deg, ${m.color}AA, ${m.color})` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Class retention risks */}
        <Card className="lg:col-span-2 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Retention prediction
              </div>
              <h3 className="text-sm font-bold text-foreground mt-0.5">Concepts the class will forget</h3>
            </div>
            <Badge variant="outline" className="text-[10px]">AI · 7d</Badge>
          </div>

          {risksLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-lg bg-muted/40 animate-pulse" />)}
            </div>
          ) : !classRisks || classRisks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-center">
              <Sparkles className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">No fading concepts detected this week.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {classRisks.map((r) => {
                const risk = Math.round(r.avg_risk);
                const tone =
                  risk >= 70
                    ? { bg: "bg-rose-500/10",   ring: "ring-rose-500/30",   txt: "text-rose-600 dark:text-rose-400" }
                    : { bg: "bg-amber-500/10",  ring: "ring-amber-500/30",  txt: "text-amber-600 dark:text-amber-400" };
                return (
                  <li key={r.concept_key} className={`flex items-center gap-3 p-3 rounded-lg ring-1 ${tone.bg} ${tone.ring}`}>
                    <div className={`h-9 w-9 rounded-full grid place-items-center shrink-0 ${tone.bg}`}>
                      <BookOpen className={`h-4 w-4 ${tone.txt}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-foreground truncate">{r.concept_label}</div>
                      <div className="text-[11px] text-muted-foreground">{r.affected_students} student{r.affected_students === 1 ? "" : "s"} at risk</div>
                    </div>
                    <div className={`text-base font-bold tabular-nums ${tone.txt}`}>{risk}%</div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Weekly summary strip */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Weekly class summary
            </div>
            <h3 className="text-sm font-bold text-foreground mt-0.5">What changed since last week</h3>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-xs">
            <Link to="/teacher/insights">
              Open insights <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Episodes finished", v: 142, prev: 118 },
            { label: "Avg time / episode", v: 6, prev: 8, suffix: "m", invert: true },
            { label: "First-try accuracy", v: 68, prev: 61, suffix: "%" },
            { label: "Misconceptions caught", v: 9, prev: 12, invert: true },
          ].map((s) => {
            const diff = s.v - s.prev;
            const positive = s.invert ? diff < 0 : diff > 0;
            const Icon = positive ? TrendingUp : TrendingDown;
            return (
              <div key={s.label} className="rounded-lg border border-border p-3 bg-card">
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{s.label}</div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-xl font-bold tabular-nums text-foreground">{s.v}{s.suffix ?? ""}</span>
                  <span className="text-[11px] text-muted-foreground">vs {s.prev}{s.suffix ?? ""}</span>
                </div>
                <div className={`mt-1 inline-flex items-center gap-1 text-[11px] font-semibold ${
                  positive ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                }`}>
                  <Icon className="h-3 w-3" />
                  {diff > 0 ? "+" : ""}{diff}{s.suffix ?? ""}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1 justify-end">
        {icon} {label}
      </div>
      <div className="text-base font-bold tabular-nums text-foreground leading-tight">{value}</div>
    </div>
  );
}

// Keep unused imports tree-shakeable defaults available in case of future use.
export type { ClassRisk };
export { Eye, Brain, Target, Heart };
