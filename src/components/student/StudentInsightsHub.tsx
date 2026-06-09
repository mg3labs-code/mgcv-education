import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRetentionPredictions } from "@/hooks/useRetentionPredictions";
import WeeklyInterestSummary from "./WeeklyInterestSummary";
import {
  TrendingUp, TrendingDown, AlertTriangle, ArrowRight, Sparkles,
  Eye, Brain, Target, Zap, Heart, Flame, Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";

export interface SkillScore {
  name: string;
  score: number;
  prev: number;
  color: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

interface Props {
  innerOS: {
    clarity_score?: number;
    thinking_score?: number;
    attention_score?: number;
    momentum_score?: number;
    character_score?: number;
    weekly_growth?: number;
  } | null | undefined;
  streakDays: number;
  episodeCount: number;
}

/* ------------ Skill bar ------------ */
function SkillRow({ s }: { s: SkillScore }) {
  const delta = s.score - s.prev;
  const positive = delta >= 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-md grid place-items-center shrink-0"
            style={{ background: `${s.color}1A` }}
          >
            <s.Icon className="h-3.5 w-3.5" style={{ color: s.color }} />
          </span>
          <span className="text-sm font-semibold text-foreground">{s.name}</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-bold tabular-nums text-foreground">
            {s.score}
            <span className="text-xs font-semibold text-muted-foreground">%</span>
          </span>
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
              positive ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
            }`}
          >
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {positive ? "+" : ""}
            {delta}
          </span>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden bg-muted/70">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${Math.max(4, Math.min(100, s.score))}%`,
            background: `linear-gradient(90deg, ${s.color}AA, ${s.color})`,
          }}
        />
      </div>
    </div>
  );
}

/* ------------ Retention prediction panel ------------ */
function RetentionPanel() {
  const { data: preds, isLoading } = useRetentionPredictions();

  const top = useMemo(() => (preds ?? []).slice(0, 3), [preds]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Retention prediction
          </div>
          <h4 className="text-sm font-bold text-foreground mt-0.5">Concepts at risk of fading</h4>
        </div>
        <Badge variant="outline" className="text-[10px]">AI · 7-day window</Badge>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : top.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-center">
          <Sparkles className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-xs text-muted-foreground">
            No predictions yet — finish a Day 1 episode and the AI will start tracking.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {top.map((p) => {
            const risk = Math.round((p.risk_score ?? 0) * 100);
            const tone =
              risk >= 70
                ? { bg: "bg-rose-500/10",   ring: "ring-rose-500/30",   txt: "text-rose-600 dark:text-rose-400",   label: "High" }
                : risk >= 40
                ? { bg: "bg-amber-500/10",  ring: "ring-amber-500/30",  txt: "text-amber-600 dark:text-amber-400", label: "Watch" }
                : { bg: "bg-emerald-500/10",ring: "ring-emerald-500/30",txt: "text-emerald-600 dark:text-emerald-400", label: "Stable" };
            return (
              <li
                key={p.id}
                className={`flex items-center gap-3 p-3 rounded-lg ring-1 ${tone.bg} ${tone.ring}`}
              >
                <div className={`h-9 w-9 rounded-full grid place-items-center shrink-0 ${tone.bg}`}>
                  <AlertTriangle className={`h-4 w-4 ${tone.txt}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground truncate">
                    {p.concept_label ?? p.concept_key}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {p.next_review_date
                      ? `Best reviewed by ${new Date(p.next_review_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`
                      : "Quick refresher recommended"}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-base font-bold tabular-nums ${tone.txt}`}>{risk}%</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {tone.label}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ------------ Main hub ------------ */
export default function StudentInsightsHub({ innerOS, streakDays, episodeCount }: Props) {
  const skills: SkillScore[] = [
    { name: "Clarity",   score: innerOS?.clarity_score   ?? 45, prev: 38, color: "#0D9488", Icon: Eye },
    { name: "Thinking",  score: innerOS?.thinking_score  ?? 48, prev: 40, color: "#7C3AED", Icon: Brain },
    { name: "Focus",     score: innerOS?.attention_score ?? 42, prev: 42, color: "#F59E0B", Icon: Target },
    { name: "Momentum",  score: innerOS?.momentum_score  ?? 38, prev: 30, color: "#3B82F6", Icon: Zap },
    { name: "Character", score: innerOS?.character_score ?? 44, prev: 40, color: "#EC4899", Icon: Heart },
  ];

  const weeklyGrowth = Math.round(Number(innerOS?.weekly_growth ?? 0));
  const overall = Math.round(skills.reduce((sum, s) => sum + s.score, 0) / skills.length);

  return (
    <section className="space-y-4" aria-label="Your insights">
      {/* Hero header */}
      <Card className="p-5 sm:p-6 bg-gradient-to-br from-teal-500/10 via-background to-violet-500/10 border-teal-500/20">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
              Your insights · this week
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-1">
              Skills, risks, and what changed
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Stat icon={<Flame className="h-3.5 w-3.5 text-orange-500" />} label="Streak" value={`${streakDays}d`} />
            <Stat icon={<Calendar className="h-3.5 w-3.5 text-blue-500" />} label="Episodes" value={String(episodeCount)} />
            <Stat
              icon={weeklyGrowth >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> : <TrendingDown className="h-3.5 w-3.5 text-amber-500" />}
              label="Growth"
              value={`${weeklyGrowth >= 0 ? "+" : ""}${weeklyGrowth}%`}
            />
            <Stat icon={<Sparkles className="h-3.5 w-3.5 text-violet-500" />} label="Overall" value={`${overall}%`} />
          </div>
        </div>
      </Card>

      {/* 2-col: skills | retention */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Skills (60%) */}
        <Card className="lg:col-span-3 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Skill progress
              </div>
              <h3 className="text-sm font-bold text-foreground mt-0.5">Your 5 inner-OS dimensions</h3>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/student" aria-label="Open growth tab">
                Growth tab <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="space-y-4">
            {skills.map((s) => (
              <SkillRow key={s.name} s={s} />
            ))}
          </div>
        </Card>

        {/* Retention (40%) */}
        <Card className="lg:col-span-2 p-5 sm:p-6">
          <RetentionPanel />
        </Card>
      </div>

      {/* Weekly summary */}
      <WeeklyInterestSummary />
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
