import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Sparkles } from "lucide-react";
import { LAYERS, rungToLayer, type Layer } from "@/lib/sevenLayers";
import { ROUTES } from "@/lib/routes";

/**
 * TodayThoughtCard
 * Replaces the scoreboard-style "Your week with X Lens" KPI tiles.
 *
 * Charter compliance: NO percentages, NO deltas, NO "vs N" comparisons,
 * NO red ↓ arrows. One concept, one lens, one next layer, one echo.
 */

const INTEREST_LENS: Record<string, { emoji: string; phrase: (concept: string) => string }> = {
  cricket: { emoji: "🏏", phrase: (c) => `a cricket pitch hides the same idea as ${c}` },
  food:    { emoji: "🍳", phrase: (c) => `your kitchen runs on ${c} every day` },
  music:   { emoji: "🎵", phrase: (c) => `every song already uses ${c}` },
  gaming:  { emoji: "🎮", phrase: (c) => `${c} is the rule behind your favourite game` },
  movies:  { emoji: "🎬", phrase: (c) => `${c} is hiding in the camera, frame by frame` },
  travel:  { emoji: "🧭", phrase: (c) => `${c} is what makes every journey possible` },
  tech:    { emoji: "🤖", phrase: (c) => `every app you open runs on ${c}` },
  nature:  { emoji: "🌿", phrase: (c) => `${c} is how nature quietly works` },
};

interface TodayBundle {
  conceptLabel: string;
  conceptKey: string | null;
  chapterId: string | null;
  episodeId: string | null;
  currentLayer: Layer;
  yesterdayThought: string | null;
  interestTag: string | null;
}

export default function TodayThoughtCard({ firstName }: { firstName: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data } = useQuery<TodayBundle | null>({
    queryKey: ["today-thought", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const [arc, rung, profile] = await Promise.all([
        supabase
          .from("curiosity_arc_progress")
          .select("concept_key, day1_first_thought, interest_tag, updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("student_rung_state")
          .select("chapter_id, episode_id, concept_key, current_rung, updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("profiles").select("interests, interest_tag").eq("user_id", user.id).maybeSingle(),
      ]);

      const conceptKey =
        (rung.data?.concept_key as string | null) ??
        (arc.data?.concept_key as string | null) ??
        null;
      const conceptLabel = conceptKey
        ? conceptKey.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "Today's idea";

      const interestTag =
        (arc.data?.interest_tag as string | null) ??
        (profile.data?.interest_tag as string | null) ??
        ((profile.data?.interests as string[] | null)?.[0] ?? null);

      return {
        conceptLabel,
        conceptKey,
        chapterId: (rung.data?.chapter_id as string | null) ?? null,
        episodeId: (rung.data?.episode_id as string | null) ?? null,
        currentLayer: rungToLayer(rung.data?.current_rung as number | null | undefined),
        yesterdayThought: (arc.data?.day1_first_thought as string | null) ?? null,
        interestTag,
      };
    },
  });

  // Empty / first-time state
  if (!data) {
    return (
      <FirstTimeCard firstName={firstName} onBegin={() => navigate(ROUTES.textbook.root)} />
    );
  }

  const lens = data.interestTag ? INTEREST_LENS[data.interestTag] : undefined;
  const nextLayer = data.currentLayer;

  const handleBegin = () => {
    if (data.chapterId && data.episodeId) {
      navigate(`/student/textbook/${data.chapterId}/${data.episodeId}`);
    } else {
      navigate("/student/textbook");
    }
  };

  return (
    <article
      aria-label="Today's thought"
      className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      {/* ambient layer-tinted glow */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-60 pointer-events-none"
        style={{
          background: `radial-gradient(900px 240px at 0% 0%, hsl(${nextLayer.hue} 80% 92%) 0%, transparent 60%), radial-gradient(700px 200px at 100% 100%, hsl(${(nextLayer.hue + 30) % 360} 70% 94%) 0%, transparent 65%)`,
        }}
      />

      <div className="relative grid gap-6 p-6 md:grid-cols-[1fr_auto] md:p-8">
        {/* LEFT — the thought */}
        <div className="min-w-0 space-y-5">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            For {firstName} · today
          </p>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              You're meeting
            </p>
            <h2 className="font-serif text-3xl font-bold leading-tight text-foreground md:text-4xl">
              {data.conceptLabel}
            </h2>
          </div>

          {lens && (
            <div className="rounded-xl border border-border/60 bg-background/60 p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Through your lens
              </p>
              <p className="mt-1 text-base leading-snug text-foreground">
                <span className="mr-1.5 text-lg">{lens.emoji}</span>
                {lens.phrase(data.conceptLabel.toLowerCase())}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your next layer
            </p>
            <div className="flex items-baseline gap-3">
              <span
                className="grid h-9 w-9 place-items-center rounded-lg text-sm font-bold text-white shadow-sm"
                style={{ background: `hsl(${nextLayer.hue} 65% 45%)` }}
              >
                {nextLayer.index}
              </span>
              <div className="min-w-0">
                <p className="font-serif text-xl font-semibold text-foreground">{nextLayer.name}</p>
                <p className="text-sm text-muted-foreground">{nextLayer.caption}</p>
              </div>
            </div>
          </div>

          {data.yesterdayThought && (
            <blockquote className="rounded-lg border-l-2 border-primary/40 bg-muted/40 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                You wondered last time
              </p>
              <p className="mt-1 font-serif text-base italic leading-snug text-foreground">
                "{data.yesterdayThought}"
              </p>
            </blockquote>
          )}

          <button
            onClick={handleBegin}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
          >
            Begin · 6 min
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* RIGHT — the 7-layer spine */}
        <LayerSpine
          current={nextLayer}
          onPick={(layer) => {
            if (data.chapterId && data.episodeId) {
              navigate(`/student/textbook/${data.chapterId}/${data.episodeId}?layer=${layer.key}`);
            } else {
              navigate("/student/textbook");
            }
          }}
        />
      </div>
    </article>
  );
}

function LayerSpine({ current, onPick }: { current: Layer; onPick?: (l: Layer) => void }) {
  return (
    <aside
      aria-label="Seven layers of understanding"
      className="hidden min-w-[200px] flex-col gap-1.5 rounded-xl border border-border/60 bg-background/50 p-3 backdrop-blur-sm md:flex"
    >
      <p className="px-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        The 7 layers · tap to jump
      </p>
      {LAYERS.map((l) => {
        const reached = l.index <= current.index;
        const isNow = l.index === current.index;
        return (
          <button
            key={l.key}
            type="button"
            onClick={() => onPick?.(l)}
            aria-current={isNow ? "step" : undefined}
            className={`group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-foreground/[0.04] active:scale-[0.98] ${
              isNow ? "bg-foreground/5 ring-1 ring-foreground/10" : ""
            }`}
          >
            <span
              className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11px] font-bold transition group-hover:scale-105"
              style={{
                background: reached ? `hsl(${l.hue} 65% 45%)` : "hsl(0 0% 92%)",
                color: reached ? "white" : "hsl(0 0% 55%)",
                boxShadow: isNow ? `0 0 0 3px hsl(${l.hue} 80% 90%)` : undefined,
              }}
            >
              {l.index}
            </span>
            <span
              className={`truncate text-[12.5px] ${
                isNow ? "font-semibold text-foreground" : reached ? "text-foreground/80" : "text-muted-foreground"
              }`}
            >
              {l.name}
            </span>
          </button>
        );
      })}
    </aside>
  );
}

function FirstTimeCard({ firstName, onBegin }: { firstName: string; onBegin: () => void }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
      <div
        aria-hidden
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          background:
            "radial-gradient(700px 200px at 0% 0%, hsl(200 80% 92%), transparent 60%), radial-gradient(600px 200px at 100% 100%, hsl(270 70% 94%), transparent 65%)",
        }}
      />
      <div className="relative grid gap-6 md:grid-cols-[1fr_auto]">
        <div className="space-y-5 min-w-0">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Welcome, {firstName}
          </p>
          <h2 className="font-serif text-3xl font-bold leading-tight text-foreground md:text-4xl">
            Learn any idea in 7 small layers.
          </h2>
          <p className="max-w-prose text-base leading-relaxed text-muted-foreground">
            Most apps quiz you. Here, every concept is unpacked layer by layer — from{" "}
            <span className="font-semibold text-foreground">what it is</span> all the way to{" "}
            <span className="font-semibold text-foreground">what follows from it</span>.
            No scores, no rush. Just one layer at a time.
          </p>

          <ol className="space-y-1.5 text-sm">
            {LAYERS.slice(0, 3).map((l) => (
              <li key={l.key} className="flex items-baseline gap-2.5">
                <span
                  className="grid h-5 w-5 shrink-0 place-items-center rounded text-[10px] font-bold text-white"
                  style={{ background: `hsl(${l.hue} 65% 45%)` }}
                >
                  {l.index}
                </span>
                <span className="text-foreground">
                  <span className="font-semibold">{l.name}</span>
                  <span className="text-muted-foreground"> — {l.caption}</span>
                </span>
              </li>
            ))}
            <li className="pl-7 text-xs italic text-muted-foreground">
              …and 4 more: Assumptions, Connections, Applications, Implications.
            </li>
          </ol>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={onBegin}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
            >
              Try Layer 1 · Definition
              <ArrowRight className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground">Takes about 2 minutes.</span>
          </div>
        </div>

        <aside
          aria-label="Seven layers of understanding"
          className="hidden min-w-[180px] flex-col gap-1.5 rounded-xl border border-border/60 bg-background/60 p-3 backdrop-blur-sm md:flex"
        >
          <p className="px-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            The 7 layers
          </p>
          {LAYERS.map((l) => (
            <div key={l.key} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
              <span
                className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11px] font-bold text-white"
                style={{ background: `hsl(${l.hue} 65% 45%)` }}
              >
                {l.index}
              </span>
              <span className="truncate text-[12.5px] text-foreground/80">{l.name}</span>
            </div>
          ))}
        </aside>
      </div>
    </article>
  );
}
