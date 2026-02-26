import { useSearchParams, useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { findTextbookMatch } from "@/data/topicTextbookMap";
import { chapters } from "@/data/textbookData";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft, ExternalLink } from "lucide-react";

const StudentDeepDive = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const topic = searchParams.get("topic") || "";
  const subject = searchParams.get("subject") || "Mathematics";
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const match = findTextbookMatch(topic);

  // Find the chapter and episode details
  const chapter = match ? chapters.find((c) => c.id === match.chapterId) : null;
  const episode = chapter && match?.episodeId
    ? chapter.episodes.find((ep) => ep.id === match.episodeId)
    : null;

  return (
    <PageLayout role="student">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/student")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Button>

        <div className="bg-card rounded-2xl border p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">🔍 Deep Dive</h1>
              <p className="text-sm text-muted-foreground">{subject} · {date}</p>
            </div>
          </div>
          <div className="bg-muted/50 rounded-xl p-4 mt-3">
            <p className="text-sm text-muted-foreground">Today's Topic</p>
            <p className="text-lg font-semibold text-foreground">{topic || "No topic specified"}</p>
          </div>
        </div>

        {/* Textbook Match */}
        {match && chapter ? (
          <div className="bg-card rounded-2xl border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">📚 Textbook Episode</h2>

            <div className="bg-muted/30 rounded-xl p-4 border">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: chapter.color }}
                >
                  {chapter.number}
                </div>
                <div>
                  <p className="font-semibold text-foreground">Ch {chapter.number}: {chapter.title}</p>
                  <p className="text-sm text-muted-foreground">{match.episodeTitle}</p>
                </div>
              </div>

              {episode && (
                <div className="mt-3 text-sm text-muted-foreground">
                  <p>📖 {episode.blocks.length} interactive blocks · {episode.duration} · {episode.type}</p>
                </div>
              )}

              {episode ? (
                <Button
                  className="mt-4 w-full"
                  onClick={() => navigate(`/student/textbook/${match.chapterId}/${match.episodeId}`)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Episode in Textbook
                </Button>
              ) : (
                <div className="mt-4 text-center py-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">🔒 This episode is coming soon</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">📚 Textbook Match</h2>
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-sm">No matching textbook episode found for "{topic}"</p>
              <p className="text-xs mt-1">Episodes will be linked as more content is added.</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate("/student/textbook")}>
                Browse All Chapters
              </Button>
            </div>
          </div>
        )}

        {/* Episode blocks preview */}
        {episode && (
          <div className="bg-card rounded-2xl border p-6">
            <h2 className="text-lg font-semibold mb-4">🧩 What's Inside This Episode</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {episode.blocks.map((block, i) => (
                <div key={i} className="bg-muted/50 rounded-xl p-3 text-center border">
                  <span className="text-xl">{block.icon}</span>
                  <p className="text-xs font-medium text-foreground mt-1 capitalize">{block.type}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{block.title}</p>
                </div>
              ))}
            </div>
            <Button
              className="mt-4 w-full"
              variant="outline"
              onClick={() => navigate(`/student/textbook/${match!.chapterId}/${match!.episodeId}`)}
            >
              Start Learning →
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default StudentDeepDive;
