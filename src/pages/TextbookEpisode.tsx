import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { chapters, ContentBlock, ConceptContent, ActivityContent, RecallContent, ExplainContent, AssessmentContent, ExerciseContent, ReasoningContent, AssumptionsContent, ConnectionsContent, ApplicationContent, ImplicationsContent } from "@/data/textbookData";
import { ArrowLeft, BookOpen, Brain, Briefcase, CheckCircle2, Compass, Eye, Layers, Lightbulb, Link, MessageSquare, Mic, PenLine, Shield, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import VoiceExplainWidget from "@/components/textbook/VoiceExplainWidget";
import TutorialDefenseModal from "@/components/textbook/TutorialDefenseModal";
import FirstPrinciplesModal from "@/components/textbook/FirstPrinciplesModal";

// ─── Layer Config ───────────────────────────────────────────

const blockIcons: Record<string, React.ElementType> = {
  concept: BookOpen, activity: PenLine, recall: Brain, explain: MessageSquare,
  assessment: CheckCircle2, exercise: Lightbulb, reasoning: Zap, assumptions: Shield,
  connections: Link, application: Briefcase, implications: Compass,
};

const blockLabels: Record<string, string> = {
  concept: "Learn", activity: "Do", recall: "Recall", explain: "Explain",
  assessment: "Test", exercise: "Practice", reasoning: "Why?",
  assumptions: "Challenge", connections: "Connect", application: "Apply",
  implications: "Reflect",
};

interface LayerStyle {
  bg: string;
  iconGradient: string;
  badge?: string;
  dotColor: string;
}

const layerStyles: Record<string, LayerStyle> = {
  concept:      { bg: "", iconGradient: "from-primary to-accent", dotColor: "bg-primary" },
  activity:     { bg: "", iconGradient: "from-primary to-accent", dotColor: "bg-primary" },
  recall:       { bg: "", iconGradient: "from-primary to-accent", dotColor: "bg-primary" },
  explain:      { bg: "", iconGradient: "from-primary to-accent", dotColor: "bg-primary" },
  assessment:   { bg: "", iconGradient: "from-primary to-accent", dotColor: "bg-primary" },
  exercise:     { bg: "", iconGradient: "from-primary to-accent", dotColor: "bg-primary" },
  reasoning:    { bg: "bg-amber-50/60 dark:bg-amber-950/10", iconGradient: "from-amber-500 to-orange-500", badge: "LAYER 3", dotColor: "bg-amber-500" },
  assumptions:  { bg: "bg-sky-50/60 dark:bg-sky-950/10", iconGradient: "from-sky-500 to-blue-500", badge: "LAYER 4", dotColor: "bg-sky-500" },
  connections:  { bg: "bg-emerald-50/60 dark:bg-emerald-950/10", iconGradient: "from-emerald-500 to-teal-500", badge: "LAYER 5", dotColor: "bg-emerald-500" },
  application:  { bg: "bg-orange-50/60 dark:bg-orange-950/10", iconGradient: "from-orange-500 to-amber-500", badge: "LAYER 6", dotColor: "bg-orange-500" },
  implications: { bg: "bg-indigo-50/60 dark:bg-indigo-950/10", iconGradient: "from-indigo-500 to-purple-500", badge: "LAYER 7", dotColor: "bg-indigo-500" },
};

const defaultStyle: LayerStyle = { bg: "", iconGradient: "from-primary to-accent", dotColor: "bg-primary" };

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

  const chapter = chapters.find((c) => c.id === chapterId);
  const episode = chapter?.episodes.find((e) => e.id === episodeId);
  const currentEpisodeIndex = chapter?.episodes.findIndex((e) => e.id === episodeId) ?? -1;
  const nextEpisode = chapter?.episodes[currentEpisodeIndex + 1];

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!episode) return;
    const observers: IntersectionObserver[] = [];
    blockRefs.current.forEach((ref, index) => {
      if (!ref) return;
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveBlock(index); },
        { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
      );
      observer.observe(ref);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [episode]);

  const scrollToBlock = useCallback((index: number) => {
    blockRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

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

  return (
    <PageLayout role="student">
      {/* Scroll Progress */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted">
        <div className="h-full bg-primary transition-all duration-150" style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* Floating Sidebar — Desktop */}
      <div className={`fixed top-1/2 -translate-y-1/2 z-40 transition-all duration-300 hidden lg:block ${sidebarOpen ? "left-4" : "-left-1"}`}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute -right-8 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          {sidebarOpen ? <ArrowLeft className="h-3.5 w-3.5" /> : <Layers className="h-3.5 w-3.5" />}
        </button>
        {sidebarOpen && (
          <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-lg p-3 w-44">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">Layers</p>
            <div className="space-y-0.5">
              {episode.blocks.map((block, i) => {
                const style = layerStyles[block.type] || defaultStyle;
                const Icon = blockIcons[block.type] || BookOpen;
                const isActive = i === activeBlock;
                const isPast = i < activeBlock;
                return (
                  <button key={i} onClick={() => scrollToBlock(i)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all text-xs ${isActive ? "bg-primary/10 text-foreground font-medium" : isPast ? "text-muted-foreground/70" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
                    <span className={`h-2 w-2 rounded-full shrink-0 transition-all ${isActive ? style.dotColor + " scale-125" : isPast ? "bg-primary/30" : "bg-border"}`} />
                    <Icon className="h-3 w-3 shrink-0" />
                    <span className="truncate">{blockLabels[block.type] || block.type}</span>
                    {isActive && <span className="ml-auto h-1 w-1 rounded-full bg-primary animate-pulse" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Sticky Header */}
        <div className="sticky top-1 z-40 bg-background/95 backdrop-blur-sm pb-3 pt-2 border-b border-border mb-6">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(`/student/textbook/${chapterId}`)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> {chapter.title}
            </button>
            <span className="text-xs text-muted-foreground">Episode {episode.number} · {episode.duration}</span>
          </div>
          <h1 className="text-xl font-bold text-foreground mt-2">{episode.title}</h1>
          <p className="text-sm text-muted-foreground">{episode.subtitle}</p>
        </div>

        {/* All Blocks — Flat Sections */}
        {episode.blocks.map((block, i) => {
          const style = layerStyles[block.type] || defaultStyle;
          const Icon = blockIcons[block.type] || BookOpen;

          return (
            <div
              key={i}
              ref={(el) => { blockRefs.current[i] = el; }}
              className={`py-8 px-6 border-b border-border scroll-mt-24 ${style.bg}`}
            >
              {/* Layer Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${style.iconGradient} flex items-center justify-center shrink-0`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  {style.badge && (
                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{style.badge}</p>
                  )}
                  <h2 className="text-lg font-bold text-foreground">{block.title}</h2>
                </div>
              </div>

              {/* Inline Block Content */}
              <InlineBlockContent block={block} />
            </div>
          );
        })}

        {/* Completion Actions */}
        <div className="py-12 px-6 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">🎉 Episode Complete!</h2>
          <p className="text-sm text-muted-foreground mb-8">Choose your next step to deepen understanding</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <button onClick={() => setShowDefense(true)} className="bg-card border-2 border-border hover:border-primary rounded-xl p-6 text-center transition-all hover:-translate-y-1">
              <div className="text-4xl mb-3">🎓</div>
              <h3 className="font-bold text-foreground mb-1">Tutorial Defense</h3>
              <p className="text-xs text-muted-foreground">Oxford-style challenge · 5 min</p>
            </button>
            <button onClick={() => setShowFirstPrinciples(true)} className="bg-card border-2 border-border hover:border-primary rounded-xl p-6 text-center transition-all hover:-translate-y-1">
              <div className="text-4xl mb-3">💡</div>
              <h3 className="font-bold text-foreground mb-1">First Principles</h3>
              <p className="text-xs text-muted-foreground">Strip & rebuild · 10 min</p>
            </button>
            <button onClick={() => navigate("/student/dashboard")} className="bg-card border-2 border-border hover:border-primary rounded-xl p-6 text-center transition-all hover:-translate-y-1">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="font-bold text-foreground mb-1">View Growth</h3>
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

      <TutorialDefenseModal open={showDefense} onOpenChange={setShowDefense} topic={episode.title} episodeTitle={`${chapter.title} — ${episode.title}`} />
      <FirstPrinciplesModal open={showFirstPrinciples} onOpenChange={setShowFirstPrinciples} topic={episode.title} episodeTitle={`${chapter.title} — ${episode.title}`} />
    </PageLayout>
  );
};

// ─── Inline Block Renderer ──────────────────────────────────
// Flat, minimal rendering — no card wrappers, matching HTML reference

const InlineBlockContent = ({ block }: { block: ContentBlock }) => {
  switch (block.type) {
    case "concept": return <InlineConcept content={block.content as ConceptContent} />;
    case "activity": return <InlineActivity content={block.content as ActivityContent} />;
    case "recall": return <InlineRecall content={block.content as RecallContent} />;
    case "explain": return <InlineExplain content={block.content as ExplainContent} />;
    case "assessment": return <InlineAssessment content={block.content as AssessmentContent} />;
    case "exercise": return <InlineExercise content={block.content as ExerciseContent} />;
    case "reasoning": return <InlineReasoning content={block.content as ReasoningContent} />;
    case "assumptions": return <InlineAssumptions content={block.content as AssumptionsContent} />;
    case "connections": return <InlineConnections content={block.content as ConnectionsContent} />;
    case "application": return <InlineApplication content={block.content as ApplicationContent} />;
    case "implications": return <InlineImplications content={block.content as ImplicationsContent} />;
    default: return null;
  }
};

// ─── Concept ────────────────────────────────────────────────
const InlineConcept = ({ content }: { content: ConceptContent }) => (
  <div className="space-y-4">
    {content.sections.map((s, i) => (
      <div key={i} className={s.highlight ? "border-l-4 border-primary bg-muted/40 rounded-lg p-5" : ""}>
        <h4 className="font-semibold text-foreground mb-2">{s.heading}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{s.body}</p>
      </div>
    ))}
    {content.keyFormulas?.map((f, i) => (
      <div key={i} className="text-center py-3 px-4 bg-muted/50 rounded-lg">
        <span className="font-mono text-base text-primary font-semibold">{f}</span>
      </div>
    ))}
  </div>
);

// ─── Activity ───────────────────────────────────────────────
const InlineActivity = ({ content }: { content: ActivityContent }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground font-medium">{content.instruction}</p>
      {content.items?.map((item, i) => (
        <div key={i} className="space-y-1">
          <p className="text-sm text-foreground">({i + 1}) {item.value}</p>
          <textarea className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={2} placeholder="Work it out here..." value={answers[i] || ""} onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })} />
        </div>
      ))}
    </div>
  );
};

// ─── Recall ─────────────────────────────────────────────────
const InlineRecall = ({ content }: { content: RecallContent }) => {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  return (
    <div className="space-y-4">
      {content.questions.map((q, i) => (
        <div key={i} className="space-y-2">
          <p className="text-sm font-medium text-foreground">🧠 {q.question}</p>
          {q.hint && !revealed[i] && <p className="text-xs text-muted-foreground italic">💡 Hint: {q.hint}</p>}
          {revealed[i] ? (
            <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
              <p className="text-sm text-green-800 dark:text-green-300">{q.answer}</p>
            </div>
          ) : (
            <button onClick={() => setRevealed({ ...revealed, [i]: true })} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Eye className="h-3 w-3" /> Reveal Answer
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Explain ────────────────────────────────────────────────
const InlineExplain = ({ content }: { content: ExplainContent }) => {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"text" | "voice">("voice");
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-foreground">{content.prompt}</p>
      {content.guidePoints && (
        <div className="border-l-4 border-primary bg-muted/40 rounded-lg p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">💡 Think about:</p>
          <ul className="space-y-1">
            {content.guidePoints.map((p, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-primary">•</span> {p}</li>
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
          <textarea className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[120px]" placeholder="Write your explanation here..." value={text} onChange={(e) => setText(e.target.value)} />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted-foreground">{wordCount} words</span>
            {content.wordLimit && <span className={`text-xs ${wordCount > content.wordLimit ? "text-destructive" : "text-muted-foreground"}`}>Limit: {content.wordLimit}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Assessment ─────────────────────────────────────────────
const InlineAssessment = ({ content }: { content: AssessmentContent }) => {
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  return (
    <div className="space-y-5">
      {content.questions.map((q, qi) => {
        const isSubmitted = submitted[qi];
        const isCorrect = selected[qi] === q.correctIndex;
        return (
          <div key={qi} className="space-y-2">
            <p className="text-sm font-medium text-foreground">Q{qi + 1}. {q.question}</p>
            <div className="space-y-1.5">
              {q.options.map((opt, oi) => {
                let cls = "border border-input bg-background hover:border-primary/40";
                if (selected[qi] === oi && !isSubmitted) cls = "border-primary bg-primary/5";
                if (isSubmitted && oi === q.correctIndex) cls = "border-green-500 bg-green-50 dark:bg-green-950/30";
                if (isSubmitted && selected[qi] === oi && oi !== q.correctIndex) cls = "border-destructive bg-red-50 dark:bg-red-950/30";
                return (
                  <button key={oi} onClick={() => { if (!isSubmitted) setSelected({ ...selected, [qi]: oi }); }} className={`w-full text-left rounded-lg px-4 py-2.5 text-sm transition-all flex items-center gap-3 ${cls}`}>
                    <span className="h-6 w-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold shrink-0">{String.fromCharCode(65 + oi)}</span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {selected[qi] !== undefined && !isSubmitted && (
              <button onClick={() => setSubmitted({ ...submitted, [qi]: true })} className="text-xs font-medium text-primary hover:underline">Check Answer →</button>
            )}
            {isSubmitted && (
              <div className={`border-l-4 rounded-lg p-3 text-sm ${isCorrect ? "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300" : "border-destructive bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300"}`}>
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

// ─── Exercise ───────────────────────────────────────────────
const InlineExercise = ({ content }: { content: ExerciseContent }) => {
  const [showAnswer, setShowAnswer] = useState<Record<number, boolean>>({});
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">📖 {content.source}</p>
      {content.problems.map((p, i) => (
        <div key={i} className="space-y-1">
          <p className="text-sm text-foreground"><span className="font-semibold">{p.number}.</span> {p.text}</p>
          {p.answer && (
            showAnswer[i] ? (
              <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-950/30 rounded-lg p-2 text-sm text-green-800 dark:text-green-300">Answer: {p.answer}</div>
            ) : (
              <button onClick={() => setShowAnswer({ ...showAnswer, [i]: true })} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Eye className="h-3 w-3" /> Show Answer
              </button>
            )
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Layer 3: Reasoning ─────────────────────────────────────
const InlineReasoning = ({ content }: { content: ReasoningContent }) => {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  return (
    <div className="space-y-5">
      <div className="border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg p-4">
        <p className="text-sm font-semibold text-foreground">{content.centralQuestion}</p>
      </div>
      {content.whyQuestions.map((q, i) => (
        <div key={i} className="space-y-2">
          <p className="text-sm font-medium text-foreground flex items-start gap-2">
            <span className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">?</span>
            {q.question}
          </p>
          {q.hint && !revealed[i] && (
            <p className="text-xs text-muted-foreground italic ml-8">💡 Hint: {q.hint}</p>
          )}
          {revealed[i] ? (
            <div className="ml-8 border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
              <p className="text-sm text-amber-800 dark:text-amber-300">{q.deeperInsight}</p>
            </div>
          ) : (
            <button onClick={() => setRevealed({ ...revealed, [i]: true })} className="ml-8 text-xs text-amber-600 hover:underline flex items-center gap-1">
              <Eye className="h-3 w-3" /> Think first, then reveal
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Layer 4: Assumptions ───────────────────────────────────
const InlineAssumptions = ({ content }: { content: AssumptionsContent }) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [showDefense, setShowDefense] = useState(false);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">These are beliefs most students hold without questioning. Can you spot the flaw?</p>
      {content.hiddenAssumptions.map((a, i) => (
        <div key={i} className="space-y-2">
          <button onClick={() => setExpanded({ ...expanded, [i]: !expanded[i] })} className="w-full text-left text-sm font-medium text-foreground hover:text-primary transition-colors flex items-start gap-2">
            <span className="h-6 w-6 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
            "{a.assumption}"
          </button>
          {expanded[i] && (
            <div className="ml-8 space-y-2">
              <div className="border-l-4 border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg p-3">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Why this matters:</p>
                <p className="text-sm text-amber-800 dark:text-amber-300">{a.whyItMatters}</p>
              </div>
              <div className="border-l-4 border-primary bg-muted/40 rounded-lg p-3">
                <p className="text-xs font-semibold text-primary mb-1">🎯 Challenge:</p>
                <p className="text-sm text-foreground">{a.challenge}</p>
              </div>
            </div>
          )}
        </div>
      ))}
      {/* Defense Prompt */}
      <div className="border-l-4 border-primary bg-muted/30 rounded-lg p-5 mt-4">
        <p className="text-sm font-semibold text-foreground mb-1">🎓 Oxford Tutorial Defense</p>
        <p className="text-sm text-muted-foreground mb-3">{content.defensePrompt}</p>
        {showDefense ? (
          <textarea className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]" placeholder="Write your defense here..." />
        ) : (
          <button onClick={() => setShowDefense(true)} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
            <Shield className="h-3.5 w-3.5" /> Accept the Challenge
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Layer 5: Connections ───────────────────────────────────
const InlineConnections = ({ content }: { content: ConnectionsContent }) => (
  <div className="space-y-4">
    <p className="text-sm text-muted-foreground">Great thinkers see patterns across different fields. Can you?</p>
    <div className="grid gap-3 sm:grid-cols-2">
      {content.connections.map((c, i) => (
        <div key={i} className="border border-border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{c.icon}</span>
            <span className="text-sm font-semibold text-foreground">{c.domain}</span>
          </div>
          <p className="text-sm text-foreground mb-1">{c.link}</p>
          <p className="text-xs text-muted-foreground italic">{c.explanation}</p>
        </div>
      ))}
    </div>
  </div>
);

// ─── Layer 6: Application ───────────────────────────────────
const InlineApplication = ({ content }: { content: ApplicationContent }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showWhy, setShowWhy] = useState(false);
  return (
    <div className="space-y-4">
      <div className="border-l-4 border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 rounded-lg p-4">
        <p className="text-sm font-bold text-foreground mb-1">{content.scenario}</p>
        <p className="text-sm text-muted-foreground">{content.context}</p>
      </div>
      {content.questions.map((q, i) => (
        <div key={i} className="space-y-1">
          <p className="text-sm font-medium text-foreground flex items-start gap-2">
            <span className="h-6 w-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
            {q.question}
          </p>
          {q.hint && <p className="text-xs text-muted-foreground italic ml-8">💡 {q.hint}</p>}
          <textarea className="w-full ml-8 max-w-[calc(100%-2rem)] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={2} placeholder="Work it out here..." value={answers[i] || ""} onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })} />
        </div>
      ))}
      <div className="border-l-4 border-dashed border-accent bg-accent/10 rounded-lg p-4">
        {showWhy ? (
          <div>
            <p className="text-xs font-semibold text-primary mb-1">🌍 Why this matters in real life:</p>
            <p className="text-sm text-foreground">{content.realWorldWhy}</p>
          </div>
        ) : (
          <button onClick={() => setShowWhy(true)} className="text-xs text-primary hover:underline flex items-center gap-1">
            <Eye className="h-3 w-3" /> Why does this matter?
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Layer 7: Implications ──────────────────────────────────
const InlineImplications = ({ content }: { content: ImplicationsContent }) => {
  const [essay, setEssay] = useState("");
  const wordCount = essay.trim().split(/\s+/).filter(Boolean).length;
  return (
    <div className="space-y-5">
      <div className="border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg p-4">
        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">🔮 The Big Question</p>
        <p className="text-base font-semibold text-foreground">{content.whatIfQuestion}</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Think about these:</p>
        {content.reflectionPrompts.map((p, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-foreground">
            <span className="text-primary shrink-0">→</span> {p}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{content.essayPrompt}</p>
        <textarea className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[140px]" placeholder="Write your reflection here..." value={essay} onChange={(e) => setEssay(e.target.value)} />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">{wordCount} words</span>
          {content.wordLimit && (
            <span className={`text-xs ${wordCount > content.wordLimit ? "text-destructive" : "text-muted-foreground"}`}>Limit: {content.wordLimit}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextbookEpisode;
