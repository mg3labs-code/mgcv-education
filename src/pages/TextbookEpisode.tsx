import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { ContentBlock, ConceptContent, ActivityContent as ActivityContentType, RecallContent, ExplainContent, AssessmentContent, ExerciseContent, ReasoningContent, AssumptionsContent, ConnectionsContent, ApplicationContent, ImplicationsContent, VisualAidContent } from "@/data/textbookData";
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
        <div className="space-y-1">
          {content.keyFormulas.map((f, i) => (
            <p key={i} className="text-lg font-mono text-foreground">{f}</p>
          ))}
        </div>
      </div>
    )}
    {(content as any).solvedExamples && (content as any).solvedExamples.length > 0 && (
      <div className="space-y-3">
        {(content as any).solvedExamples.map((ex: any, i: number) => (
          <div key={i} className="rounded-xl bg-muted/30 border border-border p-5">
            <p className="text-sm font-semibold text-foreground mb-1">🎯 {ex.question}</p>
            <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">{ex.solution}</p>
          </div>
        ))}
      </div>
    )}
    {(content as any).media && <InlineMedia media={(content as any).media} />}
  </div>
);

// DragDrop Activity Block
interface DragDropItem { value: string; categories?: string[] }
interface ActivityCategory { id: string; description: string }
interface ActivityContent { instruction: string; type?: string; items?: DragDropItem[]; categories?: ActivityCategory[] }

const DragDropActivityBlock = ({ content }: { content: ActivityContent }) => {
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [placements, setPlacements] = useState<Record<string, string[]>>({});
  const [feedback, setFeedback] = useState<Record<string, Record<string, "correct" | "wrong">>>({});
  const items = content.items || [];
  const categories = content.categories || [];
  const handleDragStart = (e: React.DragEvent, value: string) => { e.dataTransfer.setData("text/plain", value); setDragItem(value); };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    const value = e.dataTransfer.getData("text/plain");
    const item = items.find(it => it.value === value);
    if (!item) return;
    if (placements[categoryId]?.includes(value)) return;
    const isCorrect = item.categories?.includes(categoryId);
    setPlacements(prev => ({ ...prev, [categoryId]: [...(prev[categoryId] || []), value] }));
    setFeedback(prev => ({ ...prev, [categoryId]: { ...(prev[categoryId] || {}), [value]: isCorrect ? "correct" : "wrong" } }));
    setDragItem(null);
  };
  const handleReset = () => { setPlacements({}); setFeedback({}); };
  const totalPlaced = Object.values(placements).flat().length;
  const totalCorrect = Object.values(feedback).flatMap(f => Object.values(f)).filter(v => v === "correct").length;
  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
        <p className="text-base font-medium text-foreground leading-relaxed">{content.instruction}</p>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Drag these numbers</p>
        <div className="flex flex-wrap gap-3">
          {items.map((item) => (
            <div key={item.value} draggable onDragStart={(e) => handleDragStart(e, item.value)} className="px-5 py-2.5 rounded-full bg-card border-2 border-border text-foreground font-semibold text-base cursor-grab active:cursor-grabbing hover:border-primary hover:shadow-md transition-all select-none flex items-center gap-2">
              <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground" />{item.value}
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {categories.map((cat) => {
          const catPlacements = placements[cat.id] || [];
          const catFeedback = feedback[cat.id] || {};
          return (
            <div key={cat.id} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, cat.id)} className={`rounded-xl border-2 border-dashed p-4 min-h-[120px] transition-all ${dragItem ? "border-primary/60 bg-primary/5" : "border-border bg-muted/20"}`}>
              <div className="mb-3">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">{cat.id}</span>
                <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {catPlacements.length === 0 && <p className="text-xs text-muted-foreground/50 italic">Drop numbers here…</p>}
                {catPlacements.map((val) => (
                  <span key={val} className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${catFeedback[val] === "correct" ? "bg-green-50 border-green-400 text-green-800" : catFeedback[val] === "wrong" ? "bg-red-50 border-red-400 text-red-800 line-through" : "bg-card border-border text-foreground"}`}>
                    {val} {catFeedback[val] === "correct" ? "✓" : catFeedback[val] === "wrong" ? "✗" : ""}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {totalPlaced > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
          <span className="text-sm text-muted-foreground">{totalCorrect} correct of {totalPlaced} placed</span>
          <Button variant="ghost" size="sm" onClick={handleReset}><RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset</Button>
        </div>
      )}
    </div>
  );
};

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
  if (content.type === "classify" && content.categories && content.items) return <DragDropActivityBlock content={content} />;
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
            {revealed[i] && <div className="mt-2 p-3 bg-green-100 dark:bg-green-950/30 rounded-md text-green-800 dark:text-green-300 text-[0.95rem]">✓ {q.answer}</div>}
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
  bilingual_concept: { border: "border-l-blue-600",    bg: "",  badge: "📖 Read",       badgeColor: "bg-blue-500 text-white", dotColor: "bg-blue-600" },
  story_reading:     { border: "border-l-rose-500",    bg: "",  badge: "📚 Story",      badgeColor: "bg-rose-500 text-white", dotColor: "bg-rose-500" },
  vocabulary:        { border: "border-l-amber-500",   bg: "",  badge: "🔤 Words",      badgeColor: "bg-amber-500 text-white", dotColor: "bg-amber-500" },
  grammar_pattern:   { border: "border-l-emerald-500", bg: "",  badge: "🧩 Grammar",    badgeColor: "bg-emerald-500 text-white", dotColor: "bg-emerald-500" },
};

// Phase config
const stemPhases = [
  { id: "discover", label: "Discover & Explore", icon: "🔍", color: "#0D9488", subtitle: "Learn the big ideas and try them out", className: "phase-discover", blockSet: DISCOVER_BLOCKS },
  { id: "prove", label: "Test Yourself", icon: "🎯", color: "#3B82F6", subtitle: "Can you recall, explain & apply?", className: "phase-prove", blockSet: PROVE_BLOCKS },
  { id: "deeper", label: "Challenge Yourself", icon: "🚀", color: "#8B5CF6", subtitle: "Ask why, challenge assumptions, see connections", className: "phase-deeper", blockSet: DEEP_BLOCKS },
];

const LANG_READ_BLOCKS = new Set(["concept", "activity", "bilingual_concept", "story_reading", "visual_aid"]);
const LANG_PRACTICE_BLOCKS = new Set(["recall", "exercise", "assessment", "explain", "vocabulary", "grammar_pattern"]);
const LANG_EXPRESS_BLOCKS = new Set(["reasoning", "assumptions", "connections", "application", "implications"]);

const langPhases = [
  { id: "read", label: "Read & Discover", icon: "📖", color: "#0D9488", subtitle: "Read side-by-side, learn new words, hear the sounds", className: "phase-discover", blockSet: LANG_READ_BLOCKS },
  { id: "practice", label: "Practice & Pattern", icon: "🧩", color: "#3B82F6", subtitle: "Spot grammar patterns, recall what you learned", className: "phase-prove", blockSet: LANG_PRACTICE_BLOCKS },
  { id: "express", label: "Express Yourself", icon: "✍️", color: "#8B5CF6", subtitle: "Write, think, and connect to culture", className: "phase-deeper", blockSet: LANG_EXPRESS_BLOCKS },
];

// ─── Main Component ─────────────────────────────────────────

const TextbookEpisode = () => {
  const { chapterId, episodeId } = useParams();
  const [searchParams] = useSearchParams();
  const layerParam = searchParams.get("layer");
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showDefense, setShowDefense] = useState(false);
  const [showFirstPrinciples, setShowFirstPrinciples] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeBlock, setActiveBlock] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<number>>(new Set());
  const [understoodBlocks, setUnderstoodBlocks] = useState<Set<number>>(new Set());
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalBlocksRef = useRef(0);

  const toggleBlock = useCallback((index: number) => {
    setCollapsedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  }, []);

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
          user_id: user.id, chapter_id: chapterId, episode_id: episodeId,
          layer_scores: { understood: arr }, completion_pct: pct,
          completed_at: pct === 100 ? new Date().toISOString() : null,
        }, { onConflict: "user_id,chapter_id,episode_id" });
      setSaveStatus(error ? "idle" : "saved");
      if (!error) setTimeout(() => setSaveStatus("idle"), 2000);
    }, 500);
  }, [user, chapterId, episodeId]);

  const toggleUnderstood = useCallback((index: number) => {
    setUnderstoodBlocks(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
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

  const { data: chapter, isLoading: chapterLoading } = useChapterEpisodes(chapterId);
  const { data: dbBlocks, isLoading: blocksLoading } = useEpisodeBlocks(chapterId, episodeId);

  const episode = chapter?.episodes.find((e) => e.id === episodeId);
  const blocks = dbBlocks && dbBlocks.length > 0 ? dbBlocks : (episode?.blocks || []);
  const currentEpisodeIndex = chapter?.episodes.findIndex((e) => e.id === episodeId) ?? -1;
  const nextEpisode = chapter?.episodes[currentEpisodeIndex + 1];
  const isLoading = chapterLoading || blocksLoading;

  const langSubject = useMemo(() => getSubjectFromSlug(chapterId), [chapterId]);
  const isLanguage = !!langSubject;
  const phases = isLanguage ? langPhases : stemPhases;

  useEffect(() => { totalBlocksRef.current = blocks.length; }, [blocks.length]);

  // Load understood blocks from DB
  useEffect(() => {
    if (!user || !chapterId || !episodeId) return;
    supabase.from("episode_progress").select("layer_scores")
      .eq("user_id", user.id).eq("chapter_id", chapterId).eq("episode_id", episodeId)
      .maybeSingle().then(({ data }) => {
        if (data?.layer_scores && typeof data.layer_scores === "object" && !Array.isArray(data.layer_scores)) {
          const scores = data.layer_scores as Record<string, unknown>;
          if (Array.isArray(scores.understood)) setUnderstoodBlocks(new Set(scores.understood as number[]));
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

  // Navigate to block by index (paginated — no scroll needed)
  const goToBlock = useCallback((index: number) => {
    setActiveBlock(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToActivity = useCallback(() => {
    const actIdx = blocks.findIndex(b => b.type === "activity");
    if (actIdx >= 0) goToBlock(actIdx);
  }, [blocks, goToBlock]);

  // Auto-scroll to layer based on query param
  useEffect(() => {
    if (!layerParam || !blocks || blocks.length === 0) return;
    const timer = setTimeout(() => {
      const targetSet = layerParam === "deep" ? DEEP_BLOCKS : layerParam === "quiz" ? PROVE_BLOCKS : null;
      if (!targetSet) return;
      const idx = blocks.findIndex(b => targetSet.has(b.type));
      if (idx >= 0) goToBlock(idx);
    }, 500);
    return () => clearTimeout(timer);
  }, [layerParam, blocks, goToBlock]);

  if (isLoading) {
    return (
      <PageLayout role="student">
        <div className="max-w-3xl mx-auto space-y-4 pt-8">
          <Skeleton className="h-8 w-48" /><Skeleton className="h-6 w-64" />
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
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
      case "bilingual_concept": return <BilingualConceptBlock content={block.content as any} subjectName={langSubject || "Telugu"} />;
      case "vocabulary": return <VocabularyCardBlock content={block.content as any} subjectName={langSubject || "Telugu"} />;
      case "grammar_pattern": return <GrammarPatternBlock content={block.content as any} />;
      case "story_reading": return <StoryReadingBlock content={block.content as any} subjectName={langSubject || "Telugu"} />;
      case "visual_aid": return <VisualAidBlock content={block.content as VisualAidContent} />;
    }
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

  // Find current phase & section for breadcrumb
  const allPhaseBlocks = phases.flatMap(p => blocks.map((b, i) => ({ block: b, index: i, phase: p })).filter(({ block }) => p.blockSet.has(block.type)));
  const currentPhaseBlock = allPhaseBlocks.find(pb => pb.index === activeBlock);
  const currentPhase = currentPhaseBlock?.phase || phases[0];

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

      {/* ═══ Phase Sidebar — Slide-in panel ═══ */}
      {sidebarOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 45,
          background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)",
        }} onClick={() => setSidebarOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed", top: 0, left: 0, bottom: 0, width: 300, maxWidth: "85vw",
              background: "white", borderRight: "1px solid #E7E5E4", overflowY: "auto",
              padding: 20, zIndex: 46,
            }}
          >
            {/* Sidebar header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 700, fontSize: 16, color: "#1C1917" }}>
                  {episode.title}
                </div>
                <div style={{ fontSize: 12, color: "#78716C", fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>
                  {chapter.title} • Lesson {episode.number}
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} style={{
                background: "#F5F5F4", border: "none", width: 28, height: 28, borderRadius: "50%",
                cursor: "pointer", fontSize: 14, color: "#78716C",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>✕</button>
            </div>

            {/* Progress bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>Progress</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#0D9488", fontFamily: "'DM Sans', sans-serif" }}>{understoodBlocks.size}/{blocks.length}</span>
            </div>
            <div style={{ height: 6, background: "#E7E5E4", borderRadius: 3, overflow: "hidden", marginBottom: 20 }}>
              <div style={{ width: `${blocks.length > 0 ? Math.round((understoodBlocks.size / blocks.length) * 100) : 0}%`, height: "100%", background: "linear-gradient(90deg, #0D9488, #14B8A6)", borderRadius: 3, transition: "width 0.3s" }} />
            </div>

            {/* Phases and sections */}
            {phases.map((phase) => {
              const phaseBlocks = blocks.map((b, i) => ({ block: b, index: i })).filter(({ block }) => phase.blockSet.has(block.type));
              if (phaseBlocks.length === 0) return null;
              const phaseUnderstood = phaseBlocks.filter(({ index }) => understoodBlocks.has(index)).length;

              return (
                <div key={phase.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{phase.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: phase.color, fontFamily: "'DM Sans', sans-serif" }}>{phase.label}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#A8A29E", fontFamily: "'DM Sans', sans-serif" }}>
                      {phaseUnderstood}/{phaseBlocks.length}
                    </span>
                  </div>

                  {phaseBlocks.map(({ block, index: i }) => {
                    const isActive = i === activeBlock;
                    const isDone = understoodBlocks.has(i);
                    return (
                      <button
                        key={i}
                        onClick={() => { goToBlock(i); setSidebarOpen(false); }}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px",
                          borderRadius: 8, border: "none", textAlign: "left", marginBottom: 2,
                          background: isActive ? `${phase.color}10` : "transparent",
                          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                          background: isDone ? phase.color : isActive ? "white" : "#E7E5E4",
                          border: isActive && !isDone ? `2px solid ${phase.color}` : "none",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: isDone ? "white" : "#78716C", fontSize: 10, fontWeight: 700,
                        }}>
                          {isDone ? "✓" : block.icon || (blockIcons[block.type] ? "•" : "•")}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? phase.color : "#1C1917" }}>
                            {blockLabels[block.type] || block.title || block.type}
                          </div>
                          <div style={{ fontSize: 11, color: "#A8A29E" }}>
                            {layerMeta[block.type]?.badge?.split(" ").slice(1).join(" ") || block.type}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto" ref={contentRef}>
        {/* ═══ Lesson Top Bar ═══ */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 0", marginBottom: 8, flexWrap: "wrap", gap: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                padding: "5px 10px", borderRadius: 6, border: "1px solid #E7E5E4",
                background: sidebarOpen ? "#F0FDFA" : "white", fontSize: 12, cursor: "pointer",
                color: "#57534E", fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
              }}
            >
              ☰ Sections
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>
              <span>{currentPhase?.icon}</span>
              <span style={{ fontWeight: 600, color: currentPhase?.color }}>{currentPhase?.label}</span>
              <span>›</span>
              <span>{blockLabels[blocks[activeBlock]?.type] || "Section"}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>
              {understoodBlocks.size}/{blocks.length}
            </span>
            <div style={{ width: 60, height: 4, background: "#E7E5E4", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${blocks.length > 0 ? Math.round((understoodBlocks.size / blocks.length) * 100) : 0}%`, height: "100%", background: "#0D9488", borderRadius: 2 }} />
            </div>
            <button
              onClick={() => setShowToolbar(!showToolbar)}
              style={{
                padding: "4px 10px", borderRadius: 6, border: "1px solid #E7E5E4",
                background: showToolbar ? "#F0FDFA" : "white", fontSize: 11, cursor: "pointer",
                color: "#57534E", fontFamily: "'DM Sans', sans-serif",
              }}
            >
              ⋯ Tools
            </button>
          </div>
        </div>

        {/* ═══ Collapsible Tools Toolbar ═══ */}
        {showToolbar && (
          <div style={{
            display: "flex", gap: 8, padding: "10px 0", marginBottom: 8, flexWrap: "wrap",
          }}>
            {[
              { icon: "🗺️", label: "MINDMAP", color: "#0D9488", onClick: undefined },
              { icon: "✏️", label: "PRACTICE", color: "#7C3AED", onClick: scrollToActivity },
              { icon: "📚", label: "Q BANK", color: "#3B82F6", onClick: undefined },
              { icon: "🔍", label: "SEARCH", color: "#F59E0B", onClick: undefined },
            ].map(t => (
              <button
                key={t.label}
                onClick={t.onClick}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                  borderRadius: 8, border: `1.5px solid ${t.color}20`, background: "white",
                  fontSize: 12, fontWeight: 700, color: t.color, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1E3A5F, #1E293B)", borderRadius: 16,
          color: "white", padding: 24, marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button onClick={() => navigate(`/student/textbook/${chapterId}`)} style={{
              display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.7)",
              background: "none", border: "none", cursor: "pointer",
            }}>
              ← {chapter.title}
            </button>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.1)", padding: "4px 12px", borderRadius: 20 }}>
              ⏱️ {episode.duration}
            </span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 300, fontFamily: "'Source Serif 4', serif", margin: 0 }}>{episode.title}</h1>
          {episode.subtitle && <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>{episode.subtitle}</p>}
        </div>

        {/* Language Progress Widget */}
        {isLanguage && langSubject && <LanguageProgressWidget subjectName={langSubject} />}

        {/* Stats Bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#FAFAF9", borderRadius: 12, padding: 16, marginBottom: 16,
          border: "1px solid #E7E5E4",
        }}>
          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#0D9488" }}>{blocks.length}</div>
              <div style={{ fontSize: 11, color: "#78716C", marginTop: 2 }}>Total Sections</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#0D9488" }}>{understoodBlocks.size}</div>
              <div style={{ fontSize: 11, color: "#78716C", marginTop: 2 }}>Completed</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#0D9488" }}>{episode.duration}</div>
              <div style={{ fontSize: 11, color: "#78716C", marginTop: 2 }}>Est. Time</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {saveStatus === "saving" && (
              <span style={{ fontSize: 11, color: "#A8A29E", display: "flex", alignItems: "center", gap: 4 }}>
                <Cloud className="h-3 w-3" /> Saving…
              </span>
            )}
            {saveStatus === "saved" && (
              <span style={{ fontSize: 11, color: "#0D9488", display: "flex", alignItems: "center", gap: 4 }}>
                <Check className="h-3 w-3" /> Saved
              </span>
            )}
          </div>
        </div>

        {/* ═══ Blocks grouped by Phase ═══ */}
        <div className="space-y-8">
          {phases.map((phase) => {
            const phaseBlocks = blocks.map((b, i) => ({ block: b, index: i })).filter(({ block }) => phase.blockSet.has(block.type));
            if (phaseBlocks.length === 0) return null;
            const phaseUnderstood = phaseBlocks.filter(({ index }) => understoodBlocks.has(index)).length;
            const phaseComplete = phaseUnderstood === phaseBlocks.length;

            return (
              <div key={phase.id} className={phase.className}>
                {/* Phase Header */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 16, padding: "12px 16px", borderRadius: 12,
                  background: `${phase.color}08`, border: `1px solid ${phase.color}20`,
                }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1C1917", margin: 0, display: "flex", alignItems: "center", gap: 8, fontFamily: "'Source Serif 4', serif" }}>
                      {phase.icon} {phase.label}
                      {phaseComplete && <span style={{ fontSize: 13, color: "#0D9488" }}>✓ Complete</span>}
                    </h3>
                    <p style={{ fontSize: 12, color: "#78716C", margin: "4px 0 0", fontFamily: "'DM Sans', sans-serif" }}>{phase.subtitle}</p>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: phase.color,
                    background: `${phase.color}12`, padding: "4px 10px", borderRadius: 20,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
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
                        className={`bg-card rounded-xl scroll-mt-24 shadow-sm hover:shadow-md transition-all border-l-4 ${(meta as any).border || "border-l-primary"} hover:-translate-y-0.5 ${!isCollapsed ? "animate-block-unlock" : ""}`}
                      >
                        <button onClick={() => toggleBlock(i)} className="w-full flex items-center justify-between p-5 pb-3 cursor-pointer select-none group">
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

                        <div className="overflow-hidden transition-all duration-300 ease-in-out" style={{ maxHeight: isCollapsed ? "0px" : "5000px", opacity: isCollapsed ? 0 : 1, padding: isCollapsed ? "0 1.25rem" : "1.25rem" }}>
                          {renderBlock(block)}
                          <div className="mt-4 pt-3 border-t border-border flex justify-end">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleUnderstood(i); }}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${understoodBlocks.has(i) ? "bg-primary/10 text-primary border border-primary/30 animate-got-it" : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"}`}
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

                {/* ═══ Section Navigation (Previous/Next) ═══ */}
                {phaseBlocks.length > 0 && (
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginTop: 12, padding: "8px 0",
                  }}>
                    {/* Previous phase button */}
                    {phases.indexOf(phase) > 0 ? (
                      <button
                        onClick={() => {
                          const prevPhase = phases[phases.indexOf(phase) - 1];
                          const prevBlocks = blocks.map((b, i) => ({ block: b, index: i })).filter(({ block }) => prevPhase.blockSet.has(block.type));
                          if (prevBlocks.length > 0) scrollToBlock(prevBlocks[0].index);
                        }}
                        style={{
                          padding: "10px 20px", borderRadius: 12, border: "1px solid #E7E5E4",
                          background: "white", fontSize: 13, fontWeight: 600, color: "#57534E",
                          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        ← Previous
                      </button>
                    ) : <div />}

                    {phaseComplete && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#0D9488", fontFamily: "'DM Sans', sans-serif" }}>
                        ✓ Phase complete
                      </span>
                    )}

                    {phases.indexOf(phase) < phases.length - 1 ? (
                      <button
                        onClick={() => {
                          const nextPhase = phases[phases.indexOf(phase) + 1];
                          const nextBlocks = blocks.map((b, i) => ({ block: b, index: i })).filter(({ block }) => nextPhase.blockSet.has(block.type));
                          if (nextBlocks.length > 0) scrollToBlock(nextBlocks[0].index);
                        }}
                        style={{
                          padding: "10px 20px", borderRadius: 12, border: "none",
                          background: "#0D9488", fontSize: 13, fontWeight: 600, color: "white",
                          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        Next Phase →
                      </button>
                    ) : <div />}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Completion Actions */}
        <div style={{
          marginTop: 40, marginBottom: 32, borderRadius: 16,
          background: "#FAFAF9", border: "1px solid #E7E5E4", padding: 32, textAlign: "center",
        }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Source Serif 4', serif", color: "#1C1917", marginBottom: 8 }}>You crushed it! 🎉</h2>
          <p style={{ fontSize: 15, color: "#78716C", marginBottom: 32, fontFamily: "'DM Sans', sans-serif" }}>What do you want to try next?</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
            <button onClick={() => setShowDefense(true)} style={{
              background: "white", border: "2px solid #E7E5E4", borderRadius: 14,
              padding: 24, textAlign: "center", cursor: "pointer", transition: "all 0.15s",
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🎓</div>
              <h3 style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 700, fontSize: 14, color: "#1C1917", marginBottom: 4 }}>Can you defend it?</h3>
              <p style={{ fontSize: 12, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>Friendly debate · 5 min</p>
            </button>

            <button onClick={() => setShowFirstPrinciples(true)} style={{
              background: "white", border: "2px solid #E7E5E4", borderRadius: 14,
              padding: 24, textAlign: "center", cursor: "pointer", transition: "all 0.15s",
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>💡</div>
              <h3 style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 700, fontSize: 14, color: "#1C1917", marginBottom: 4 }}>Break it to basics</h3>
              <p style={{ fontSize: 12, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>Strip down, rebuild · 10 min</p>
            </button>

            <button onClick={() => navigate("/student")} style={{
              background: "white", border: "2px solid #E7E5E4", borderRadius: 14,
              padding: 24, textAlign: "center", cursor: "pointer", transition: "all 0.15s",
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
              <h3 style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 700, fontSize: 14, color: "#1C1917", marginBottom: 4 }}>See how far you've come</h3>
              <p style={{ fontSize: 12, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>Track your growth</p>
            </button>
          </div>

          {nextEpisode ? (
            <button
              onClick={() => { navigate(`/student/textbook/${chapterId}/${nextEpisode.id}`); window.scrollTo(0, 0); }}
              style={{
                padding: "14px 32px", borderRadius: 12, border: "none",
                background: "#0D9488", color: "white", fontSize: 15, fontWeight: 700,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Continue to Episode {nextEpisode.number}: {nextEpisode.title} →
            </button>
          ) : (
            <button
              onClick={() => navigate(`/student/textbook/${chapterId}`)}
              style={{
                padding: "14px 32px", borderRadius: 12, border: "none",
                background: "#059669", color: "white", fontSize: 15, fontWeight: 700,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}
            >
              <CheckCircle2 className="h-5 w-5" /> Complete Chapter
            </button>
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
