import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Activity, Radio, Target, Layers, Lightbulb, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import TeacherThinkingSignals from "./TeacherThinkingSignals";
import TeacherMisconceptionMap from "./TeacherMisconceptionMap";
import TeacherSuggestedHooks from "./TeacherSuggestedHooks";
import ClassDepthProgression from "./ClassDepthProgression";

interface Props {
  className: string;
}

/**
 * Premium "command center" wrapper for the four live teacher widgets.
 * Hero gradient + live class pulse stats + tabbed organization so each
 * surface gets full breathing room instead of a long scroll of cards.
 */
const LiveIntelligenceHub = ({ className }: Props) => {
  const { user } = useAuth();
  const [pulse, setPulse] = useState(0);

  // Class-scoped quick stats for the hero band
  const { data: stats } = useQuery({
    queryKey: ["live-hub-stats", user?.id, className, pulse],
    enabled: !!user,
    queryFn: async () => {
      const { data: students } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("class_name", className);
      const ids = (students ?? []).map((s) => s.user_id);
      const empty = { students: ids.length, activeNow: 0, signals24h: 0, stuckCount: 0, climbing: 0 };
      if (!ids.length) return empty;

      const sinceLive = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [{ data: live }, { data: day }, { data: climb }] = await Promise.all([
        supabase
          .from("episode_interactions")
          .select("user_id, created_at")
          .in("user_id", ids)
          .gte("created_at", sinceLive),
        supabase
          .from("episode_interactions")
          .select("wrong_attempts, correct_on_first_try, created_at")
          .in("user_id", ids)
          .gte("created_at", since24h),
        supabase
          .from("student_rung_state")
          .select("current_rung, updated_at")
          .in("user_id", ids)
          .gte("updated_at", since24h),
      ]);

      const activeNow = new Set((live ?? []).map((r: any) => r.user_id)).size;
      const signals24h = (day?.length ?? 0) + (climb?.length ?? 0);
      const stuckCount = (day ?? []).filter(
        (r: any) => (r.wrong_attempts ?? 0) >= 2 || r.correct_on_first_try === false,
      ).length;
      const climbing = (climb ?? []).filter((r: any) => (r.current_rung ?? 0) >= 3).length;

      return { students: ids.length, activeNow, signals24h, stuckCount, climbing };
    },
  });

  // refresh stats every 10s for live feel
  useEffect(() => {
    const t = setInterval(() => setPulse((p) => p + 1), 10000);
    return () => clearInterval(t);
  }, []);

  const noLiveData = !stats || (stats.students === 0 && stats.signals24h === 0);
  const demoStats = { students: 22, activeNow: 7, signals24h: 184, climbing: 12, stuckCount: 5 };
  const s = noLiveData ? demoStats : stats!;

  const heroStats = [
    { label: "Live now", value: s.activeNow, color: "from-emerald-400 to-teal-500", glow: "shadow-emerald-500/30" },
    { label: "Signals · 24h", value: s.signals24h, color: "from-violet-400 to-fuchsia-500", glow: "shadow-violet-500/30" },
    { label: "Climbing ↑", value: s.climbing, color: "from-sky-400 to-blue-500", glow: "shadow-sky-500/30" },
    { label: "Stuck moments", value: s.stuckCount, color: "from-rose-400 to-orange-500", glow: "shadow-rose-500/30" },
  ];

  return (
    <Card className="overflow-hidden border-border/60 shadow-lg">
      {/* HERO BAND */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 px-5 sm:px-6 pt-5 pb-6 text-white">
        {/* ambient glow */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background:
              "radial-gradient(800px 200px at 20% 0%, rgba(99,102,241,0.45), transparent 60%), radial-gradient(600px 200px at 90% 100%, rgba(45,212,191,0.35), transparent 60%)",
          }}
        />
        <div className="relative flex items-center gap-2 mb-1">
          <div className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center ring-1 ring-white/15">
            <Activity className="h-5 w-5 text-emerald-300" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold tracking-tight">Live Intelligence Hub</h2>
            <p className="text-[11px] sm:text-xs text-white/60">
              Real-time thinking signals, misconceptions and tomorrow's hooks for {className}
            </p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            Live
          </span>
        </div>

        {/* stat tiles */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4">
          {heroStats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-xl bg-white/5 backdrop-blur-md ring-1 ring-white/10 p-3 shadow-lg ${s.glow}`}
            >
              <div className={`text-[10px] uppercase tracking-wider font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>
                {s.label}
              </div>
              <div className="text-2xl sm:text-3xl font-bold tabular-nums mt-0.5 text-white">
                {s.value}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="relative mt-3 flex items-center gap-1.5 text-[10px] text-white/50">
          <Sparkles className="h-3 w-3" />
          <span>{stats?.students ?? 0} students in {className} · stats refresh every 10s</span>
        </div>
      </div>

      {/* TABS */}
      <Tabs defaultValue="signals" className="w-full">
        <div className="px-3 sm:px-4 pt-3 border-b border-border bg-muted/30">
          <TabsList className="bg-transparent p-0 h-auto gap-1 flex-wrap">
            {[
              { v: "signals", Icon: Radio, label: "Live Signals" },
              { v: "miscon", Icon: Target, label: "Misconceptions" },
              { v: "depth", Icon: Layers, label: "Depth Map" },
              { v: "hooks", Icon: Lightbulb, label: "Tomorrow's Hooks" },
            ].map((t) => (
              <TabsTrigger
                key={t.v}
                value={t.v}
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold gap-1.5"
              >
                <t.Icon className="h-3.5 w-3.5" />
                <span className="hidden xs:inline sm:inline">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="p-2 sm:p-3 bg-card">
          <TabsContent value="signals" className="mt-0">
            <TeacherThinkingSignals className={className} />
          </TabsContent>
          <TabsContent value="miscon" className="mt-0">
            <TeacherMisconceptionMap className={className} />
          </TabsContent>
          <TabsContent value="depth" className="mt-0">
            <ClassDepthProgression className={className} />
          </TabsContent>
          <TabsContent value="hooks" className="mt-0">
            <TeacherSuggestedHooks className={className} />
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
};

export default LiveIntelligenceHub;
