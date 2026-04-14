import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ContentBlock, ConceptContent, ActivityContent as ActivityContentType, RecallContent, ExplainContent, AssessmentContent, ExerciseContent, ReasoningContent, AssumptionsContent, ConnectionsContent, ApplicationContent, ImplicationsContent, VisualAidContent, JeeProblemsContent, JeeExtensionContent, JeeSpeedDrillContent } from "@/data/textbookData";
import { useChapterEpisodes, useEpisodeBlocks } from "@/hooks/useTextbookData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Brain, Briefcase, Check, CheckCircle2, Cloud, Compass, Eye, Image, Lightbulb, Link, Map, MessageSquare, AudioLines, PenLine, Search, Shield, Sparkles, Zap, RotateCcw, GripHorizontal, X, ChevronLeft, Menu, MoreHorizontal, Lock } from "lucide-react";
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
import JeeProblemsBlock from "@/components/textbook/JeeProblemsBlock";
import JeeExtensionBlock from "@/components/textbook/JeeExtensionBlock";
import JeeSpeedDrillBlock from "@/components/textbook/JeeSpeedDrillBlock";
import { Switch } from "@/components/ui/switch";
import SectionCelebration from "@/components/textbook/SectionCelebration";
import ComprehensionCheck from "@/components/textbook/ComprehensionCheck";
import EpisodeLoadingTransition from "@/components/textbook/EpisodeLoadingTransition";

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
  jee_problems: Zap, jee_extension: Sparkles, jee_speed_drill: Zap,
};

const blockLabels: Record<string, string> = {
  concept: "What's the big idea?", activity: "Try it yourself!", recall: "Can you remember?",
  explain: "Teach your friend", assessment: "Prove it!", exercise: "Level up",
  reasoning: "But WHY though?", assumptions: "What if we're wrong?",
  connections: "Where else does this hide?", application: "Use it in real life",
  implications: "What does this change?", visual_aid: "See it in action",
  jee_problems: "⚡ JEE Problem Bank", jee_extension: "🔬 Beyond Board", jee_speed_drill: "⏱️ Speed Drill",
};

// 3-Phase system: UNDERSTAND → PROVE → MASTER
const UNDERSTAND_BLOCKS = new Set(["concept", "activity", "exercise"]);
const PROVE_BLOCKS = new Set(["recall", "explain", "assessment"]);
const MASTER_BLOCKS = new Set(["reasoning", "assumptions", "connections", "application", "implications"]);
const JEE_BLOCKS = new Set(["jee_problems", "jee_extension", "jee_speed_drill"]);

const phases = [
  { id: "understand", label: "🔍 Discover & Explore", shortLabel: "UNDERSTAND", color: "#0D9488", subtitle: "Core concept + interactive activity + practice", blockSet: UNDERSTAND_BLOCKS },
  { id: "prove", label: "🎯 Test Yourself", shortLabel: "PROVE", color: "#3B82F6", subtitle: "Quick recall + explain in own words + quiz", blockSet: PROVE_BLOCKS },
  { id: "master", label: "🚀 Challenge Yourself", shortLabel: "MASTER", color: "#8B5CF6", subtitle: "Deep reasoning + myth-busting + real life", blockSet: MASTER_BLOCKS },
  { id: "jee", label: "⚡ JEE Boost", shortLabel: "JEE", color: "#D97706", subtitle: "Competitive problems + speed drills + extensions", blockSet: JEE_BLOCKS },
];

// Language overrides
const LANG_READ_BLOCKS = new Set(["concept", "activity", "bilingual_concept", "story_reading"]);
const LANG_PRACTICE_BLOCKS = new Set(["recall", "exercise", "assessment", "explain", "vocabulary", "grammar_pattern"]);
const LANG_EXPRESS_BLOCKS = new Set(["reasoning", "assumptions", "connections", "application", "implications"]);

const langPhases = [
  { id: "read", label: "📖 Read & Discover", icon: "📖", color: "#0D9488", subtitle: "Read side-by-side, learn new words", className: "phase-discover", blockSet: LANG_READ_BLOCKS },
  { id: "practice", label: "🧩 Practice & Pattern", icon: "🧩", color: "#3B82F6", subtitle: "Spot grammar patterns, recall", className: "phase-prove", blockSet: LANG_PRACTICE_BLOCKS },
  { id: "express", label: "✍️ Express Yourself", icon: "✍️", color: "#8B5CF6", subtitle: "Write, think, connect", className: "phase-deeper", blockSet: LANG_EXPRESS_BLOCKS },
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
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [blockCompleted, setBlockCompleted] = useState<Set<number>>(new Set());
  const [showUnderstandConfirm, setShowUnderstandConfirm] = useState(false);
  const [expandedTextbookRef, setExpandedTextbookRef] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [visitedBlocks, setVisitedBlocks] = useState<Set<string>>(new Set());
  const [sectionStartTime, setSectionStartTime] = useState<number>(Date.now());
  const [sectionTimings, setSectionTimings] = useState<Record<number, number>>({});
  const [wrongAttempts, setWrongAttempts] = useState<Record<number, number>>({});
  const [comprehensionResults, setComprehensionResults] = useState<Record<number, { result: string; attempts: number }>>({});
  const [jeeMode, setJeeMode] = useState(false);
  const [readingTimer, setReadingTimer] = useState(0);
  const [showReasoningGate, setShowReasoningGate] = useState(false);
  const [answerChanges, setAnswerChanges] = useState<Record<number, number>>({});
  const contentRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalBlocksRef = useRef(0);

  // Reset all state when episode changes
  useEffect(() => {
    setActiveBlock(0);
    setShowCompletion(false);
    setAlreadyCompleted(false);
    setUnderstoodBlocks(new Set());
    setBlockCompleted(new Set());
    setShowUnderstandConfirm(false);
    setShowSectionsSheet(false);
    setShowToolsPopup(false);
    setExitConfirm(false);
    setSaveStatus("idle");
    setShowCelebration(false);
    setSectionStartTime(Date.now());
    setSectionTimings({});
    setWrongAttempts({});
    setComprehensionResults({});
  }, [episodeId]);

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

  const markBlockInteracted = useCallback((index: number) => {
    setBlockCompleted(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  const { data: chapter, isLoading: chapterLoading } = useChapterEpisodes(chapterId);
  const { data: dbBlocks, isLoading: blocksLoading } = useEpisodeBlocks(chapterId, episodeId, jeeMode ? "all" : "board");

  const episode = chapter?.episodes.find((e) => e.id === episodeId);
  const allBlocks = dbBlocks && dbBlocks.length > 0 ? dbBlocks : (episode?.blocks || []);

  // Filter out visual_aid blocks from navigation
  const navBlocks = useMemo(() => allBlocks.filter(b => b.type !== "visual_aid"), [allBlocks]);

  const INTERACTIVE_TYPES = useMemo(() => new Set(["activity", "recall", "explain", "assessment", "exercise"]), []);

  const toggleUnderstood = useCallback((index: number) => {
    const block = navBlocks[index];
    const isInteractive = block && INTERACTIVE_TYPES.has(block.type);

    if (isInteractive && !blockCompleted.has(index)) {
      toast.error("Complete the activity first before marking as understood! 🎯");
      return;
    }

    if (!isInteractive && !blockCompleted.has(index) && !showUnderstandConfirm) {
      setShowUnderstandConfirm(true);
      return;
    }

    setShowUnderstandConfirm(false);
    setUnderstoodBlocks(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      persistUnderstood(next);
      return next;
    });
  }, [persistUnderstood, navBlocks, blockCompleted, showUnderstandConfirm, INTERACTIVE_TYPES]);

  // Map: navBlock index → array of visual_aid blocks that follow it
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

  // 3-Phase indices
  const getPhaseForBlock = useCallback((type: string) => {
    if (UNDERSTAND_BLOCKS.has(type)) return phases[0];
    if (PROVE_BLOCKS.has(type)) return phases[1];
    if (MASTER_BLOCKS.has(type)) return phases[2];
    return phases[0];
  }, []);

  const phaseIndices = useMemo(() => phases.map(p => ({
    ...p,
    indices: navBlocks.map((b, i) => ({ type: b.type, i })).filter(({ type }) => p.blockSet.has(type)).map(({ i }) => i),
  })), [navBlocks]);

  // 3-Phase sequential locking: Understand → Prove → Master/JEE
  const isBlockLocked = useCallback((index: number) => {
    const block = navBlocks[index];
    if (!block) return false;
    const type = block.type;

    // Understand phase is always unlocked
    if (UNDERSTAND_BLOCKS.has(type)) return false;

    // Language blocks: Read always open, Practice needs Read done, Express needs Practice done
    if (isLanguage) {
      if (LANG_READ_BLOCKS.has(type)) return false;
      const readIndices = navBlocks.map((b, i) => ({ type: b.type, i })).filter(({ type: t }) => LANG_READ_BLOCKS.has(t)).map(({ i }) => i);
      const allReadDone = readIndices.length === 0 || readIndices.every(i => understoodBlocks.has(i));
      if (LANG_PRACTICE_BLOCKS.has(type)) return !allReadDone;
      const practiceIndices = navBlocks.map((b, i) => ({ type: b.type, i })).filter(({ type: t }) => LANG_PRACTICE_BLOCKS.has(t)).map(({ i }) => i);
      const allPracticeDone = practiceIndices.length === 0 || practiceIndices.every(i => understoodBlocks.has(i));
      if (LANG_EXPRESS_BLOCKS.has(type)) return !allPracticeDone;
      return false;
    }

    // Prove phase: locked until ALL Understand blocks are understood
    if (PROVE_BLOCKS.has(type)) {
      const understandIndices = phaseIndices[0]?.indices ?? [];
      return understandIndices.length > 0 && !understandIndices.every(i => understoodBlocks.has(i));
    }

    // Master phase: locked until ALL Prove blocks are understood
    if (MASTER_BLOCKS.has(type)) {
      const proveIdxs = phaseIndices[1]?.indices ?? [];
      return proveIdxs.length > 0 && !proveIdxs.every(i => understoodBlocks.has(i));
    }

    // JEE phase: follows Master unlock rules
    if (JEE_BLOCKS.has(type)) {
      const proveIdxs = phaseIndices[1]?.indices ?? [];
      return proveIdxs.length > 0 && !proveIdxs.every(i => understoodBlocks.has(i));
    }

    return false;
  }, [navBlocks, understoodBlocks, phaseIndices, isLanguage]);

  // Phase unlock toasts — fire once per episode when a phase transitions from locked to available
  const prevUnlockRef = useRef<{ prove: boolean; master: boolean }>({ prove: false, master: false });
  useEffect(() => {
    if (navBlocks.length === 0) return;
    const understandDone = (phaseIndices[0]?.indices ?? []).every(i => understoodBlocks.has(i)) && (phaseIndices[0]?.indices ?? []).length > 0;
    const proveDone = (phaseIndices[1]?.indices ?? []).every(i => understoodBlocks.has(i)) && (phaseIndices[1]?.indices ?? []).length > 0;

    if (understandDone && !prevUnlockRef.current.prove) {
      prevUnlockRef.current.prove = true;
      toast.success("🎯 Test Yourself unlocked! You understood the basics.", { duration: 4000 });
    }
    if (proveDone && !prevUnlockRef.current.master) {
      prevUnlockRef.current.master = true;
      toast.success("🚀 Challenge Yourself unlocked! Time for deeper thinking.", { duration: 4000 });
    }
  }, [understoodBlocks, phaseIndices, navBlocks.length]);

  useEffect(() => { totalBlocksRef.current = navBlocks.length; }, [navBlocks.length]);

  // Load understood blocks from DB
  useEffect(() => {
    if (!user || !chapterId || !episodeId) return;
    supabase.from("episode_progress").select("layer_scores, completion_pct, completed_at")
      .eq("user_id", user.id).eq("chapter_id", chapterId).eq("episode_id", episodeId)
      .maybeSingle().then(({ data }) => {
        if (data?.layer_scores && typeof data.layer_scores === "object" && !Array.isArray(data.layer_scores)) {
          const scores = data.layer_scores as Record<string, unknown>;
          if (Array.isArray(scores.understood)) setUnderstoodBlocks(new Set(scores.understood as number[]));
        }
        // If episode was previously completed, show the already-completed state
        if (data?.completed_at) {
          setAlreadyCompleted(true);
          setShowCompletion(true);
        }
      });
  }, [user, chapterId, episodeId]);

  const goToBlock = useCallback((index: number) => {
    if (isBlockLocked(index)) {
      const block = navBlocks[index];
      const blockType = block?.type || "";
      if (PROVE_BLOCKS.has(blockType)) {
        const remaining = (phaseIndices[0]?.indices ?? []).filter(i => !understoodBlocks.has(i)).length;
        toast.error(`Complete ${remaining} more Understand section${remaining > 1 ? "s" : ""} to unlock 🔒`);
      } else if (MASTER_BLOCKS.has(blockType) || JEE_BLOCKS.has(blockType)) {
        const remaining = (phaseIndices[1]?.indices ?? []).filter(i => !understoodBlocks.has(i)).length;
        toast.error(`Complete ${remaining} more Prove section${remaining > 1 ? "s" : ""} to unlock 🔒`);
      } else {
        toast.error("Complete previous sections first 🔒");
      }
      return;
    }
    // Track time spent on current section
    const timeSpent = Math.round((Date.now() - sectionStartTime) / 1000);
    setSectionTimings(prev => ({ ...prev, [activeBlock]: (prev[activeBlock] || 0) + timeSpent }));
    setSectionStartTime(Date.now());
    
    // Mark visited
    const blockKey = `${chapterId}_${episodeId}_${activeBlock}`;
    setVisitedBlocks(prev => { const n = new Set(prev); n.add(blockKey); return n; });
    
    setActiveBlock(index);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [isBlockLocked, sectionStartTime, activeBlock, chapterId, episodeId]);

  const scrollToActivity = useCallback(() => {
    const actIdx = navBlocks.findIndex(b => b.type === "activity");
    if (actIdx >= 0) goToBlock(actIdx);
  }, [navBlocks, goToBlock]);

  useEffect(() => {
    if (!layerParam || !navBlocks || navBlocks.length === 0) return;
    const timer = setTimeout(() => {
      const targetSet = layerParam === "deep" ? MASTER_BLOCKS : layerParam === "quiz" ? new Set(["recall", "assessment", "explain"]) : null;
      if (!targetSet) return;
      const idx = navBlocks.findIndex(b => targetSet.has(b.type));
      if (idx >= 0) goToBlock(idx);
    }, 500);
    return () => clearTimeout(timer);
  }, [layerParam, navBlocks, goToBlock]);

  const onBlockComplete = useCallback(() => markBlockInteracted(activeBlock), [markBlockInteracted, activeBlock]);

  const onWrongAttempt = useCallback(() => {
    setWrongAttempts(prev => ({ ...prev, [activeBlock]: (prev[activeBlock] || 0) + 1 }));
  }, [activeBlock]);

  const onComprehensionResult = useCallback((result: "pass" | "revise" | "skip", attempts: number) => {
    setComprehensionResults(prev => ({ ...prev, [activeBlock]: { result, attempts } }));
  }, [activeBlock]);

  // Persist block interaction to DB
  const persistInteraction = useCallback(async (blockIndex: number) => {
    if (!user || !chapterId || !episodeId) return;
    const block = navBlocks[blockIndex];
    if (!block) return;
    const timeSpent = sectionTimings[blockIndex] || 0;
    const comp = comprehensionResults[blockIndex];
    const wrong = wrongAttempts[blockIndex] || 0;
    try {
      await supabase.from("episode_interactions" as any).upsert({
        user_id: user.id,
        chapter_id: chapterId,
        episode_id: episodeId,
        block_index: blockIndex,
        block_type: block.type,
        time_spent_seconds: timeSpent,
        wrong_attempts: wrong,
        correct_on_first_try: wrong === 0,
        comprehension_result: comp?.result || null,
        comprehension_attempts: comp?.attempts || 0,
        completed_at: new Date().toISOString(),
      }, { onConflict: "user_id,chapter_id,episode_id,block_index" });
    } catch (e) {
      console.error("Failed to persist interaction:", e);
    }
  }, [user, chapterId, episodeId, navBlocks, sectionTimings, comprehensionResults, wrongAttempts]);

  // Skill-mapping toasts for micro-connections
  const SKILL_TOASTS: Record<string, string> = useMemo(() => ({
    assumptions: "You just practiced the same skill elite interviewers test 🏛️",
    application: "Top institutions call this the Case Method — you're already doing it 🎓",
    reasoning: "This is how JEE Advanced separates toppers from memorizers 🧠",
    explain: "Feynman won a Nobel Prize using this exact technique 🔬",
    connections: "Elite tutorial systems work exactly like this — connecting ideas across fields 🧠",
  }), []);

  // Helper: advance with celebration
  const advanceWithCelebration = useCallback((nextIndex: number) => {
    // Record final time for current section
    const timeSpent = Math.round((Date.now() - sectionStartTime) / 1000);
    setSectionTimings(prev => ({ ...prev, [activeBlock]: (prev[activeBlock] || 0) + timeSpent }));

    // Auto-mark current as understood
    setUnderstoodBlocks(prev => {
      const next = new Set(prev);
      next.add(activeBlock);
      persistUnderstood(next);
      return next;
    });
    markBlockInteracted(activeBlock);
    // Persist interaction data
    persistInteraction(activeBlock);

    // Show skill-mapping toast if applicable
    const block = navBlocks[activeBlock];
    if (block && SKILL_TOASTS[block.type]) {
      toast(SKILL_TOASTS[block.type], { duration: 4000 });
    }

    // Show celebration then move
    setShowCelebration(true);
  }, [activeBlock, persistUnderstood, markBlockInteracted, persistInteraction, sectionStartTime, navBlocks, SKILL_TOASTS]);

  const handleCelebrationDone = useCallback(() => {
    setShowCelebration(false);
    if (activeBlock < navBlocks.length - 1) {
      goToBlock(activeBlock + 1);
    } else {
      handleFinish();
    }
  }, [activeBlock, navBlocks.length, goToBlock]);

  // Check if this is the first visit to current block
  const isFirstVisitToBlock = useMemo(() => {
    const blockKey = `${chapterId}_${episodeId}_${activeBlock}`;
    // Check localStorage for persistent visited state
    const visited = localStorage.getItem(`visited_blocks_${chapterId}_${episodeId}`);
    if (visited) {
      try {
        const arr = JSON.parse(visited) as number[];
        return !arr.includes(activeBlock);
      } catch { return true; }
    }
    return !visitedBlocks.has(blockKey);
  }, [chapterId, episodeId, activeBlock, visitedBlocks]);

  // Persist visited blocks
  const markBlockVisited = useCallback((index: number) => {
    const key = `visited_blocks_${chapterId}_${episodeId}`;
    const existing = localStorage.getItem(key);
    let arr: number[] = [];
    try { arr = existing ? JSON.parse(existing) : []; } catch {}
    if (!arr.includes(index)) {
      arr.push(index);
      localStorage.setItem(key, JSON.stringify(arr));
    }
  }, [chapterId, episodeId]);

  // Content blocks (non-interactive) that need comprehension check
  const CONTENT_TYPES = useMemo(() => new Set(["concept", "reasoning", "connections", "implications"]), []);
  // Reading types that need minimum time
  const READING_TYPES = useMemo(() => new Set(["concept", "reasoning", "connections", "implications"]), []);
  const ASSESSMENT_TYPES = useMemo(() => new Set(["assessment"]), []);
  const READING_MIN_SECONDS = 90;

  // Reading timer — counts up while on reading sections
  useEffect(() => {
    const block = navBlocks[activeBlock];
    if (!block || !READING_TYPES.has(block.type)) {
      setReadingTimer(0);
      return;
    }
    setReadingTimer(0);
    const id = setInterval(() => setReadingTimer(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [activeBlock, navBlocks]);

  // Check if continue is allowed
  const isContinueGated = useMemo(() => {
    const block = navBlocks[activeBlock];
    if (!block) return false;
    // Reading sections: need minimum time
    if (READING_TYPES.has(block.type) && readingTimer < READING_MIN_SECONDS) return true;
    // Assessment sections: need all questions attempted
    if (ASSESSMENT_TYPES.has(block.type) && !blockCompleted.has(activeBlock)) return true;
    // Interactive sections: need completion
    if (INTERACTIVE_TYPES.has(block.type) && !blockCompleted.has(activeBlock)) return true;
    return false;
  }, [navBlocks, activeBlock, readingTimer, blockCompleted, READING_TYPES, ASSESSMENT_TYPES, INTERACTIVE_TYPES]);

  const continueHint = useMemo(() => {
    const block = navBlocks[activeBlock];
    if (!block) return "";
    if (READING_TYPES.has(block.type) && readingTimer < READING_MIN_SECONDS) {
      const remaining = READING_MIN_SECONDS - readingTimer;
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      return `Read for ${mins}:${secs.toString().padStart(2, "0")} more...`;
    }
    if (ASSESSMENT_TYPES.has(block.type) && !blockCompleted.has(activeBlock)) return "Answer all questions first";
    if (INTERACTIVE_TYPES.has(block.type) && !blockCompleted.has(activeBlock)) return "Complete the activity first";
    return "";
  }, [navBlocks, activeBlock, readingTimer, blockCompleted, READING_TYPES, ASSESSMENT_TYPES, INTERACTIVE_TYPES]);

  // Pre-reasoning gate: check when entering Master phase
  const checkReasoningGate = useCallback((nextIndex: number) => {
    const block = navBlocks[nextIndex];
    if (!block || !MASTER_BLOCKS.has(block.type)) return false;
    const gateKey = `reasoning_gate_${chapterId}_${episodeId}`;
    if (localStorage.getItem(gateKey)) return false;
    // Check if previous block was NOT master
    const prevBlock = navBlocks[activeBlock];
    if (prevBlock && MASTER_BLOCKS.has(prevBlock.type)) return false;
    localStorage.setItem(gateKey, "1");
    return true;
  }, [navBlocks, activeBlock, chapterId, episodeId]);

  const onAnswerChange = useCallback(() => {
    setAnswerChanges(prev => ({ ...prev, [activeBlock]: (prev[activeBlock] || 0) + 1 }));
  }, [activeBlock]);

  if (isLoading) {
    return <EpisodeLoadingTransition />;
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
        case "recall": return <RecallBlock content={block.content as RecallContent} onComplete={onBlockComplete} />;
        case "explain": return <ExplainBlock content={block.content as ExplainContent} onComplete={onBlockComplete} />;
      case "assessment": return <AssessmentBlock content={block.content as AssessmentContent} onComplete={onBlockComplete} onWrongAttempt={onWrongAttempt} onAnswerChange={onAnswerChange} />;
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
      case "concept": return <ConceptBlock content={block.content as ConceptContent} onComplete={onBlockComplete} />;
      case "activity": return <ActivityBlock content={block.content as ActivityContent} onComplete={onBlockComplete} />;
      case "recall": return <RecallBlock content={block.content as RecallContent} onComplete={onBlockComplete} />;
      case "explain": return <ExplainBlock content={block.content as ExplainContent} onComplete={onBlockComplete} />;
      case "assessment": return <AssessmentBlock content={block.content as AssessmentContent} onComplete={onBlockComplete} onWrongAttempt={onWrongAttempt} onAnswerChange={onAnswerChange} />;
      case "exercise": return <ExerciseBlock content={block.content as ExerciseContent} onComplete={onBlockComplete} />;
      case "reasoning": return <ReasoningBlock content={block.content as ReasoningContent} />;
      case "assumptions": return <AssumptionsBlock content={block.content as AssumptionsContent} onStartDefense={() => setShowDefense(true)} />;
      case "connections": return <ConnectionsBlock content={block.content as ConnectionsContent} />;
      case "application": return <ApplicationBlock content={block.content as ApplicationContent} />;
      case "implications": return <ImplicationsBlock content={block.content as ImplicationsContent} />;
      case "jee_problems": return <JeeProblemsBlock content={block.content as JeeProblemsContent} onComplete={onBlockComplete} />;
      case "jee_extension": return <JeeExtensionBlock content={block.content as JeeExtensionContent} onComplete={onBlockComplete} />;
      case "jee_speed_drill": return <JeeSpeedDrillBlock content={block.content as JeeSpeedDrillContent} onComplete={onBlockComplete} />;
      default: return null;
    }
  };

  const defaultMeta = { border: "border-l-primary", bg: "", dotColor: "bg-primary", badge: undefined, badgeColor: undefined } as const;

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
            <button onClick={() => setExitConfirm(false)} style={{
              flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid #E7E5E4",
              background: "white", fontSize: 14, fontWeight: 600, color: "#57534E", cursor: "pointer",
            }}>Stay</button>
            <button onClick={handleExit} style={{
              flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
              background: "#EF4444", fontSize: 14, fontWeight: 600, color: "white", cursor: "pointer",
            }}>Leave</button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ COMPLETION SCREEN — Centered Celebration ═══
  if (showCompletion) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
        {!alreadyCompleted && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="absolute rounded-full animate-ping" style={{
                width: Math.random() * 8 + 4, height: Math.random() * 8 + 4,
                background: ["#0D9488", "#F59E0B", "#8B5CF6", "#EC4899", "#3B82F6"][i % 5],
                left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`, animationDuration: `${Math.random() * 2 + 1}s`, opacity: 0.7,
              }} />
            ))}
          </div>
        )}
        <div style={{
          textAlign: "center", maxWidth: 420, width: "90%", padding: "48px 28px",
          background: "white", borderRadius: 28, position: "relative",
          boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
        }} className="animate-scale-in">
          {alreadyCompleted ? (
            <>
              <div style={{ fontSize: 72, marginBottom: 8, lineHeight: 1 }}>✅</div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1C1917", marginBottom: 4 }}>Already Completed!</h1>
              <p style={{ fontSize: 16, color: "#0D9488", fontWeight: 600, marginBottom: 4 }}>{episode.title}</p>
              <p style={{ fontSize: 13, color: "#A8A29E", marginBottom: 28 }}>You've already mastered all {navBlocks.length} sections ✨</p>

              {/* Revisit or continue */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                <button onClick={() => { setShowCompletion(false); setAlreadyCompleted(false); setActiveBlock(0); }} style={{
                  background: "#F0FDFA", border: "2px solid #0D9488", borderRadius: 14, padding: 16, textAlign: "center", cursor: "pointer",
                }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>🔄</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0D9488" }}>Revisit Sections</div>
                  <div style={{ fontSize: 10, color: "#78716C" }}>Review all {navBlocks.length} sections</div>
                </button>
                <button onClick={() => { setShowCompletion(false); setShowDefense(true); }} style={{
                  background: "#F9FAFB", border: "2px solid #E7E5E4", borderRadius: 14, padding: 16, textAlign: "center", cursor: "pointer",
                }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>🎓</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1C1917" }}>Defend it</div>
                  <div style={{ fontSize: 10, color: "#78716C" }}>Debate · 5 min</div>
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 72, marginBottom: 8, lineHeight: 1 }}>🎉</div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1C1917", marginBottom: 4 }}>Nailed it!</h1>
              <p style={{ fontSize: 16, color: "#0D9488", fontWeight: 600, marginBottom: 4 }}>{episode.title}</p>
              <p style={{ fontSize: 13, color: "#A8A29E", marginBottom: 28 }}>{navBlocks.length} sections completed ✨</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 32 }}>
                {[
                  { icon: "👁️", label: "Clarity", value: "+3%" },
                  { icon: "🧠", label: "Thinking", value: "+2%" },
                  { icon: "🎯", label: "Focus", value: "+4%" },
                ].map(d => (
                  <div key={d.label} style={{ textAlign: "center", background: "#F0FDFA", borderRadius: 16, padding: "12px 16px" }}>
                    <div style={{ fontSize: 24, marginBottom: 2 }}>{d.icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#0D9488" }}>{d.value}</div>
                    <div style={{ fontSize: 10, color: "#78716C" }}>{d.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                <button onClick={() => { setShowCompletion(false); setShowDefense(true); }} style={{
                  background: "#F9FAFB", border: "2px solid #E7E5E4", borderRadius: 14, padding: 16, textAlign: "center", cursor: "pointer",
                }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>🎓</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1C1917" }}>Defend it</div>
                  <div style={{ fontSize: 10, color: "#78716C" }}>Debate · 5 min</div>
                </button>
                <button onClick={() => { setShowCompletion(false); setShowFirstPrinciples(true); }} style={{
                  background: "#F9FAFB", border: "2px solid #E7E5E4", borderRadius: 14, padding: 16, textAlign: "center", cursor: "pointer",
                }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>💡</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1C1917" }}>Break it down</div>
                  <div style={{ fontSize: 10, color: "#78716C" }}>First principles · 10 min</div>
                </button>
              </div>
            </>
          )}
          {nextEpisode ? (
            <button onClick={() => navigate(`/student/textbook/${chapterId}/${nextEpisode.id}`)} style={{
              width: "100%", padding: "14px 32px", borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, #0D9488, #14B8A6)", color: "white", fontSize: 15, fontWeight: 700,
              cursor: "pointer", boxShadow: "0 4px 14px rgba(13,148,136,0.4)",
            }}>Next: {nextEpisode.title} →</button>
          ) : (
            <button onClick={handleExit} style={{
              width: "100%", padding: "14px 32px", borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, #059669, #10B981)", color: "white", fontSize: 15, fontWeight: 700,
              cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 14px rgba(5,150,105,0.4)",
            }}><CheckCircle2 className="h-5 w-5" /> Back to Chapter</button>
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
  const currentPhase = block ? getPhaseForBlock(block.type) : phases[0];

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#F9FAFB", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ═══ TOP BAR ═══ */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 16px", borderBottom: "1px solid #E7E5E4", background: "white",
        height: 48, flexShrink: 0,
      }}>
        <button onClick={() => setExitConfirm(true)} style={{
          width: 32, height: 32, borderRadius: 8, border: "none",
          background: "#F5F5F4", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center", color: "#78716C", flexShrink: 0,
        }}><X className="h-4 w-4" /></button>

        {/* Progress dots — colored by phase */}
        <div style={{ display: "flex", alignItems: "center", gap: 3, flex: 1, justifyContent: "center", padding: "0 12px", overflow: "hidden" }}>
          {navBlocks.map((nb, i) => {
            const phase = getPhaseForBlock(nb.type);
            return (
              <div key={i} onClick={() => goToBlock(i)} style={{
                width: navBlocks.length > 15 ? 4 : navBlocks.length > 8 ? 6 : 8,
                height: navBlocks.length > 15 ? 4 : navBlocks.length > 8 ? 6 : 8,
                borderRadius: 2, cursor: "pointer",
                background: understoodBlocks.has(i)
                  ? phase.color
                  : i === activeBlock ? "#1C1917"
                  : "#D6D3D1",
                transition: "all 0.2s", flexShrink: 0,
              }} />
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {saveStatus === "saving" && <Cloud className="h-3 w-3" style={{ color: "#A8A29E" }} />}
          {saveStatus === "saved" && <Check className="h-3 w-3" style={{ color: "#0D9488" }} />}
          <span style={{ fontSize: 12, fontWeight: 600, color: "#78716C", minWidth: 32, textAlign: "right" }}>
            {activeBlock + 1}/{navBlocks.length}
          </span>
        </div>
      </div>

      <>
      {/* ═══ PHASE BADGE ═══ */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 16px", fontSize: 12, flexShrink: 0,
        background: currentPhase.color === "#D97706" ? "#FFFBEB" : currentPhase.color === "#0D9488" ? "#F0FDFA" : currentPhase.color === "#3B82F6" ? "#EFF6FF" : "#F5F3FF",
        borderBottom: "1px solid #F5F5F4",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 700, color: currentPhase.color, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 11 }}>
            {currentPhase.shortLabel}
          </span>
          <span style={{ color: "#D6D3D1" }}>•</span>
          <span style={{ color: "#78716C" }}>{blockLabels[block?.type || "concept"] || block?.type}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600, color: "#78716C", fontSize: 11 }}>
            {understoodBlocks.size}/{navBlocks.length} done
          </span>
          {!isLanguage && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, borderLeft: "1px solid #E7E5E4", paddingLeft: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: jeeMode ? "#D97706" : "#A8A29E" }}>JEE</span>
              <Switch
                checked={jeeMode}
                onCheckedChange={(checked) => { setJeeMode(checked); setActiveBlock(0); }}
                className="h-4 w-8 data-[state=checked]:bg-amber-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* ═══ CONTENT AREA ═══ */}
      <div ref={contentRef} style={{ flex: 1, overflowY: "auto", padding: "0 12px 120px", WebkitOverflowScrolling: "touch" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", paddingTop: 16 }}>

          {isLanguage && langSubject && <LanguageProgressWidget subjectName={langSubject} />}

          {block && (
            <>
              {/* JEE badge for JEE blocks */}
              {JEE_BLOCKS.has(block.type) && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
                    ⚡ JEE BOOST
                  </span>
                </div>
              )}
              {/* Section title */}
              <h1 style={{ fontSize: 22, fontWeight: 700, color: JEE_BLOCKS.has(block.type) ? "#D97706" : "#1C1917", marginBottom: 4, fontFamily: "'Source Serif 4', serif" }}>
                {block.icon} {block.title}
              </h1>
               <p style={{ fontSize: 13, color: "#A8A29E", marginBottom: 20, fontStyle: "italic" }}>
                 {sectionHooks[block.type] || blockSubtitles[block.type] || ""}
               </p>

              {/* Block content with colored border */}
              <div className={`bg-card rounded-xl border-l-4 ${JEE_BLOCKS.has(block.type) ? "border-l-amber-500" : ((meta as any).border || "border-l-primary")} shadow-sm`}>
                <div className="p-5">
                  {renderBlock(block)}
                </div>
              </div>

              {/* ═══ Comprehension Check for content blocks (first visit) ═══ */}
              {CONTENT_TYPES.has(block.type) && (
                <ComprehensionCheck
                  sectionTitle={block.title || blockLabels[block.type] || "this section"}
                  isFirstVisit={isFirstVisitToBlock}
                  onResult={onComprehensionResult}
                  onPass={() => {
                    markBlockVisited(activeBlock);
                    markBlockInteracted(activeBlock);
                    advanceWithCelebration(activeBlock);
                  }}
                  onSkip={() => {
                    markBlockVisited(activeBlock);
                    markBlockInteracted(activeBlock);
                  }}
                />
              )}
              {/* Inline visual aids */}
              {attachedVisuals[activeBlock]?.map((vb, vi) => (
                <div key={vi} className="mt-4">
                  <VisualAidBlock content={vb.content as VisualAidContent} />
                </div>
              ))}

              {/* ═══ COLLAPSIBLE TEXTBOOK REFERENCE (Option C) ═══ */}
              {block.textbookRef && (
                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={() => setExpandedTextbookRef(expandedTextbookRef === activeBlock ? null : activeBlock)}
                    style={{
                      width: "100%", padding: "10px 14px",
                      background: expandedTextbookRef === activeBlock ? "#FFFEF5" : "#FAFAF9",
                      border: "1px solid #E7E5E4",
                      borderRadius: expandedTextbookRef === activeBlock ? "12px 12px 0 0" : 12,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                      fontSize: 12, fontWeight: 600, color: "#7C3AED", textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>📖</span>
                    <span>{expandedTextbookRef === activeBlock ? "Hide original textbook text ▲" : "See original textbook text ▼"}</span>
                  </button>

                  {expandedTextbookRef === activeBlock && (
                    <div style={{
                      padding: "16px 14px", background: "#FFFEF5",
                      border: "1px solid #E7E5E4", borderTop: "none",
                      borderRadius: "0 0 12px 12px",
                    }}>
                      {block.textbookRef.snippets ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {block.textbookRef.snippets.map((snippet, i) => (
                            <div key={i} style={{
                              padding: "12px 14px", borderRadius: 8,
                              borderLeft: "3px solid #7C3AED40",
                              background: "white",
                            }}>
                              <p style={{
                                fontSize: 13, color: "#44403C", lineHeight: 1.7,
                                fontFamily: "'Source Serif 4', serif", fontStyle: "italic",
                              }}>
                                "{snippet.text}"
                              </p>
                              <p style={{ fontSize: 10, color: "#A8A29E", marginTop: 6, fontStyle: "italic" }}>
                                — {snippet.source}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : block.textbookRef.text ? (
                        <div style={{
                          padding: "12px 14px", borderRadius: 8,
                          borderLeft: "3px solid #7C3AED40",
                          background: "white",
                        }}>
                          <p style={{
                            fontSize: 13, color: "#44403C", lineHeight: 1.7,
                            fontFamily: "'Source Serif 4', serif", fontStyle: "italic",
                          }}>
                            "{block.textbookRef.text}"
                          </p>
                          <p style={{ fontSize: 10, color: "#A8A29E", marginTop: 6, fontStyle: "italic" }}>
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

      {/* "Did you understand?" is now rendered inline inside content area — see below */}

      {/* ═══ BOTTOM BAR (right padding to avoid chatbot FAB) ═══ */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "10px 12px", paddingRight: 72, background: "white", borderTop: "1px solid #E7E5E4",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.06)", gap: 8,
      }}>
        {/* Left: Sections */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <button onClick={() => setShowSectionsSheet(true)} style={{
            width: 36, height: 36, borderRadius: 10, border: "1px solid #E7E5E4",
            background: "white", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", color: "#78716C",
          }}><Menu className="h-4 w-4" /></button>
          {activeBlock > 0 && (
            <button onClick={() => goToBlock(activeBlock - 1)} style={{
              width: 36, height: 36, borderRadius: 10, border: "1px solid #E7E5E4",
              background: "white", fontSize: 16, fontWeight: 600, color: "#57534E", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>←</button>
          )}
        </div>

        {/* Center: Continue/Finish — PROMINENT & CENTERED */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          {!isLastBlock ? (
            <button onClick={() => advanceWithCelebration(activeBlock)} style={{
              padding: "10px 28px", borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, #0D9488, #14B8A6)",
              fontSize: 15, fontWeight: 700, color: "white",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 4px 14px rgba(13,148,136,0.35)",
              minWidth: 140,
            }}>Continue →</button>
          ) : (
            <button onClick={() => advanceWithCelebration(activeBlock)} style={{
              padding: "10px 28px", borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, #059669, #10B981)",
              fontSize: 15, fontWeight: 700, color: "white",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 4px 14px rgba(5,150,105,0.35)",
              minWidth: 140,
            }}>Finish ✓</button>
          )}
        </div>

        {/* Right: Tools */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <button onClick={() => setShowToolsPopup(!showToolsPopup)} style={{
            width: 36, height: 36, borderRadius: 10, border: "1px solid #E7E5E4",
            background: showToolsPopup ? "#F0FDFA" : "white", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#78716C",
            position: "relative",
          }}><MoreHorizontal className="h-4 w-4" /></button>

          {showToolsPopup && (
            <div style={{
              position: "absolute", bottom: 56, right: 16,
              background: "white", borderRadius: 14, border: "1px solid #E7E5E4",
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)", padding: 8, display: "flex", gap: 4,
              whiteSpace: "nowrap", zIndex: 70,
            }}>
              {[
                { icon: "🗺️", label: "Mindmap" },
                { icon: "✏️", label: "Practice", onClick: scrollToActivity },
                { icon: "📚", label: "Q Bank" },
                { icon: "🔍", label: "Search" },
              ].map(t => (
                <button key={t.label} onClick={() => { t.onClick?.(); setShowToolsPopup(false); }} style={{
                  padding: "8px 12px", borderRadius: 8, border: "none",
                  background: "transparent", fontSize: 12, fontWeight: 600,
                  color: "#57534E", cursor: "pointer", display: "flex",
                  flexDirection: "column", alignItems: "center", gap: 2,
                }}>
                  <span style={{ fontSize: 18 }}>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ SECTIONS BOTTOM SHEET — Two-Track Layout ═══ */}
      {showSectionsSheet && (
        <>
          <div onClick={() => setShowSectionsSheet(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 60 }} />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 61,
            background: "white", borderRadius: "16px 16px 0 0",
            maxHeight: "70vh", overflowY: "auto",
            boxShadow: "0 -10px 40px rgba(0,0,0,0.1)",
            padding: "16px 20px 32px",
          }}>
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

            {/* ═══ 3-PHASE SECTIONS ═══ */}
            {phaseIndices.map((phase, pi) => {
              const phaseDone = phase.indices.filter(i => understoodBlocks.has(i)).length;
              const isPhaseFullyLocked = phase.indices.length > 0 && phase.indices.every(i => isBlockLocked(i));
              
              // Calculate unlock progress message
              let unlockHint = "";
              if (isPhaseFullyLocked && pi === 1) {
                const understandTotal = phaseIndices[0]?.indices?.length ?? 0;
                const understandDone = phaseIndices[0]?.indices?.filter(i => understoodBlocks.has(i)).length ?? 0;
                const remaining = understandTotal - understandDone;
                unlockHint = remaining > 0 ? `Complete ${remaining} more section${remaining > 1 ? "s" : ""} to unlock` : "";
              } else if (isPhaseFullyLocked && pi === 2) {
                const proveTotal = phaseIndices[1]?.indices?.length ?? 0;
                const proveDone = phaseIndices[1]?.indices?.filter(i => understoodBlocks.has(i)).length ?? 0;
                const remaining = proveTotal - proveDone;
                unlockHint = remaining > 0 ? `Complete ${remaining} more section${remaining > 1 ? "s" : ""} to unlock` : "";
              }

              return (
                <div key={phase.id} style={{ marginBottom: 20, opacity: isPhaseFullyLocked ? 0.6 : 1, transition: "opacity 0.3s" }}>
                  {/* Phase header */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8,
                    padding: "8px 12px", borderRadius: 10,
                    background: isPhaseFullyLocked ? "#F5F5F4" : (phase.color === "#0D9488" ? "#F0FDFA" : phase.color === "#3B82F6" ? "#EFF6FF" : "#F5F3FF"),
                    borderTop: `3px solid ${isPhaseFullyLocked ? "#D6D3D1" : phase.color}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {isPhaseFullyLocked && <Lock className="h-3.5 w-3.5" style={{ color: "#A8A29E" }} />}
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: isPhaseFullyLocked ? "#A8A29E" : phase.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          {phase.shortLabel}
                        </span>
                        <p style={{ fontSize: 13, fontWeight: 700, color: isPhaseFullyLocked ? "#78716C" : "#1C1917", margin: "2px 0 0" }}>{phase.label}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#A8A29E" }}>
                      {isPhaseFullyLocked ? <Lock className="h-3 w-3" style={{ color: "#D6D3D1" }} /> : `${phaseDone}/${phase.indices.length}`}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "#78716C", marginBottom: 8 }}>{phase.subtitle}</p>
                  
                  {/* Unlock progress hint */}
                  {unlockHint && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "6px 10px",
                      marginBottom: 8, borderRadius: 8, background: "#FFFBEB",
                      border: "1px solid #FDE68A",
                    }}>
                      <Lock className="h-3 w-3" style={{ color: "#D97706", flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#92400E" }}>{unlockHint}</span>
                    </div>
                  )}

                  {phase.indices.map(i => {
                    const b = navBlocks[i];
                    const isActive = i === activeBlock;
                    const isDone = understoodBlocks.has(i);
                    const locked = isBlockLocked(i);
                    return (
                      <button key={i} onClick={() => { goToBlock(i); if (!locked) setShowSectionsSheet(false); }} style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                        borderRadius: 10, border: locked ? "1px solid #E7E5E4" : isDone ? `1px solid ${phase.color}40` : "1px solid #E7E5E4",
                        textAlign: "left", marginBottom: 4, cursor: locked ? "not-allowed" : "pointer",
                        background: locked ? "#FAFAF9" : isDone ? `${phase.color}08` : isActive ? "#F0FDFA" : "white",
                        transition: "all 0.15s",
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                          background: locked ? "#E7E5E4" : isDone ? phase.color : "#F5F5F4",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: locked ? "#A8A29E" : isDone ? "white" : "#78716C", fontSize: 12, fontWeight: 700,
                        }}>
                          {locked ? <Lock className="h-3 w-3" /> : isDone ? "✓" : b.icon || "•"}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: locked ? "#A8A29E" : "#1C1917" }}>
                            {blockLabels[b.type] || b.title}
                          </div>
                          <div style={{ fontSize: 11, color: "#A8A29E" }}>
                            {locked ? "Locked" : (layerMeta[b.type]?.badge?.split(" ").slice(1).join(" ") || b.type)}
                          </div>
                        </div>
                        {isDone && <span style={{ fontSize: 11, fontWeight: 600, color: phase.color }}>✓ Done</span>}
                        {locked && !isDone && <Lock className="h-3.5 w-3.5" style={{ color: "#D6D3D1" }} />}
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

      {/* Celebration overlay */}
      <SectionCelebration show={showCelebration} onDone={handleCelebrationDone} />

      {/* Modals */}
      <TutorialDefenseModal open={showDefense} onOpenChange={setShowDefense} topic={episode.title} episodeTitle={`${chapter.title} — ${episode.title}`} subject={chapter.title} chapterId={chapterId} episodeId={episodeId} />
      <FirstPrinciplesModal open={showFirstPrinciples} onOpenChange={setShowFirstPrinciples} topic={episode.title} episodeTitle={`${chapter.title} — ${episode.title}`} subject={chapter.title} chapterId={chapterId} episodeId={episodeId} />
    </div>
  );
};

export default TextbookEpisode;
