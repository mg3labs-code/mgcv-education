import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, Target } from "lucide-react";

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
};

/**
 * Misconception Map — surfaces the concepts and rungs where the class
 * is stuck. Built from episode_interactions aggregated by chapter+episode+block.
 */
const TeacherMisconceptionMap = ({ className }: Props) => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["misconception-map", user?.id, className],
    enabled: !!user,
    queryFn: async () => {
      const { data: students } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("class_name", className);
      const ids = (students ?? []).map((s) => s.user_id);
      if (!ids.length) return [];
      const { data } = await supabase
        .from("episode_interactions")
        .select("user_id, chapter_id, episode_id, block_type, block_index, wrong_attempts, correct_on_first_try, comprehension_result")
        .in("user_id", ids)
        .gte("created_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());
      return (data ?? []) as Row[];
    },
  });

  // Aggregate by chapter::episode::block_type
  const groups = new Map<
    string,
    { chapter: string; episode: string; block: string; attempts: number; wrong: number; students: Set<string> }
  >();
  for (const r of data ?? []) {
    const key = `${r.chapter_id}::${r.episode_id}::${r.block_type}`;
    const g = groups.get(key) ?? {
      chapter: r.chapter_id,
      episode: r.episode_id,
      block: r.block_type,
      attempts: 0,
      wrong: 0,
      students: new Set<string>(),
    };
    g.attempts += 1;
    g.wrong += Math.max(0, r.wrong_attempts) + (r.correct_on_first_try === false ? 1 : 0);
    g.students.add(r.user_id);
    groups.set(key, g);
  }

  const top = Array.from(groups.values())
    .map((g) => ({
      ...g,
      stuckRate: g.attempts ? g.wrong / (g.attempts * 2) : 0, // soft normalization
      studentCount: g.students.size,
    }))
    .filter((g) => g.wrong > 0)
    .sort((a, b) => b.stuckRate - a.stuckRate)
    .slice(0, 8);

  const heatColor = (rate: number) => {
    if (rate >= 0.5) return "bg-rose-500";
    if (rate >= 0.3) return "bg-amber-500";
    if (rate >= 0.15) return "bg-yellow-400";
    return "bg-emerald-500";
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Target className="h-5 w-5 text-rose-500" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-foreground">Misconception Map</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Where {className} is getting stuck — last 14 days. Brighter cells mean more struggle.
      </p>

      {isLoading ? (
        <div className="text-xs text-muted-foreground">Loading…</div>
      ) : top.length === 0 ? (
        <div className="text-xs text-muted-foreground py-4 text-center">
          No misconception patterns detected yet — your class is cruising.
        </div>
      ) : (
        <ul className="space-y-2">
          {top.map((g) => (
            <li
              key={`${g.chapter}-${g.episode}-${g.block}`}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 p-3 rounded-xl border border-border bg-card"
            >
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center text-white text-[11px] font-bold ${heatColor(g.stuckRate)}`}
                title={`Struggle: ${Math.round(g.stuckRate * 100)}%`}
              >
                {Math.round(g.stuckRate * 100)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">
                  {g.episode} · <span className="text-muted-foreground font-medium capitalize">{g.block}</span>
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  Chapter {g.chapter} · {g.studentCount} student{g.studentCount === 1 ? "" : "s"} · {g.wrong} wrong attempt{g.wrong === 1 ? "" : "s"}
                </div>
              </div>
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" aria-hidden />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default TeacherMisconceptionMap;
