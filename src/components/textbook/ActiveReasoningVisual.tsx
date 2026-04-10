import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Lightbulb, Puzzle, GitBranch, CheckCircle2, HelpCircle, Globe, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ReasoningStep {
  step_number: number;
  title: string;
  subtitle: string;
  explanation: string;
  key_labels: string[];
  image_url?: string;
}

interface Props {
  topic?: string;
  subject?: string;
  grade?: string;
  onQuiz?: () => void;
}

const stepIcons = [Lightbulb, Puzzle, GitBranch, CheckCircle2];
const stepColors = [
  "from-amber-500 to-orange-500",
  "from-blue-500 to-cyan-500",
  "from-purple-500 to-pink-500",
  "from-emerald-500 to-teal-500",
];

const ActiveReasoningVisual = ({ topic, subject, grade, onQuiz }: Props) => {
  const [steps, setSteps] = useState<ReasoningStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputTopic, setInputTopic] = useState(topic || "");

  const generate = async (topicToUse?: string) => {
    const t = topicToUse || inputTopic;
    if (!t.trim()) return;

    setLoading(true);
    setSteps([]);
    setCurrentStep(0);

    try {
      // Simulate step progress
      const progressInterval = setInterval(() => {
        setCurrentStep((prev) => Math.min(prev + 1, 4));
      }, 8000);

      const { data, error } = await supabase.functions.invoke(
        "generate-reasoning-visual",
        { body: { topic: t, subject: subject || "Science", grade: grade || "Grade 10" } }
      );

      clearInterval(progressInterval);

      if (error) throw error;
      if (data?.steps) {
        setSteps(data.steps);
        setCurrentStep(4);
        if (data.cached) {
          toast({ title: "Loaded from cache ⚡", description: "This visual was generated before" });
        }
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Generation failed", description: "Please try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Building Active Reasoning Visual...
            </h3>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4].map((s) => {
                const Icon = stepIcons[s - 1];
                return (
                  <div
                    key={s}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      currentStep >= s
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    Step {s}
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground">
              {currentStep === 0 && "Analyzing topic..."}
              {currentStep === 1 && "Understanding the problem..."}
              {currentStep === 2 && "Breaking into parts..."}
              {currentStep === 3 && "Exploring possibilities..."}
              {currentStep === 4 && "Drawing conclusions..."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (steps.length === 0) {
    return null; // Render nothing if no steps yet — the parent page handles input
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">🧠 Active Reasoning</h2>
        <p className="text-sm text-muted-foreground mt-1">{inputTopic || topic}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((step, i) => {
          const Icon = stepIcons[i];
          return (
            <Card key={i} className="overflow-hidden border-2 border-border/50 hover:border-primary/30 transition-all">
              {/* Step Header */}
              <div className={`bg-gradient-to-r ${stepColors[i]} p-3 flex items-center gap-3`}>
                <div className="w-8 h-8 rounded-full bg-background/20 flex items-center justify-center text-sm font-bold text-background">
                  {step.step_number}
                </div>
                <div>
                  <h3 className="font-bold text-background text-sm">{step.title}</h3>
                  <p className="text-xs text-background/80">{step.subtitle}</p>
                </div>
                <Icon className="h-5 w-5 text-background/80 ml-auto" />
              </div>

              <CardContent className="p-4 space-y-3">
                {/* Image */}
                {step.image_url ? (
                  <div className="rounded-lg overflow-hidden border border-border bg-muted">
                    <img
                      src={step.image_url}
                      alt={`Step ${step.step_number}: ${step.title}`}
                      className="w-full h-48 object-contain bg-background"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border h-48 flex items-center justify-center bg-muted/50">
                    <p className="text-xs text-muted-foreground">Image not available</p>
                  </div>
                )}

                {/* Explanation */}
                <p className="text-sm text-foreground leading-relaxed">
                  {step.explanation}
                </p>

                {/* Labels */}
                <div className="flex flex-wrap gap-1.5">
                  {step.key_labels.map((label, j) => (
                    <span
                      key={j}
                      className="px-2 py-0.5 text-xs rounded-full bg-accent text-accent-foreground font-medium"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="outline" size="sm" onClick={onQuiz}>
          <HelpCircle className="h-4 w-4 mr-1" /> Quiz Me
        </Button>
        <Button variant="outline" size="sm">
          <Globe className="h-4 w-4 mr-1" /> Real-Life Example
        </Button>
        <Button variant="outline" size="sm">
          <BarChart3 className="h-4 w-4 mr-1" /> Get Diagram
        </Button>
      </div>
    </div>
  );
};

export { ActiveReasoningVisual };
export type { ReasoningStep };
