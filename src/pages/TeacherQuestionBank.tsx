import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Library,
  Filter,
  Search,
  Plus,
  Check,
  Brain,
  Eye,
  Target,
  Sparkles,
  Layers,
  Download,
  ClipboardCheck,
  TrendingUp,
  AlertTriangle,
  Lock,
  ChevronRight,
} from "lucide-react";

/* ───────────── Types ───────────── */

type Difficulty = "foundation" | "core" | "advanced";
type Thinking =
  | "recall"
  | "understand"
  | "apply"
  | "analyze"
  | "evaluate"
  | "create";

interface Question {
  id: string;
  text: string;
  subject: string;
  chapter: string;
  concept: string;
  difficulty: Difficulty;
  thinking: Thinking;
  marks: number;
  estMinutes: number;
  source: "NCERT" | "Board PYQ" | "JEE" | "Olympiad" | "Concept Bank";
}

interface ConceptReadiness {
  subject: string;
  chapter: string;
  concept: string;
  mastered: number;   // %
  practising: number; // %
  struggling: number; // %
  readyToTeach: boolean;
  prerequisitesMet: boolean;
  blocker?: string;
}

/* ───────────── Mock data (rich, board-aligned) ───────────── */

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology"] as const;
const CLASSES = ["Class 10", "Class 9", "Class 8"] as const;

const QUESTION_BANK: Question[] = [
  { id: "q1",  text: "If √2 is irrational, prove that 5 + 3√2 is irrational.",                                                subject: "Mathematics", chapter: "Real Numbers",        concept: "Irrational Numbers",         difficulty: "core",       thinking: "analyze",    marks: 3, estMinutes: 6, source: "NCERT" },
  { id: "q2",  text: "Find the HCF of 96 and 404 using Euclid's algorithm.",                                                 subject: "Mathematics", chapter: "Real Numbers",        concept: "Euclid's Division",          difficulty: "foundation", thinking: "apply",      marks: 2, estMinutes: 4, source: "NCERT" },
  { id: "q3",  text: "Without long division, predict whether 13/3125 has a terminating decimal expansion. Justify.",         subject: "Mathematics", chapter: "Real Numbers",        concept: "Decimal Expansions",         difficulty: "core",       thinking: "evaluate",   marks: 3, estMinutes: 5, source: "Board PYQ" },
  { id: "q4",  text: "Design a real-life example where understanding HCF prevents waste in tiling a rectangular floor.",     subject: "Mathematics", chapter: "Real Numbers",        concept: "HCF Applications",           difficulty: "advanced",   thinking: "create",     marks: 5, estMinutes: 10, source: "Concept Bank" },
  { id: "q5",  text: "State and verify the Mid-Point theorem for a triangle with vertices (0,0), (6,0), (4,4).",             subject: "Mathematics", chapter: "Coordinate Geometry", concept: "Mid-Point Theorem",          difficulty: "core",       thinking: "apply",      marks: 4, estMinutes: 7, source: "NCERT" },
  { id: "q6",  text: "A boy throws a ball upward at 20 m/s. Find max height and time to return. (g=10)",                     subject: "Physics",     chapter: "Motion",              concept: "Kinematic Equations",        difficulty: "core",       thinking: "apply",      marks: 3, estMinutes: 6, source: "NCERT" },
  { id: "q7",  text: "Explain why a car's seatbelt prevents injury during a sudden stop. Use Newton's first law.",           subject: "Physics",     chapter: "Force & Laws",        concept: "Inertia",                    difficulty: "foundation", thinking: "understand", marks: 2, estMinutes: 4, source: "NCERT" },
  { id: "q8",  text: "Two trolleys are pushed with equal force; one is empty, one carries bricks. Predict and justify.",     subject: "Physics",     chapter: "Force & Laws",        concept: "F = ma",                     difficulty: "core",       thinking: "analyze",    marks: 3, estMinutes: 5, source: "Board PYQ" },
  { id: "q9",  text: "From a graph of velocity vs time, derive the equation v² = u² + 2as.",                                 subject: "Physics",     chapter: "Motion",              concept: "Kinematic Derivations",      difficulty: "advanced",   thinking: "evaluate",   marks: 5, estMinutes: 10, source: "JEE" },
  { id: "q10", text: "Balance: Fe + O₂ → Fe₂O₃ and classify the reaction type.",                                             subject: "Chemistry",   chapter: "Chemical Reactions",  concept: "Balancing Equations",        difficulty: "foundation", thinking: "recall",     marks: 2, estMinutes: 3, source: "NCERT" },
  { id: "q11", text: "Predict the colour change when iron nails are dipped in CuSO₄ solution. Explain at the particle level.", subject: "Chemistry", chapter: "Chemical Reactions",  concept: "Displacement Reactions",     difficulty: "core",       thinking: "analyze",    marks: 4, estMinutes: 7, source: "Board PYQ" },
  { id: "q12", text: "Design an experiment to compare reactivity of Zn, Fe, Cu using salt solutions. Safety + observations.", subject: "Chemistry", chapter: "Metals & Non-metals", concept: "Reactivity Series",          difficulty: "advanced",   thinking: "create",     marks: 5, estMinutes: 12, source: "Concept Bank" },
  { id: "q13", text: "Why is photosynthesis called an endothermic reaction? Give the balanced equation.",                    subject: "Biology",     chapter: "Life Processes",      concept: "Photosynthesis",             difficulty: "core",       thinking: "understand", marks: 3, estMinutes: 5, source: "NCERT" },
  { id: "q14", text: "Compare aerobic and anaerobic respiration with one example each from the human body.",                 subject: "Biology",     chapter: "Life Processes",      concept: "Respiration",                difficulty: "foundation", thinking: "recall",     marks: 3, estMinutes: 5, source: "NCERT" },
  { id: "q15", text: "Predict what happens to leaf colour if magnesium is removed from soil for 4 weeks. Justify.",          subject: "Biology",     chapter: "Life Processes",      concept: "Chlorophyll & Minerals",     difficulty: "advanced",   thinking: "evaluate",   marks: 4, estMinutes: 8, source: "Olympiad" },
];

const READINESS: ConceptReadiness[] = [
  { subject: "Mathematics", chapter: "Real Numbers",        concept: "Irrational Numbers",     mastered: 62, practising: 26, struggling: 12, readyToTeach: true,  prerequisitesMet: true },
  { subject: "Mathematics", chapter: "Real Numbers",        concept: "Euclid's Division",      mastered: 78, practising: 18, struggling: 4,  readyToTeach: true,  prerequisitesMet: true },
  { subject: "Mathematics", chapter: "Real Numbers",        concept: "Decimal Expansions",     mastered: 41, practising: 38, struggling: 21, readyToTeach: false, prerequisitesMet: true, blocker: "21% still confuse terminating vs non-terminating — re-teach with one worked example." },
  { subject: "Mathematics", chapter: "Coordinate Geometry", concept: "Mid-Point Theorem",      mastered: 55, practising: 30, struggling: 15, readyToTeach: true,  prerequisitesMet: false, blocker: "Plotting fluency at 48% — recap Cartesian plane first (5 min)." },
  { subject: "Physics",     chapter: "Motion",              concept: "Kinematic Equations",    mastered: 68, practising: 22, struggling: 10, readyToTeach: true,  prerequisitesMet: true },
  { subject: "Physics",     chapter: "Motion",              concept: "Kinematic Derivations",  mastered: 28, practising: 32, struggling: 40, readyToTeach: false, prerequisitesMet: false, blocker: "Graph interpretation < 50% — run the v-t graph hook before deriving formulas." },
  { subject: "Physics",     chapter: "Force & Laws",        concept: "Inertia",                mastered: 81, practising: 15, struggling: 4,  readyToTeach: true,  prerequisitesMet: true },
  { subject: "Chemistry",   chapter: "Chemical Reactions",  concept: "Balancing Equations",    mastered: 72, practising: 20, struggling: 8,  readyToTeach: true,  prerequisitesMet: true },
  { subject: "Chemistry",   chapter: "Chemical Reactions",  concept: "Displacement Reactions", mastered: 47, practising: 35, struggling: 18, readyToTeach: true,  prerequisitesMet: true },
  { subject: "Chemistry",   chapter: "Metals & Non-metals", concept: "Reactivity Series",      mastered: 33, practising: 30, struggling: 37, readyToTeach: false, prerequisitesMet: false, blocker: "Displacement reaction mastery only 47% — reinforce before introducing the series." },
  { subject: "Biology",     chapter: "Life Processes",      concept: "Photosynthesis",         mastered: 70, practising: 22, struggling: 8,  readyToTeach: true,  prerequisitesMet: true },
  { subject: "Biology",     chapter: "Life Processes",      concept: "Respiration",            mastered: 64, practising: 28, struggling: 8,  readyToTeach: true,  prerequisitesMet: true },
  { subject: "Biology",     chapter: "Life Processes",      concept: "Chlorophyll & Minerals", mastered: 38, practising: 34, struggling: 28, readyToTeach: false, prerequisitesMet: true, blocker: "Most students haven't connected mineral deficiency to leaf colour — show a real picture first." },
];

/* ───────────── Tokens ───────────── */

const DIFF_META: Record<Difficulty, { label: string; cls: string }> = {
  foundation: { label: "Foundation", cls: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30" },
  core:       { label: "Core",       cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  advanced:   { label: "Advanced",   cls: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30" },
};

const THINK_META: Record<Thinking, { label: string; Icon: typeof Brain }> = {
  recall:     { label: "Recall",     Icon: Eye },
  understand: { label: "Understand", Icon: Brain },
  apply:      { label: "Apply",      Icon: Target },
  analyze:    { label: "Analyze",    Icon: Layers },
  evaluate:   { label: "Evaluate",   Icon: ClipboardCheck },
  create:     { label: "Create",     Icon: Sparkles },
};

/* ───────────── Page ───────────── */

const TeacherQuestionBank = () => {
  const [selectedClass, setSelectedClass] = useState<string>(CLASSES[0]);
  const [subject, setSubject] = useState<string>("All");
  const [difficulty, setDifficulty] = useState<Difficulty | "All">("All");
  const [thinking, setThinking] = useState<Thinking | "All">("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filteredQs = useMemo(() => {
    return QUESTION_BANK.filter((q) => {
      if (subject !== "All" && q.subject !== subject) return false;
      if (difficulty !== "All" && q.difficulty !== difficulty) return false;
      if (thinking !== "All" && q.thinking !== thinking) return false;
      if (search && !`${q.text} ${q.concept} ${q.chapter}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [subject, difficulty, thinking, search]);

  const filteredReadiness = useMemo(() => {
    return READINESS.filter((r) => subject === "All" || r.subject === subject);
  }, [subject]);

  const readyCount  = filteredReadiness.filter((r) => r.readyToTeach && r.prerequisitesMet).length;
  const blockerCount = filteredReadiness.filter((r) => !r.readyToTeach || !r.prerequisitesMet).length;
  const totalSelectedMarks = QUESTION_BANK.filter((q) => selected.has(q.id)).reduce((s, q) => s + q.marks, 0);

  const toggle = (id: string) =>
    setSelected((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <DashboardLayout role="teacher">
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Library className="h-5 w-5 text-primary" />
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Question Bank & Readiness
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Pick questions by difficulty + thinking type, and see which concepts {selectedClass} is ready for.
              </p>
            </div>
            <div className="inline-flex p-1 rounded-xl bg-muted/60 border border-border self-start md:self-auto">
              {CLASSES.map((c) => {
                const active = c === selectedClass;
                return (
                  <button
                    key={c}
                    onClick={() => setSelectedClass(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                      active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </header>

          {/* Shared filter bar */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Filter className="h-3.5 w-3.5" /> Filters
              </div>

              <FilterChips
                label="Subject"
                value={subject}
                options={["All", ...SUBJECTS]}
                onChange={setSubject}
              />
              <FilterChips
                label="Difficulty"
                value={difficulty}
                options={["All", "foundation", "core", "advanced"]}
                onChange={(v) => setDifficulty(v as any)}
                renderLabel={(v) => (v === "All" ? "All" : DIFF_META[v as Difficulty].label)}
              />
              <FilterChips
                label="Thinking"
                value={thinking}
                options={["All", "recall", "understand", "apply", "analyze", "evaluate", "create"]}
                onChange={(v) => setThinking(v as any)}
                renderLabel={(v) => (v === "All" ? "All" : THINK_META[v as Thinking].label)}
              />

              <div className="relative ml-auto min-w-[200px] flex-1 sm:flex-none">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search question or concept…"
                  className="pl-8 h-9"
                />
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="bank" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="bank" className="gap-2">
                <Library className="h-4 w-4" /> Question Bank
              </TabsTrigger>
              <TabsTrigger value="readiness" className="gap-2">
                <TrendingUp className="h-4 w-4" /> Student Readiness
              </TabsTrigger>
            </TabsList>

            {/* ── Question Bank ── */}
            <TabsContent value="bank" className="mt-4 space-y-3">
              {/* Selection summary */}
              {selected.size > 0 && (
                <Card className="p-4 flex items-center gap-3 bg-primary/5 border-primary/30">
                  <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {selected.size}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">
                      {selected.size} question{selected.size === 1 ? "" : "s"} selected · {totalSelectedMarks} marks
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Ready to push to a worksheet or assignment.
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>
                    Clear
                  </Button>
                  <Button size="sm" className="gap-1.5">
                    <Download className="h-3.5 w-3.5" /> Build worksheet
                  </Button>
                </Card>
              )}

              <div className="text-xs text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filteredQs.length}</span> of{" "}
                {QUESTION_BANK.length} questions
              </div>

              <div className="grid gap-3">
                {filteredQs.map((q) => {
                  const Think = THINK_META[q.thinking].Icon;
                  const isSel = selected.has(q.id);
                  return (
                    <Card
                      key={q.id}
                      onClick={() => toggle(q.id)}
                      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                        isSel ? "ring-2 ring-primary border-primary/50 bg-primary/[0.03]" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSel ? "bg-primary border-primary" : "border-border"
                          }`}
                        >
                          {isSel && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground leading-snug">{q.text}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                            <Badge variant="outline" className={`gap-1 ${DIFF_META[q.difficulty].cls}`}>
                              {DIFF_META[q.difficulty].label}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <Think className="h-3 w-3" /> {THINK_META[q.thinking].label}
                            </Badge>
                            <Badge variant="secondary" className="font-normal">
                              {q.subject} · {q.chapter}
                            </Badge>
                            <Badge variant="secondary" className="font-normal">
                              {q.concept}
                            </Badge>
                            <span className="text-muted-foreground ml-1">
                              {q.marks}m · ~{q.estMinutes} min · {q.source}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                {filteredQs.length === 0 && (
                  <Card className="p-8 text-center text-sm text-muted-foreground">
                    No questions match these filters. Loosen difficulty or thinking type.
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ── Readiness ── */}
            <TabsContent value="readiness" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <StatTile icon={Check}          label="Ready to teach"       value={readyCount}    tint="emerald" />
                <StatTile icon={AlertTriangle}  label="Blocked / needs recap" value={blockerCount} tint="amber" />
                <StatTile icon={Layers}         label="Concepts tracked"      value={filteredReadiness.length} tint="primary" />
              </div>

              <div className="grid gap-3">
                {filteredReadiness.map((r) => (
                  <ReadinessRow key={`${r.subject}-${r.concept}`} r={r} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

/* ───────────── Bits ───────────── */

const FilterChips = ({
  label,
  value,
  options,
  onChange,
  renderLabel,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  renderLabel?: (v: string) => string;
}) => (
  <div className="flex items-center gap-1.5">
    <span className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">{label}:</span>
    <div className="inline-flex flex-wrap gap-1">
      {options.map((o) => {
        const active = o === value;
        return (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              active
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
            }`}
          >
            {renderLabel ? renderLabel(o) : o}
          </button>
        );
      })}
    </div>
  </div>
);

const StatTile = ({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: typeof Brain;
  label: string;
  value: number;
  tint: "emerald" | "amber" | "primary";
}) => {
  const tints: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber:   "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    primary: "bg-primary/10 text-primary",
  };
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${tints[tint]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground tabular-nums leading-none">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </Card>
  );
};

const ReadinessRow = ({ r }: { r: ConceptReadiness }) => {
  const ready = r.readyToTeach && r.prerequisitesMet;
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
            ready ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
          }`}
        >
          {ready ? <Check className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold text-foreground">{r.concept}</span>
            <span className="text-xs text-muted-foreground">
              {r.subject} · {r.chapter}
            </span>
            <Badge
              variant="outline"
              className={`ml-auto text-[10px] ${
                ready
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
              }`}
            >
              {ready ? "Ready to teach" : "Needs prep"}
            </Badge>
          </div>

          {/* Stacked bar */}
          <div className="mt-3 h-2 w-full rounded-full overflow-hidden flex bg-muted">
            <div className="bg-emerald-500" style={{ width: `${r.mastered}%` }} />
            <div className="bg-amber-400"   style={{ width: `${r.practising}%` }} />
            <div className="bg-rose-500"    style={{ width: `${r.struggling}%` }} />
          </div>
          <div className="mt-1.5 flex gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> {r.mastered}% mastered</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-400" /> {r.practising}% practising</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-rose-500" /> {r.struggling}% struggling</span>
          </div>

          {r.blocker && (
            <div className="mt-3 text-xs p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{r.blocker}</span>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" /> Add to plan
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
              See students <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TeacherQuestionBank;
