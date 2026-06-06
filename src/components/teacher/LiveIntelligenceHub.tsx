import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Activity, CalendarClock, Brain, Users, Sparkles } from "lucide-react";
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
 * Live Intelligence Hub — collapsed to 3 clean tabs:
 *   Today      → tomorrow's openers + live thinking signals
 *   Class Mind → misconceptions by 7-layer
 *   Each Student → depth/layer progression per student
 *
 * No demo-data fallback in hero stats — when a class is empty,
 * the band shows a neutral "no signals yet" line instead of fake numbers.
 */
const LiveIntelligenceHub = ({ className }: Props) => {
  const { user } = useAuth();
  const [pulse, setPulse] = useState(0);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["live-hub-stats", user?.id, className, pulse],
    enabled: !!user,
    queryFn: async () => {
      const { data: students } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("class_name", className);
      const ids = (students ?? []).map((s) => s.user_id);
      if (!ids.length) return { students: 0, activeNow: 0, signals24h: 0, stuckCount: 0, climbing: 0 };

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

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => p + 1), 10000);
    return () => clearInterval(t);
  }, []);

  const s = stats ?? { students: 0, activeNow: 0, signals24h: 0, stuckCount: 0, climbing: 0 };
  const hasAnySignal = s.signals24h > 0 || s.activeNow > 0;

  const heroStats = [
    { label: "Live now", value: s.activeNow, color: "from-emerald-400 to-teal-500", glow: "shadow-emerald-500/30" },
    { label: "Signals · 24h", value: s.signals24h, color: "from-violet-400 to-fuchsia-500", glow: "shadow-violet-500/30" },
    { label: "Climbing ↑", value: s.climbing, color: "from-sky-400 to-blue-500", glow: "shadow-sky-500/30" },
    { label: "Stuck moments", value: s.stuckCount, color: "from-rose-400 to-orange-500", glow: "shadow-rose-500/30" },
  ];

  return (
    <Card className="overflow-hidden border-border/60 shadow-lg">
      {/* HERO BAND */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 px-5 sm:px-6 pt-5 pb-6 text-white">
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

        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4">
          {heroStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-xl bg-white/5 backdrop-blur-md ring-1 ring-white/10 p-3 shadow-lg ${stat.glow}`}
            >
              <div className={`text-[10px] uppercase tracking-wider font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.label}
              </div>
              <div className="text-2xl sm:text-3xl font-bold tabular-nums mt-0.5 text-white">
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="relative mt-3 flex items-center gap-1.5 text-[10px] text-white/50">
          <Sparkles className="h-3 w-3" />
          <span>
            {isLoading
              ? "Loading class…"
              : s.students === 0
                ? `${className} has no students linked yet`
                : hasAnySignal
                  ? `${s.students} students in ${className} · stats refresh every 10s`
                  : `${s.students} students in ${className} · waiting for first signals…`}
          </span>
        </div>
      </div>

      {/* TABS — collapsed to 3 */}
      <Tabs defaultValue="today" className="w-full">
        <div className="px-3 sm:px-4 pt-3 border-b border-border bg-muted/30">
          <TabsList className="bg-transparent p-0 h-auto gap-1 w-full grid grid-cols-3">
            {[
              { v: "today", Icon: CalendarClock, label: "Today" },
              { v: "mind",  Icon: Brain,         label: "Class Mind" },
              { v: "each",  Icon: Users,         label: "Each Student" },
            ].map((t) => (
              <TabsTrigger
                key={t.v}
                value={t.v}
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground rounded-lg px-2 py-2 text-[11px] sm:text-sm font-semibold gap-1.5 flex-col sm:flex-row h-auto"
              >
                <t.Icon className="h-4 w-4" />
                <span className="truncate">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="p-2 sm:p-3 bg-card space-y-3">
          <TabsContent value="today" className="mt-0 space-y-3">
            <TeacherSuggestedHooks className={className} />
            <TeacherThinkingSignals className={className} />
          </TabsContent>

          <TabsContent value="mind" className="mt-0">
            <TeacherMisconceptionMap className={className} />
          </TabsContent>

          <TabsContent value="each" className="mt-0">
            <ClassDepthProgression className={className} />
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
};

export default LiveIntelligenceHub;
