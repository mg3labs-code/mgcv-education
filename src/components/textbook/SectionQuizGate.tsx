import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import IconSelectionQuiz, { QuizIcon } from "./IconSelectionQuiz";
import ComprehensionCheck from "./ComprehensionCheck";
import { Button } from "@/components/ui/button";
import { Loader2, SkipForward } from "lucide-react";

interface SectionQuizGateProps {
  sectionTitle: string;
  subject?: string;
  isFirstVisit: boolean;
  onPass: () => void;
  onSkip: () => void;
  onResult?: (result: "pass" | "revise" | "skip", attempts: number) => void;
}

interface QuizData {
  question: string;
  icons: QuizIcon[];
}

const SectionQuizGate = ({
  sectionTitle,
  subject,
  isFirstVisit,
  onPass,
  onSkip,
  onResult,
}: SectionQuizGateProps) => {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [quizLoading, setQuizLoading] = useState(true);
  const [quizDone, setQuizDone] = useState(false);

  useEffect(() => {
    if (!isFirstVisit) return;
    let cancelled = false;

    const fetchQuiz = async () => {
      try {
        // Build slug same way as edge function
        const subj = subject || "Science";
        const slug = `${subj.toLowerCase()}_${sectionTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 60)}`;

        // Check cache first
        const { data } = await supabase
          .from("reasoning_visuals")
          .select("quiz")
          .eq("slug", slug)
          .maybeSingle();

        if (!cancelled && data?.quiz) {
          const q = data.quiz as unknown as QuizData;
          if (q.question && q.icons?.length > 0) {
            setQuizData(q);
          }
        }

        // If no cache, try generating quiz-only in background (fire-and-forget)
        if (!data?.quiz) {
          supabase.functions
            .invoke("generate-reasoning-visual", {
              body: { topic: sectionTitle, subject: subj, action: "fetch-quiz-only" },
            })
            .then(({ data: genData }) => {
              if (!cancelled && genData?.quiz?.question && genData.quiz.icons?.length > 0) {
                setQuizData(genData.quiz);
              }
            })
            .catch(() => {});
        }
      } catch {
        // silently skip quiz
      } finally {
        if (!cancelled) setQuizLoading(false);
      }
    };

    fetchQuiz();
    return () => { cancelled = true; };
  }, [sectionTitle, subject, isFirstVisit]);

  if (!isFirstVisit) return null;

  // Phase 1: Quiz (if available and not done)
  if (!quizDone && !quizLoading && quizData) {
    return (
      <div className="mt-4 space-y-2">
        <IconSelectionQuiz
          question={quizData.question}
          icons={quizData.icons}
          onComplete={(score, total) => {
            setTimeout(() => setQuizDone(true), 1500);
          }}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setQuizDone(true)}
            className="text-muted-foreground text-xs gap-1"
          >
            <SkipForward className="h-3 w-3" /> Skip to writing
          </Button>
        </div>
      </div>
    );
  }

  // Brief loading state (max ~1s)
  if (quizLoading) {
    return (
      <div className="mt-4 flex items-center gap-2 text-muted-foreground text-sm py-3">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Preparing check…</span>
      </div>
    );
  }

  // Phase 2: ComprehensionCheck (after quiz or if no quiz)
  return (
    <ComprehensionCheck
      sectionTitle={sectionTitle}
      isFirstVisit={isFirstVisit}
      onPass={onPass}
      onSkip={onSkip}
      onResult={onResult}
    />
  );
};

export default SectionQuizGate;
