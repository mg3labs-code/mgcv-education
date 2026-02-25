import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ChevronDown, ChevronUp, BookOpen, Clock, MapPin, Lightbulb, FlaskConical, CheckCircle2 } from "lucide-react";

interface TopicBreakdown {
  heading: string;
  points: string[];
}

interface ScheduleItem {
  time: string;
  endTime: string;
  class: string;
  room: string;
  topic: string;
  chapter: string;
  activity: "Topic" | "Practice" | "Revision" | "Test";
  status: "completed" | "current" | "upcoming";
  color: string;
  breakdown: TopicBreakdown[];
  keyFormulas?: string[];
  teachingTip?: string;
}

const scheduleItems: ScheduleItem[] = [
  {
    time: "9:00 AM", endTime: "9:45 AM", class: "10th CBSE Mathematics", room: "Room 302",
    topic: "Real Numbers – Euclid's Division Lemma", chapter: "Ch 1: Real Numbers",
    activity: "Topic", status: "completed", color: "#4299e1",
    breakdown: [
      { heading: "Core Concept", points: ["a = bq + r where 0 ≤ r < b", "Used to find HCF of two positive integers", "Lemma vs Theorem distinction"] },
      { heading: "Steps to Apply", points: ["Apply division to a and b (a > b)", "If r = 0, b is HCF", "Else apply lemma to b and r, repeat"] },
    ],
    keyFormulas: ["a = bq + r, 0 ≤ r < b", "HCF(a,b) = HCF(b,r)"],
    teachingTip: "Use numerical example (455, 42) before abstract proof. Students struggle with 'why repeat?'"
  },
  {
    time: "10:00 AM", endTime: "10:45 AM", class: "10th CBSE Mathematics", room: "Room 302",
    topic: "Fundamental Theorem of Arithmetic", chapter: "Ch 1: Real Numbers",
    activity: "Practice", status: "current", color: "#48bb78",
    breakdown: [
      { heading: "Core Concept", points: ["Every composite = product of primes (unique)", "Prime factorisation is unique ignoring order", "Applications: finding LCM & HCF"] },
      { heading: "Method", points: ["Factor tree for prime factorisation", "HCF = smallest powers of common primes", "LCM = greatest powers of all primes"] },
    ],
    keyFormulas: ["HCF × LCM = Product of two numbers"],
    teachingTip: "Common mistake: students multiply all primes for HCF. Stress 'smallest power of COMMON primes'."
  },
  {
    time: "11:00 AM", endTime: "11:45 AM", class: "9th CBSE Mathematics", room: "Room 205",
    topic: "Irrational Numbers", chapter: "Ch 1: Number Systems",
    activity: "Topic", status: "upcoming", color: "#ed64a6",
    breakdown: [
      { heading: "What to Cover", points: ["Non-terminating, non-repeating decimals", "√2, √3, π — proof √2 is irrational", "Locating irrationals on number line"] },
      { heading: "Key Distinctions", points: ["Rational: p/q form, terminating/repeating", "Irrational: cannot be p/q", "Together = Real Numbers ℝ"] },
    ],
    keyFormulas: ["√2 ≈ 1.414", "√3 ≈ 1.732"],
    teachingTip: "Walk through proof by contradiction slowly — students find it abstract."
  },
  {
    time: "12:00 PM", endTime: "12:45 PM", class: "8th CBSE Mathematics", room: "Room 101",
    topic: "Properties of Rational Number Operations", chapter: "Ch 1: Rational Numbers",
    activity: "Revision", status: "upcoming", color: "#9f7aea",
    breakdown: [
      { heading: "Properties", points: ["Closure: ✓ for +,−,× | ✗ for ÷ (by 0)", "Commutative: ✓ for +,× | ✗ for −,÷", "Associative: ✓ for +,× | ✗ for −,÷"] },
      { heading: "Special Elements", points: ["Additive identity: 0", "Multiplicative identity: 1", "Inverse of a/b → -a/b and b/a"] },
    ],
    keyFormulas: ["a/b × b/a = 1"],
    teachingTip: "Use ✓/✗ grid for all 4 operations × 3 properties — very visual."
  },
];

const activityColors: Record<string, string> = {
  "Topic": "bg-blue-100 text-blue-800",
  "Practice": "bg-green-100 text-green-800",
  "Revision": "bg-purple-100 text-purple-800",
  "Test": "bg-red-100 text-red-800",
};

const TeacherDailyTodo = () => {
  const [expandedSlot, setExpandedSlot] = useState<number | null>(
    scheduleItems.findIndex(s => s.status === "current") >= 0
      ? scheduleItems.findIndex(s => s.status === "current")
      : 0
  );

  const toggleSlot = (i: number) => setExpandedSlot(expandedSlot === i ? null : i);

  const completedCount = scheduleItems.filter(s => s.status === "completed").length;
  const totalCount = scheduleItems.length;

  return (
    <DashboardLayout role="teacher">
      <main className="p-8 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">Today's Teaching Plan</h1>
          <p className="text-muted-foreground">Your daily schedule with topic breakdowns for quick revision before each class</p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>{completedCount}/{totalCount} classes done</span>
            </div>
            <div className="flex-1 max-w-[200px] h-2 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(completedCount / totalCount) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Schedule Timeline */}
        <div className="space-y-3">
          {scheduleItems.map((item, i) => {
            const isExpanded = expandedSlot === i;
            const statusLabel = item.status === "completed" ? "Done" : item.status === "current" ? "Now" : "Next";
            const statusClass = item.status === "completed"
              ? "bg-green-100 text-green-800"
              : item.status === "current"
                ? "bg-amber-100 text-amber-800 animate-pulse"
                : "bg-slate-100 text-slate-600";

            return (
              <div key={i} className="rounded-xl border border-border/60 overflow-hidden transition-all shadow-sm" style={{ borderLeftWidth: "4px", borderLeftColor: item.color }}>
                {/* Timeline Row */}
                <button
                  onClick={() => toggleSlot(i)}
                  className="w-full flex items-center gap-4 p-5 text-left bg-card hover:bg-accent/30 transition-colors border-none cursor-pointer"
                >
                  <div className="min-w-[90px]">
                    <div className="font-semibold text-foreground">{item.time}</div>
                    <div className="text-xs text-muted-foreground">{item.endTime}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground truncate">{item.topic}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${activityColors[item.activity]}`}>{item.activity}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{item.class}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.room}</span>
                      <span className="text-muted-foreground/60">• {item.chapter}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${statusClass}`}>{statusLabel}</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                </button>

                {/* Expanded: Topic Breakdown */}
                {isExpanded && (
                  <div className="bg-accent/20 border-t border-border/40 p-6 animate-fadeInUp">
                    <div className="grid md:grid-cols-2 gap-4">
                      {item.breakdown.map((section, si) => (
                        <div key={si} className="bg-card rounded-lg p-4 border border-border/30">
                          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                            <BookOpen className="h-3.5 w-3.5 text-primary" />
                            {section.heading}
                          </h4>
                          <ul className="space-y-1.5">
                            {section.points.map((pt, pi) => (
                              <li key={pi} className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className="text-primary mt-0.5 shrink-0">›</span>
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}

                      {item.keyFormulas && item.keyFormulas.length > 0 && (
                        <div className="bg-card rounded-lg p-4 border border-border/30">
                          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                            <FlaskConical className="h-3.5 w-3.5 text-primary" />
                            Key Formulas
                          </h4>
                          <div className="space-y-1.5">
                            {item.keyFormulas.map((f, fi) => (
                              <div key={fi} className="text-xs bg-primary/5 text-primary font-mono px-3 py-1.5 rounded-md border border-primary/10">
                                {f}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.teachingTip && (
                        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200/50 md:col-span-2">
                          <h4 className="text-sm font-semibold text-amber-800 mb-1 flex items-center gap-2">
                            <Lightbulb className="h-3.5 w-3.5" />
                            Teaching Tip
                          </h4>
                          <p className="text-xs text-amber-700 leading-relaxed">{item.teachingTip}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </DashboardLayout>
  );
};

export default TeacherDailyTodo;
