import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReasoningStep } from "@/components/textbook/ActiveReasoningVisual";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Brain, Beaker, Atom, Calculator, Leaf, Zap, Loader2, ArrowLeft,
  Lightbulb, Puzzle, GitBranch, CheckCircle2, Clock, BookOpen
} from "lucide-react";
import { Link } from "react-router-dom";

const suggestedTopics: Record<string, { icon: any; topics: string[] }> = {
  Chemistry: {
    icon: Beaker,
    topics: [
      "How does electrolysis work?",
      "What happens in a combustion reaction?",
      "How do acids and bases neutralize?",
      "Explain the process of corrosion",
    ],
  },
  Physics: {
    icon: Atom,
    topics: [
      "How does an electric circuit work?",
      "What causes refraction of light?",
      "How does a transformer work?",
      "Explain Newton's Third Law with examples",
    ],
  },
  Mathematics: {
    icon: Calculator,
    topics: [
      "How to find the HCF using Euclid's algorithm?",
      "How do quadratic equations work?",
      "What are similar triangles?",
      "How to solve a pair of linear equations?",
    ],
  },
  Biology: {
    icon: Leaf,
    topics: [
      "How do plants make food?",
      "How does the human heart pump blood?",
      "What is DNA replication?",
      "How does natural selection work?",
    ],
  },
};

const stepIcons = [Lightbulb, Puzzle, GitBranch, CheckCircle2];
const stepColors = [
  "from-amber-500 to-orange-500",
  "from-blue-500 to-cyan-500",
  "from-purple-500 to-pink-500",
  "from-emerald-500 to-teal-500",
];

interface StoredVisual {
  id: string;
  topic: string;
  subject: string;
  grade: string;
  steps: ReasoningStep[];
  created_at: string;
}

const subjectIcons: Record<string, any> = {
  Chemistry: Beaker,
  Physics: Atom,
  Mathematics: Calculator,
  Biology: Leaf,
  Science: Brain,
};

const ReasoningVisualDemo = () => {
  const [inputTopic, setInputTopic] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("Chemistry");
  const [steps, setSteps] = useState<ReasoningStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [gallery, setGallery] = useState<StoredVisual[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);

  // Fetch gallery on mount
  useEffect(() => {
    const fetchGallery = async () => {
      const { data, error } = await supabase
        .from("reasoning_visuals")
        .select("id, topic, subject, grade, steps, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setGallery(data as unknown as StoredVisual[]);
      }
      setGalleryLoading(false);
    };
    fetchGallery();
  }, []);

  const generate = async (topic: string, subject?: string) => {
    if (!topic.trim()) return;
    setInputTopic(topic);
    setSelectedSubject(subject || selectedSubject);
    setLoading(true);
    setSteps([]);
    setCurrentStep(0);

    try {
      const progressInterval = setInterval(() => {
        setCurrentStep((prev) => Math.min(prev + 1, 4));
      }, 8000);

      // Add AbortController with 3-minute timeout for new generations
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      const { data, error } = await supabase.functions.invoke(
        "generate-reasoning-visual",
        {
          body: { topic, subject: subject || selectedSubject, grade: "Grade 10" },
        }
      );

      clearTimeout(timeoutId);
      clearInterval(progressInterval);

      if (error) throw error;
      if (data?.steps) {
        setSteps(data.steps);
        setCurrentStep(4);
        if (data.cached && data.match === "exact") {
          toast({ title: "Loaded from cache ⚡", description: "This exact visual was generated before — with images!" });
        } else if (data.cached && data.match === "related") {
          toast({ title: "Found a related visual 🔍", description: `Matched: "${data.original_topic}"` });
        } else {
          // New generation — images are generating in background
          toast({ title: "Steps ready! 🎓", description: "Images are generating in the background. They'll appear in the gallery in ~2 minutes." });
          // Poll for images every 30s for up to 3 minutes
          const pollSlug = `${(subject || selectedSubject).toLowerCase()}_${topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}`;
          let pollCount = 0;
          const pollInterval = setInterval(async () => {
            pollCount++;
            const { data: updated } = await supabase
              .from("reasoning_visuals")
              .select("id, topic, subject, grade, steps, created_at")
              .eq("slug", pollSlug)
              .maybeSingle();
            if (updated) {
              const updatedSteps = updated.steps as any[];
              const hasImages = updatedSteps.some((s: any) => s.image_url);
              if (hasImages) {
                setSteps(updatedSteps as ReasoningStep[]);
                toast({ title: "Images ready! 🖼️", description: "Visual diagrams have been generated" });
                clearInterval(pollInterval);
                // Refresh gallery
                const { data: refreshed } = await supabase
                  .from("reasoning_visuals")
                  .select("id, topic, subject, grade, steps, created_at")
                  .order("created_at", { ascending: false })
                  .limit(20);
                if (refreshed) setGallery(refreshed as unknown as StoredVisual[]);
              }
            }
            if (pollCount >= 6) clearInterval(pollInterval); // Stop after 3 min
          }, 30000);
        }
      }
    } catch (err: any) {
      console.error(err);
      const isTimeout = err?.name === "AbortError" || err?.message?.includes("Failed to send");
      const isCredits = err?.message?.includes("402") || err?.message?.includes("non-2xx");
      toast({
        title: isCredits ? "AI credits temporarily exhausted 💳" : isTimeout ? "Generation timed out ⏱️" : "Generation failed",
        description: isCredits 
          ? "Please try loading a previously generated visual from the library below, or try again later." 
          : isTimeout 
          ? "The visual is being generated in the background. Check the library below in a minute." 
          : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      // Refresh gallery in case background generation completed
      const { data: refreshed } = await supabase
        .from("reasoning_visuals")
        .select("id, topic, subject, grade, steps, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (refreshed) setGallery(refreshed as unknown as StoredVisual[]);
    }
  };

  const loadFromGallery = (visual: StoredVisual) => {
    setInputTopic(visual.topic);
    setSelectedSubject(visual.subject);
    setSteps(visual.steps);
    setCurrentStep(4);
    toast({ title: "Loaded from library 📚", description: visual.topic });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Brain className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Active Reasoning Visual Generator</h1>
            <p className="text-xs text-muted-foreground">4-step visual breakdown for any topic</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Input Section */}
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type any topic... e.g. How does photosynthesis work?"
                value={inputTopic}
                onChange={(e) => setInputTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generate(inputTopic)}
                className="text-foreground"
              />
              <Button onClick={() => generate(inputTopic)} disabled={loading || !inputTopic.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Generate
              </Button>
            </div>

            {/* Subject Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {Object.entries(suggestedTopics).map(([subj, { icon: Icon }]) => (
                <Button
                  key={subj}
                  variant={selectedSubject === subj ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSubject(subj)}
                  className="shrink-0"
                >
                  <Icon className="h-3.5 w-3.5 mr-1" />
                  {subj}
                </Button>
              ))}
            </div>

            {/* Suggested Topics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedTopics[selectedSubject]?.topics.map((t) => (
                <Button
                  key={t}
                  variant="ghost"
                  size="sm"
                  className="justify-start text-left h-auto py-2 text-xs"
                  onClick={() => generate(t, selectedSubject)}
                  disabled={loading}
                >
                  <Lightbulb className="h-3.5 w-3.5 mr-2 shrink-0 text-amber-500" />
                  {t}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                <h3 className="text-lg font-semibold text-foreground">
                  Building Elite Reasoning Visual...
                </h3>
                <div className="flex justify-center gap-3 flex-wrap">
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
                  {currentStep === 0 && "Analyzing topic with subject-specific AI..."}
                  {currentStep === 1 && "Understanding the problem — building visual map..."}
                  {currentStep === 2 && "Breaking into parts — generating labeled diagrams..."}
                  {currentStep === 3 && "Exploring possibilities — creating infographics..."}
                  {currentStep >= 4 && "Drawing conclusions — finalizing visuals..."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {steps.length > 0 && !loading && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">🧠 Active Reasoning</h2>
              <p className="text-sm text-muted-foreground mt-1">{inputTopic}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {steps.map((step, i) => {
                const Icon = stepIcons[i];
                return (
                  <Card key={i} className="overflow-hidden border-2 border-border/50 hover:border-primary/30 transition-all">
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

                      <p className="text-sm text-foreground leading-relaxed">{step.explanation}</p>

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

            <div className="text-center">
              <Button variant="outline" onClick={() => { setSteps([]); setInputTopic(""); }}>
                Try Another Topic
              </Button>
            </div>
          </div>
        )}

        {/* Previously Generated Gallery */}
        {gallery.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Previously Generated</h2>
              <span className="text-xs text-muted-foreground">({gallery.length} visuals)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {gallery.map((visual) => {
                const SubjIcon = subjectIcons[visual.subject] || Brain;
                const firstImage = (visual.steps as ReasoningStep[])?.[0]?.image_url;
                return (
                  <Card
                    key={visual.id}
                    className="cursor-pointer hover:border-primary/40 transition-all hover:shadow-md group"
                    onClick={() => loadFromGallery(visual)}
                  >
                    <CardContent className="p-3 space-y-2">
                      {firstImage ? (
                        <div className="rounded-md overflow-hidden border border-border h-28">
                          <img
                            src={firstImage}
                            alt={visual.topic}
                            className="w-full h-full object-contain bg-background group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="rounded-md border border-dashed border-border h-28 flex items-center justify-center bg-muted/30">
                          <SubjIcon className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                          {visual.topic}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <SubjIcon className="h-3 w-3" />
                            {visual.subject}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(visual.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {galleryLoading && (
          <div className="text-center py-6">
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            <p className="text-xs text-muted-foreground mt-2">Loading library...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReasoningVisualDemo;
