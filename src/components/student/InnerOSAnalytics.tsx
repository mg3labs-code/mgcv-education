import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, AlertTriangle, Zap, TrendingUp, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InnerOSAnalyticsProps {
  userId: string;
}

interface BlockStats {
  block_type: string;
  avg_time: number;
  confusion_count: number;
  total: number;
  first_try_rate: number;
}

const BLOCK_LABELS: Record<string, string> = {
  concept: "Concept",
  reasoning: "Reasoning",
  assumptions: "Assumptions",
  connections: "Connections",
  application: "Application",
  implications: "Implications",
  recall: "Recall",
  explain: "Explain",
  assessment: "Assessment",
  exercise: "Exercise",
  activity: "Activity",
};

const InnerOSAnalytics = ({ userId }: InnerOSAnalyticsProps) => {
  const [stats, setStats] = useState<BlockStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("episode_interactions")
        .select("block_type, time_spent_seconds, wrong_attempts, answer_changes, correct_on_first_try")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (cancelled || !data) { setLoading(false); return; }

      const grouped: Record<string, { total: number; time: number; confusion: number; firstTry: number }> = {};
      for (const row of data) {
        const t = row.block_type as string;
        if (!grouped[t]) grouped[t] = { total: 0, time: 0, confusion: 0, firstTry: 0 };
        grouped[t].total += 1;
        grouped[t].time += row.time_spent_seconds || 0;
        if ((row.wrong_attempts || 0) > 1 || (row.answer_changes || 0) > 2) grouped[t].confusion += 1;
        if (row.correct_on_first_try) grouped[t].firstTry += 1;
      }
      const arr = Object.entries(grouped)
        .map(([block_type, v]) => ({
          block_type,
          avg_time: Math.round(v.time / v.total),
          confusion_count: v.confusion,
          total: v.total,
          first_try_rate: Math.round((v.firstTry / v.total) * 100),
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);
      setStats(arr);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-card p-5 animate-pulse">
        <div className="h-4 w-40 bg-muted rounded mb-4" />
        <div className="h-24 bg-muted rounded" />
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-5">
        <h3 className="text-base font-bold text-foreground mb-2">📊 Learning Analytics</h3>
        <p className="text-sm text-muted-foreground">
          Complete a few episode sections — your time, confusion and engagement signals will appear here.
        </p>
      </div>
    );
  }

  const maxTime = Math.max(...stats.map(s => s.avg_time), 1);
  const totalSections = stats.reduce((sum, s) => sum + s.total, 0);
  const totalConfusion = stats.reduce((sum, s) => sum + s.confusion_count, 0);
  const avgFirstTry = Math.round(stats.reduce((sum, s) => sum + s.first_try_rate * s.total, 0) / totalSections);
  const slowestBlock = stats.reduce((a, b) => a.avg_time > b.avg_time ? a : b);
  const mostConfusing = stats.reduce((a, b) => a.confusion_count > b.confusion_count ? a : b);

  return (
    <TooltipProvider>
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            📊 Learning Analytics
            <Tooltip>
              <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Tracked per section type from your last 200 interactions. Confusion = wrong attempts &gt; 1 or answer changes &gt; 2. Friction-free = first-try success.
                </p>
              </TooltipContent>
            </Tooltip>
          </h3>
          <span className="text-[10px] text-muted-foreground">last {totalSections} sections</span>
        </div>

        {/* 3 KPI cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/40 p-3">
            <Clock className="h-3.5 w-3.5 text-blue-600 mb-1" />
            <p className="text-[10px] text-muted-foreground font-medium">Slowest</p>
            <p className="text-sm font-bold text-foreground truncate">{BLOCK_LABELS[slowestBlock.block_type] || slowestBlock.block_type}</p>
            <p className="text-[10px] text-blue-600 font-semibold">{slowestBlock.avg_time}s avg</p>
          </div>
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/40 p-3">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mb-1" />
            <p className="text-[10px] text-muted-foreground font-medium">Most confused</p>
            <p className="text-sm font-bold text-foreground truncate">{BLOCK_LABELS[mostConfusing.block_type] || mostConfusing.block_type}</p>
            <p className="text-[10px] text-amber-600 font-semibold">{totalConfusion} flag{totalConfusion !== 1 ? "s" : ""}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/40 p-3">
            <Zap className="h-3.5 w-3.5 text-emerald-600 mb-1" />
            <p className="text-[10px] text-muted-foreground font-medium">Friction-free</p>
            <p className="text-sm font-bold text-foreground">{avgFirstTry}%</p>
            <p className="text-[10px] text-emerald-600 font-semibold">first-try rate</p>
          </div>
        </div>

        {/* Time-spent bar chart */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Time per section type</p>
          {stats.map(s => (
            <div key={s.block_type} className="flex items-center gap-2">
              <span className="text-[11px] text-foreground w-20 truncate">{BLOCK_LABELS[s.block_type] || s.block_type}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                  style={{ width: `${(s.avg_time / maxTime) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground w-10 text-right">{s.avg_time}s</span>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 pt-2 border-t border-border/50">
          <TrendingUp className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <strong className="text-foreground">How dimensions are calculated:</strong> Clarity = first-try comprehension rate. Thinking = depth of reasoning answers. Attention = time-on-task consistency. Momentum = streak + daily activity. Character = brainstorm + assumption-challenge participation.
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default InnerOSAnalytics;
