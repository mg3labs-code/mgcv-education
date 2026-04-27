import { useRef, useState, useEffect } from "react";
import { ContentBlock, ConceptContent, RecallContent, ExplainContent, AssessmentContent, ExerciseContent, ReasoningContent, AssumptionsContent, ConnectionsContent, ApplicationContent, ImplicationsContent, VisualAidContent } from "@/data/textbookData";
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
  const [activeIndex, setActiveIndex] = useState(0);

  // Track active section on scroll
  useEffect(() => {
    if (!blocks.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-section-index"));
            if (!isNaN(idx)) setActiveIndex(idx);
          }
        });
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0.1 }
    );
    Object.entries(sectionRefs.current).forEach(([_, el]) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [blocks.length]);

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
    <div className="max-w-3xl mx-auto px-1 sm:px-0">
      {/* Header */}
      {(chapterTitle || episodeTitle) && (
        <div className="mb-6">
          {chapterTitle && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{chapterTitle}</p>}
          {episodeTitle && <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-1 leading-tight" style={{ fontFamily: "'Source Serif 4', serif" }}>{episodeTitle}</h1>}
        </div>
      )}

      {/* Floating TOC pills with active tracking */}
      <div className="flex gap-2 mb-8 sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-3 -mx-2 px-2 border-b border-border/30 overflow-x-auto scrollbar-hide">
        {blocks.map((block, i) => {
          const meta = layerMeta[block.type] || defaultMeta;
          const isActive = activeIndex === i;
          return (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`flex min-w-[7.5rem] items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border transition-all hover:shadow-sm ${
                isActive
                  ? "border-primary bg-primary/10 text-primary shadow-sm scale-105"
                  : "border-border/60 text-muted-foreground hover:border-primary/40"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isActive ? "bg-primary" : meta.dotColor}`} />
              <span>{block.icon || ""} {(block.title || block.type).slice(0, 20)}</span>
            </button>
          );
        })}
      </div>

      {/* Content sections — continuous scroll */}
      <div className="space-y-12">
        {blocks.map((block, i) => {
          const meta = layerMeta[block.type] || defaultMeta;
          return (
            <div
              key={i}
              ref={(el) => { sectionRefs.current[i] = el; }}
              data-section-index={i}
              className="scroll-mt-20"
            >
              {/* Section header with gradient accent */}
              <div className="flex items-center gap-3 mb-4">
                {meta.badge && (
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${meta.badgeColor || ""}`}>
                    {meta.badge}
                  </span>
                )}
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight" style={{ fontFamily: "'Source Serif 4', serif" }}>
                    {block.icon} {block.title}
                  </h2>
                  <p className="text-xs text-muted-foreground italic">{blockSubtitles[block.type] || ""}</p>
                </div>
              </div>

              {/* Block content with colored left border */}
              <div className={`bg-card rounded-xl border-l-4 ${meta.border} shadow-sm border border-border/30`}>
                <div className="p-5 md:p-7 text-base leading-7">
                  {renderBlock(block)}
                </div>
              </div>

              {/* Gradient separator */}
              {i < blocks.length - 1 && (
                <div className="mt-10 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              )}
            </div>
          );
        })}
      </div>

      {/* End marker */}
      <div className="text-center py-12 text-muted-foreground">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
          ✅ End of episode content
        </div>
      </div>
    </div>
  );
};

export default FullTextbookView;
