import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronDown, ChevronUp, BookOpen, Clock, MapPin, Lightbulb, FlaskConical } from "lucide-react";

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

const students = [
  { name: "Arjun Reddy", initials: "AR", note: "Excellent progress in algebra", score: 95, perf: "excellent" as const, gradient: "from-emerald-500 to-emerald-600" },
  { name: "Priya Sharma", initials: "PS", note: "Needs support with geometry", score: 67, perf: "needs-support" as const, gradient: "from-orange-400 to-red-500" },
  { name: "Rahul Kumar", initials: "RK", note: "Good improvement shown", score: 82, perf: "good" as const, gradient: "from-blue-500 to-blue-600" },
];

const toolActions: Record<string, string> = {
  "Grade Assignments": "/teacher/assignments",
  "Take Attendance": "/teacher/attendance",
  "Performance Report": "/teacher/performance",
  "Quiz": "/teacher/quiz",
};

const tools = [
  { icon: "📋", label: "Take Attendance" },
  { icon: "📝", label: "Grade Assignments" },
  { icon: "📊", label: "Performance Report" },
  { icon: "🧩", label: "Quiz" },
];

const announcements = [
  { title: "🎓 Mid-Term Exam Schedule Released", desc: "The mid-term examination schedule for all grades has been published. Mathematics exams are scheduled for July 15-18." },
  { title: "📚 New Digital Learning Resources Available", desc: "Interactive mathematics modules and virtual lab simulations are now available on the school portal." },
  { title: "🏆 National Mathematics Olympiad Registration", desc: "Registration is now open for talented students. Deadline: July 30th." },
];


const perfBadgeClass = {
  "excellent": "bg-green-100 text-green-800",
  "needs-support": "bg-red-100 text-red-800",
  "good": "bg-blue-100 text-blue-700",
};

const TeacherDashboard = () => {
  const { fullName } = useAuth();
  const navigate = useNavigate();
  const firstName = fullName?.split(" ")[0] || "Teacher";
  const [expandedSlot, setExpandedSlot] = useState<number | null>(
    scheduleItems.findIndex(s => s.status === "current") >= 0
      ? scheduleItems.findIndex(s => s.status === "current")
      : 0
  );

  const toggleSlot = (i: number) => setExpandedSlot(expandedSlot === i ? null : i);

  return (
    <DashboardLayout role="teacher">
      <main className="p-8 max-w-[1400px] mx-auto">
        {/* Welcome Header */}
        <div className="bg-white/10 backdrop-blur-[10px] rounded-[20px] p-8 mb-8 text-white text-center shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
          <h1 className="text-[2.5rem] mb-2 text-shadow-lg">Good Morning, {firstName}!</h1>
          <p className="text-lg opacity-90 mb-4">Ready to inspire 127 students today? Your dedicated teaching is shaping the future!</p>
          <div className="flex items-center justify-center gap-2.5 text-lg mb-6">
            <span>🔥 15 consecutive days of excellence!</span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 mt-6">
            {[
              { value: "127", label: "Active Students" },
              { value: "6", label: "Classes Today" },
              { value: "23", label: "Assignments to Review" },
              { value: "94%", label: "Class Average" },
            ].map((stat, i) => (
              <div key={i} className="bg-white/20 rounded-2xl p-6 text-center backdrop-blur-[10px]">
                <div className="text-[2.5rem] font-bold mb-2">{stat.value}</div>
                <div className="text-base opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Full-Width: Today's Schedule + Topic Prep ── */}
        <div className="glass-card p-8 mb-8" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-[50px] h-[50px] rounded-xl flex items-center justify-center text-2xl text-white bg-gradient-to-br from-indigo-500 to-purple-500">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Today's Schedule & Topic Prep</h2>
              <p className="text-sm text-muted-foreground">Click any slot to see the topic breakdown for a quick revision</p>
            </div>
          </div>

          <div className="space-y-3">
            {scheduleItems.map((item, i) => {
              const isExpanded = expandedSlot === i;
              const statusLabel = item.status === "completed" ? "Done" : item.status === "current" ? "Now" : "Next";
              const statusClass = item.status === "completed" ? "bg-green-100 text-green-800" : item.status === "current" ? "bg-amber-100 text-amber-800 animate-pulse" : "bg-slate-100 text-slate-600";

              return (
                <div key={i} className="rounded-xl border border-border/60 overflow-hidden transition-all" style={{ borderLeftWidth: "4px", borderLeftColor: item.color }}>
                  {/* Timeline Row */}
                  <button
                    onClick={() => toggleSlot(i)}
                    className="w-full flex items-center gap-4 p-4 text-left bg-card hover:bg-accent/30 transition-colors border-none cursor-pointer"
                  >
                    <div className="min-w-[90px]">
                      <div className="font-semibold text-foreground text-sm">{item.time}</div>
                      <div className="text-xs text-muted-foreground">{item.endTime}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-foreground text-sm truncate">{item.topic}</span>
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
                    <div className="bg-accent/20 border-t border-border/40 p-5 animate-fadeInUp">
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Breakdown sections */}
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

                        {/* Key Formulas */}
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

                        {/* Teaching Tip */}
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
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-8 mb-8">
          {/* Student Spotlight */}
          <div className="glass-card p-8" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-[50px] h-[50px] rounded-xl flex items-center justify-center text-2xl text-white bg-gradient-to-br from-emerald-500 to-emerald-600">👥</div>
              <h2 className="text-2xl font-semibold text-foreground">Student Spotlight</h2>
            </div>
            {students.map((s, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl mb-4 transition-all hover:bg-accent/30">
                <div className={`w-[50px] h-[50px] rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br ${s.gradient}`}>
                  {s.initials}
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 text-foreground">{s.name}</h4>
                  <p className="text-muted-foreground text-sm">{s.note}</p>
                </div>
                <span className={`py-1 px-3 rounded-full text-xs font-semibold ml-auto ${perfBadgeClass[s.perf]}`}>
                  {s.score}%
                </span>
              </div>
            ))}
          </div>

          {/* Quick Teaching Tools */}
          <div className="glass-card p-8" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-[50px] h-[50px] rounded-xl flex items-center justify-center text-2xl text-white bg-gradient-to-br from-yellow-400 to-orange-400">⚡</div>
              <h2 className="text-2xl font-semibold text-foreground">Quick Teaching Tools</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {tools.map((tool, i) => (
                <button key={i} onClick={() => toolActions[tool.label] && navigate(toolActions[tool.label])} className="flex flex-col items-center p-6 rounded-xl bg-accent/30 transition-all cursor-pointer hover:bg-accent/50 hover:-translate-y-0.5 border-none text-inherit">
                  <div className="text-[2rem] mb-2">{tool.icon}</div>
                  <span className="text-sm font-medium text-foreground">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Announcements */}
          <div className="glass-card p-8" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-[50px] h-[50px] rounded-xl flex items-center justify-center text-2xl text-white bg-gradient-to-br from-blue-500 to-blue-600">📢</div>
              <h2 className="text-2xl font-semibold text-foreground">School Updates & Announcements</h2>
            </div>
            {announcements.map((a, i) => (
              <div key={i} className="p-4 border-l-4 border-primary bg-accent/20 rounded-lg mb-4">
                <h4 className="text-foreground mb-2">{a.title}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>

          {/* Teaching Achievements */}
          <div className="glass-card p-8" style={{ animationDelay: "0.5s" }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-[50px] h-[50px] rounded-xl flex items-center justify-center text-2xl text-white bg-gradient-to-br from-yellow-400 to-orange-400">🏆</div>
              <h2 className="text-2xl font-semibold text-foreground">Teaching Achievements</h2>
            </div>
            <div className="bg-gradient-to-br from-pink-400 to-yellow-300 rounded-2xl p-6 text-center text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-xl font-bold mb-2">🏆 100% Assignment Completion</div>
                <div>✨ Award Winner</div>
                <div className="text-sm opacity-90 mt-2">Your innovative teaching methods have increased class participation by 40% this semester. Keep inspiring!</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-[#0f1419]/95 text-white py-8 mt-12 rounded-[20px]">
          <div className="max-w-[1400px] mx-auto px-8 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-8">
            <div>
              <h4 className="mb-4 text-blue-400">EduTech</h4>
              <p className="text-gray-400 leading-relaxed">Empowering education through innovative technology solutions.</p>
            </div>
            <div>
              <h4 className="mb-4 text-blue-400">Quick Links</h4>
              <p className="text-gray-400 leading-relaxed">Dashboard • Schedule • Metrics • Settings</p>
            </div>
            <div>
              <h4 className="mb-4 text-blue-400">Support</h4>
              <p className="text-gray-400 leading-relaxed">mg3labs@gmail.com</p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-4 text-center text-gray-500">
            © 2025 EduTech. All rights reserved.
          </div>
        </footer>
      </main>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
