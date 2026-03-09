import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { chapters, ContentBlock, ConceptContent, ActivityContent, RecallContent, ExplainContent, AssessmentContent, ExerciseContent, ReasoningContent, AssumptionsContent, ConnectionsContent, ApplicationContent, ImplicationsContent } from "@/data/textbookData";
import { ArrowLeft, ArrowRight, BookOpen, Brain, Briefcase, CheckCircle2, ChevronRight, Compass, Eye, EyeOff, Layers, Lightbulb, Link, MessageSquare, Mic, PenLine, Shield, Sparkles, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import VoiceExplainWidget from "@/components/textbook/VoiceExplainWidget";
import ReasoningBlock from "@/components/textbook/ReasoningBlock";
import AssumptionsBlock from "@/components/textbook/AssumptionsBlock";
import ConnectionsBlock from "@/components/textbook/ConnectionsBlock";
import ApplicationBlock from "@/components/textbook/ApplicationBlock";
import ImplicationsBlock from "@/components/textbook/ImplicationsBlock";
import TutorialDefenseModal from "@/components/textbook/TutorialDefenseModal";
import FirstPrinciplesModal from "@/components/textbook/FirstPrinciplesModal";

// ─── Block Renderers ───────────────────────────────────────

const ConceptBlock = ({ content }: { content: ConceptContent }) => (
  <div className="space-y-5">
    {content.sections.map((s, i) => (
      <div
        key={i}
        className={`rounded-xl p-5 ${
          s.highlight ? "bg-primary/5 border-l-4 border-primary" : "bg-muted/40 border border-border"
        }`}
      >
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
          <div key={i} className="font-mono text-sm bg-background rounded-lg px-3 py-2 mt-2 text-foreground border">
            {f}
          </div>
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
          <textarea
            className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            rows={2}
            placeholder="Work it out here..."
            value={answers[i] || ""}
            onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
          />
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
          {q.hint && !revealed[i] && (
            <p className="text-xs text-muted-foreground italic mb-2">💡 Hint: {q.hint}</p>
          )}
          {revealed[i] ? (
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 mt-2">
              <p className="text-sm text-green-800 dark:text-green-300">{q.answer}</p>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRevealed({ ...revealed, [i]: true })}
              className="mt-1"
            >
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
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span> {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setMode("voice")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            mode === "voice" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mic className="h-3.5 w-3.5" /> Speak It
        </button>
        <button
          onClick={() => setMode("text")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            mode === "text" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <PenLine className="h-3.5 w-3.5" /> Write It
        </button>
      </div>

      {mode === "voice" ? (
        <VoiceExplainWidget
          topic="Real Numbers — Chapter 1"
          prompt={content.prompt}
          guidePoints={content.guidePoints}
          onTranscript={(t) => setText(t)}
        />
      ) : (
        <div>
          <textarea
            className="w-full rounded-xl border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[120px]"
            placeholder="Write your explanation here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted-foreground">{wordCount} words</span>
            {content.wordLimit && (
              <span className={`text-xs ${wordCount > content.wordLimit ? "text-destructive" : "text-muted-foreground"}`}>
                Limit: {content.wordLimit}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AssessmentBlock = ({ content }: { content: AssessmentContent }) => {
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});

  const handleSelect = (qi: number, oi: number) => {
    if (submitted[qi]) return;
    setSelected({ ...selected, [qi]: oi });
  };

  const handleSubmit = (qi: number) => {
    setSubmitted({ ...submitted, [qi]: true });
  };

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
                  <button
                    key={oi}
                    onClick={() => handleSelect(qi, oi)}
                    className={`w-full text-left rounded-lg px-4 py-3 text-sm transition-all flex items-center gap-3 ${optClass}`}
                  >
                    <span className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {selected[qi] !== undefined && !isSubmitted && (
              <Button size="sm" className="mt-3" onClick={() => handleSubmit(qi)}>
                Check Answer
              </Button>
            )}
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
      <div className="rounded-lg bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
        📖 {content.source}
      </div>
      {content.problems.map((p, i) => (
        <div key={i} className="rounded-xl border bg-card p-4">
          <p className="text-sm text-foreground">
            <span className="font-semibold">{p.number}.</span> {p.text}
          </p>
          {p.answer && (
            <div className="mt-2">
              {showAnswer[i] ? (
                <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-2 text-sm text-green-800 dark:text-green-300">
                  Answer: {p.answer}
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setShowAnswer({ ...showAnswer, [i]: true })}>
                  <Eye className="h-3.5 w-3.5 mr-1" /> Show Answer
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Block Icon Map ─────────────────────────────────────────

const blockIcons: Record<string, React.ElementType> = {
  concept: BookOpen,
  activity: PenLine,
  recall: Brain,
  explain: MessageSquare,
  assessment: CheckCircle2,
  exercise: Lightbulb,
  reasoning: Zap,
  assumptions: Shield,
  connections: Link,
  application: Briefcase,
  implications: Compass,
};

const blockLabels: Record<string, string> = {
  concept: "Learn",
  activity: "Do",
  recall: "Recall",
  explain: "Explain",
  assessment: "Test",
  exercise: "Practice",
  reasoning: "Why?",
  assumptions: "Challenge",
  connections: "Connect",
  application: "Apply",
  implications: "Reflect",
};

// ─── Main Component ─────────────────────────────────────────

const TextbookEpisode = () => {
  const { chapterId, episodeId } = useParams();
  const navigate = useNavigate();
  const [currentBlock, setCurrentBlock] = useState(0);
  const [showDefense, setShowDefense] = useState(false);
  const [showFirstPrinciples, setShowFirstPrinciples] = useState(false);

  const chapter = chapters.find((c) => c.id === chapterId);
  const episode = chapter?.episodes.find((e) => e.id === episodeId);

  if (!chapter || !episode) {
    return (
      <PageLayout role="student">
        <div className="text-center py-20">
          <p className="text-muted-foreground">Episode not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/student/textbook")}>
            Back to Textbook
          </Button>
        </div>
      </PageLayout>
    );
  }

  const block = episode.blocks[currentBlock];
  const progressPct = ((currentBlock + 1) / episode.blocks.length) * 100;
  const BlockIcon = blockIcons[block.type] || BookOpen;

  const renderBlock = () => {
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

  const isLastBlock = currentBlock === episode.blocks.length - 1;

  return (
    <PageLayout role="student">
      <div className="max-w-3xl mx-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(`/student/textbook/${chapterId}`)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> {chapter.title}
          </button>
          <span className="text-xs text-muted-foreground">
            Episode {episode.number} · {episode.duration}
          </span>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground font-medium">
              {currentBlock + 1} of {episode.blocks.length} blocks
            </span>
            <span className="text-xs text-primary font-semibold">{Math.round(progressPct)}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />

          {/* Block Nav Pills */}
          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
            {episode.blocks.map((b, i) => {
              const Icon = blockIcons[b.type] || BookOpen;
              return (
                <button
                  key={i}
                  onClick={() => setCurrentBlock(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    i === currentBlock
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {blockLabels[b.type]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Block Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <BlockIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{block.icon} {block.title}</h2>
            <p className="text-xs text-muted-foreground capitalize">{block.type} Block</p>
          </div>
        </div>

        {/* Block Content */}
        <div className="mb-8">{renderBlock()}</div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentBlock(Math.max(0, currentBlock - 1))}
            disabled={currentBlock === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Previous
          </Button>

          {!isLastBlock ? (
            <Button
              size="sm"
              onClick={() => setCurrentBlock(currentBlock + 1)}
            >
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDefense(true)}
                className="border-primary/30 text-primary hover:bg-primary/5"
              >
                <Shield className="h-4 w-4 mr-1" /> Tutorial Defense
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFirstPrinciples(true)}
                className="border-accent text-foreground hover:bg-accent/10"
              >
                <Layers className="h-4 w-4 mr-1" /> First Principles
              </Button>
              <Button
                size="sm"
                onClick={() => navigate(`/student/textbook/${chapterId}`)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" /> Complete
              </Button>
            </div>
          )}
        </div>

        {/* Modals */}
        <TutorialDefenseModal
          open={showDefense}
          onOpenChange={setShowDefense}
          topic={episode.title}
          episodeTitle={`${chapter.title} — ${episode.title}`}
        />
        <FirstPrinciplesModal
          open={showFirstPrinciples}
          onOpenChange={setShowFirstPrinciples}
          topic={episode.title}
          episodeTitle={`${chapter.title} — ${episode.title}`}
        />
      </div>
    </PageLayout>
  );
};

export default TextbookEpisode;
