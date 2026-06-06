import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, Sparkles } from "lucide-react";

interface Bundle {
  fullName: string;
  topInterest: string | null;
  firstThought: string | null;
  conceptLabel: string | null;
  episodesAfter: number;
  streakDays: number;
}

const INTEREST_LABEL: Record<string, string> = {
  cricket: "cricket", food: "cooking", movies: "films", gaming: "games",
  music: "music", travel: "travel", tech: "technology", nature: "the natural world",
};

/**
 * ParentWeeklyNote — a warm, jargon-free weekly note for the parent.
 * No scores, no risk labels, no percentages. Celebrates curiosity and effort.
 * Intended for the parent-facing channel (email / parent portal), not the student view.
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
        streakDays: Number(streak.data ?? 0),
      };
    },
  });

  if (!data) return null;

  const firstName = data.fullName.split(" ")[0] || "Your child";
  const interest = data.topInterest ? (INTEREST_LABEL[data.topInterest] ?? data.topInterest) : null;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 100%)",
        border: "1px solid #FDE68A",
        borderRadius: 16,
        padding: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Heart className="h-4 w-4" style={{ color: "#B45309" }} />
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#92400E", margin: 0 }}>
            A note for {firstName}'s family
          </p>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: "#B45309", background: "#FEF3C7", padding: "3px 8px", borderRadius: 999 }}>
          <Sparkles className="h-3 w-3" /> This week
        </span>
      </div>

      <div style={{ background: "white", borderRadius: 12, padding: 18, border: "1px solid #FDE68A" }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#1C1917", margin: "0 0 10px", lineHeight: 1.5 }}>
          Dear Parent,
        </p>
        <p style={{ fontSize: 13.5, color: "#44403C", lineHeight: 1.7, margin: "0 0 10px" }}>
          We wanted to share a small moment from {firstName}'s week of learning.
        </p>

        <p style={{ fontSize: 13.5, color: "#44403C", lineHeight: 1.7, margin: "0 0 10px" }}>
          {data.firstThought && data.conceptLabel ? (
            <>
              While exploring <strong>{data.conceptLabel}</strong>, {firstName} paused to wonder,{" "}
              <em>"{data.firstThought}"</em> — exactly the kind of curiosity that turns into deep understanding.
            </>
          ) : (
            <>{firstName} brought a quiet curiosity into class this week, asking thoughtful questions along the way.</>
          )}
        </p>

        {interest && (
          <p style={{ fontSize: 13.5, color: "#44403C", lineHeight: 1.7, margin: "0 0 10px" }}>
            We're gently weaving lessons into things {firstName} naturally enjoys — like <strong>{interest}</strong> — so learning feels close to life, not separate from it.
          </p>
        )}

        {data.streakDays >= 2 ? (
          <p style={{ fontSize: 13.5, color: "#44403C", lineHeight: 1.7, margin: "0 0 10px" }}>
            {firstName} showed up to learn on <strong>{data.streakDays} different days</strong> this week. Consistency like this is something to be proud of.
          </p>
        ) : data.episodesAfter > 0 ? (
          <p style={{ fontSize: 13.5, color: "#44403C", lineHeight: 1.7, margin: "0 0 10px" }}>
            {firstName} took meaningful steps forward this week — every effort counts, and we noticed.
          </p>
        ) : null}

        <p style={{ fontSize: 13.5, color: "#44403C", lineHeight: 1.7, margin: "0 0 14px" }}>
          You don't need to do anything with this note. We just wanted you to know — your child is learning, and we're cheering them on.
        </p>

        <p style={{ fontSize: 13.5, fontWeight: 600, color: "#1C1917", margin: 0 }}>
          With warmth,<br />
          <span style={{ color: "#92400E" }}>{firstName}'s learning team</span>
        </p>

        <p style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed #FDE68A", fontSize: 11, color: "#A8A29E", fontStyle: "italic" }}>
          A short note, sent quietly each Sunday. No scores, no rankings — just a glimpse of the week.
        </p>
      </div>
    </div>
  );
}
