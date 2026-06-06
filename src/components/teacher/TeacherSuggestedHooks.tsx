import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Lightbulb, Trophy, Utensils, Plane, Leaf } from "lucide-react";
import { DEMO_HOOKS } from "./demoData";

interface Props {
  className: string;
}

const INTEREST_ICONS: Record<string, { Icon: typeof Trophy; tint: string }> = {
  cricket: { Icon: Trophy, tint: "text-emerald-600 bg-emerald-500/10" },
  food: { Icon: Utensils, tint: "text-amber-600 bg-amber-500/10" },
  travel: { Icon: Plane, tint: "text-sky-600 bg-sky-500/10" },
  nature: { Icon: Leaf, tint: "text-violet-600 bg-violet-500/10" },
};

const HOOK_TEMPLATES: Record<string, (concept: string) => string> = {
  cricket: (c) => `Open ${c} like a cricket scoreboard — show how a single rule keeps the score honest.`,
  food: (c) => `Start ${c} from a kitchen — measuring rice for guests reveals the same idea in 30 seconds.`,
  travel: (c) => `Frame ${c} as a road-trip plan — splitting distance and time is the same logic.`,
  nature: (c) => `Anchor ${c} in a tree's growth pattern — nature solves it the same way.`,
};

/**
 * Suggests interest-anchored hooks for tomorrow based on (1) the concepts
 * the class struggled with most and (2) the top interest of students in
 * that class. Pure heuristic — no AI call yet, deterministic + fast.
 */
const TeacherSuggestedHooks = ({ className }: Props) => {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["suggested-hooks", user?.id, className],
    enabled: !!user,
    queryFn: async () => {
      const { data: students } = await supabase
        .from("profiles")
        .select("user_id, interests")
        .eq("class_name", className);
      const ids = (students ?? []).map((s) => s.user_id);
      if (!ids.length) return { hooks: [] as { concept: string; interest: string; line: string }[] };

      // Top interest in the class
      const tally: Record<string, number> = {};
      for (const s of students ?? []) {
        for (const i of (s.interests ?? []) as string[]) {
          tally[i.toLowerCase()] = (tally[i.toLowerCase()] ?? 0) + 1;
        }
      }
      const topInterest = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "cricket";

      // Concepts with most wrong attempts
      const { data: ix } = await supabase
        .from("episode_interactions")
        .select("episode_id, wrong_attempts, correct_on_first_try")
        .in("user_id", ids)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      const byEp: Record<string, number> = {};
      for (const r of ix ?? []) {
        const score = (r.wrong_attempts ?? 0) + (r.correct_on_first_try === false ? 1 : 0);
        if (score > 0) byEp[r.episode_id] = (byEp[r.episode_id] ?? 0) + score;
      }
      const topConcepts = Object.entries(byEp).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
      if (!topConcepts.length) topConcepts.push("Real Numbers", "Polynomials", "Quadratics");

      const template = HOOK_TEMPLATES[topInterest] ?? HOOK_TEMPLATES.cricket;
      const hooks = topConcepts.map((c) => ({
        concept: c,
        interest: topInterest,
        line: template(c),
      }));
      return { hooks };
    },
  });

  const hooks = data?.hooks ?? [];

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb className="h-5 w-5 text-amber-500" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-foreground">Suggested Hooks for Tomorrow</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Interest-anchored openers for the concepts {className} struggled with this week.
      </p>
      {hooks.length === 0 ? (
        <div className="text-xs text-muted-foreground py-4 text-center">
          No struggle data yet this week — hooks will appear once students start practicing.
        </div>
      ) : (
        <ul className="space-y-2">
          {hooks.map((h) => {
            const meta = INTEREST_ICONS[h.interest] ?? INTEREST_ICONS.cricket;
            return (
              <li
                key={h.concept}
                className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card"
              >
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${meta.tint}`}>
                  <meta.Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] uppercase tracking-wide font-bold text-muted-foreground">
                    {h.concept} · via {h.interest}
                  </div>
                  <div className="text-sm text-foreground leading-snug mt-0.5">{h.line}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};

export default TeacherSuggestedHooks;
