import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, Brain, Target, Heart, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info, ChevronRight, GraduationCap, Users, BookOpen, ClipboardList, BarChart3, Bell, MessageSquare, Lightbulb, Zap, Shield } from "lucide-react";

const CLASS_OPTIONS = ["Class 10-A", "Class 10-B", "Class 9-A"];

const STAT_CARDS = [
  { label: "Avg Clarity", value: "76%", trend: +3, icon: Eye, borderColor: "border-l-sky-500", bg: "bg-sky-50", iconBg: "bg-sky-100", iconColor: "text-sky-600" },
  { label: "Avg Reasoning", value: "71%", trend: +5, icon: Brain, borderColor: "border-l-purple-500", bg: "bg-purple-50", iconBg: "bg-purple-100", iconColor: "text-purple-600" },
  { label: "Avg Attention", value: "68%", trend: -2, icon: Target, borderColor: "border-l-amber-500", bg: "bg-amber-50", iconBg: "bg-amber-100", iconColor: "text-amber-600" },
  { label: "Avg Character", value: "74%", trend: +4, icon: Heart, borderColor: "border-l-rose-500", bg: "bg-rose-50", iconBg: "bg-rose-100", iconColor: "text-rose-600" },
];

const CURRICULUM_INSIGHTS = [
  {
    title: "Why This Curriculum Develops Thinking",
    icon: "🧠",
    bg: "bg-blue-50", border: "border-blue-200",
    points: [
      "7-layer framework forces students to move beyond memorization",
      "Layer 3 (Reasoning) activates logical thinking — 82% of students show improved deduction",
      "Layer 4 (Assumptions) trains critical questioning — students challenge ideas, not just accept them",
    ],
  },
  {
    title: "How It Builds Character",
    icon: "💎",
    bg: "bg-emerald-50", border: "border-emerald-200",
    points: [
      "Tutorial Defense builds confidence through defended reasoning",
      "First Principles teaches intellectual honesty — accepting what you don't know",
      "Reflection prompts develop self-awareness and emotional regulation",
    ],
  },
  {
    title: "What's Working Best",
    icon: "⭐",
    bg: "bg-amber-50", border: "border-amber-200",
    points: [
      "Students who complete Layer 5+ show 3× better retention in assessments",
      "Voice essays improve articulation scores by 40%",
      "Tutorial Defense sessions correlate with 25% higher exam scores",
    ],
  },
];

const METHODS_PERFORMANCE = [
  { name: "Tutorial Defense", usage: "78%", sessions: 156, icon: "🎓" },
  { name: "First Principles", usage: "65%", sessions: 98, icon: "🔬" },
  { name: "Case Study", usage: "52%", sessions: 73, icon: "📋" },
  { name: "Peer Teaching", usage: "34%", sessions: 42, icon: "👥" },
];

const ALERTS = [
  { type: "critical" as const, student: "Priya Sharma", message: "3 consecutive sessions with declining attention scores", action: "Schedule 1-on-1", icon: AlertTriangle },
  { type: "warning" as const, student: "Rahul Kumar", message: "Skipping Layer 4 (Assumptions) consistently — avoiding critical thinking", action: "Assign Defense", icon: Info },
  { type: "success" as const, student: "Arjun Reddy", message: "Breakthrough! Completed all 7 layers with 90%+ scores for 5 episodes", action: "Acknowledge", icon: CheckCircle },
];

const AI_INSIGHTS = [
  { label: "Class Strength", value: "Logical reasoning in number theory", icon: "💪" },
  { label: "Needs Work", value: "Abstract thinking in geometry applications", icon: "🎯" },
  { label: "Behavioral Pattern", value: "Attention drops 40% after 25 mins — suggest micro-breaks", icon: "📊" },
  { label: "Time Saved", value: "AI grading saved 12 hours this week", icon: "⏱️" },
];

const QUICK_ACTIONS = [
  { label: "Grade Assignments", icon: ClipboardList, path: "/teacher/assignments", color: "from-blue-500 to-blue-600" },
  { label: "Take Attendance", icon: Users, path: "/teacher/attendance", color: "from-emerald-500 to-emerald-600" },
  { label: "Performance Report", icon: BarChart3, path: "/teacher/performance", color: "from-purple-500 to-purple-600" },
  { label: "Announcements", icon: Bell, path: "/teacher/parent-connect", color: "from-amber-500 to-orange-500" },
  { label: "View Schedule", icon: BookOpen, path: "/teacher/schedule", color: "from-teal-500 to-cyan-600" },
  { label: "Analytics", icon: Lightbulb, path: "/teacher/analytics", color: "from-rose-500 to-pink-500" },
];

const alertStyles = {
  critical: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700", dot: "bg-red-500" },
  warning: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  success: { bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
};

const TeacherDashboard = () => {
  const { fullName } = useAuth();
  const navigate = useNavigate();
  const firstName = fullName?.split(" ")[0] || "Teacher";
  const [selectedClass, setSelectedClass] = useState(CLASS_OPTIONS[0]);

  return (
    <DashboardLayout role="teacher">
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Good Morning, {firstName}! 👋</h1>
            <p className="text-muted-foreground mt-1">Your students' Inner OS is evolving — here's what needs your attention.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {CLASS_OPTIONS.map((cls) => (
              <button key={cls} onClick={() => setSelectedClass(cls)}
                className={`px-4 py-2 rounded-full text-sm font-medium border-none cursor-pointer transition-all ${
                  selectedClass === cls
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}>
                {cls}
              </button>
            ))}
          </div>
        </div>

        {/* Pedagogy Badge */}
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-full px-4 py-2 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-700">Oxford & Harvard Pedagogy Active</span>
          </div>
          <div className="bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-200 rounded-full px-4 py-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">7-Layer Framework Deployed</span>
          </div>
        </div>

        {/* ── 4 Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map((stat) => (
            <div key={stat.label} className={`${stat.bg} border-l-4 ${stat.borderColor} rounded-xl p-5 transition-all hover:shadow-md`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                <div className={`w-8 h-8 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                  <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <div className={`flex items-center gap-1 mt-1 text-sm font-medium ${stat.trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {stat.trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {stat.trend >= 0 ? "+" : ""}{stat.trend}% this week
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Grid: Intelligence + Alerts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Curriculum Intelligence */}
          <div className="lg:col-span-2 space-y-5">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" /> Curriculum Intelligence
            </h2>

            {CURRICULUM_INSIGHTS.map((insight, i) => (
              <div key={i} className={`${insight.bg} ${insight.border} border rounded-xl p-5`}>
                <h3 className="font-bold text-foreground text-base flex items-center gap-2 mb-3">
                  <span>{insight.icon}</span> {insight.title}
                </h3>
                <ul className="space-y-2">
                  {insight.points.map((point, j) => (
                    <li key={j} className="text-sm text-foreground/80 flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span> {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Elite Methods Performance */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-bold text-foreground text-base mb-4 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" /> Elite Methods Performance
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {METHODS_PERFORMANCE.map((method) => (
                  <div key={method.name} className="border border-border rounded-lg p-4 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{method.icon}</span>
                      <span className="text-sm font-semibold text-foreground">{method.name}</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">{method.usage}</div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-primary rounded-full" style={{ width: method.usage }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{method.sessions} sessions total</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Alerts */}
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5 text-red-500" /> Needs Attention
            </h2>

            {ALERTS.map((alert, i) => {
              const style = alertStyles[alert.type];
              return (
                <div key={i} className={`${style.bg} ${style.border} border rounded-xl p-4`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full ${style.dot} mt-2 shrink-0`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground text-sm">{alert.student}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
                          {alert.type}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/70 mb-3">{alert.message}</p>
                      <button className="text-xs font-semibold text-primary hover:underline bg-transparent border-none cursor-pointer p-0 flex items-center gap-1">
                        {alert.action} <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* AI Behavioral Insights */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-5 text-white">
              <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                <Zap className="h-4 w-4" /> AI Behavioral Insights
              </h3>
              <div className="space-y-3">
                {AI_INSIGHTS.map((insight, i) => (
                  <div key={i} className="bg-white/10 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{insight.icon}</span>
                      <div>
                        <p className="text-xs text-white/70 font-medium">{insight.label}</p>
                        <p className="text-sm text-white font-medium mt-0.5">{insight.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <button key={action.label} onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-3 p-5 rounded-xl bg-card border border-border hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer text-center group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="bg-[#0f1419]/95 text-white py-6 rounded-2xl mt-4">
          <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
            <div>
              <h4 className="mb-2 text-blue-400 text-sm">EduTech</h4>
              <p className="text-gray-400 text-xs leading-relaxed">Empowering education through innovative technology.</p>
            </div>
            <div>
              <h4 className="mb-2 text-blue-400 text-sm">Quick Links</h4>
              <p className="text-gray-400 text-xs">Dashboard • Schedule • Metrics • Settings</p>
            </div>
            <div>
              <h4 className="mb-2 text-blue-400 text-sm">Support</h4>
              <p className="text-gray-400 text-xs">mg3labs@gmail.com</p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-4 pt-3 text-center text-gray-500 text-xs">
            © 2025 EduTech. All rights reserved.
          </div>
        </footer>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
