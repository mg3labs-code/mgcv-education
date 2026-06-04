import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";

const EMOJI: Record<string, string> = {
  cricket: "🏏", food: "🍔", movies: "🎬", gaming: "🎮",
  music: "🎵", travel: "✈️", tech: "💻", nature: "🌧",
};

interface SummaryRow {
  has_interests: boolean;
  top_interest: string | null;
  cutover_at: string | null;
  episodes_after: number;
  episodes_before: number;
  avg_time_after_seconds: number;
  avg_time_before_seconds: number;
  first_try_rate_after: number;
  first_try_rate_before: number;
  high_risk_after: number;
  high_risk_before: number;
}

function Delta({ after, before, invert = false, suffix = "" }: { after: number; before: number; invert?: boolean; suffix?: string }) {
  const diff = after - before;
  const positive = invert ? diff < 0 : diff > 0;
  const neutral = diff === 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span
      className={
        neutral
          ? "text-muted-foreground"
          : positive
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-amber-600 dark:text-amber-400"
      }
      style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}
    >
      {!neutral && <Icon className="h-3.5 w-3.5" />}
      {diff > 0 ? "+" : ""}{Math.round(diff)}{suffix}
    </span>
  );
}

export default function WeeklyInterestSummary() {
  const { user } = useAuth();

  const { data } = useQuery<SummaryRow | null>({
    queryKey: ["weekly-interest-summary", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // RPC name is new — fall back gracefully if types haven't regenerated.
      const { data, error } = await (supabase as unknown as {
        rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: SummaryRow[] | null; error: unknown }>;
      }).rpc("get_weekly_interest_summary", { _user_id: user!.id });
      if (error || !data || !data.length) return null;
      return data[0];
    },
  });

  if (!data || !data.has_interests || !data.top_interest) return null;

  const interest = data.top_interest;
  const emoji = EMOJI[interest] ?? "✨";
  const pctAfter = Math.round((data.first_try_rate_after || 0) * 100);
  const pctBefore = Math.round((data.first_try_rate_before || 0) * 100);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #FFF8EC 0%, #FEF3F2 100%)",
        border: "1px solid #FCD9B6",
        borderRadius: 16,
        padding: 20,
        marginTop: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Sparkles className="h-4 w-4" style={{ color: "#D97706" }} />
        <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#92400E", margin: 0 }}>
          Your week with {emoji} {interest} lens
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        <Stat label="Episodes finished" after={data.episodes_after} before={data.episodes_before} suffix="" />
        <Stat label="First-try accuracy" after={pctAfter} before={pctBefore} suffix="%" />
        <Stat label="Avg time / episode" after={Math.round(data.avg_time_after_seconds / 60)} before={Math.round(data.avg_time_before_seconds / 60)} suffix="m" invertDelta />
        <Stat label="High-risk concepts" after={data.high_risk_after} before={data.high_risk_before} suffix="" invertDelta />
      </div>

      <p style={{ marginTop: 12, fontSize: 12, color: "#78716C", fontStyle: "italic" }}>
        Compared to your activity before you picked your interests.
      </p>
    </div>
  );
}

function Stat({ label, after, before, suffix, invertDelta }: { label: string; after: number; before: number; suffix: string; invertDelta?: boolean }) {
  return (
    <div style={{ background: "white", borderRadius: 12, padding: 12, border: "1px solid #FDE6CB" }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#92400E", margin: 0, letterSpacing: "0.05em" }}>{label}</p>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: "#1C1917" }}>{after}{suffix}</span>
        <span style={{ fontSize: 11, color: "#A8A29E" }}>vs {before}{suffix}</span>
        <Delta after={after} before={before} invert={invertDelta} suffix={suffix} />
      </div>
    </div>
  );
}
