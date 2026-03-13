import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { findTextbookMatch } from "@/data/topicTextbookMap";
import PopQuizModal from "@/components/student/PopQuizModal";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Brain, Eye, Zap, Heart, TrendingUp, Flame, Star, ChevronRight, GraduationCap, Target, Users, Lightbulb, Award } from "lucide-react";
import HelpTooltip from "@/components/HelpTooltip";
import EmptyState from "@/components/EmptyState";

interface ScheduleItem {
  type: string;
  title?: string;
  label?: string;
  cssClass?: string;
  chapterId?: string;
  isNational?: boolean;
}

interface SubjectSchedule {
  subject: string;
  schedule: Record<string, ScheduleItem>;
  chapters: { id: string; name: string; colorHex: string }[];
}

const SUBJECT_META: Record<string, { icon: string; time: string; color: string }> = {
  "Mathematics": { icon: "📐", time: "09:00 AM – 10:00 AM", color: "#667eea" },
  "Science": { icon: "🔬", time: "10:00 AM – 11:00 AM", color: "#48bb78" },
  "English": { icon: "📖", time: "11:15 AM – 12:15 PM", color: "#9f7aea" },
  "Social Science": { icon: "🌍", time: "01:00 PM – 02:00 PM", color: "#ed8936" },
  "Hindi": { icon: "🇮🇳", time: "02:00 PM – 03:00 PM", color: "#f56565" },
  "Sanskrit": { icon: "🕉️", time: "03:00 PM – 04:00 PM", color: "#38b2ac" },
};

const BREAKS = [
  { time: "11:00 AM – 11:15 AM", subject: "Short Break", icon: "☕", topic: "Refresh and Energize", type: "break" as const },
  { time: "12:15 PM – 01:00 PM", subject: "Lunch Break", icon: "🍽️", topic: "Nutrition and Rest", type: "break" as const },
];

const calendarDays = ["S", "M", "T", "W", "T", "F", "S"];

// Dimension styling config (scores come from DB)
const DIMENSION_CONFIG = [
  { key: "clarity_score", name: "Clarity", icon: Eye, color: "from-sky-400 to-blue-500", bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700" },
  { key: "thinking_score", name: "Thinking", icon: Brain, color: "from-purple-400 to-purple-600", bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  { key: "attention_score", name: "Attention", icon: Target, color: "from-amber-400 to-orange-500", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
  { key: "momentum_score", name: "Momentum", icon: Zap, color: "from-emerald-400 to-teal-500", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
  { key: "character_score", name: "Character", icon: Heart, color: "from-rose-400 to-pink-500", bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700" },
] as const;

const ELITE_METHOD_META: Record<string, { name: string; desc: string; icon: string; available: boolean }> = {
  tutorial_defense: { name: "Tutorial Defense", desc: "Defend your reasoning like an Oxford scholar", icon: "🎓", available: true },
  first_principles: { name: "First Principles", desc: "Strip concepts to fundamentals like Feynman", icon: "🔬", available: true },
  case_study: { name: "Case Study", desc: "Apply knowledge to real scenarios — Harvard style", icon: "📋", available: true },
  peer_teaching: { name: "Peer Teaching", desc: "Teach others to master it yourself", icon: "👥", available: false },
};

const StudentDashboard = () => {
  const { fullName, user } = useAuth();
  const navigate = useNavigate();
  const firstName = fullName?.split(" ")[0] || "Student";
  const [completedItems, setCompletedItems] = useState<number[]>([]);
  const [subjectSchedules, setSubjectSchedules] = useState<SubjectSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizSubject, setQuizSubject] = useState<string | null>(null);
  const [dailyQuizOpen, setDailyQuizOpen] = useState(false);
  const [dailyQuizScore, setDailyQuizScore] = useState<{ score: number; total: number } | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "schedule">("overview");

  // Fetch Inner OS scores from DB
  const { data: innerOS, isLoading: innerOSLoading } = useQuery({
    queryKey: ["student-inner-os", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_inner_os")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch breakthroughs from DB
  const { data: breakthroughs } = useQuery({
    queryKey: ["student-breakthroughs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_breakthroughs")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // Fetch method session counts
  const { data: methodCounts } = useQuery({
    queryKey: ["student-method-counts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("method_sessions")
        .select("method_type, completed")
        .eq("user_id", user!.id);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((s) => { counts[s.method_type] = (counts[s.method_type] || 0) + 1; });
      return counts;
    },
    enabled: !!user,
  });

  const overallScore = innerOS?.overall_score ?? 0;
  const streakDays = innerOS?.streak_days ?? 0;
  const userLevel = innerOS?.level ?? 1;
  const weeklyGrowth = innerOS?.weekly_growth ?? 0;

  useEffect(() => {
    const fetchAllSchedules = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("class_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile?.class_name) { setLoading(false); return; }

      const { data: schedules } = await supabase
        .from("teaching_schedules")
        .select("subject, schedule_data, chapters_data")
        .eq("class_name", profile.class_name);

      if (schedules) {
        setSubjectSchedules(
          schedules.map((s) => ({
            subject: s.subject,
            schedule: s.schedule_data as unknown as Record<string, ScheduleItem>,
            chapters: (s.chapters_data as unknown as { id: string; name: string; colorHex: string }[]) || [],
          }))
        );
      }
      setLoading(false);
    };
    fetchAllSchedules();
  }, [user]);

  const today = new Date();
  const todayKey = today.toISOString().split("T")[0];

  const todayScheduleItems = useMemo(() => {
    const items: { time: string; subject: string; icon: string; topic: string; type: "class" | "break" | "holiday" | "practice" | "test" | "assignment"; color: string; chapterName?: string }[] = [];
    const orderedSubjects = Object.keys(SUBJECT_META);

    orderedSubjects.forEach((subjectName) => {
      const subSchedule = subjectSchedules.find((s) => s.subject === subjectName);
      const meta = SUBJECT_META[subjectName];
      const todayItem = subSchedule?.schedule[todayKey];

      if (todayItem) {
        const chapterName = todayItem.chapterId
          ? subSchedule?.chapters.find((c) => c.id === todayItem.chapterId)?.name
          : undefined;
        let topic = todayItem.title || todayItem.label || "Scheduled";
        if (chapterName) topic = `${chapterName}: ${topic}`;

        items.push({
          time: meta.time, subject: subjectName, icon: meta.icon, topic,
          type: todayItem.type as any,
          color: todayItem.chapterId
            ? (subSchedule?.chapters.find((c) => c.id === todayItem.chapterId)?.colorHex || meta.color)
            : meta.color,
          chapterName,
        });
      } else {
        items.push({ time: meta.time, subject: subjectName, icon: meta.icon, topic: "Regular Class", type: "class", color: meta.color });
      }

      if (subjectName === "Science") items.push({ ...BREAKS[0], color: "#6b7280" });
      if (subjectName === "English") items.push({ ...BREAKS[1], color: "#6b7280" });
    });

    return items;
  }, [subjectSchedules, todayKey]);

  const toggleComplete = (index: number) => {
    setCompletedItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const totalClasses = todayScheduleItems.filter((s) => s.type !== "break").length;
  const completedClasses = completedItems.filter((i) => todayScheduleItems[i]?.type !== "break").length;
  const progressPercent = totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "topic": return { label: "📚 Topic", bg: "from-blue-50 to-blue-100", text: "text-blue-800", border: "border-blue-300" };
      case "practice": return { label: "🏋️ Practice", bg: "from-cyan-50 to-cyan-100", text: "text-cyan-800", border: "border-cyan-300" };
      case "test": return { label: "📝 Test", bg: "from-red-50 to-red-100", text: "text-red-800", border: "border-red-300" };
      case "assignment": return { label: "📋 Assignment", bg: "from-amber-50 to-amber-100", text: "text-amber-800", border: "border-amber-300" };
      case "holiday": return { label: "🎉 Holiday", bg: "from-orange-50 to-orange-100", text: "text-orange-800", border: "border-orange-300" };
      default: return { label: "📖 Class", bg: "from-gray-50 to-gray-100", text: "text-gray-800", border: "border-gray-300" };
    }
  };

  return (
    <DashboardLayout role="student">
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">

        {/* ── Hero Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Hi, {firstName}! 👋</h1>
            <p className="text-muted-foreground mt-1">Your Inner Operating System is growing stronger every day.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-300 rounded-full px-4 py-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="font-bold text-orange-700">{streakDays} Day Streak</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-300 rounded-full px-4 py-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="font-bold text-yellow-700">Level {userLevel}</span>
            </div>
          </div>
        </div>

        {/* ── Tab Switcher ── */}
        <div className="flex gap-2 bg-muted/50 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all border-none cursor-pointer ${
              activeTab === "overview"
                ? "bg-card text-foreground shadow-sm"
                : "bg-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            🧠 Inner OS Overview
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all border-none cursor-pointer ${
              activeTab === "schedule"
                ? "bg-card text-foreground shadow-sm"
                : "bg-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            📅 Today's Schedule
          </button>
        </div>

        {activeTab === "overview" ? (
          <>
            {/* ── Inner OS Score Card ── */}
            <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                {/* Score Circle */}
                <div className="relative w-32 h-32 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
                    <circle cx="60" cy="60" r="52" fill="none" stroke="white" strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${(overallScore / 100) * 327} 327`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{innerOSLoading ? "..." : `${overallScore}%`}</span>
                    <span className="text-xs text-white/70">Inner OS</span>
                  </div>
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold mb-1">Your Inner Operating System</h2>
                  <p className="text-white/80 text-sm mb-3">
                    Your mind's core abilities — clarity, thinking, attention, momentum, and character — 
                    all growing together to make you a stronger learner.
                  </p>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <TrendingUp className="h-4 w-4 text-emerald-300" />
                    <span className="text-emerald-300 font-semibold text-sm">{weeklyGrowth >= 0 ? "+" : ""}{weeklyGrowth}% growth this week</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 5 Dimension Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {innerOSLoading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)
              ) : (
                DIMENSION_CONFIG.map((dim) => {
                  const score = innerOS ? (innerOS as any)[dim.key] ?? 0 : 0;
                  return (
                    <div key={dim.name} className={`${dim.bg} ${dim.border} border rounded-xl p-4 transition-all hover:shadow-md hover:-translate-y-0.5`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${dim.color} flex items-center justify-center`}>
                          <dim.icon className="h-4 w-4 text-white" />
                        </div>
                        <span className={`text-sm font-semibold ${dim.text}`}>{dim.name}</span>
                      </div>
                      <div className="text-2xl font-bold text-foreground mb-1">{score}%</div>
                      <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden mb-2">
                        <div className={`h-full rounded-full bg-gradient-to-r ${dim.color}`} style={{ width: `${score}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── Main Grid: Continue Learning + Methods + Breakthroughs ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Continue Learning */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" /> Continue Learning
                  </h3>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                      1
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground">Chapter 1: Real Numbers</h4>
                      <p className="text-sm text-muted-foreground">Episode 1 — Euclid's Division Algorithm</p>
                      <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: "35%" }} />
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 block">35% complete</span>
                    </div>
                    <button
                      onClick={() => navigate("/student/textbook/ch1")}
                      className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold border-none cursor-pointer hover:opacity-90 transition-all flex items-center gap-1 shrink-0"
                    >
                      Continue <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Elite University Methods */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" /> Elite University Methods
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">World-class thinking tools adapted for you</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(ELITE_METHOD_META).map(([key, method]) => {
                      const sessions = methodCounts?.[key] ?? 0;
                      return (
                        <div key={key}
                          className={`border rounded-xl p-4 transition-all ${
                            method.available
                              ? "bg-card border-border hover:border-primary/30 hover:shadow-sm cursor-pointer"
                              : "bg-muted/30 border-border opacity-60 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{method.icon}</span>
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground text-sm">{method.name}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">{method.desc}</p>
                              {method.available ? (
                                <span className="text-xs text-primary font-medium mt-2 block">{sessions} sessions completed</span>
                              ) : (
                                <span className="text-xs text-muted-foreground mt-2 block">🔒 Coming Soon</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Sidebar: Today's Focus + Breakthroughs */}
              <div className="space-y-5">
                {/* Today's Focus */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" /> Today's Focus
                  </h3>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                    <p className="font-semibold text-amber-900 text-sm">Real Numbers — Episode 1</p>
                    <p className="text-xs text-amber-700 mt-1">Focus on understanding Euclid's Division Algorithm through the 7-layer framework</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">Layer 3: Reasoning</span>
                    </div>
                  </div>
                </div>

                {/* Recent Breakthroughs */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" /> Recent Breakthroughs
                  </h3>
                  <div className="space-y-3">
                    {(breakthroughs ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground italic text-center py-4">Complete your first episode to earn breakthroughs!</p>
                    ) : (
                      (breakthroughs ?? []).map((b) => (
                        <div key={b.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <span className="text-lg">{b.icon}</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">{b.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{new Date(b.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-base font-bold text-foreground mb-3">📊 Quick Stats</h3>
                  {[
                    { label: "Episodes Completed", value: "3" },
                    { label: "Methods Used", value: "8" },
                    { label: "Study Hours", value: "12.5h" },
                    { label: "Weekly Gems", value: "45 💎" },
                  ].map((stat, i) => (
                    <div key={i} className="flex justify-between items-center py-2.5 border-b border-border last:border-none">
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                      <span className="text-sm font-bold text-foreground">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ── Schedule Tab (existing functionality) ── */
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <aside className="w-full lg:w-[350px] lg:flex-shrink-0 space-y-5">
              {/* Calendar Card */}
              <div className="bg-[#1a1a1a]/90 text-white rounded-2xl p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="text-lg font-medium">Day {today.getDate()}</div>
                    <div className="text-xs text-gray-500">{today.toLocaleDateString("en-US", { weekday: "long" })}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button className="text-gray-500 hover:text-white transition-colors text-lg bg-transparent border-none cursor-pointer">‹</button>
                    <div className="bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-yellow-400 rounded-xl py-2 px-3 flex items-center gap-2">
                      <span className="text-base text-yellow-400 font-bold">{today.getDate()}</span>
                      <span className="text-[10px] text-gray-300">{today.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}</span>
                    </div>
                    <button className="text-gray-500 hover:text-white transition-colors text-lg bg-transparent border-none cursor-pointer">›</button>
                  </div>
                </div>
                <div className="mb-5">
                  <div className="text-sm text-gray-500 mb-2 text-center">
                    {today.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </div>
                  <div className="grid grid-cols-7 gap-1 mb-3">
                    {calendarDays.map((d, i) => (
                      <div key={i} className="text-center text-xs text-gray-500 py-2 font-medium">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
                      const cells = [];
                      for (let i = 0; i < firstDayOfMonth; i++) cells.push(<div key={`e-${i}`} className="aspect-square" />);
                      for (let d = 1; d <= daysInMonth; d++) {
                        const isToday = d === today.getDate();
                        const isPast = d < today.getDate();
                        cells.push(
                          <button key={d} className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium cursor-pointer transition-all border-none relative
                            ${isToday ? "bg-emerald-500 text-white" : ""}
                            ${isPast ? "bg-gray-700/50 text-gray-400" : ""}
                            ${!isToday && !isPast ? "bg-transparent text-white hover:bg-[#3a3a3a]" : ""}`}>
                            {d}
                          </button>
                        );
                      }
                      return cells;
                    })()}
                  </div>
                </div>
              </div>

              {/* Today's Info */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-base font-bold text-foreground mb-3">📅 Today</h3>
                <div className="text-center text-base font-semibold mb-3 text-primary">
                  {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </div>
                {progressPercent >= 100 ? (
                  <button onClick={() => setDailyQuizOpen(true)}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 rounded-xl font-semibold border-none text-center cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all animate-pulse">
                    🧠 Daily Knowledge Quiz — Unlocked! 🎉
                  </button>
                ) : (
                  <div className="w-full bg-muted text-muted-foreground p-4 rounded-xl font-medium text-center cursor-not-allowed">
                    🔒 Daily Quiz — Complete all classes to unlock
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-base font-bold text-foreground mb-3">📊 Progress</h3>
                {[
                  { label: "Subjects Today:", value: String(totalClasses) },
                  { label: "Completed:", value: String(completedClasses) },
                  { label: "Progress:", value: `${progressPercent}%` },
                  ...(dailyQuizScore ? [{ label: "Daily Quiz:", value: `${dailyQuizScore.score}/${dailyQuizScore.total}` }] : []),
                ].map((stat, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 border-b border-border last:border-none">
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                    <span className="text-sm font-bold text-foreground">{stat.value}</span>
                  </div>
                ))}
              </div>
            </aside>

            {/* Schedule Cards */}
            <section className="flex-1">
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-xl font-bold text-foreground mb-1">📝 Today's Class Schedule</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  {loading ? "Loading schedule..." : "Synced from your teacher's calendar — click to mark complete!"}
                </p>

                <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(320px,1fr))] mb-6">
                  {todayScheduleItems.map((item, i) => {
                    const isCompleted = completedItems.includes(i);
                    const badge = getTypeBadge(item.type);

                    return (
                      <button key={i} onClick={() => toggleComplete(i)}
                        className={`text-foreground p-5 rounded-xl cursor-pointer transition-all border-2 text-left relative overflow-hidden group
                          ${isCompleted
                            ? "bg-gradient-to-br from-green-100 to-green-50 border-emerald-500 scale-[0.98]"
                            : "bg-card border-border hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"}`}>
                        {isCompleted && <span className="absolute top-3 right-3 text-emerald-500 font-bold text-xl">✓</span>}
                        <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-semibold text-muted-foreground mb-1 block pl-3">{item.time}</span>
                        <div className="text-base font-bold text-foreground mb-2 pl-3">
                          {item.icon} {item.subject}
                          {item.type === "break" && <span className="ml-2 text-xs font-normal text-muted-foreground italic">Refresh</span>}
                        </div>
                        <span className="text-xs text-muted-foreground italic py-1 px-2.5 bg-primary/5 rounded-full inline-block ml-3">{item.topic}</span>

                        {item.type !== "break" && (
                          <div className="flex gap-2 mt-3 pt-2 border-t border-border pl-3" onClick={(e) => e.stopPropagation()}>
                            <span className={`py-1.5 px-3 rounded-full text-[11px] font-semibold bg-gradient-to-r ${badge.bg} ${badge.text} border ${badge.border} cursor-pointer hover:-translate-y-0.5 transition-all`}>
                              {badge.label}
                            </span>
                            <span className="py-1.5 px-3 rounded-full text-[11px] font-semibold bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 border border-purple-300 cursor-pointer hover:-translate-y-0.5 transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                const topicMatch = findTextbookMatch(item.topic);
                                navigate(`/student/deep-dive?topic=${encodeURIComponent(item.topic)}&subject=${encodeURIComponent(item.subject)}&date=${todayKey}${topicMatch ? `&chapter=${topicMatch.chapterId}` : ""}`);
                              }}>
                              🔍 Deep Dive
                            </span>
                            <span className="py-1.5 px-3 rounded-full text-[11px] font-semibold bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-800 border border-emerald-300 cursor-pointer hover:-translate-y-0.5 transition-all"
                              onClick={(e) => { e.stopPropagation(); setQuizSubject(item.subject); }}>
                              ⚡ Pop Quiz
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Progress Bar */}
                <div className="bg-muted/30 p-5 rounded-xl border border-border">
                  <h3 className="text-foreground text-base mb-3 text-center font-semibold">📈 Progress Today</h3>
                  <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden mb-2">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <p className="text-center text-muted-foreground text-sm font-semibold">{progressPercent}% Complete</p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {quizSubject && <PopQuizModal open={!!quizSubject} onClose={() => setQuizSubject(null)} subject={quizSubject} />}
      {dailyQuizOpen && (
        <PopQuizModal open={dailyQuizOpen} onClose={() => setDailyQuizOpen(false)} subject="All Subjects" mode="daily"
          onComplete={(score, total) => setDailyQuizScore({ score, total })} />
      )}
    </DashboardLayout>
  );
};

export default StudentDashboard;
