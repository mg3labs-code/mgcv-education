import { useNavigate, useParams } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { useChapterEpisodes } from "@/hooks/useTextbookData";
import { useUserEpisodeProgress, getEpisodeStatus, getChapterProgress } from "@/hooks/useEpisodeProgress";
import { Play, Clock, Sparkles, CheckCircle2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DetailSkeleton } from "@/components/PageSkeleton";

const typeIcons: Record<string, string> = {
  Concept: "💡",
  "Deep Dive": "🔬",
  Application: "🔧",
  Assessment: "✅",
  Practice: "📝",
};

const TextbookChapter = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const { data: chapter, isLoading } = useChapterEpisodes(chapterId);
  const { data: progressMap } = useUserEpisodeProgress();

  if (isLoading) {
    return (
      <PageLayout role="student">
        <div className="max-w-4xl mx-auto">
          <DetailSkeleton />
        </div>
      </PageLayout>
    );
  }

  if (!chapter) {
    return (
      <PageLayout role="student">
        <div className="text-center py-20">
          <p className="text-muted-foreground">Chapter not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/student/textbook")}>
            Back to Textbook
          </Button>
        </div>
      </PageLayout>
    );
  }

  const breadcrumbs = [
    { label: "Dashboard", href: "/student" },
    { label: "Textbook", href: "/student/textbook" },
    { label: chapter.title },
  ];

  const episodeSlugs = chapter.episodes.map((e) => e.id);
  const chProg = getChapterProgress(progressMap, chapter.id, episodeSlugs);

  return (
    <PageLayout role="student" breadcrumbItems={breadcrumbs}>
      <div className="max-w-4xl mx-auto">

        {/* Chapter Header */}
        <div className="rounded-2xl p-6 mb-8 text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${chapter.color}, ${chapter.color}cc)` }}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
          <div className="relative">
            <div className="text-white/70 text-sm font-medium mb-1">Chapter {chapter.number}</div>
            <h1 className="text-2xl font-bold mb-2">{chapter.title}</h1>
            <p className="text-white/80 text-sm">{chapter.subtitle}</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-white/70">
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {chapter.periods} periods</span>
              <span className="flex items-center gap-1"><Sparkles className="h-4 w-4" /> {chapter.episodes.length} episodes</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> {chProg.completed}/{chProg.total} done</span>
            </div>
            {chProg.total > 0 && (
              <div className="mt-3 h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full bg-white/90 transition-all" style={{ width: `${chProg.pct}%` }} />
              </div>
            )}
          </div>
        </div>

        {/* Resume CTA */}
        {chProg.resumeEpisodeSlug && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-accent/30 bg-accent/5 p-4">
            <div className="flex items-center gap-3 min-w-0">
              <PlayCircle className="h-5 w-5 text-accent shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground">
                  {chProg.hasInProgress ? "Pick up where you left off" : "Continue your journey"}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {chapter.episodes.find((e) => e.id === chProg.resumeEpisodeSlug)?.title}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => navigate(`/student/textbook/${chapterId}/${chProg.resumeEpisodeSlug}`)}
            >
              Resume
            </Button>
          </div>
        )}

        {/* Episodes */}
        <div className="space-y-3">
          {chapter.episodes.map((episode) => {
            const { status, pct } = getEpisodeStatus(progressMap, chapter.id, episode.id);
            const isDone = status === "completed";
            const isInProg = status === "in-progress";
            return (
              <button
                key={episode.id}
                onClick={() => navigate(`/student/textbook/${chapterId}/${episode.id}`)}
                className={`w-full text-left rounded-xl border bg-card p-5 hover:shadow-md transition-all group ${
                  isDone ? "border-success/30" : isInProg ? "border-accent/40" : "hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="h-11 w-11 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 relative"
                    style={{ backgroundColor: chapter.color }}
                  >
                    {episode.number}
                    {isDone && (
                      <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-success flex items-center justify-center border-2 border-card">
                        <CheckCircle2 className="h-3 w-3 text-success-foreground" />
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{episode.title}</h3>
                      {isDone && (
                        <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Completed
                        </span>
                      )}
                      {isInProg && (
                        <span className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                          <PlayCircle className="h-3 w-3" /> Resume
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{episode.subtitle}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {episode.duration}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                        {typeIcons[episode.type] || "📖"} {episode.type}
                      </span>
                    </div>
                    {isInProg && (
                      <div className="mt-2">
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    )}
                  </div>
                  <div className="shrink-0">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors ${
                      isDone ? "bg-success/10 text-success" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
                    }`}>
                      {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
};

export default TextbookChapter;
