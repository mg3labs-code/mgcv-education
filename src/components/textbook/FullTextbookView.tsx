import { useRef } from "react";
import { ContentBlock, ConceptContent, RecallContent, ExplainContent, AssessmentContent, ExerciseContent, ReasoningContent, AssumptionsContent, ConnectionsContent, ApplicationContent, ImplicationsContent, VisualAidContent } from "@/data/textbookData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen } from "lucide-react";

import { ConceptBlock, ActivityBlock, RecallBlock, ExplainBlock, AssessmentBlock, ExerciseBlock, blockSubtitles, layerMeta, type ActivityContent } from "@/components/textbook/EpisodeBlocks";
import ReasoningBlock from "@/components/textbook/ReasoningBlock";
import AssumptionsBlock from "@/components/textbook/AssumptionsBlock";
import ConnectionsBlock from "@/components/textbook/ConnectionsBlock";
import ApplicationBlock from "@/components/textbook/ApplicationBlock";
import ImplicationsBlock from "@/components/textbook/ImplicationsBlock";
import BilingualConceptBlock from "@/components/textbook/BilingualConceptBlock";
import VocabularyCardBlock from "@/components/textbook/VocabularyCardBlock";
import GrammarPatternBlock from "@/components/textbook/GrammarPatternBlock";
import StoryReadingBlock from "@/components/textbook/StoryReadingBlock";
import VisualAidBlock from "@/components/textbook/VisualAidBlock";

interface FullTextbookViewProps {
  blocks?: ContentBlock[];
  chapterTitle?: string;
  episodeTitle?: string;
}

const defaultMeta = { border: "border-l-primary", bg: "", dotColor: "bg-primary", badge: undefined, badgeColor: undefined } as const;

const FullTextbookView = ({ blocks = [], chapterTitle, episodeTitle }: FullTextbookViewProps) => {
  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const scrollTo = (index: number) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case "concept": return <ConceptBlock content={block.content as ConceptContent} />;
      case "activity": return <ActivityBlock content={block.content as ActivityContent} />;
      case "recall": return <RecallBlock content={block.content as RecallContent} />;
      case "explain": return <ExplainBlock content={block.content as ExplainContent} />;
      case "assessment": return <AssessmentBlock content={block.content as AssessmentContent} />;
      case "exercise": return <ExerciseBlock content={block.content as ExerciseContent} />;
      case "reasoning": return <ReasoningBlock content={block.content as ReasoningContent} />;
      case "assumptions": return <AssumptionsBlock content={block.content as AssumptionsContent} onStartDefense={() => {}} />;
      case "connections": return <ConnectionsBlock content={block.content as ConnectionsContent} />;
      case "application": return <ApplicationBlock content={block.content as ApplicationContent} />;
      case "implications": return <ImplicationsBlock content={block.content as ImplicationsContent} />;
      case "visual_aid": return <VisualAidBlock content={block.content as VisualAidContent} />;
      case "bilingual_concept": return <BilingualConceptBlock content={block.content as any} subjectName="Telugu" />;
      case "vocabulary": return <VocabularyCardBlock content={block.content as any} subjectName="Telugu" />;
      case "grammar_pattern": return <GrammarPatternBlock content={block.content as any} />;
      case "story_reading": return <StoryReadingBlock content={block.content as any} subjectName="Telugu" />;
      default: return null;
    }
  };

  if (!blocks.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center space-y-2">
          <BookOpen className="h-10 w-10 mx-auto opacity-40" />
          <p className="text-sm">No textbook content available for this episode yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      {(chapterTitle || episodeTitle) && (
        <div className="mb-6">
          {chapterTitle && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{chapterTitle}</p>}
          {episodeTitle && <h1 className="text-xl font-bold text-foreground mt-1" style={{ fontFamily: "'Source Serif 4', serif" }}>{episodeTitle}</h1>}
        </div>
      )}

      {/* Floating TOC pills */}
      <div className="flex flex-wrap gap-2 mb-8 sticky top-0 z-10 bg-[#F9FAFB] py-3 -mx-2 px-2">
        {blocks.map((block, i) => {
          const meta = layerMeta[block.type] || defaultMeta;
          return (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:shadow-sm"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              <span className={`h-2 w-2 rounded-full ${meta.dotColor}`} />
              <span className="text-muted-foreground">{block.icon || ""} {(block.title || block.type).slice(0, 20)}</span>
            </button>
          );
        })}
      </div>

      {/* Content sections — continuous scroll */}
      <div className="space-y-8">
        {blocks.map((block, i) => {
          const meta = layerMeta[block.type] || defaultMeta;
          return (
            <div
              key={i}
              ref={(el) => { sectionRefs.current[i] = el; }}
              className="scroll-mt-16"
            >
              {/* Section header */}
              <div className="flex items-center gap-3 mb-3">
                {meta.badge && (
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${meta.badgeColor || ""}`}>
                    {meta.badge}
                  </span>
                )}
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Source Serif 4', serif" }}>
                    {block.icon} {block.title}
                  </h2>
                  <p className="text-xs text-muted-foreground italic">{blockSubtitles[block.type] || ""}</p>
                </div>
              </div>

              {/* Block content with colored left border */}
              <div className={`bg-card rounded-xl border-l-4 ${meta.border} shadow-sm`}>
                <div className="p-5">
                  {renderBlock(block)}
                </div>
              </div>

              {/* Separator */}
              {i < blocks.length - 1 && (
                <div className="mt-8 border-b border-border/40" />
              )}
            </div>
          );
        })}
      </div>

      {/* End marker */}
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">✅ End of episode content</p>
      </div>
    </div>
  );
};

export default FullTextbookView;
