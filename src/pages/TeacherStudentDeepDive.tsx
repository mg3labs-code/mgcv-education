import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, Layers, Brain, MessageCircle, AlertCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const TRACK_BG: Record<string, string> = {
  foundation: "bg-sky-500",
  core: "bg-emerald-500",
  advanced: "bg-violet-500",
};

const TeacherStudentDeepDive = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["student-profile", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", studentId!).maybeSingle();
      return data;
    },
  });

  const { data: rungs } = useQuery({
    queryKey: ["student-rungs", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data } = await supabase
        .from("student_rung_state")
        .select("*")
        .eq("user_id", studentId!)
        .order("updated_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: arc } = useQuery({
    queryKey: ["student-arc", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data } = await supabase
        .from("curiosity_arc_progress")
        .select("*")
        .eq("user_id", studentId!)
        .order("updated_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const { data: risk } = useQuery({
    queryKey: ["student-risk", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data } = await supabase
        .from("retention_predictions")
        .select("concept_label, risk_level, risk_score, recommended_action, predicted_for_date")
        .eq("user_id", studentId!)
        .order("generated_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const { data: os } = useQuery({
    queryKey: ["student-os", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data } = await supabase
        .from("student_inner_os")
        .select("*")
        .eq("user_id", studentId!)
        .maybeSingle();
      return data;
    },
  });

  const trackTally = { foundation: 0, core: 0, advanced: 0 };
  for (const r of rungs ?? []) {
    const k = (r.depth_track ?? "core") as keyof typeof trackTally;
    if (k in trackTally) trackTally[k] += 1;
  }
  const total = rungs?.length || 1;

  return (
    <DashboardLayout role="teacher">
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          {/* Header */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
                {(profile?.full_name ?? "S").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                  {profile?.full_name ?? "Student"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {profile?.class_name ?? "—"} · {profile?.school_name ?? "—"}
                </p>
                {profile?.interests?.length ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {profile.interests.map((i: string) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </Card>

          {/* Inner OS scores */}
          {os && (
            <Card className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Inner OS</h2>
                <span className="ml-auto text-xs text-muted-foreground">Lvl {os.level}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: "Clarity", v: os.clarity_score },
                  { label: "Thinking", v: os.thinking_score },
                  { label: "Focus", v: os.attention_score },
                  { label: "Momentum", v: os.momentum_score },
                  { label: "Character", v: os.character_score },
                ].map((d) => (
                  <div key={d.label}>
                    <div className="text-[11px] font-medium text-muted-foreground">{d.label}</div>
                    <div className="text-xl font-bold text-foreground tabular-nums">{d.v}</div>
                    <div className="h-1.5 mt-1 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${d.v}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Depth journey */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Depth Journey</h2>
            </div>
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-muted mb-2">
              {(["foundation", "core", "advanced"] as const).map((k) => (
                <div
                  key={k}
                  className={TRACK_BG[k]}
                  style={{ width: `${Math.round((trackTally[k] / total) * 100)}%` }}
                  title={`${k}: ${trackTally[k]}`}
                />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] mb-4">
              {(["foundation", "core", "advanced"] as const).map((k) => (
                <div key={k} className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${TRACK_BG[k]}`} />
                  <span className="capitalize font-semibold text-foreground">{k}</span>
                  <span className="ml-auto tabular-nums text-muted-foreground">{trackTally[k]}</span>
                </div>
              ))}
            </div>
            {!rungs?.length ? (
              <div className="text-xs text-muted-foreground py-2">No episode activity yet.</div>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                {rungs.slice(0, 10).map((r: any) => (
                  <li key={r.id} className="flex items-center gap-3 p-3 bg-card">
                    <span
                      className={`h-7 w-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center ${TRACK_BG[r.depth_track] ?? "bg-emerald-500"}`}
                    >
                      {r.current_rung}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {r.episode_id} <span className="text-muted-foreground font-medium">· ch {r.chapter_id}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground capitalize">
                        {r.depth_track} · updated {new Date(r.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* First thoughts */}
          {!!arc?.length && (
            <Card className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="h-5 w-5 text-violet-500" />
                <h2 className="text-lg font-semibold text-foreground">Their First Thoughts</h2>
              </div>
              <ul className="space-y-2">
                {arc
                  .filter((a: any) => a.day1_first_thought)
                  .map((a: any) => (
                    <li
                      key={a.id}
                      className="p-3 rounded-xl border-l-4 border-violet-500 bg-violet-500/5"
                    >
                      <div className="text-[11px] uppercase tracking-wide font-bold text-violet-600">
                        {a.concept_key}
                      </div>
                      <div className="text-sm text-foreground mt-1 italic">"{a.day1_first_thought}"</div>
                    </li>
                  ))}
              </ul>
            </Card>
          )}

          {/* Retention risk */}
          {!!risk?.length && (
            <Card className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-rose-500" />
                <h2 className="text-lg font-semibold text-foreground">Retention Risk · Next Week</h2>
              </div>
              <ul className="space-y-2">
                {risk.map((r: any, i: number) => {
                  const tint =
                    r.risk_level === "high" ? "bg-rose-500" : r.risk_level === "medium" ? "bg-amber-500" : "bg-emerald-500";
                  return (
                    <li key={i} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                      <span className={`h-8 w-8 rounded-lg ${tint} text-white text-[11px] font-bold flex items-center justify-center shrink-0`}>
                        {r.risk_score}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-foreground">{r.concept_label}</div>
                        <div className="text-[11px] text-muted-foreground capitalize">{r.risk_level} risk</div>
                        <div className="text-xs text-foreground/80 mt-1">{r.recommended_action}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          <Button variant="outline" onClick={() => navigate("/teacher")} className="w-full">
            Back to Dashboard
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherStudentDeepDive;
