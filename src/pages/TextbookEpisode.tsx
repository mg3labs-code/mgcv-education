import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { ContentBlock, ConceptContent, ActivityContent, RecallContent, ExplainContent, AssessmentContent, ExerciseContent, ReasoningContent, AssumptionsContent, ConnectionsContent, ApplicationContent, ImplicationsContent, VisualAidContent } from "@/data/textbookData";
import { useChapterEpisodes, useEpisodeBlocks } from "@/hooks/useTextbookData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, BookOpen, Brain, Briefcase, Check, CheckCircle2, ChevronDown, Cloud, Compass, Eye, Image, Layers, Lightbulb, Link, Map, MessageSquare, Mic, PenLine, Search, Shield, Sparkles, Zap, RotateCcw, GripHorizontal } from "lucide-react";
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
import BilingualConceptBlock from "@/components/textbook/BilingualConceptBlock";
import VocabularyCardBlock from "@/components/textbook/VocabularyCardBlock";
import GrammarPatternBlock from "@/components/textbook/GrammarPatternBlock";
import StoryReadingBlock from "@/components/textbook/StoryReadingBlock";
import LanguageProgressWidget from "@/components/textbook/LanguageProgressWidget";
import VisualAidBlock from "@/components/textbook/VisualAidBlock";
import InlineMedia from "@/components/textbook/InlineMedia";

const LANGUAGE_SUBJECTS = new Set(["Telugu", "Hindi"]);

const getSubjectFromSlug = (slug?: string): string | null => {
  if (!slug) return null;
  if (slug.startsWith("tel-")) return "Telugu";
  if (slug.startsWith("hindi-")) return "Hindi";
  return null;
};

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
  connections: Link, application: Briefcase, implications: Compass, visual_aid: Image,
};

const blockLabels: Record<string, string> = {
  concept: "What's the big idea?", activity: "Try it yourself!", recall: "Can you remember?",
  explain: "Teach your friend", assessment: "Prove it!", exercise: "Level up",
  reasoning: "But WHY though?", assumptions: "What if we're wrong?",
  connections: "Where else does this hide?", application: "Use it in real life",
  implications: "What does this change?", visual_aid: "See it in action",
};

const blockSubtitles: Record<string, string> = {
  concept: "The core idea, made simple",
  activity: "Get your hands dirty",
  exercise: "Practice makes permanent",
  recall: "No peeking allowed!",
  assessment: "Show what you really know",
  explain: "If you can explain it, you own it",
  reasoning: "The reason behind the rule",
  assumptions: "Challenge what everyone assumes",
  connections: "Surprising links you didn't expect",
  application: "How the real world uses this",
  implications: "How this idea shapes tomorrow",
  bilingual_concept: "Read in both languages side-by-side",
  story_reading: "A story to read and understand",
  vocabulary: "New words to master today",
  grammar_pattern: "Spot the pattern in the language",
  visual_aid: "A picture is worth a thousand words",
};

const DEEP_BLOCKS = new Set(["reasoning", "assumptions", "connections", "application", "implications"]);
const DISCOVER_BLOCKS = new Set(["concept", "activity", "exercise", "visual_aid"]);
const PROVE_BLOCKS = new Set(["recall", "assessment", "explain"]);

const layerMeta: Record<string, { border: string; bg: string; badge?: string; badgeColor?: string; dotColor: string }> = {
  concept:     { border: "border-l-blue-600",    bg: "",  badge: "🔍 Discover",     badgeColor: "bg-amber-500 text-white", dotColor: "bg-blue-600" },
  activity:    { border: "border-l-rose-500",    bg: "",  badge: "🎮 Play",         badgeColor: "bg-rose-500 text-white", dotColor: "bg-rose-500" },
  recall:      { border: "border-l-amber-500",   bg: "",  badge: "🧩 Challenge",    badgeColor: "bg-amber-500 text-white", dotColor: "bg-amber-500" },
  explain:     { border: "border-l-purple-500",  bg: "",  badge: "🗣️ Your Turn",    badgeColor: "bg-purple-500 text-white", dotColor: "bg-purple-500" },
  assessment:  { border: "border-l-emerald-500", bg: "",  badge: "🏆 Quiz Time",    badgeColor: "bg-emerald-500 text-white", dotColor: "bg-emerald-500" },
  exercise:    { border: "border-l-cyan-500",    bg: "",  badge: "💪 Workout",      badgeColor: "bg-cyan-600 text-white", dotColor: "bg-cyan-500" },
  reasoning:   { border: "border-l-amber-600",   bg: "",  badge: "🤔 Think Deeper", badgeColor: "bg-amber-600 text-white", dotColor: "bg-amber-600" },
  assumptions: { border: "border-l-sky-500",     bg: "",  badge: "🕵️ Investigate",  badgeColor: "bg-sky-500 text-white", dotColor: "bg-sky-500" },
  connections: { border: "border-l-emerald-600", bg: "",  badge: "🌐 Connect",      badgeColor: "bg-emerald-600 text-white", dotColor: "bg-emerald-600" },
  application: { border: "border-l-orange-500",  bg: "",  badge: "🚀 Apply",        badgeColor: "bg-orange-500 text-white", dotColor: "bg-orange-500" },
  implications:{ border: "border-l-indigo-500",  bg: "",  badge: "🔮 Imagine",      badgeColor: "bg-indigo-500 text-white", dotColor: "bg-indigo-500" },
  visual_aid:  { border: "border-l-pink-500",    bg: "",  badge: "🖼️ Visual",     badgeColor: "bg-pink-500 text-white", dotColor: "bg-pink-500" },
  // Language-native block types
  bilingual_concept: { border: "border-l-blue-600",    bg: "",  badge: "📖 Read",       badgeColor: "bg-blue-500 text-white", dotColor: "bg-blue-600" },
  story_reading:     { border: "border-l-rose-500",    bg: "",  badge: "📚 Story",      badgeColor: "bg-rose-500 text-white", dotColor: "bg-rose-500" },
  vocabulary:        { border: "border-l-amber-500",   bg: "",  badge: "🔤 Words",      badgeColor: "bg-amber-500 text-white", dotColor: "bg-amber-500" },
  grammar_pattern:   { border: "border-l-emerald-500", bg: "",  badge: "🧩 Grammar",    badgeColor: "bg-emerald-500 text-white", dotColor: "bg-emerald-500" },
};

// Phase config — STEM default
const stemPhases = [
  { id: "discover", label: "🔍 Discover & Explore", subtitle: "Learn the big ideas and try them out", className: "phase-discover", blockSet: DISCOVER_BLOCKS },
  { id: "prove", label: "🧩 Prove You Know It", subtitle: "Test yourself — can you recall, explain & apply?", className: "phase-prove", blockSet: PROVE_BLOCKS },
  { id: "deeper", label: "🚀 Go Deeper — The Fun Part", subtitle: "Ask why, challenge assumptions, see connections", className: "phase-deeper", blockSet: DEEP_BLOCKS },
];

// Language-specific phases (supports both native bilingual types and legacy STEM-mapped types)
const LANG_READ_BLOCKS = new Set(["concept", "activity", "bilingual_concept", "story_reading", "visual_aid"]);
const LANG_PRACTICE_BLOCKS = new Set(["recall", "exercise", "assessment", "explain", "vocabulary", "grammar_pattern"]);
const LANG_EXPRESS_BLOCKS = new Set(["reasoning", "assumptions", "connections", "application", "implications"]);

const langPhases = [
  { id: "read", label: "📖 Read & Discover", subtitle: "Read side-by-side, learn new words, hear the sounds", className: "phase-discover", blockSet: LANG_READ_BLOCKS },
  { id: "practice", label: "🧩 Practice & Pattern", subtitle: "Spot grammar patterns, recall what you learned", className: "phase-prove", blockSet: LANG_PRACTICE_BLOCKS },
  { id: "express", label: "✍️ Express Yourself", subtitle: "Write, think, and connect to culture", className: "phase-deeper", blockSet: LANG_EXPRESS_BLOCKS },
];

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
  const { user } = useAuth();
  const [showDefense, setShowDefense] = useState(false);
  const [showFirstPrinciples, setShowFirstPrinciples] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeBlock, setActiveBlock] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<number>>(new Set());
  const [understoodBlocks, setUnderstoodBlocks] = useState<Set<number>>(new Set());
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalBlocksRef = useRef(0);

  const toggleBlock = useCallback((index: number) => {
    setCollapsedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  // Persist understood blocks to DB (debounced)
  const persistUnderstood = useCallback((understood: Set<number>) => {
    if (!user || !chapterId || !episodeId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus("saving");
    saveTimerRef.current = setTimeout(async () => {
      const arr = Array.from(understood);
      const pct = totalBlocksRef.current > 0 ? Math.round((arr.length / totalBlocksRef.current) * 100) : 0;
      const { error } = await supabase
        .from("episode_progress")
        .upsert({
          user_id: user.id,
          chapter_id: chapterId,
          episode_id: episodeId,
          layer_scores: { understood: arr },
          completion_pct: pct,
          completed_at: pct === 100 ? new Date().toISOString() : null,
        }, { onConflict: "user_id,chapter_id,episode_id" });
      setSaveStatus(error ? "idle" : "saved");
      if (!error) setTimeout(() => setSaveStatus("idle"), 2000);
    }, 500);
  }, [user, chapterId, episodeId]);

  const toggleUnderstood = useCallback((index: number) => {
    setUnderstoodBlocks(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      persistUnderstood(next);
      return next;
    });
  }, [persistUnderstood]);

  const toggleAllCollapsed = useCallback((blocks: any[]) => {
    setCollapsedBlocks(prev => {
      if (prev.size === blocks.length) return new Set();
      return new Set(blocks.map((_, i) => i));
    });
  }, []);
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

  // Detect if this is a language subject
  const langSubject = useMemo(() => getSubjectFromSlug(chapterId), [chapterId]);
  const isLanguage = !!langSubject;
  const phases = isLanguage ? langPhases : stemPhases;

  // Keep totalBlocksRef in sync
  useEffect(() => { totalBlocksRef.current = blocks.length; }, [blocks.length]);

  // Load understood blocks from DB on mount
  useEffect(() => {
    if (!user || !chapterId || !episodeId) return;
    supabase
      .from("episode_progress")
      .select("layer_scores")
      .eq("user_id", user.id)
      .eq("chapter_id", chapterId)
      .eq("episode_id", episodeId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.layer_scores && typeof data.layer_scores === "object" && !Array.isArray(data.layer_scores)) {
          const scores = data.layer_scores as Record<string, unknown>;
          if (Array.isArray(scores.understood)) {
            setUnderstoodBlocks(new Set(scores.understood as number[]));
          }
        }
      });
  }, [user, chapterId, episodeId]);

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
    // Native bilingual block types (from generate-language-content)
    switch (block.type) {
      case "bilingual_concept": return <BilingualConceptBlock content={block.content as any} subjectName={langSubject || "Telugu"} />;
      case "vocabulary": return <VocabularyCardBlock content={block.content as any} subjectName={langSubject || "Telugu"} />;
      case "grammar_pattern": return <GrammarPatternBlock content={block.content as any} />;
      case "story_reading": return <StoryReadingBlock content={block.content as any} subjectName={langSubject || "Telugu"} />;
      case "visual_aid": return <VisualAidBlock content={block.content as VisualAidContent} />;
    }

    // Language-aware rendering for legacy STEM-typed blocks
    if (isLanguage && langSubject) {
      switch (block.type) {
        case "concept": return <BilingualConceptBlock content={block.content as any} subjectName={langSubject} />;
        case "activity": return <VocabularyCardBlock content={block.content as any} subjectName={langSubject} />;
        case "recall": return <RecallBlock content={block.content as RecallContent} />;
        case "explain": return <ExplainBlock content={block.content as ExplainContent} />;
        case "assessment": return <AssessmentBlock content={block.content as AssessmentContent} />;
        case "exercise": return <GrammarPatternBlock content={block.content as any} />;
        case "reasoning": return <StoryReadingBlock content={block.content as any} subjectName={langSubject} />;
        case "assumptions": return <AssumptionsBlock content={block.content as AssumptionsContent} onStartDefense={() => setShowDefense(true)} />;
        case "connections": return <ConnectionsBlock content={block.content as ConnectionsContent} />;
        case "application": return <ApplicationBlock content={block.content as ApplicationContent} />;
        case "implications": return <ImplicationsBlock content={block.content as ImplicationsContent} />;
        default: return null;
      }
    }
    // STEM rendering
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

  const breadcrumbs = [
    { label: "Dashboard", href: "/student" },
    { label: "Textbook", href: "/student/textbook" },
    { label: chapter.title, href: `/student/textbook/${chapterId}` },
    { label: episode.title },
  ];

  return (
    <PageLayout role="student" breadcrumbItems={breadcrumbs}>
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
          <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-lg p-3 w-48">
            {phases.map((phase) => {
              const phaseBlocks = blocks.map((b, i) => ({ block: b, index: i })).filter(({ block }) => phase.blockSet.has(block.type));
              if (phaseBlocks.length === 0) return null;
              const phaseUnderstood = phaseBlocks.filter(({ index }) => understoodBlocks.has(index)).length;
              const phaseComplete = phaseUnderstood === phaseBlocks.length && phaseBlocks.length > 0;
              return (
                <div key={phase.id} className="mb-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 px-1 flex items-center gap-1">
                    {phase.label.split(" ")[0]} {phase.label.split(" ").slice(1).join(" ")}
                    {phaseComplete && <Check className="h-3 w-3 text-primary" />}
                  </p>
                  <div className="space-y-0.5">
                    {phaseBlocks.map(({ block, index: i }) => {
                      const meta = layerMeta[block.type] || defaultMeta;
                      const BlockIcon = blockIcons[block.type] || BookOpen;
                      const isActive = i === activeBlock;
                      const isPast = i < activeBlock;
                      return (
                        <button
                          key={i}
                          onClick={() => scrollToBlock(i)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all text-xs ${
                            isActive ? "bg-primary/10 text-foreground font-medium"
                              : isPast ? "text-muted-foreground/70"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <span className={`h-2 w-2 rounded-full shrink-0 transition-all ${isActive ? meta.dotColor + " scale-125" : isPast ? "bg-primary/30" : "bg-border"}`} />
                          <BlockIcon className="h-3 w-3 shrink-0" />
                          <span className="truncate">{blockLabels[block.type] || block.type}</span>
                          {understoodBlocks.has(i) && <Check className="h-3 w-3 ml-auto text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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

        {/* Language Progress Widget — shown only for language subjects */}
        {isLanguage && langSubject && <LanguageProgressWidget subjectName={langSubject} />}

        {/* Stats Bar */}
        <div className="flex items-center justify-between bg-muted/50 rounded-xl p-4 mb-6">
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{blocks.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Total Sections</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{understoodBlocks.size}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{episode.duration}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Estimated Time</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saveStatus === "saving" && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 animate-pulse">
                <Cloud className="h-3 w-3" /> Saving…
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-xs text-primary flex items-center gap-1">
                <Check className="h-3 w-3" /> Saved
              </span>
            )}
            <button
              onClick={() => toggleAllCollapsed(blocks)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {collapsedBlocks.size === blocks.length ? (
                <><Eye className="h-3.5 w-3.5" /> Expand All</>
              ) : (
                <><ChevronDown className="h-3.5 w-3.5 -rotate-90" /> Collapse All</>
              )}
            </button>
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

        {/* Blocks grouped by Phase */}
        <div className="space-y-8">
          {phases.map((phase) => {
            const phaseBlocks = blocks
              .map((b, i) => ({ block: b, index: i }))
              .filter(({ block }) => phase.blockSet.has(block.type));
            if (phaseBlocks.length === 0) return null;

            const phaseUnderstood = phaseBlocks.filter(({ index }) => understoodBlocks.has(index)).length;
            const phaseComplete = phaseUnderstood === phaseBlocks.length;

            return (
              <div key={phase.id} className={phase.className}>
                {/* Phase Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      {phase.label}
                      {phaseComplete && <span className="text-primary text-sm">✓ Complete</span>}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{phase.subtitle}</p>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground bg-background/60 px-3 py-1 rounded-full">
                    {phaseUnderstood}/{phaseBlocks.length}
                  </span>
                </div>

                {/* Phase Blocks */}
                <div className="space-y-4">
                  {phaseBlocks.map(({ block, index: i }) => {
                    const meta = layerMeta[block.type] || defaultMeta;
                    const BlockIcon = blockIcons[block.type] || BookOpen;
                    const isCollapsed = collapsedBlocks.has(i);

                    return (
                      <div
                        key={i}
                        ref={(el) => { blockRefs.current[i] = el; }}
                        className={`bg-card rounded-xl scroll-mt-24 shadow-sm hover:shadow-md transition-all border-l-4 ${(meta as any).border || "border-l-primary"} hover:-translate-y-0.5 ${
                          !isCollapsed ? "animate-block-unlock" : ""
                        }`}
                      >
                        {/* Section Header */}
                        <button
                          onClick={() => toggleBlock(i)}
                          className="w-full flex items-center justify-between p-5 pb-3 cursor-pointer select-none group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xl shrink-0">{block.icon}</span>
                            <div className="text-left min-w-0">
                              <h2 className="text-[1.1rem] font-semibold text-foreground truncate">{block.title}</h2>
                              <p className="text-xs text-muted-foreground italic mt-0.5">{blockSubtitles[block.type] || ""}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {meta.badge && (
                              <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${meta.badgeColor || ""} hidden sm:inline-flex`}>
                                {meta.badge}
                              </span>
                            )}
                            {understoodBlocks.has(i) && <Check className="h-4 w-4 text-primary" />}
                            <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isCollapsed ? "-rotate-90" : "rotate-0"}`} />
                          </div>
                        </button>

                        {/* Block Content — collapsible */}
                        <div
                          className="overflow-hidden transition-all duration-300 ease-in-out"
                          style={{
                            maxHeight: isCollapsed ? "0px" : "5000px",
                            opacity: isCollapsed ? 0 : 1,
                            padding: isCollapsed ? "0 1.25rem" : "1.25rem",
                          }}
                        >
                          {renderBlock(block)}

                          {/* Got it! button */}
                          <div className="mt-4 pt-3 border-t border-border flex justify-end">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleUnderstood(i); }}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                understoodBlocks.has(i)
                                  ? "bg-primary/10 text-primary border border-primary/30 animate-got-it"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
                              }`}
                            >
                              <CheckCircle2 className={`h-4 w-4 ${understoodBlocks.has(i) ? "fill-primary" : ""}`} />
                              {understoodBlocks.has(i) ? "Nailed it! 🎯" : "Got it! ✓"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion Actions */}
        <div className="mt-10 mb-8 rounded-2xl bg-muted/50 border border-border p-8 text-center">
          <h2 className="text-2xl font-bold font-serif text-foreground mb-2">You crushed it! 🎉</h2>
          <p className="text-base text-muted-foreground mb-8">What do you want to try next?</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <button onClick={() => setShowDefense(true)} className="bg-card border-2 border-border hover:border-primary rounded-xl p-6 text-center transition-all hover:-translate-y-1">
              <div className="text-4xl mb-3">🎓</div>
              <h3 className="font-bold font-serif text-foreground mb-1">Can you defend it?</h3>
              <p className="text-xs text-muted-foreground">Friendly debate, not a test · 5 min</p>
            </button>

            <button onClick={() => setShowFirstPrinciples(true)} className="bg-card border-2 border-border hover:border-primary rounded-xl p-6 text-center transition-all hover:-translate-y-1">
              <div className="text-4xl mb-3">💡</div>
              <h3 className="font-bold font-serif text-foreground mb-1">Break it to basics</h3>
              <p className="text-xs text-muted-foreground">Strip it down, rebuild smarter · 10 min</p>
            </button>

            <button onClick={() => navigate("/student/dashboard")} className="bg-card border-2 border-border hover:border-primary rounded-xl p-6 text-center transition-all hover:-translate-y-1">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="font-bold font-serif text-foreground mb-1">See how far you've come</h3>
              <p className="text-xs text-muted-foreground">Track your growth</p>
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
