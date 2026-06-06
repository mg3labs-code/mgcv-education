import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Sparkles } from "lucide-react";

interface Bundle {
  fullName: string;
  topInterest: string | null;
  firstThought: string | null;
  conceptLabel: string | null;
  episodesAfter: number;
  highRiskAfter: number;
  firstTryPct: number;
  streakDays: number;
}

const EMOJI: Record<string, string> = {
  cricket: "🏏", food: "🍔", movies: "🎬", gaming: "🎮",
  music: "🎵", travel: "✈️", tech: "💻", nature: "🌧",
};

/**
 * ParentWeeklyNote — a read-only preview of the note the student's parent
 * would receive this week. Auto-composed from existing arc + activity data.
 * Lives on the student dashboard so the student can see what's shared.
 */
export default function ParentWeeklyNote() {
  const { user } = useAuth();

  const { data } = useQuery<Bundle | null>({
    queryKey: ["parent-weekly-note", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const [profile, arc, summary, streak] = await Promise.all([
        supabase.from("profiles").select("full_name, interests").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("curiosity_arc_progress")
          .select("day1_first_thought, concept_key, updated_at")
          .eq("user_id", user.id)
          .not("day1_first_thought", "is", null)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        (supabase as unknown as {
          rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: Array<Record<string, unknown>> | null }>;
        }).rpc("get_weekly_interest_summary", { _user_id: user.id }),
        (supabase as unknown as {
          rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: number | null }>;
        }).rpc("get_student_streak", { _user_id: user.id }),
      ]);

      const interests = (profile.data?.interests as string[] | null) ?? [];
      const sRow = (summary.data?.[0] ?? null) as Record<string, unknown> | null;
      const conceptKey = (arc.data?.concept_key as string | null) ?? null;
      const conceptLabel = conceptKey
        ? conceptKey.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : null;

      return {
        fullName: (profile.data?.full_name as string) ?? "Your child",
        topInterest: interests[0] ?? null,
        firstThought: (arc.data?.day1_first_thought as string) ?? null,
        conceptLabel,
        episodesAfter: Number(sRow?.episodes_after ?? 0),
        highRiskAfter: Number(sRow?.high_risk_after ?? 0),
        firstTryPct: Math.round(Number(sRow?.first_try_rate_after ?? 0) * 100),
        streakDays: Number(streak.data ?? 0),
      };
    },
  });

  if (!data || (!data.firstThought && data.episodesAfter === 0)) return null;

  const firstName = data.fullName.split(" ")[0] || "Your child";
  const interestEmoji = data.topInterest ? (EMOJI[data.topInterest] ?? "✨") : "✨";
  const interestLabel = data.topInterest ?? "their interests";

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #F0F9FF 0%, #EFF6FF 100%)",
        border: "1px solid #BFDBFE",
        borderRadius: 16,
        padding: 20,
        marginTop: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Mail className="h-4 w-4" style={{ color: "#1D4ED8" }} />
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#1E3A8A", margin: 0 }}>
            What your parent sees this week
          </p>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: "#1D4ED8", background: "#DBEAFE", padding: "3px 8px", borderRadius: 999 }}>
          <Sparkles className="h-3 w-3" /> Preview
        </span>
      </div>

      <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #DBEAFE" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#1C1917", margin: "0 0 8px" }}>
          Hello! Here's how {firstName} learned this week.
        </p>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#44403C", lineHeight: 1.55 }}>
          {data.firstThought && data.conceptLabel && (
            <li>
              • {firstName} started <strong>{data.conceptLabel}</strong> by wondering:{" "}
              <em>"{data.firstThought}"</em>
            </li>
          )}
          {data.topInterest && (
            <li>
              • Learning is being connected to <strong>{interestEmoji} {interestLabel}</strong> — what {firstName} naturally cares about.
            </li>
          )}
          <li>
            • {data.episodesAfter > 0 ? `Finished ${data.episodesAfter} learning ${data.episodesAfter === 1 ? "episode" : "episodes"}` : "Just getting started"}
            {data.firstTryPct > 0 ? ` · ${data.firstTryPct}% answered right on the first try` : ""}.
          </li>
          {data.streakDays >= 2 && (
            <li>
              • On a <strong>{data.streakDays}-day streak</strong> — showing up regularly.
            </li>
          )}
          {data.highRiskAfter > 0 && (
            <li>
              • {data.highRiskAfter} concept{data.highRiskAfter > 1 ? "s" : ""} we'll revisit next week so it stays in long-term memory.
            </li>
          )}
        </ul>
        <p style={{ marginTop: 10, fontSize: 11, color: "#78716C", fontStyle: "italic" }}>
          Auto-generated · sent to your parent every Sunday.
        </p>
      </div>
    </div>
  );
}
