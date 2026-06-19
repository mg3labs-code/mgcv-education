import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/lib/routes";
import { useUserEpisodeProgress } from "@/hooks/useEpisodeProgress";

const INTEREST_EMOJI: Record<string, string> = {
  food: "🍳", cricket: "🏏", music: "🎵", gaming: "🎮",
  movies: "🎬", travel: "🧭", tech: "🤖", nature: "🌿", sports: "⚽",
};

const MYSTERY_BY_INTEREST: Record<string, string> = {
  food: "Can a restaurant rating be 4.5?",
  cricket: "Why does a batting average have a decimal?",
  music: "How can a beat be 1.5 seconds long?",
  gaming: "Why is your win-rate written as 67.5%?",
  movies: "How can a movie last 2.25 hours?",
  travel: "Can a journey really be 3.5 hours?",
  tech: "Why is storage measured as 1.5 GB?",
  nature: "How tall is a tree if it's 4.5 metres?",
  sports: "Can a goal-rate be 1.5 per match?",
};

interface JourneyData {
  interest: string | null;
  yesterdayThought: string | null;
  conceptLabel: string | null;
  chapterId: string | null;
  episodeId: string | null;
  episodeTitle: string | null;
}

export default function ContinueJourneyHero({ firstName }: { firstName: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data } = useQuery<JourneyData | null>({
    queryKey: ["continue-journey-hero", user?.id],
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
          .select("chapter_id, episode_id, concept_key, updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("interests, interest_tag")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      const interest =
        (arc.data?.interest_tag as string | null) ??
        (profile.data?.interest_tag as string | null) ??
        ((profile.data?.interests as string[] | null)?.[0] ?? null);

      const conceptKey =
        (rung.data?.concept_key as string | null) ??
        (arc.data?.concept_key as string | null) ??
        null;
      const conceptLabel = conceptKey
        ? conceptKey.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : null;

      let episodeTitle: string | null = null;
      if (rung.data?.episode_id) {
        const { data: ep } = await supabase
          .from("tb_episodes")
          .select("title")
          .eq("id", rung.data.episode_id)
          .maybeSingle();
        episodeTitle = (ep?.title as string | null) ?? null;
      }

      return {
        interest: interest ? interest.toLowerCase() : null,
        yesterdayThought: (arc.data?.day1_first_thought as string | null) ?? null,
        conceptLabel,
        chapterId: (rung.data?.chapter_id as string | null) ?? null,
        episodeId: (rung.data?.episode_id as string | null) ?? null,
        episodeTitle,
      };
    },
  });

  const hasJourney = !!(data && (data.yesterdayThought || data.episodeId || data.interest));

  const onContinue = () => {
    if (data?.chapterId && data?.episodeId) {
      navigate(ROUTES.textbook.episode(data.chapterId, data.episodeId));
    } else {
      navigate(ROUTES.textbook.root);
    }
  };

  const interestKey = data?.interest ?? "";
  const interestEmoji = INTEREST_EMOJI[interestKey] ?? "✨";
  const mystery =
    MYSTERY_BY_INTEREST[interestKey] ??
    (data?.conceptLabel ? `What's hiding inside ${data.conceptLabel}?` : "What will you uncover today?");

  return (
    <article
      aria-label="Continue your journey"
      className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      style={{
        background:
          "linear-gradient(135deg, #FFFBF5 0%, #FFF7ED 45%, #ECFEFF 100%)",
        borderColor: "#E7E5E4",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(700px 220px at 0% 0%, rgba(13,148,136,0.10), transparent 60%), radial-gradient(600px 200px at 100% 100%, rgba(124,58,237,0.10), transparent 65%)",
        }}
      />
      <div className="relative p-6 md:p-8">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          {hasJourney ? `Welcome back, ${firstName}` : `Welcome, ${firstName}`}
        </p>

        <h1
          className="mt-2 font-serif text-3xl font-bold leading-tight text-foreground md:text-4xl"
          style={{ fontFamily: "'Source Serif 4', serif" }}
        >
          Continue Your Journey
        </h1>

        {hasJourney ? (
          <div className="mt-5 space-y-3">
            {data?.interest && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-base">{interestEmoji}</span>
                <span className="text-muted-foreground">Your lens:</span>
                <span className="font-semibold capitalize text-foreground">{data.interest}</span>
              </div>
            )}

            {data?.yesterdayThought && (
              <blockquote className="rounded-lg border-l-2 border-primary/50 bg-background/60 px-4 py-3 backdrop-blur-sm">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Quote className="h-3 w-3" /> Yesterday you said
                </p>
                <p
                  className="mt-1 italic leading-snug text-foreground"
                  style={{ fontFamily: "'Source Serif 4', serif" }}
                >
                  "{data.yesterdayThought}"
                </p>
              </blockquote>
            )}

            <div className="rounded-lg bg-background/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Today's mystery
              </p>
              <p
                className="mt-1 text-base leading-snug text-foreground"
                style={{ fontFamily: "'Source Serif 4', serif" }}
              >
                {mystery}
              </p>
              {data?.episodeTitle && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Up next · <span className="font-medium text-foreground">{data.episodeTitle}</span>
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-4 max-w-prose text-base leading-relaxed text-muted-foreground">
            Start your first episode and we'll personalize the rest around what you're curious about.
          </p>
        )}

        <button
          onClick={onContinue}
          className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-110 active:scale-[0.98]"
          style={{ background: "#0D9488" }}
        >
          {hasJourney ? "Continue Journey" : "Start your first episode"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
