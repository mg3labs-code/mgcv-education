import { useNavigate, useParams } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { useChapterEpisodes } from "@/hooks/useTextbookData";
import { Play, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  if (isLoading) {
    return (
      <PageLayout role="student">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
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

  return (
    <PageLayout role="student">
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate("/student/textbook")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> All Chapters
        </button>

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
            </div>
          </div>
        </div>

        {/* Episodes */}
        <div className="space-y-3">
          {chapter.episodes.map((episode) => (
            <button
              key={episode.id}
              onClick={() => navigate(`/student/textbook/${chapterId}/${episode.id}`)}
              className="w-full text-left rounded-xl border bg-card p-5 hover:shadow-md hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div
                  className="h-11 w-11 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                  style={{ backgroundColor: chapter.color }}
                >
                  {episode.number}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{episode.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{episode.subtitle}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {episode.duration}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                      {typeIcons[episode.type] || "📖"} {episode.type}
                    </span>
                    <span>{episode.blocks.length} blocks</span>
                  </div>
                </div>
                <div className="shrink-0">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                    <Play className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default TextbookChapter;
