import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { chapters, ContentBlock, ConceptContent, ActivityContent, RecallContent, ExplainContent, AssessmentContent, ExerciseContent, ReasoningContent, AssumptionsContent, ConnectionsContent, ApplicationContent, ImplicationsContent } from "@/data/textbookData";
import { ArrowLeft, BookOpen, Brain, Briefcase, CheckCircle2, Compass, Eye, Layers, Lightbulb, Link, MessageSquare, Mic, PenLine, Shield, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import VoiceExplainWidget from "@/components/textbook/VoiceExplainWidget";
import ReasoningBlock from "@/components/textbook/ReasoningBlock";
import AssumptionsBlock from "@/components/textbook/AssumptionsBlock";
import ConnectionsBlock from "@/components/textbook/ConnectionsBlock";
import ApplicationBlock from "@/components/textbook/ApplicationBlock";
import ImplicationsBlock from "@/components/textbook/ImplicationsBlock";
import TutorialDefenseModal from "@/components/textbook/TutorialDefenseModal";
import FirstPrinciplesModal from "@/components/textbook/FirstPrinciplesModal";

// ─── Block Renderers (inline, keep simple) ─────────────────

const ConceptBlock = ({ content }: { content: ConceptContent }) => (
  <div className="space-y-5">
    {content.sections.map((s, i) => (
      <div key={i} className={`rounded-xl p-5 ${s.highlight ? "bg-primary/5 border-l-4 border-primary" : "bg-muted/40 border border-border"}`}>
        <h4 className="font-semibold text-foreground mb-3">{s.heading}</h4>
        <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{s.body}</div>
      </div>
    ))}
    {content.keyFormulas && content.keyFormulas.length > 0 && (
      <div className="rounded-xl bg-accent/30 border border-accent p-4">
        <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Key Formulas
        </h4>
        {content.keyFormulas.map((f, i) => (
          <div key={i} className="font-mono text-sm bg-background rounded-lg px-3 py-2 mt-2 text-foreground border">{f}</div>
        ))}
      </div>
    )}
    {content.example && content.example.map((ex, i) => (
      <div key={i} className="rounded-xl border bg-card p-4">
        <p className="text-sm font-medium text-foreground mb-2">📌 {ex.question}</p>
        <p className="text-sm text-muted-foreground whitespace-pre-line">{ex.solution}</p>
      </div>
    ))}
  </div>
);

const ActivityBlock = ({ content }: { content: ActivityContent }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
        <p className="text-sm font-medium text-foreground">{content.instruction}</p>
      </div>
      {content.items?.map((item, i) => (
        <div key={i} className="rounded-xl border bg-card p-4">
          <p className="text-sm font-medium text-foreground mb-2">({i + 1}) {item.value}</p>
          <textarea className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" rows={2} placeholder="Work it out here..." value={answers[i] || ""} onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })} />
        </div>
      ))}
    </div>
  );
};

const RecallBlock = ({ content }: { content: RecallContent }) => {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  return (
    <div className="space-y-3">
      {content.questions.map((q, i) => (
        <div key={i} className="rounded-xl border bg-card p-4">
          <p className="text-sm font-medium text-foreground mb-2">🧠 {q.question}</p>
          {q.hint && !revealed[i] && <p className="text-xs text-muted-foreground italic mb-2">💡 Hint: {q.hint}</p>}
          {revealed[i] ? (
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 mt-2">
              <p className="text-sm text-green-800 dark:text-green-300">{q.answer}</p>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setRevealed({ ...revealed, [i]: true })} className="mt-1">
              <Eye className="h-3.5 w-3.5 mr-1" /> Reveal Answer
            </Button>
          )}
        </div>
      ))}
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
        <p className="text-sm font-medium text-foreground">{content.prompt}</p>
      </div>
      {content.guidePoints && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">💡 Think about:</p>
          <ul className="space-y-1">
            {content.guidePoints.map((p, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-primary mt-0.5">•</span> {p}</li>
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
          <textarea className="w-full rounded-xl border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[120px]" placeholder="Write your explanation here..." value={text} onChange={(e) => setText(e.target.value)} />
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
            <p className="text-sm font-medium text-foreground mb-3">Q{qi + 1}. {q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                let optClass = "border bg-background hover:border-primary/40";
                if (selected[qi] === oi && !isSubmitted) optClass = "border-primary bg-primary/5";
                if (isSubmitted && oi === q.correctIndex) optClass = "border-green-500 bg-green-50 dark:bg-green-950/30";
                if (isSubmitted && selected[qi] === oi && oi !== q.correctIndex) optClass = "border-red-500 bg-red-50 dark:bg-red-950/30";
                return (
                  <button key={oi} onClick={() => handleSelect(qi, oi)} className={`w-full text-left rounded-lg px-4 py-3 text-sm transition-all flex items-center gap-3 ${optClass}`}>
                    <span className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{String.fromCharCode(65 + oi)}</span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {selected[qi] !== undefined && !isSubmitted && <Button size="sm" className="mt-3" onClick={() => handleSubmit(qi)}>Check Answer</Button>}
            {isSubmitted && (
              <div className={`mt-3 rounded-lg p-3 text-sm ${isCorrect ? "bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"}`}>
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
      <div className="rounded-lg bg-muted/40 px-4 py-2 text-xs text-muted-foreground">📖 {content.source}</div>
      {content.problems.map((p, i) => (
        <div key={i} className="rounded-xl border bg-card p-4">
          <p className="text-sm text-foreground"><span className="font-semibold">{p.number}.</span> {p.text}</p>
          {p.answer && (
            <div className="mt-2">
              {showAnswer[i] ? (
                <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-2 text-sm text-green-800 dark:text-green-300">Answer: {p.answer}</div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setShowAnswer({ ...showAnswer, [i]: true })}><Eye className="h-3.5 w-3.5 mr-1" /> Show Answer</Button>
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
  concept: "Learn", activity: "Do", recall: "Recall", explain: "Explain",
  assessment: "Test", exercise: "Practice", reasoning: "Why?",
  assumptions: "Challenge", connections: "Connect", application: "Apply",
  implications: "Reflect",
};

const layerMeta: Record<string, { bg: string; badge?: string; badgeColor?: string; dotColor: string }> = {
  concept:     { bg: "", dotColor: "bg-primary" },
  activity:    { bg: "", dotColor: "bg-primary" },
  recall:      { bg: "", dotColor: "bg-primary" },
  explain:     { bg: "", dotColor: "bg-primary" },
  assessment:  { bg: "", dotColor: "bg-primary" },
  exercise:    { bg: "", dotColor: "bg-primary" },
  reasoning:   { bg: "bg-amber-50 dark:bg-amber-950/20",   badge: "LAYER 3 · Reasoning",   badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", dotColor: "bg-amber-500" },
  assumptions: { bg: "bg-sky-50 dark:bg-sky-950/20",       badge: "LAYER 4 · Assumptions",  badgeColor: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300", dotColor: "bg-sky-500" },
  connections: { bg: "bg-emerald-50 dark:bg-emerald-950/20", badge: "LAYER 5 · Connections", badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300", dotColor: "bg-emerald-500" },
  application: { bg: "bg-amber-50 dark:bg-amber-950/20",   badge: "LAYER 6 · Application",  badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", dotColor: "bg-amber-500" },
  implications:{ bg: "bg-indigo-50 dark:bg-indigo-950/20",  badge: "LAYER 7 · Implications", badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300", dotColor: "bg-indigo-500" },
};

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

  const chapter = chapters.find((c) => c.id === chapterId);
  const episode = chapter?.episodes.find((e) => e.id === episodeId);

  // Find next episode
  const currentEpisodeIndex = chapter?.episodes.findIndex((e) => e.id === episodeId) ?? -1;
  const nextEpisode = chapter?.episodes[currentEpisodeIndex + 1];

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
    if (!episode) return;
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

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case "concept": return <ConceptBlock content={block.content as ConceptContent} />;
      case "activity": return <ActivityBlock content={block.content as ActivityContent} />;
      case "recall": return <RecallBlock content={block.content as RecallContent} />;
      case "explain": return <ExplainBlock content={block.content as ExplainContent} />;
      case "assessment": return <AssessmentBlock content={block.content as AssessmentContent} />;
      case "exercise": return <ExerciseBlock content={block.content as ExerciseContent} />;
      case "reasoning": return <ReasoningBlock content={block.content as ReasoningContent} />;
      case "assumptions": return <AssumptionsBlock content={block.content as AssumptionsContent} />;
      case "connections": return <ConnectionsBlock content={block.content as ConnectionsContent} />;
      case "application": return <ApplicationBlock content={block.content as ApplicationContent} />;
      case "implications": return <ImplicationsBlock content={block.content as ImplicationsContent} />;
      default: return null;
    }
  };

  const defaultMeta = { bg: "", dotColor: "bg-primary" } as const;

  return (
    <PageLayout role="student">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted">
        <div className="h-full bg-primary transition-all duration-150" style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* Floating Layer Sidebar — Desktop only */}
      <div className={`fixed top-1/2 -translate-y-1/2 z-40 transition-all duration-300 hidden lg:block ${sidebarOpen ? "left-4" : "-left-1"}`}>
        {/* Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-8 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          title={sidebarOpen ? "Hide navigation" : "Show navigation"}
        >
          {sidebarOpen ? (
            <ArrowLeft className="h-3.5 w-3.5" />
          ) : (
            <Layers className="h-3.5 w-3.5" />
          )}
        </button>

        {sidebarOpen && (
          <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-lg p-3 w-44">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">Layers</p>
            <div className="space-y-0.5">
              {episode.blocks.map((block, i) => {
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

        {/* All Blocks — Scrollable */}
        <div className="space-y-0">
          {episode.blocks.map((block, i) => {
            const meta = layerMeta[block.type] || defaultMeta;
            const BlockIcon = blockIcons[block.type] || BookOpen;

            return (
              <div
                key={i}
                ref={(el) => { blockRefs.current[i] = el; }}
                className={`rounded-2xl p-6 mb-5 ${meta.bg || "bg-card"} border border-border scroll-mt-24`}
              >
                {/* Layer Badge */}
                {"badge" in meta && meta.badge && (
                  <span className={`inline-block text-[11px] font-bold tracking-wide px-3 py-1 rounded-full mb-4 ${"badgeColor" in meta ? meta.badgeColor : ""}`}>
                    {meta.badge}
                  </span>
                )}

                {/* Block Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <BlockIcon className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="font-semibold text-foreground text-lg">{block.icon} {block.title}</h2>
                </div>

                {/* Block Content */}
                {renderBlock(block)}
              </div>
            );
          })}
        </div>

        {/* Completion Actions */}
        <div className="mt-10 mb-8 rounded-2xl bg-muted/50 border border-border p-8 text-center">
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

      {/* Modals */}
      <TutorialDefenseModal open={showDefense} onOpenChange={setShowDefense} topic={episode.title} episodeTitle={`${chapter.title} — ${episode.title}`} />
      <FirstPrinciplesModal open={showFirstPrinciples} onOpenChange={setShowFirstPrinciples} topic={episode.title} episodeTitle={`${chapter.title} — ${episode.title}`} />
    </PageLayout>
  );
};

export default TextbookEpisode;
