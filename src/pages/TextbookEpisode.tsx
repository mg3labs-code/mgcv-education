import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { ContentBlock, ConceptContent, ActivityContent, RecallContent, ExplainContent, AssessmentContent, ExerciseContent, ReasoningContent, AssumptionsContent, ConnectionsContent, ApplicationContent, ImplicationsContent } from "@/data/textbookData";
import { useChapterEpisodes, useEpisodeBlocks } from "@/hooks/useTextbookData";
import { ArrowLeft, BookOpen, Brain, Briefcase, CheckCircle2, Compass, Eye, Layers, Lightbulb, Link, Map, MessageSquare, Mic, PenLine, Search, Shield, Sparkles, Zap, RotateCcw, GripHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import VoiceExplainWidget from "@/components/textbook/VoiceExplainWidget";
import ReasoningBlock from "@/components/textbook/ReasoningBlock";
import AssumptionsBlock from "@/components/textbook/AssumptionsBlock";
import ConnectionsBlock from "@/components/textbook/ConnectionsBlock";
import ApplicationBlock from "@/components/textbook/ApplicationBlock";
import ImplicationsBlock from "@/components/textbook/ImplicationsBlock";
import TutorialDefenseModal from "@/components/textbook/TutorialDefenseModal";
import FirstPrinciplesModal from "@/components/textbook/FirstPrinciplesModal";

// ─── Block Renderers ────────────────────────────────────────

const ConceptBlock = ({ content }: { content: ConceptContent }) => (
  <div className="space-y-5">
    {content.sections.map((s, i) => (
      <div key={i}>
        <h4 className="font-semibold text-foreground text-[1.1rem] mb-2">{s.heading}</h4>
        <div className="text-[0.95rem] text-muted-foreground leading-[1.8] whitespace-pre-line">{s.body}</div>
      </div>
    ))}
    {content.keyFormulas && content.keyFormulas.length > 0 && (
      <div className="rounded-lg bg-muted/40 border-2 border-primary/30 p-5 text-center">
        <h4 className="text-sm font-semibold text-primary mb-3 flex items-center justify-center gap-2">
          🎯 Key Formulas
        </h4>
        {content.keyFormulas.map((f, i) => (
          <div key={i} className="font-mono text-lg font-semibold text-foreground mt-2">{f}</div>
        ))}
      </div>
    )}
    {content.example && content.example.map((ex, i) => (
      <div key={i} className="rounded-lg border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20 p-5">
        <h4 className="text-green-700 dark:text-green-400 font-semibold mb-2 flex items-center gap-2">🎯 {ex.question}</h4>
        <p className="text-[0.95rem] text-muted-foreground leading-[1.8] whitespace-pre-line">{ex.solution}</p>
      </div>
    ))}
  </div>
);

// ─── Drag & Drop Activity Block ─────────────────────────────

const DragDropActivityBlock = ({ content }: { content: ActivityContent }) => {
  const [placements, setPlacements] = useState<Record<string, string[]>>({});
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, Record<string, "correct" | "wrong">>>({});

  const categories = content.categories || [];
  const items = content.items || [];

  // Items not yet placed anywhere
  const availableItems = items.filter(item =>
    !Object.values(placements).flat().includes(item.value) || 
    // Allow items in multiple zones
    true
  );

  const handleDragStart = (e: React.DragEvent, value: string) => {
    setDragItem(value);
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", value);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    const value = e.dataTransfer.getData("text/plain");
    if (!value) return;

    const item = items.find(i => i.value === value);
    if (!item) return;

    // Check if already in this category
    if (placements[categoryId]?.includes(value)) return;

    const isCorrect = item.categories?.includes(categoryId);

    setPlacements(prev => ({
      ...prev,
      [categoryId]: [...(prev[categoryId] || []), value],
    }));

    setFeedback(prev => ({
      ...prev,
      [categoryId]: {
        ...(prev[categoryId] || {}),
        [value]: isCorrect ? "correct" : "wrong",
      },
    }));

    setDragItem(null);
  };

  const handleReset = () => {
    setPlacements({});
    setFeedback({});
  };

  const totalPlaced = Object.values(placements).flat().length;
  const totalCorrect = Object.values(feedback).flatMap(f => Object.values(f)).filter(v => v === "correct").length;

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
        <p className="text-base font-medium text-foreground leading-relaxed">{content.instruction}</p>
      </div>

      {/* Draggable chips */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Drag these numbers</p>
        <div className="flex flex-wrap gap-3">
          {items.map((item) => (
            <div
              key={item.value}
              draggable
              onDragStart={(e) => handleDragStart(e, item.value)}
              className="px-5 py-2.5 rounded-full bg-card border-2 border-border text-foreground font-semibold text-base cursor-grab active:cursor-grabbing hover:border-primary hover:shadow-md transition-all select-none flex items-center gap-2"
            >
              <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              {item.value}
            </div>
          ))}
        </div>
      </div>

      {/* Drop zones */}
      <div className="grid grid-cols-2 gap-4">
        {categories.map((cat) => {
          const catPlacements = placements[cat.id] || [];
          const catFeedback = feedback[cat.id] || {};

          return (
            <div
              key={cat.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, cat.id)}
              className={`rounded-xl border-2 border-dashed p-4 min-h-[120px] transition-all ${
                dragItem ? "border-primary/60 bg-primary/5" : "border-border bg-muted/20"
              }`}
            >
              <div className="mb-3">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">{cat.id}</span>
                <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {catPlacements.length === 0 && (
                  <p className="text-xs text-muted-foreground/50 italic">Drop numbers here…</p>
                )}
                {catPlacements.map((val) => (
                  <span
                    key={val}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                      catFeedback[val] === "correct"
                        ? "bg-green-50 border-green-400 text-green-800"
                        : catFeedback[val] === "wrong"
                        ? "bg-red-50 border-red-400 text-red-800 line-through"
                        : "bg-card border-border text-foreground"
                    }`}
                  >
                    {val} {catFeedback[val] === "correct" ? "✓" : catFeedback[val] === "wrong" ? "✗" : ""}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats & Reset */}
      {totalPlaced > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {totalCorrect} correct of {totalPlaced} placed
          </span>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
        </div>
      )}
    </div>
  );
};

// Fallback for non-classify activity types
const FallbackActivityBlock = ({ content }: { content: ActivityContent }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
        <p className="text-base font-medium text-foreground leading-relaxed">{content.instruction}</p>
      </div>
      {content.items?.map((item, i) => (
        <div key={i} className="rounded-xl border bg-card p-4">
          <p className="text-base font-medium text-foreground mb-2">({i + 1}) {item.value}</p>
          <textarea className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" rows={2} placeholder="Work it out here..." value={answers[i] || ""} onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })} />
        </div>
      ))}
    </div>
  );
};

const ActivityBlock = ({ content }: { content: ActivityContent }) => {
  if (content.type === "classify" && content.categories && content.items) {
    return <DragDropActivityBlock content={content} />;
  }
  return <FallbackActivityBlock content={content} />;
};

const RecallBlock = ({ content }: { content: RecallContent }) => {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  return (
    <div className="border-2 border-dashed border-amber-400 rounded-lg p-5 bg-amber-50/50 dark:bg-amber-950/10">
      <h4 className="text-amber-600 dark:text-amber-400 font-semibold mb-4 flex items-center gap-2">🧠 Quick Check</h4>
      <div className="space-y-3">
        {content.questions.map((q, i) => (
          <div key={i} className="bg-white dark:bg-card rounded-lg p-4 cursor-pointer hover:bg-amber-50/60 dark:hover:bg-amber-950/20 transition-colors" onClick={() => !revealed[i] && setRevealed({ ...revealed, [i]: true })}>
            <p className="text-[0.95rem] font-medium text-foreground"><strong>Q{i + 1}:</strong> {q.question}</p>
            {q.hint && !revealed[i] && <p className="text-sm text-muted-foreground italic mt-1">💡 Hint: {q.hint}</p>}
            {revealed[i] && (
              <div className="mt-2 p-3 bg-green-100 dark:bg-green-950/30 rounded-md text-green-800 dark:text-green-300 text-[0.95rem]">
                ✓ {q.answer}
              </div>
            )}
            {!revealed[i] && <p className="text-xs text-muted-foreground mt-2">Click to reveal answer</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

const ExplainBlock = ({ content }: { content: ExplainContent }) => {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"text" | "voice">("voice");
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
        <p className="text-base font-medium text-foreground leading-relaxed">{content.prompt}</p>
      </div>
      {content.guidePoints && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">💡 Think about:</p>
          <ul className="space-y-1">
            {content.guidePoints.map((p, i) => (
              <li key={i} className="text-base text-muted-foreground flex items-start gap-2"><span className="text-primary mt-0.5">•</span> {p}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
        <button onClick={() => setMode("voice")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === "voice" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <Mic className="h-3.5 w-3.5" /> Speak It
        </button>
        <button onClick={() => setMode("text")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === "text" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <PenLine className="h-3.5 w-3.5" /> Write It
        </button>
      </div>
      {mode === "voice" ? (
        <VoiceExplainWidget topic="Real Numbers — Chapter 1" prompt={content.prompt} guidePoints={content.guidePoints} onTranscript={(t) => setText(t)} />
      ) : (
        <div>
          <textarea className="w-full rounded-xl border bg-background px-4 py-3 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[120px]" placeholder="Write your explanation here..." value={text} onChange={(e) => setText(e.target.value)} />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted-foreground">{wordCount} words</span>
            {content.wordLimit && <span className={`text-xs ${wordCount > content.wordLimit ? "text-destructive" : "text-muted-foreground"}`}>Limit: {content.wordLimit}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

const AssessmentBlock = ({ content }: { content: AssessmentContent }) => {
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const handleSelect = (qi: number, oi: number) => { if (submitted[qi]) return; setSelected({ ...selected, [qi]: oi }); };
  const handleSubmit = (qi: number) => { setSubmitted({ ...submitted, [qi]: true }); };
  return (
    <div className="space-y-5">
      {content.questions.map((q, qi) => {
        const isSubmitted = submitted[qi];
        const isCorrect = selected[qi] === q.correctIndex;
        return (
          <div key={qi} className="rounded-xl border bg-card p-5">
            <p className="text-base font-medium text-foreground mb-3">Q{qi + 1}. {q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                let optClass = "border bg-background hover:border-primary/40";
                if (selected[qi] === oi && !isSubmitted) optClass = "border-primary bg-primary/5";
                if (isSubmitted && oi === q.correctIndex) optClass = "border-green-500 bg-green-50 dark:bg-green-950/30";
                if (isSubmitted && selected[qi] === oi && oi !== q.correctIndex) optClass = "border-red-500 bg-red-50 dark:bg-red-950/30";
                return (
                  <button key={oi} onClick={() => handleSelect(qi, oi)} className={`w-full text-left rounded-lg px-4 py-3 text-base transition-all flex items-center gap-3 ${optClass}`}>
                    <span className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{String.fromCharCode(65 + oi)}</span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {selected[qi] !== undefined && !isSubmitted && <Button size="sm" className="mt-3" onClick={() => handleSubmit(qi)}>Check Answer</Button>}
            {isSubmitted && (
              <div className={`mt-3 rounded-lg p-3 text-base ${isCorrect ? "bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"}`}>
                <p className="font-medium">{isCorrect ? "✅ Correct!" : "❌ Not quite."}</p>
                <p className="mt-1">{q.explanation}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const ExerciseBlock = ({ content }: { content: ExerciseContent }) => {
  const [showAnswer, setShowAnswer] = useState<Record<number, boolean>>({});
  return (
    <div className="space-y-3">
      <div className="border-l-4 border-blue-500 bg-blue-50/60 dark:bg-blue-950/20 rounded-r-lg px-4 py-3 text-sm text-muted-foreground">📖 {content.source}</div>
      {content.problems.map((p, i) => (
        <div key={i} className="bg-white dark:bg-card rounded-lg border-l-3 border-green-500 p-4 cursor-pointer" onClick={() => !showAnswer[i] && setShowAnswer({ ...showAnswer, [i]: true })}>
          <p className="text-[0.95rem] text-foreground leading-[1.8]"><span className="font-semibold">{p.number}.</span> {p.text}</p>
          {p.answer && (
            <div className="mt-2">
              {showAnswer[i] ? (
                <div className="rounded-md bg-green-100 dark:bg-green-950/30 p-3 text-[0.95rem] text-green-800 dark:text-green-300">✓ Answer: {p.answer}</div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">Click to reveal answer</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Layer Config ───────────────────────────────────────────

const blockIcons: Record<string, React.ElementType> = {
  concept: BookOpen, activity: PenLine, recall: Brain, explain: MessageSquare,
  assessment: CheckCircle2, exercise: Lightbulb, reasoning: Zap, assumptions: Shield,
  connections: Link, application: Briefcase, implications: Compass,
};

const blockLabels: Record<string, string> = {
  concept: "Definition", activity: "Mechanism", recall: "Recall", explain: "Explain",
  assessment: "Test", exercise: "Practice", reasoning: "Reasoning",
  assumptions: "Assumptions", connections: "Connections", application: "Application",
  implications: "Implications",
};

const DEEP_BLOCKS = new Set(["reasoning", "assumptions", "connections", "application", "implications"]);

const layerMeta: Record<string, { border: string; bg: string; badge?: string; badgeColor?: string; dotColor: string }> = {
  concept:     { border: "border-l-blue-600",    bg: "",  badge: "💡 Essential",  badgeColor: "bg-green-500 text-white", dotColor: "bg-blue-600" },
  activity:    { border: "border-l-rose-500",    bg: "",  badge: "📝 Practice",   badgeColor: "bg-amber-500 text-white", dotColor: "bg-rose-500" },
  recall:      { border: "border-l-amber-500",   bg: "",  badge: "🧠 Recall",     badgeColor: "bg-amber-500 text-white", dotColor: "bg-amber-500" },
  explain:     { border: "border-l-purple-500",  bg: "",  badge: "💬 Explain",    badgeColor: "bg-purple-500 text-white", dotColor: "bg-purple-500" },
  assessment:  { border: "border-l-emerald-500", bg: "",  badge: "✅ Test",       badgeColor: "bg-emerald-500 text-white", dotColor: "bg-emerald-500" },
  exercise:    { border: "border-l-cyan-500",    bg: "",  badge: "💪 Practice",   badgeColor: "bg-cyan-600 text-white", dotColor: "bg-cyan-500" },
  reasoning:   { border: "border-l-amber-600",   bg: "",  badge: "⚡ Important",  badgeColor: "bg-amber-500 text-white", dotColor: "bg-amber-600" },
  assumptions: { border: "border-l-sky-500",     bg: "",  badge: "🛡️ Important",  badgeColor: "bg-amber-500 text-white", dotColor: "bg-sky-500" },
  connections: { border: "border-l-emerald-600", bg: "",  badge: "🔗 Essential",  badgeColor: "bg-green-500 text-white", dotColor: "bg-emerald-600" },
  application: { border: "border-l-orange-500",  bg: "",  badge: "🌍 Essential",  badgeColor: "bg-green-500 text-white", dotColor: "bg-orange-500" },
  implications:{ border: "border-l-indigo-500",  bg: "",  badge: "🎓 Advanced",   badgeColor: "bg-red-500 text-white", dotColor: "bg-indigo-500" },
};

// ─── Action Bar Buttons ─────────────────────────────────────

const actionBarButtons = [
  { label: "MINDMAP", icon: Map, gradient: "from-blue-500 to-violet-500" },
  { label: "PRACTICE", icon: PenLine, gradient: "from-rose-500 to-pink-500" },
  { label: "Q BANK", icon: Lightbulb, gradient: "from-emerald-500 to-teal-500" },
  { label: "SEARCH", icon: Search, gradient: "from-gray-400 to-gray-500" },
];

// ─── Main Component ─────────────────────────────────────────

const TextbookEpisode = () => {
  const { chapterId, episodeId } = useParams();
  const navigate = useNavigate();
  const [showDefense, setShowDefense] = useState(false);
  const [showFirstPrinciples, setShowFirstPrinciples] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeBlock, setActiveBlock] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);

  // DB-backed data with fallback
  const { data: chapter, isLoading: chapterLoading } = useChapterEpisodes(chapterId);
  const { data: dbBlocks, isLoading: blocksLoading } = useEpisodeBlocks(chapterId, episodeId);

  const episode = chapter?.episodes.find((e) => e.id === episodeId);
  const blocks = dbBlocks && dbBlocks.length > 0 ? dbBlocks : (episode?.blocks || []);

  const currentEpisodeIndex = chapter?.episodes.findIndex((e) => e.id === episodeId) ?? -1;
  const nextEpisode = chapter?.episodes[currentEpisodeIndex + 1];
  
  const isLoading = chapterLoading || blocksLoading;

  // Scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // IntersectionObserver for active block tracking
  useEffect(() => {
    if (!blocks || blocks.length === 0) return;
    const observers: IntersectionObserver[] = [];
    blockRefs.current.forEach((ref, index) => {
      if (!ref) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveBlock(index);
        },
        { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
      );
      observer.observe(ref);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [blocks]);

  const scrollToBlock = useCallback((index: number) => {
    blockRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToActivity = useCallback(() => {
    const actIdx = blocks.findIndex(b => b.type === "activity");
    if (actIdx >= 0) scrollToBlock(actIdx);
  }, [blocks, scrollToBlock]);

  if (isLoading) {
    return (
      <PageLayout role="student">
        <div className="max-w-3xl mx-auto space-y-4 pt-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-64" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      </PageLayout>
    );
  }

  if (!chapter || !episode) {
    return (
      <PageLayout role="student">
        <div className="text-center py-20">
          <p className="text-muted-foreground">Episode not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/student/textbook")}>Back to Textbook</Button>
        </div>
      </PageLayout>
    );
  }

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case "concept": return <ConceptBlock content={block.content as ConceptContent} />;
      case "activity": return <ActivityBlock content={block.content as ActivityContent} />;
      case "recall": return <RecallBlock content={block.content as RecallContent} />;
      case "explain": return <ExplainBlock content={block.content as ExplainContent} />;
      case "assessment": return <AssessmentBlock content={block.content as AssessmentContent} />;
      case "exercise": return <ExerciseBlock content={block.content as ExerciseContent} />;
      case "reasoning": return <ReasoningBlock content={block.content as ReasoningContent} />;
      case "assumptions": return <AssumptionsBlock content={block.content as AssumptionsContent} onStartDefense={() => setShowDefense(true)} />;
      case "connections": return <ConnectionsBlock content={block.content as ConnectionsContent} />;
      case "application": return <ApplicationBlock content={block.content as ApplicationContent} />;
      case "implications": return <ImplicationsBlock content={block.content as ImplicationsContent} />;
      default: return null;
    }
  };

  const defaultMeta = { border: "border-l-primary", bg: "", dotColor: "bg-primary", badge: undefined, badgeColor: undefined } as const;

  return (
    <PageLayout role="student">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted">
        <div className="h-full bg-primary transition-all duration-150" style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* Floating Layer Sidebar — Desktop only */}
      <div className={`fixed top-1/2 -translate-y-1/2 z-40 transition-all duration-300 hidden lg:block ${sidebarOpen ? "left-4" : "-left-1"}`}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-8 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          title={sidebarOpen ? "Hide navigation" : "Show navigation"}
        >
          {sidebarOpen ? <ArrowLeft className="h-3.5 w-3.5" /> : <Layers className="h-3.5 w-3.5" />}
        </button>

        {sidebarOpen && (
          <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-lg p-3 w-44">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">Layers</p>
            <div className="space-y-0.5">
              {blocks.map((block, i) => {
                const meta = layerMeta[block.type] || defaultMeta;
                const BlockIcon = blockIcons[block.type] || BookOpen;
                const isActive = i === activeBlock;
                const isPast = i < activeBlock;

                return (
                  <button
                    key={i}
                    onClick={() => scrollToBlock(i)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all text-xs ${
                      isActive
                        ? "bg-primary/10 text-foreground font-medium"
                        : isPast
                        ? "text-muted-foreground/70"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full shrink-0 transition-all ${isActive ? meta.dotColor + " scale-125" : isPast ? "bg-primary/30" : "bg-border"}`} />
                    <BlockIcon className="h-3 w-3 shrink-0" />
                    <span className="truncate">{blockLabels[block.type] || block.type}</span>
                    {isActive && <span className="ml-auto h-1 w-1 rounded-full bg-primary animate-pulse" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto" ref={contentRef}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 to-indigo-800 rounded-2xl text-white p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigate(`/student/textbook/${chapterId}`)} className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" /> {chapter.title}
            </button>
            <span className="text-xs text-white/60 bg-white/10 px-3 py-1 rounded-full">⏱️ {episode.duration}</span>
          </div>
          <h1 className="text-2xl font-light text-white">{episode.title}</h1>
          {episode.subtitle && <p className="text-sm text-white/70 mt-1">{episode.subtitle}</p>}
        </div>

        {/* Stats Bar */}
        <div className="flex justify-between bg-muted/50 rounded-xl p-4 mb-6">
          <div className="text-center">
            <div className="text-xl font-bold text-primary">{blocks.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Total Sections</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-primary">0</div>
            <div className="text-xs text-muted-foreground mt-0.5">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-primary">{episode.duration}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Estimated Time</div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {actionBarButtons.map((btn) => (
            <button
              key={btn.label}
              onClick={btn.label === "PRACTICE" ? scrollToActivity : undefined}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r ${btn.gradient} shadow-sm hover:shadow-md hover:scale-105 transition-all`}
            >
              <btn.icon className="h-3.5 w-3.5" />
              {btn.label}
            </button>
          ))}
        </div>

        {/* All Blocks */}
        <div className="space-y-0">
          {blocks.map((block, i) => {
            const meta = layerMeta[block.type] || defaultMeta;
            const BlockIcon = blockIcons[block.type] || BookOpen;
            const isDeep = DEEP_BLOCKS.has(block.type);
            const isFirstDeep = isDeep && !blocks.slice(0, i).some(b => DEEP_BLOCKS.has(b.type));

            return (
              <React.Fragment key={i}>
                {/* Deep Mastery Divider */}
                {isFirstDeep && (
                  <div className="flex items-center gap-3 my-8 px-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      🧠 Deep Mastery Layers
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}

                <div
                  ref={(el) => { blockRefs.current[i] = el; }}
                  className={`bg-white dark:bg-card rounded-xl p-5 mb-5 scroll-mt-24 shadow-sm hover:shadow-md transition-all border-l-4 ${(meta as any).border || "border-l-primary"} hover:-translate-y-0.5`}
                >
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{block.icon}</span>
                      <h2 className="text-[1.2rem] font-semibold text-foreground">{block.title}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      {meta.badge && (
                        <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${meta.badgeColor || ""}`}>
                          {meta.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Block Content */}
                  {renderBlock(block)}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Completion Actions */}
        <div className="mt-10 mb-8 rounded-2xl bg-muted/50 border border-border p-8 text-center">
          <h2 className="text-2xl font-bold font-serif text-foreground mb-2">🎉 Episode Complete!</h2>
          <p className="text-base text-muted-foreground mb-8">Choose your next step to deepen understanding</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <button onClick={() => setShowDefense(true)} className="bg-card border-2 border-border hover:border-primary rounded-xl p-6 text-center transition-all hover:-translate-y-1">
              <div className="text-4xl mb-3">🎓</div>
              <h3 className="font-bold font-serif text-foreground mb-1">Tutorial Defense</h3>
              <p className="text-xs text-muted-foreground">Oxford-style challenge · 5 min</p>
            </button>

            <button onClick={() => setShowFirstPrinciples(true)} className="bg-card border-2 border-border hover:border-primary rounded-xl p-6 text-center transition-all hover:-translate-y-1">
              <div className="text-4xl mb-3">💡</div>
              <h3 className="font-bold font-serif text-foreground mb-1">First Principles</h3>
              <p className="text-xs text-muted-foreground">Strip & rebuild · 10 min</p>
            </button>

            <button onClick={() => navigate("/student/dashboard")} className="bg-card border-2 border-border hover:border-primary rounded-xl p-6 text-center transition-all hover:-translate-y-1">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="font-bold font-serif text-foreground mb-1">View Growth</h3>
              <p className="text-xs text-muted-foreground">See your progress</p>
            </button>
          </div>

          {nextEpisode ? (
            <Button size="lg" onClick={() => { navigate(`/student/textbook/${chapterId}/${nextEpisode.id}`); window.scrollTo(0, 0); }} className="text-base px-8">
              Continue to Episode {nextEpisode.number}: {nextEpisode.title} →
            </Button>
          ) : (
            <Button size="lg" onClick={() => navigate(`/student/textbook/${chapterId}`)} className="bg-green-600 hover:bg-green-700 text-white text-base px-8">
              <CheckCircle2 className="h-5 w-5 mr-2" /> Complete Chapter
            </Button>
          )}
        </div>
      </div>

      {/* Modals */}
      <TutorialDefenseModal open={showDefense} onOpenChange={setShowDefense} topic={episode.title} episodeTitle={`${chapter.title} — ${episode.title}`} subject={chapter.title} chapterId={chapterId} episodeId={episodeId} />
      <FirstPrinciplesModal open={showFirstPrinciples} onOpenChange={setShowFirstPrinciples} topic={episode.title} episodeTitle={`${chapter.title} — ${episode.title}`} subject={chapter.title} chapterId={chapterId} episodeId={episodeId} />
    </PageLayout>
  );
};

export default TextbookEpisode;
