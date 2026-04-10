import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChapterEpisodes, useEpisodeBlocks } from "@/hooks/useTextbookData";
import FullTextbookView from "@/components/textbook/FullTextbookView";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Zap } from "lucide-react";

const TextbookReference = () => {
  const { chapterId, episodeId } = useParams();
  const navigate = useNavigate();
  const [jeeMode, setJeeMode] = useState(false);

  const { data: chapter, isLoading: chapterLoading } = useChapterEpisodes(chapterId);
  const { data: dbBlocks, isLoading: blocksLoading } = useEpisodeBlocks(chapterId, episodeId, jeeMode ? "all" : "board");

  const episode = chapter?.episodes.find((e) => e.id === episodeId);
  const blocks = dbBlocks && dbBlocks.length > 0 ? dbBlocks : (episode?.blocks || []);
  const isLoading = chapterLoading || blocksLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md px-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-64" />
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!chapter || !episode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Episode not found.</p>
          <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Simple header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{chapter.title}</p>
          <h1 className="text-sm font-bold text-foreground">{episode.title} — Textbook Reference</h1>
        </div>

        {/* JEE Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Board</span>
          <Switch
            checked={jeeMode}
            onCheckedChange={setJeeMode}
            className="data-[state=checked]:bg-amber-500"
          />
          <span className={`text-xs font-medium flex items-center gap-1 ${jeeMode ? "text-amber-600" : "text-muted-foreground"}`}>
            <Zap className="h-3 w-3" /> JEE
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-8">
        <FullTextbookView blocks={blocks} chapterTitle={chapter.title} episodeTitle={episode.title} />
      </div>
    </div>
  );
};

export default TextbookReference;
