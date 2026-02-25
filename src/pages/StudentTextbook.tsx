import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { chapters } from "@/data/textbookData";
import { BookOpen, Clock, FileText, Lock, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const StudentTextbook = () => {
  const navigate = useNavigate();

  return (
    <PageLayout role="student">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">📚 My Textbook</h1>
              <p className="text-sm text-muted-foreground">Class X Mathematics · Telangana State Board</p>
            </div>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            Every chapter transformed into bite-sized episodes. Read, interact, recall & master — at your own pace.
          </p>
        </div>

        {/* Chapter Grid */}
        <div className="space-y-3">
          {chapters.map((chapter) => {
            const hasEpisodes = chapter.episodes.length > 0;
            const episodeCount = chapter.episodes.length;

            return (
              <button
                key={chapter.id}
                onClick={() => hasEpisodes && navigate(`/student/textbook/${chapter.id}`)}
                disabled={!hasEpisodes}
                className={`w-full text-left rounded-xl border p-5 transition-all group ${
                  hasEpisodes
                    ? "bg-card hover:shadow-md hover:border-primary/30 cursor-pointer"
                    : "bg-muted/30 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Chapter Number */}
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ backgroundColor: chapter.color }}
                  >
                    {chapter.number}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">{chapter.title}</h3>
                      {!hasEpisodes && (
                        <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                          <Lock className="h-3 w-3" /> Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{chapter.subtitle}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {chapter.periods} periods
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Pages {chapter.pageRange}
                      </span>
                      {hasEpisodes && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" /> {episodeCount} episodes
                        </span>
                      )}
                    </div>
                    {hasEpisodes && (
                      <div className="mt-2">
                        <Progress value={0} className="h-1.5" />
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  {hasEpisodes && (
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
};

export default StudentTextbook;
