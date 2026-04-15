import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Sparkles, ChevronRight, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import IconSelectionQuiz, { type QuizIcon } from "@/components/textbook/IconSelectionQuiz";

/* ── Types ── */
interface VisualStep {
  step_number: number;
  title: string;
  explanation: string;
  image_url?: string;
  emoji: string;
}

interface QuizData {
  question: string;
  icons: QuizIcon[];
}

/* ── Preset concepts for quick demo ── */
const PRESETS = [
  { label: "Photosynthesis", topic: "How do plants make food through photosynthesis?", subject: "Biology" },
  { label: "Electric Circuit", topic: "How does an electric circuit work?", subject: "Physics" },
  { label: "Quadratic Equations", topic: "How do quadratic equations work?", subject: "Mathematics" },
  { label: "Acids & Bases", topic: "How do acids and bases neutralize each other?", subject: "Chemistry" },
];

const STEP_STYLES = [
  { bg: "bg-sky-50 dark:bg-sky-950/30", border: "border-sky-200 dark:border-sky-800", accent: "text-sky-700 dark:text-sky-300", pill: "bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200" },
  { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", accent: "text-amber-700 dark:text-amber-300", pill: "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200" },
  { bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-800", accent: "text-violet-700 dark:text-violet-300", pill: "bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-200" },
  { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", accent: "text-emerald-700 dark:text-emerald-300", pill: "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200" },
];

/* ── Main Component ── */
const VisualReasoningDemo = () => {
  const [topic, setTopic] = useState("");
  const [activeTopic, setActiveTopic] = useState("");
  const [steps, setSteps] = useState<VisualStep[]>([]);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const generate = async (t: string, subject = "Science") => {
    if (!t.trim()) return;
    setTopic(t);
    setActiveTopic(t);
    setLoading(true);
    setSteps([]);
    setQuiz(null);
    setQuizCompleted(false);
    setExpandedStep(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-reasoning-visual", {
        body: { topic: t, subject, grade: "Grade 10" },
      });

      if (error) throw error;

      if (data?.steps) {
        const emojis = ["🔍", "⚙️", "🔗", "✅"];
        const mapped: VisualStep[] = data.steps.map((s: any, i: number) => ({
          step_number: s.step_number || i + 1,
          title: s.title,
          explanation: s.explanation,
          emoji: emojis[i] || "📌",
          image_url: s.image_url,
        }));
        setSteps(mapped);
        setExpandedStep(0);

        // Set quiz data if available
        if (data.quiz) {
          setQuiz(data.quiz);
        }

        // If images are being generated in the background, poll
        const missingImages = mapped.filter(s => !s.image_url);
        if (missingImages.length > 0 && data?.images_generating) {
          setGeneratingImages(true);
          pollForImages(t, subject);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate reasoning. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const pollForImages = async (topicStr: string, subject: string) => {
    const maxAttempts = 12;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(r => setTimeout(r, 5000));
      try {
        const { data } = await supabase.functions.invoke("generate-reasoning-visual", {
          body: { topic: topicStr, subject, grade: "Grade 10" },
        });
        if (data?.steps) {
          const emojis = ["🔍", "⚙️", "🔗", "✅"];
          const hasNewImages = data.steps.some((s: any) => s.image_url);
          if (hasNewImages) {
            setSteps(data.steps.map((s: any, i: number) => ({
              step_number: s.step_number || i + 1,
              title: s.title,
              explanation: s.explanation,
              emoji: emojis[i] || "📌",
              image_url: s.image_url,
            })));
            // Also update quiz if returned
            if (data.quiz && !quiz) {
              setQuiz(data.quiz);
            }
            const allDone = data.steps.every((s: any) => s.image_url);
            if (allDone || data.cached) {
              setGeneratingImages(false);
              return;
            }
          }
        }
      } catch {
        // ignore poll errors
      }
    }
    setGeneratingImages(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-bold text-foreground">📖 Visual Reasoning Demo</h1>
            <p className="text-[11px] text-muted-foreground">PDF-style illustrated step-by-step + quiz</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Input */}
        <Card className="border border-border">
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Enter any concept… e.g. How does photosynthesis work?"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generate(topic)}
                className="text-foreground text-sm"
              />
              <Button onClick={() => generate(topic)} disabled={loading || !topic.trim()} size="sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => generate(p.topic, p.subject)}
                  disabled={loading}
                  className="px-2.5 py-1 text-[11px] rounded-full bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors font-medium disabled:opacity-50"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Breaking down the concept into visual steps…</p>
          </div>
        )}

        {/* Results */}
        {steps.length > 0 && !loading && (
          <div className="space-y-4">
            {/* Title banner */}
            <div className="rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 p-4 text-center">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">Visual Reasoning</p>
              <h2 className="text-lg font-bold text-foreground mt-1">{activeTopic}</h2>
              {generatingImages && (
                <p className="text-[11px] text-muted-foreground mt-2 flex items-center justify-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" /> Generating illustrations…
                </p>
              )}
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {steps.map((step, i) => {
                const style = STEP_STYLES[i % STEP_STYLES.length];
                const isExpanded = expandedStep === i;

                return (
                  <div
                    key={i}
                    className={`rounded-xl border ${style.border} ${style.bg} overflow-hidden transition-all`}
                  >
                    <button
                      onClick={() => setExpandedStep(isExpanded ? null : i)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    >
                      <span className={`${style.pill} w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0`}>
                        {step.emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${style.accent}`}>Step {step.step_number}</p>
                        <p className="text-[13px] font-semibold text-foreground truncate">{step.title}</p>
                      </div>
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 animate-fade-in">
                        <div className="rounded-lg border border-border bg-background overflow-hidden">
                          {step.image_url ? (
                            <img
                              src={step.image_url}
                              alt={`Step ${step.step_number}: ${step.title}`}
                              className="w-full h-44 object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-44 flex flex-col items-center justify-center gap-2 bg-muted/50">
                              {generatingImages ? (
                                <>
                                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                  <p className="text-[11px] text-muted-foreground">Generating illustration…</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-[11px] text-muted-foreground">No illustration yet</p>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setGeneratingImages(true);
                                      pollForImages(activeTopic, "Science");
                                    }}
                                  >
                                    <RefreshCw className="h-3 w-3 mr-1" /> Generate
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        <p className="text-[13px] text-foreground/90 leading-relaxed">
                          {step.explanation}
                        </p>

                        {i < steps.length - 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs w-full"
                            onClick={() => setExpandedStep(i + 1)}
                          >
                            Next: {steps[i + 1].title} →
                          </Button>
                        )}
                        {i === steps.length - 1 && (
                          <div className="text-center py-2">
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">✅ Reasoning Complete!</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Icon Selection Quiz — PDF-style gamification */}
            {quiz && (
              <div className="mt-6">
                <IconSelectionQuiz
                  question={quiz.question}
                  icons={quiz.icons}
                  onComplete={(score, total) => {
                    setQuizCompleted(true);
                    if (score === total) {
                      toast.success("Perfect score! 🎉");
                    }
                  }}
                />
              </div>
            )}

            {/* Reset */}
            <div className="text-center pt-2">
              <Button variant="outline" size="sm" onClick={() => { setSteps([]); setQuiz(null); setTopic(""); setActiveTopic(""); setQuizCompleted(false); }}>
                Try Another Concept
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualReasoningDemo;
