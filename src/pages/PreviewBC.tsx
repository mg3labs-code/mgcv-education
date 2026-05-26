import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, BookOpen, Trophy, TrendingUp, ClipboardList,
  ChevronRight, Flame, ArrowLeft, Check, Play, Brain,
  Lightbulb, PenLine, Target, Award
} from "lucide-react";

/**
 * Rough preview of Option B (shell) + Option C (6-step loop)
 * Two screens side-by-side on desktop, stacked on mobile.
 */
export default function PreviewBC() {
  const [view, setView] = useState<"home" | "loop">("home");

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-sm">B + C Preview</h1>
            <p className="text-xs text-muted-foreground">Rough mockup · not wired to data</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={view === "home" ? "default" : "outline"}
              onClick={() => setView("home")}
            >
              B · Home shell
            </Button>
            <Button
              size="sm"
              variant={view === "loop" ? "default" : "outline"}
              onClick={() => setView("loop")}
            >
              C · 6-step loop
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {view === "home" ? <HomeShell onOpen={() => setView("loop")} /> : <SixStepLoop onBack={() => setView("home")} />}
      </div>

      {/* Legend */}
      <div className="max-w-md mx-auto px-4 pb-12">
        <Card className="p-4 bg-muted/30 border-dashed">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">How it works:</strong> The hero card on the home shell (B) is the ONLY thing that looks important. Tapping <em>Begin</em> drops the student into the 6-step loop (C). All current features (textbook, exam, progress) are demoted to small tiles below, parents still see depth.
          </p>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- B: Home shell ---------------- */
function HomeShell({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Good evening</p>
          <h2 className="text-xl font-bold">Arjun</h2>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Flame className="h-3 w-3 text-orange-500" /> 4-day streak
        </Badge>
      </div>

      {/* HERO — Today's Spark */}
      <Card
        onClick={onOpen}
        className="relative overflow-hidden p-6 cursor-pointer border-2 border-primary/40 bg-gradient-to-br from-primary/15 via-primary/5 to-background shadow-lg hover:shadow-xl transition-all active:scale-[0.99]"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Today's Spark
            </span>
          </div>
          <h3 className="text-2xl font-bold leading-tight mb-1">
            Why does ice float on water?
          </h3>
          <p className="text-sm text-muted-foreground mb-5">
            Class 9 · Science · 8 min · earns 40 XP
          </p>
          <Button size="lg" className="w-full text-base font-semibold gap-2">
            <Play className="h-4 w-4 fill-current" /> Begin
          </Button>
        </div>
      </Card>

      {/* Demoted tiles */}
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 px-1">
          Also available
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <SmallTile icon={BookOpen} label="Textbook" sub="12 chapters" />
          <SmallTile icon={Trophy} label="Exam Room" sub="Practice" />
          <SmallTile icon={TrendingUp} label="Progress" sub="68%" />
          <SmallTile icon={ClipboardList} label="Tasks" sub="2 pending" />
        </div>
      </div>

      <button className="w-full text-center text-xs text-muted-foreground py-3 hover:text-foreground">
        More →
      </button>
    </div>
  );
}

function SmallTile({ icon: Icon, label, sub }: any) {
  return (
    <Card className="p-3 hover:bg-muted/50 cursor-pointer transition-colors">
      <Icon className="h-4 w-4 text-muted-foreground mb-2" />
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </Card>
  );
}

/* ---------------- C: 6-step loop ---------------- */
const STEPS = [
  { icon: Lightbulb, label: "Hook", desc: "A real-world question to spark curiosity" },
  { icon: Brain, label: "Explore", desc: "Visual story explains the concept" },
  { icon: Target, label: "Check", desc: "Quick 'did you get it?' question" },
  { icon: PenLine, label: "Apply", desc: "Try it on a fresh problem" },
  { icon: Sparkles, label: "Reflect", desc: "What did you learn? 1 line" },
  { icon: Award, label: "Reward", desc: "XP, streak, what's next tomorrow" },
];

function SixStepLoop({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(0);
  const S = STEPS[step];
  const Icon = S.icon;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-4">
      {/* Top */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </p>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step card */}
      <Card className="p-6 min-h-[340px] flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Step {step + 1}
            </p>
            <h3 className="text-lg font-bold">{S.label}</h3>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">{S.desc}</p>

        {/* Placeholder content for the step */}
        <div className="flex-1 rounded-lg border border-dashed bg-muted/30 flex items-center justify-center p-6 text-center">
          <p className="text-sm text-muted-foreground">
            <em>{S.label}</em> content renders here<br />
            <span className="text-xs">(question, visual, input, or reward)</span>
          </p>
        </div>

        <div className="flex gap-2 mt-5">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} className="flex-1 gap-1">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={onBack} className="flex-1 gap-1">
              <Check className="h-4 w-4" /> Finish · +40 XP
            </Button>
          )}
        </div>
      </Card>

      {/* Step pills */}
      <div className="flex gap-1 justify-center pt-2">
        {STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={`h-2 rounded-full transition-all ${
              i === step ? "w-6 bg-primary" : i < step ? "w-2 bg-primary/50" : "w-2 bg-muted"
            }`}
            aria-label={`Go to step ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
