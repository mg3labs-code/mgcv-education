import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Rocket, Brain, ArrowRight, Check } from "lucide-react";

/**
 * VibeCheckModal — 3-question adaptive placement.
 *
 * Auto-opens the first time a student lands on a learning page after onboarding,
 * BEFORE they hit any 7-layer content. The 3 questions feel like a friendly chat,
 * never like a test. Their answers map to one of three modes:
 *
 *   🌱 EXPLORER  — Grade 4 English, 1-line answers, emoji-heavy. "Just show me cool stuff."
 *   🚀 BUILDER   — Grade 6 English, simple analogies. "I want to understand HOW it works."
 *   🧠 MASTER    — Full 7-layer depth. "Challenge me. I want the deep reasoning."
 *
 * Result is saved to `student_preferences.difficulty_level` so every textbook page
 * can render the right voice. Students can change it later from settings.
 */

export type DifficultyMode = "explorer" | "builder" | "master";

const QUESTIONS: Array<{
  id: string;
  prompt: string;
  hint: string;
  options: Array<{
    label: string;
    emoji: string;
    desc: string;
    weight: { explorer: number; builder: number; master: number };
  }>;
}> = [
  {
    id: "q1",
    prompt: "When you learn something new, what feels best?",
    hint: "Just pick what sounds fun — there's no wrong answer.",
    options: [
      {
        label: "Show me with pictures",
        emoji: "🎨",
        desc: "Stories, colors, and short fun facts",
        weight: { explorer: 3, builder: 1, master: 0 },
      },
      {
        label: "Show me how it works",
        emoji: "⚙️",
        desc: "Step by step, with simple examples",
        weight: { explorer: 1, builder: 3, master: 1 },
      },
      {
        label: "Show me WHY it works",
        emoji: "🔬",
        desc: "Deep reasons, real proofs, big questions",
        weight: { explorer: 0, builder: 1, master: 3 },
      },
    ],
  },
  {
    id: "q2",
    prompt: "How do you feel about big science words like 'photosynthesis' or 'electromagnetism'?",
    hint: "Be honest! Lots of people find them tricky.",
    options: [
      {
        label: "Kinda scary 😅",
        emoji: "🌱",
        desc: "I want simple words I already know",
        weight: { explorer: 3, builder: 1, master: 0 },
      },
      {
        label: "I'm okay with them",
        emoji: "🚀",
        desc: "Explain them once and I'll get it",
        weight: { explorer: 1, builder: 3, master: 1 },
      },
      {
        label: "I love big words!",
        emoji: "🧠",
        desc: "Throw the technical stuff at me",
        weight: { explorer: 0, builder: 1, master: 3 },
      },
    ],
  },
  {
    id: "q3",
    prompt: "Which of these would you read first?",
    hint: "Pick the one that makes you most curious.",
    options: [
      {
        label: "\"A frog can jump 20 times its body length! 🐸\"",
        emoji: "✨",
        desc: "Quick, fun, surprising facts",
        weight: { explorer: 3, builder: 1, master: 0 },
      },
      {
        label: "\"Here's HOW frogs jump so far — their leg muscles work like springs.\"",
        emoji: "🔧",
        desc: "Clear explanations with everyday comparisons",
        weight: { explorer: 1, builder: 3, master: 1 },
      },
      {
        label: "\"Frog jumps demonstrate elastic potential energy storage in tendons...\"",
        emoji: "📐",
        desc: "Real science, real depth, real challenge",
        weight: { explorer: 0, builder: 1, master: 3 },
      },
    ],
  },
];

const MODE_META: Record<DifficultyMode, { title: string; emoji: string; tagline: string; color: string; icon: typeof Sparkles }> = {
  explorer: {
    title: "Explorer Mode",
    emoji: "🌱",
    tagline: "Easy words. Fun facts. Big curiosity. You'll level up as you go.",
    color: "from-emerald-400 to-teal-500",
    icon: Sparkles,
  },
  builder: {
    title: "Builder Mode",
    emoji: "🚀",
    tagline: "Step-by-step learning with everyday examples. Perfect balance.",
    color: "from-blue-400 to-indigo-500",
    icon: Rocket,
  },
  master: {
    title: "Master Mode",
    emoji: "🧠",
    tagline: "Full depth. Real reasoning. Challenge unlocked.",
    color: "from-purple-400 to-pink-500",
    icon: Brain,
  },
};

const VibeCheckModal = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({ explorer: 0, builder: 0, master: 0 });
  const [result, setResult] = useState<DifficultyMode | null>(null);
  const [saving, setSaving] = useState(false);

  // Read student_preferences to decide if vibe check is needed.
  // We auto-open if difficulty_level is the default 'medium' (never set explicitly)
  // AND onboarding is complete. This way the vibe check arrives AFTER onboarding,
  // exactly when the student is ready to learn.
  const { data: prefs } = useQuery({
    queryKey: ["student_preferences", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("student_preferences")
        .select("difficulty_level, onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (!prefs) return;
    // Already placed → skip
    if (["explorer", "builder", "master"].includes(prefs.difficulty_level)) return;
    // Not done with onboarding → wait
    if (!prefs.onboarding_completed) return;
    // Default 'medium' or null → show
    setOpen(true);
  }, [prefs]);

  const handleAnswer = (optIdx: number) => {
    const w = QUESTIONS[step].options[optIdx].weight;
    const next = {
      explorer: scores.explorer + w.explorer,
      builder: scores.builder + w.builder,
      master: scores.master + w.master,
    };
    setScores(next);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // Pick the highest-scoring mode
      const winner = (Object.entries(next) as Array<[DifficultyMode, number]>)
        .sort((a, b) => b[1] - a[1])[0][0];
      setResult(winner);
    }
  };

  const handleConfirm = async () => {
    if (!user || !result) return;
    setSaving(true);
    await supabase
      .from("student_preferences")
      .update({ difficulty_level: result })
      .eq("user_id", user.id);
    qc.invalidateQueries({ queryKey: ["student_preferences", user.id] });
    setSaving(false);
    setOpen(false);
  };

  // Render result screen
  if (result) {
    const meta = MODE_META[result];
    const Icon = meta.icon;
    return (
      <Dialog open={open} onOpenChange={() => { /* prevent close until confirm */ }}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-card">
          <div className={`bg-gradient-to-br ${meta.color} p-8 text-center text-white`}>
            <div className="text-6xl mb-3 animate-bounce">{meta.emoji}</div>
            <h2 className="text-2xl font-bold mb-1">You're a {meta.title.split(" ")[0]}!</h2>
            <p className="text-white/90 text-sm">{meta.tagline}</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground">
                Your textbook will start in <strong className="text-foreground">{meta.title}</strong>.
                As you complete chapters, you'll <strong className="text-foreground">level up</strong> and unlock deeper content. 🔓
              </div>
            </div>
            <Button
              onClick={handleConfirm}
              disabled={saving}
              className="w-full"
              size="lg"
            >
              {saving ? "Saving..." : "Let's go!"} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const q = QUESTIONS[step];

  return (
    <Dialog open={open} onOpenChange={() => { /* locked until done */ }}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 bg-card">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pt-5">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i < step ? "w-6 bg-primary" : i === step ? "w-10 bg-primary" : "w-6 bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="px-6 pt-3 pb-6 space-y-5">
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
              <Sparkles className="h-3 w-3" />
              Quick vibe check ({step + 1} of {QUESTIONS.length})
            </div>
            <h2 className="text-xl font-bold text-foreground leading-tight">{q.prompt}</h2>
            <p className="text-xs text-muted-foreground mt-1">{q.hint}</p>
          </div>

          <div className="space-y-2.5">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className="w-full text-left p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group bg-transparent cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl shrink-0 group-hover:scale-110 transition-transform">{opt.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-foreground text-sm leading-snug">{opt.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                  </div>
                  <Check className="h-4 w-4 text-muted-foreground/0 group-hover:text-primary transition-colors mt-1" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VibeCheckModal;
