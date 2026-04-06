import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ContentBlock, ConceptContent, ActivityContent as ActivityContentType, RecallContent, ExplainContent, AssessmentContent, ExerciseContent, ReasoningContent, AssumptionsContent, ConnectionsContent, ApplicationContent, ImplicationsContent, VisualAidContent } from "@/data/textbookData";
import { useChapterEpisodes, useEpisodeBlocks } from "@/hooks/useTextbookData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Brain, Briefcase, Check, CheckCircle2, Cloud, Compass, Eye, Image, Lightbulb, Link, Map, MessageSquare, Mic, PenLine, Search, Shield, Sparkles, Zap, RotateCcw, GripHorizontal, X, ChevronLeft, Menu, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
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
import { ConceptBlock, ActivityBlock, RecallBlock, ExplainBlock, AssessmentBlock, ExerciseBlock, blockSubtitles, layerMeta, type ActivityContent } from "@/components/textbook/EpisodeBlocks";

const LANGUAGE_SUBJECTS = new Set(["Telugu", "Hindi"]);

const getSubjectFromSlug = (slug?: string): string | null => {
  if (!slug) return null;
  if (slug.startsWith("tel-")) return "Telugu";
  if (slug.startsWith("hindi-")) return "Hindi";
  return null;
};

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

const DEEP_BLOCKS = new Set(["reasoning", "assumptions", "connections", "application", "implications"]);
const DISCOVER_BLOCKS = new Set(["concept", "activity", "exercise"]);
const PROVE_BLOCKS = new Set(["recall", "assessment", "explain"]);

// Phase config
const stemPhases = [
  { id: "discover", label: "Discover & Explore", icon: "🔍", color: "#0D9488", subtitle: "Learn the big ideas and try them out", className: "phase-discover", blockSet: DISCOVER_BLOCKS },
  { id: "prove", label: "Test Yourself", icon: "🎯", color: "#3B82F6", subtitle: "Can you recall, explain & apply?", className: "phase-prove", blockSet: PROVE_BLOCKS },
  { id: "deeper", label: "Challenge Yourself", icon: "🚀", color: "#8B5CF6", subtitle: "Ask why, challenge assumptions, see connections", className: "phase-deeper", blockSet: DEEP_BLOCKS },
];

const LANG_READ_BLOCKS = new Set(["concept", "activity", "bilingual_concept", "story_reading"]);
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
  const [activeBlock, setActiveBlock] = useState(0);
  const [showSectionsSheet, setShowSectionsSheet] = useState(false);
  const [showToolsPopup, setShowToolsPopup] = useState(false);
  const [understoodBlocks, setUnderstoodBlocks] = useState<Set<number>>(new Set());
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [exitConfirm, setExitConfirm] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [textbookRefOpen, setTextbookRefOpen] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalBlocksRef = useRef(0);

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

  const { data: chapter, isLoading: chapterLoading } = useChapterEpisodes(chapterId);
  const { data: dbBlocks, isLoading: blocksLoading } = useEpisodeBlocks(chapterId, episodeId);

  const episode = chapter?.episodes.find((e) => e.id === episodeId);
  const allBlocks = dbBlocks && dbBlocks.length > 0 ? dbBlocks : (episode?.blocks || []);

  // Filter out visual_aid blocks from navigation — they render inline with their preceding block
  const navBlocks = useMemo(() => allBlocks.filter(b => b.type !== "visual_aid"), [allBlocks]);

  // Map: navBlock index → array of visual_aid blocks that follow it in the original array
  const attachedVisuals = useMemo(() => {
    const map: Record<number, ContentBlock[]> = {};
    let navIdx = -1;
    for (const b of allBlocks) {
      if (b.type !== "visual_aid") {
        navIdx++;
        map[navIdx] = [];
      } else if (navIdx >= 0) {
        map[navIdx].push(b);
      }
    }
    return map;
  }, [allBlocks]);

  const currentEpisodeIndex = chapter?.episodes.findIndex((e) => e.id === episodeId) ?? -1;
  const nextEpisode = chapter?.episodes[currentEpisodeIndex + 1];
  const isLoading = chapterLoading || blocksLoading;

  const langSubject = useMemo(() => getSubjectFromSlug(chapterId), [chapterId]);
  const isLanguage = !!langSubject;
  const phases = isLanguage ? langPhases : stemPhases;

  useEffect(() => { totalBlocksRef.current = navBlocks.length; }, [navBlocks.length]);

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

  // Phase 3 locking: check if all Phase 1+2 blocks are understood
  const phase3BlockTypes = isLanguage ? LANG_EXPRESS_BLOCKS : DEEP_BLOCKS;
  const phase12Indices = useMemo(() =>
    navBlocks.map((b, i) => ({ type: b.type, i })).filter(({ type }) => !phase3BlockTypes.has(type)).map(({ i }) => i),
    [navBlocks, phase3BlockTypes]
  );
  const phase3Indices = useMemo(() =>
    navBlocks.map((b, i) => ({ type: b.type, i })).filter(({ type }) => phase3BlockTypes.has(type)).map(({ i }) => i),
    [navBlocks, phase3BlockTypes]
  );
  const isPhase3Unlocked = phase12Indices.length > 0 && phase12Indices.every(i => understoodBlocks.has(i));
  const isBlockLocked = useCallback((index: number) => {
    return phase3Indices.includes(index) && !isPhase3Unlocked;
  }, [phase3Indices, isPhase3Unlocked]);

  const goToBlock = useCallback((index: number) => {
    if (isBlockLocked(index)) {
      toast.error("Complete all Discover & Test sections first 🔒");
      return;
    }
    setActiveBlock(index);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [isBlockLocked]);

  const scrollToActivity = useCallback(() => {
    const actIdx = navBlocks.findIndex(b => b.type === "activity");
    if (actIdx >= 0) goToBlock(actIdx);
  }, [navBlocks, goToBlock]);

  // Auto-scroll to layer based on query param
  useEffect(() => {
    if (!layerParam || !navBlocks || navBlocks.length === 0) return;
    const timer = setTimeout(() => {
      const targetSet = layerParam === "deep" ? DEEP_BLOCKS : layerParam === "quiz" ? PROVE_BLOCKS : null;
      if (!targetSet) return;
      const idx = navBlocks.findIndex(b => targetSet.has(b.type));
      if (idx >= 0) goToBlock(idx);
    }, 500);
    return () => clearTimeout(timer);
  }, [layerParam, navBlocks, goToBlock]);

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "#F9FAFB" }}>
        <div className="space-y-4 w-full max-w-md px-6">
          <Skeleton className="h-8 w-48" /><Skeleton className="h-6 w-64" />
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!chapter || !episode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "#F9FAFB" }}>
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Episode not found.</p>
          <Button variant="outline" onClick={() => navigate("/student/textbook")}>Back to Textbook</Button>
        </div>
      </div>
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

  // Find current phase
  const allPhaseBlocks = phases.flatMap(p => navBlocks.map((b, i) => ({ block: b, index: i, phase: p })).filter(({ block }) => p.blockSet.has(block.type)));
  const currentPhaseBlock = allPhaseBlocks.find(pb => pb.index === activeBlock);
  const currentPhase = currentPhaseBlock?.phase || phases[0];

  const handleExit = () => {
    navigate(`/student/textbook/${chapterId}`);
  };

  const handleFinish = () => {
    setShowCompletion(true);
  };

  // ═══ EXIT CONFIRMATION MODAL ═══
  if (exitConfirm) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
        <div style={{
          background: "white", borderRadius: 20, padding: 32, maxWidth: 360, width: "90%",
          textAlign: "center", boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📖</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1C1917", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
            Leave this lesson?
          </h2>
          <p style={{ fontSize: 14, color: "#78716C", marginBottom: 24, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
            Your progress is saved. You can continue from section {activeBlock + 1} next time.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => setExitConfirm(false)}
              style={{
                flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid #E7E5E4",
                background: "white", fontSize: 14, fontWeight: 600, color: "#57534E",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Stay
            </button>
            <button
              onClick={handleExit}
              style={{
                flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                background: "#EF4444", fontSize: 14, fontWeight: 600, color: "white",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Leave
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ COMPLETION SCREEN ═══
  if (showCompletion) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "#F9FAFB" }}>
        <div style={{ textAlign: "center", maxWidth: 420, width: "90%", padding: "40px 20px" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1C1917", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
            Lesson Complete!
          </h1>
          <p style={{ fontSize: 16, color: "#78716C", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
            {episode.title}
          </p>
          <p style={{ fontSize: 13, color: "#A8A29E", marginBottom: 32, fontFamily: "'DM Sans', sans-serif" }}>
            Core Path done • {navBlocks.length} sections completed
          </p>

          {/* Stat gains */}
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 40 }}>
            {[
              { icon: "👁️", label: "Clarity", value: "+3%" },
              { icon: "🧠", label: "Thinking", value: "+2%" },
              { icon: "🎯", label: "Focus", value: "+4%" },
            ].map(d => (
              <div key={d.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>{d.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0D9488", fontFamily: "'DM Sans', sans-serif" }}>{d.value}</div>
                <div style={{ fontSize: 11, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>{d.label}</div>
              </div>
            ))}
          </div>

          {/* Challenge buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <button onClick={() => { setShowCompletion(false); setShowDefense(true); }} style={{
              background: "white", border: "2px solid #E7E5E4", borderRadius: 14,
              padding: 20, textAlign: "center", cursor: "pointer",
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🎓</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1C1917", fontFamily: "'DM Sans', sans-serif" }}>Defend it</div>
              <div style={{ fontSize: 11, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>Debate · 5 min</div>
            </button>
            <button onClick={() => { setShowCompletion(false); setShowFirstPrinciples(true); }} style={{
              background: "white", border: "2px solid #E7E5E4", borderRadius: 14,
              padding: 20, textAlign: "center", cursor: "pointer",
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>💡</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1C1917", fontFamily: "'DM Sans', sans-serif" }}>Break it down</div>
              <div style={{ fontSize: 11, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>First principles · 10 min</div>
            </button>
          </div>

          {/* Navigation */}
          {nextEpisode ? (
            <button
              onClick={() => { navigate(`/student/textbook/${chapterId}/${nextEpisode.id}`); }}
              style={{
                width: "100%", padding: "14px 32px", borderRadius: 12, border: "none",
                background: "#0D9488", color: "white", fontSize: 15, fontWeight: 700,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Next: {nextEpisode.title} →
            </button>
          ) : (
            <button
              onClick={handleExit}
              style={{
                width: "100%", padding: "14px 32px", borderRadius: 12, border: "none",
                background: "#059669", color: "white", fontSize: 15, fontWeight: 700,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <CheckCircle2 className="h-5 w-5" /> Back to Chapter
            </button>
          )}
        </div>
      </div>
    );
  }

  // ═══ IMMERSIVE MODULE ═══
  const block = navBlocks.length > 0 && activeBlock < navBlocks.length ? navBlocks[activeBlock] : null;
  const meta = block ? (layerMeta[block.type] || defaultMeta) : defaultMeta;
  const isUnderstood = understoodBlocks.has(activeBlock);
  const isLastBlock = activeBlock === navBlocks.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#F9FAFB", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ═══ TOP BAR — Single line ═══ */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 16px", borderBottom: "1px solid #E7E5E4", background: "white",
        height: 48, flexShrink: 0,
      }}>
        {/* Close */}
        <button
          onClick={() => setExitConfirm(true)}
          style={{
            width: 32, height: 32, borderRadius: 8, border: "none",
            background: "#F5F5F4", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", color: "#78716C", flexShrink: 0,
          }}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Progress dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 3, flex: 1, justifyContent: "center", padding: "0 12px", overflow: "hidden" }}>
          {navBlocks.map((_, i) => (
            <div
              key={i}
              style={{
                width: navBlocks.length > 15 ? 4 : navBlocks.length > 8 ? 6 : 8,
                height: navBlocks.length > 15 ? 4 : navBlocks.length > 8 ? 6 : 8,
                borderRadius: 2,
                background: understoodBlocks.has(i) ? "#0D9488" : i === activeBlock ? "#1C1917" : "#D6D3D1",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
            />
          ))}
        </div>

        {/* Counter + save + reading mode toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {saveStatus === "saving" && (
            <Cloud className="h-3 w-3" style={{ color: "#A8A29E" }} />
          )}
          {saveStatus === "saved" && (
            <Check className="h-3 w-3" style={{ color: "#0D9488" }} />
          )}
          <span style={{ fontSize: 12, fontWeight: 600, color: "#78716C", minWidth: 32, textAlign: "right" }}>
            {activeBlock + 1}/{navBlocks.length}
          </span>
        </div>
      </div>

      <>
      {/* ═══ PHASE BADGE — Tiny ═══ */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6, padding: "6px 16px",
        fontSize: 12, color: "#78716C", flexShrink: 0,
      }}>
        <span>{currentPhase?.icon}</span>
        <span style={{ fontWeight: 600, color: currentPhase?.color }}>{currentPhase?.label}</span>
        <span style={{ color: "#D6D3D1" }}>•</span>
        <span>{meta.badge?.split(" ").slice(1).join(" ") || block?.type || "Section"}</span>
      </div>

      {/* ═══ CONTENT AREA — Scrollable ═══ */}
      <div
        ref={contentRef}
        style={{
          flex: 1, overflowY: "auto", padding: "0 16px 120px",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto", paddingTop: 16 }}>

          {/* Language Progress Widget */}
          {isLanguage && langSubject && <LanguageProgressWidget subjectName={langSubject} />}

          {block && (
            <>
              {/* Section title */}
              <h1 style={{
                fontSize: 22, fontWeight: 700, color: "#1C1917", marginBottom: 4,
                fontFamily: "'Source Serif 4', serif",
              }}>
                {block.icon} {block.title}
              </h1>
              <p style={{ fontSize: 13, color: "#A8A29E", marginBottom: 20, fontStyle: "italic" }}>
                {blockSubtitles[block.type] || ""}
              </p>

              {/* Block content */}
              <div className={`bg-card rounded-xl border-l-4 ${(meta as any).border || "border-l-primary"} shadow-sm`}>
                <div className="p-5">
                  {renderBlock(block)}
                </div>
              </div>

              {/* Inline visual aids attached to this section */}
              {attachedVisuals[activeBlock]?.map((vb, vi) => (
                <div key={vi} className="mt-4">
                  <VisualAidBlock content={vb.content as VisualAidContent} />
                </div>
              ))}

              {/* Inline textbook reference callouts — collapsible */}
              {block.textbookRef && (
                <div style={{ marginTop: 16 }}>
                  <button
                    onClick={() => setTextbookRefOpen(!textbookRefOpen)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 12px", borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      background: textbookRefOpen ? "hsl(var(--muted) / 0.3)" : "transparent",
                      cursor: "pointer", fontSize: 11, fontWeight: 600,
                      color: "hsl(var(--primary))",
                      width: "100%", textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                  >
                    📖 {textbookRefOpen ? "Hide textbook reference ▲" : "Your Textbook Says… ▼"}
                  </button>

                  {textbookRefOpen && (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      {block.textbookRef.snippets ? (
                        block.textbookRef.snippets.map((snippet, i) => (
                          <div key={i} style={{
                            padding: "10px 14px", borderRadius: 8,
                            borderLeft: "3px solid hsl(var(--primary) / 0.4)",
                            background: "hsl(var(--muted) / 0.3)",
                          }}>
                            <p style={{
                              fontSize: 12, color: "hsl(var(--muted-foreground))", lineHeight: 1.65,
                              fontFamily: "'Source Serif 4', serif", fontStyle: "italic",
                            }}>
                              "{snippet.text}"
                            </p>
                            <p style={{ fontSize: 10, color: "hsl(var(--muted-foreground) / 0.7)", marginTop: 6, fontStyle: "italic" }}>
                              — {snippet.source}
                            </p>
                          </div>
                        ))
                      ) : block.textbookRef.text ? (
                        <div style={{
                          padding: "10px 14px", borderRadius: 8,
                          borderLeft: "3px solid hsl(var(--primary) / 0.4)",
                          background: "hsl(var(--muted) / 0.3)",
                        }}>
                          <p style={{
                            fontSize: 12, color: "hsl(var(--muted-foreground))", lineHeight: 1.65,
                            fontFamily: "'Source Serif 4', serif", fontStyle: "italic",
                          }}>
                            "{block.textbookRef.text}"
                          </p>
                          <p style={{ fontSize: 10, color: "hsl(var(--muted-foreground) / 0.7)", marginTop: 6, fontStyle: "italic" }}>
                            — {block.textbookRef.source}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ═══ BOTTOM BAR — Fixed ═══ */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "12px 16px", background: "white", borderTop: "1px solid #E7E5E4",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.04)",
      }}>
        {/* Left: Sections + Prev */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setShowSectionsSheet(true)}
            style={{
              width: 36, height: 36, borderRadius: 8, border: "1px solid #E7E5E4",
              background: "white", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", color: "#78716C",
            }}
          >
            <Menu className="h-4 w-4" />
          </button>
          {activeBlock > 0 && (
            <button
              onClick={() => goToBlock(activeBlock - 1)}
              style={{
                padding: "8px 14px", borderRadius: 8, border: "1px solid #E7E5E4",
                background: "white", fontSize: 13, fontWeight: 600, color: "#57534E",
                cursor: "pointer",
              }}
            >
              ← Prev
            </button>
          )}
        </div>

        {/* Center: Tools */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowToolsPopup(!showToolsPopup)}
            style={{
              width: 36, height: 36, borderRadius: 8, border: "1px solid #E7E5E4",
              background: showToolsPopup ? "#F0FDFA" : "white", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#78716C",
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {/* Tools popup */}
          {showToolsPopup && (
            <div style={{
              position: "absolute", bottom: 44, left: "50%", transform: "translateX(-50%)",
              background: "white", borderRadius: 12, border: "1px solid #E7E5E4",
              boxShadow: "0 8px 30px rgba(0,0,0,0.1)", padding: 8, display: "flex", gap: 4,
              whiteSpace: "nowrap",
            }}>
              {[
                { icon: "🗺️", label: "Mindmap" },
                { icon: "✏️", label: "Practice", onClick: scrollToActivity },
                { icon: "📚", label: "Q Bank" },
                { icon: "🔍", label: "Search" },
              ].map(t => (
                <button
                  key={t.label}
                  onClick={() => { t.onClick?.(); setShowToolsPopup(false); }}
                  style={{
                    padding: "8px 12px", borderRadius: 8, border: "none",
                    background: "transparent", fontSize: 12, fontWeight: 600,
                    color: "#57534E", cursor: "pointer", display: "flex",
                    flexDirection: "column", alignItems: "center", gap: 2,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Got it + Continue/Finish */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => toggleUnderstood(activeBlock)}
            style={{
              padding: "8px 14px", borderRadius: 8,
              border: isUnderstood ? "1.5px solid #0D9488" : "1px solid #E7E5E4",
              background: isUnderstood ? "#F0FDFA" : "white",
              fontSize: 13, fontWeight: 600,
              color: isUnderstood ? "#0D9488" : "#78716C",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
            }}
          >
            <CheckCircle2 className="h-4 w-4" style={{ fill: isUnderstood ? "#0D9488" : "none" }} />
            {isUnderstood ? "✓" : "Got it!"}
          </button>

          {!isLastBlock ? (
            <button
              disabled={!isUnderstood}
              onClick={() => goToBlock(activeBlock + 1)}
              style={{
                padding: "8px 18px", borderRadius: 8, border: "none",
                background: isUnderstood ? "#0D9488" : "#D6D3D1",
                fontSize: 13, fontWeight: 700, color: isUnderstood ? "white" : "#A8A29E",
                cursor: isUnderstood ? "pointer" : "not-allowed",
                transition: "all 0.2s",
              }}
            >
              Continue →
            </button>
          ) : (
            <button
              disabled={!isUnderstood}
              onClick={handleFinish}
              style={{
                padding: "8px 18px", borderRadius: 8, border: "none",
                background: isUnderstood ? "#059669" : "#D6D3D1",
                fontSize: 13, fontWeight: 700, color: isUnderstood ? "white" : "#A8A29E",
                cursor: isUnderstood ? "pointer" : "not-allowed",
                transition: "all 0.2s",
              }}
            >
              Finish ✓
            </button>
          )}
        </div>
      </div>

      {/* ═══ SECTIONS BOTTOM SHEET ═══ */}
      {showSectionsSheet && (
        <>
          <div
            onClick={() => setShowSectionsSheet(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 60 }}
          />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 61,
            background: "white", borderRadius: "16px 16px 0 0",
            maxHeight: "70vh", overflowY: "auto",
            boxShadow: "0 -10px 40px rgba(0,0,0,0.1)",
            padding: "16px 20px 32px",
          }}>
            {/* Handle */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "#D6D3D1", margin: "0 auto 16px" }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1C1917", margin: 0 }}>{episode.title}</h3>
                <p style={{ fontSize: 12, color: "#78716C", margin: "2px 0 0" }}>{chapter.title} • Lesson {episode.number}</p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0D9488" }}>
                {understoodBlocks.size}/{navBlocks.length}
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: 6, background: "#E7E5E4", borderRadius: 3, overflow: "hidden", marginBottom: 20 }}>
              <div style={{
                width: `${navBlocks.length > 0 ? Math.round((understoodBlocks.size / navBlocks.length) * 100) : 0}%`,
                height: "100%", background: "linear-gradient(90deg, #0D9488, #14B8A6)", borderRadius: 3, transition: "width 0.3s",
              }} />
            </div>

            {/* Phases and sections */}
            {phases.map((phase) => {
              const phaseBlocks = navBlocks.map((b, i) => ({ block: b, index: i })).filter(({ block }) => phase.blockSet.has(block.type));
              if (phaseBlocks.length === 0) return null;
              const phaseUnderstood = phaseBlocks.filter(({ index }) => understoodBlocks.has(index)).length;

              return (
                <div key={phase.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{phase.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: phase.color }}>{phase.label}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#A8A29E" }}>
                      {phaseUnderstood}/{phaseBlocks.length}
                    </span>
                  </div>

                  {phaseBlocks.map(({ block: b, index: i }) => {
                    const isActive = i === activeBlock;
                    const isDone = understoodBlocks.has(i);
                    const locked = isBlockLocked(i);
                    return (
                      <button
                        key={i}
                        onClick={() => { if (!locked) { goToBlock(i); setShowSectionsSheet(false); } else { toast.error("Complete all Discover & Test sections first 🔒"); } }}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px",
                          borderRadius: 8, border: "none", textAlign: "left", marginBottom: 2,
                          background: isActive ? `${phase.color}10` : "transparent",
                          cursor: locked ? "not-allowed" : "pointer",
                          opacity: locked ? 0.5 : 1,
                        }}
                      >
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                          background: locked ? "#D6D3D1" : isDone ? phase.color : isActive ? "white" : "#E7E5E4",
                          border: isActive && !isDone && !locked ? `2px solid ${phase.color}` : "none",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: isDone ? "white" : "#78716C", fontSize: 10, fontWeight: 700,
                        }}>
                          {locked ? "🔒" : isDone ? "✓" : "•"}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: locked ? "#A8A29E" : isActive ? phase.color : "#1C1917" }}>
                            {blockLabels[b.type] || b.title || b.type}
                          </div>
                          <div style={{ fontSize: 11, color: "#A8A29E" }}>
                            {locked ? "Complete previous phases to unlock" : layerMeta[b.type]?.badge?.split(" ").slice(1).join(" ") || b.type}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}

          </div>
        </>
      )}

      </>

      {/* Modals */}
      <TutorialDefenseModal open={showDefense} onOpenChange={setShowDefense} topic={episode.title} episodeTitle={`${chapter.title} — ${episode.title}`} subject={chapter.title} chapterId={chapterId} episodeId={episodeId} />
      <FirstPrinciplesModal open={showFirstPrinciples} onOpenChange={setShowFirstPrinciples} topic={episode.title} episodeTitle={`${chapter.title} — ${episode.title}`} subject={chapter.title} chapterId={chapterId} episodeId={episodeId} />
    </div>
  );
};

export default TextbookEpisode;
