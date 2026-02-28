import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { findTextbookMatch } from "@/data/topicTextbookMap";
import PopQuizModal from "@/components/student/PopQuizModal";

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

  // Build today's dynamic schedule from all subjects
  const todayScheduleItems = useMemo(() => {
    const items: { time: string; subject: string; icon: string; topic: string; type: "class" | "break" | "holiday" | "practice" | "test" | "assignment"; color: string; chapterName?: string }[] = [];

    // Sort subjects by their time slots
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
          time: meta.time,
          subject: subjectName,
          icon: meta.icon,
          topic,
          type: todayItem.type as any,
          color: todayItem.chapterId
            ? (subSchedule?.chapters.find((c) => c.id === todayItem.chapterId)?.colorHex || meta.color)
            : meta.color,
          chapterName,
        });
      } else {
        // No schedule for this subject today - still show as regular class
        items.push({
          time: meta.time,
          subject: subjectName,
          icon: meta.icon,
          topic: "Regular Class",
          type: "class",
          color: meta.color,
        });
      }

      // Insert breaks at appropriate positions
      if (subjectName === "Science") {
        items.push({ ...BREAKS[0], color: "#6b7280" });
      }
      if (subjectName === "English") {
        items.push({ ...BREAKS[1], color: "#6b7280" });
      }
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

  // Find today's highlighted topic (first topic-type item)
  const todayHighlight = todayScheduleItems.find((s) => (s.type as string) === "topic");

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
      <div className="p-[30px] space-y-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-[30px]">
          {/* Sidebar */}
          <aside className="w-full lg:w-[350px] lg:flex-shrink-0">
            {/* Calendar Card */}
            <div className="bg-[#1a1a1a]/90 text-white rounded-2xl p-5 mb-5">
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

              {/* Mini Calendar */}
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
                    for (let i = 0; i < firstDayOfMonth; i++) {
                      cells.push(<div key={`e-${i}`} className="aspect-square" />);
                    }
                    for (let d = 1; d <= daysInMonth; d++) {
                      const isToday = d === today.getDate();
                      const isPast = d < today.getDate();
                      cells.push(
                        <button
                          key={d}
                          className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium cursor-pointer transition-all border-none relative
                            ${isToday ? "bg-emerald-500 text-white" : ""}
                            ${isPast ? "bg-gray-700/50 text-gray-400" : ""}
                            ${!isToday && !isPast ? "bg-transparent text-white hover:bg-[#3a3a3a]" : ""}
                          `}
                        >
                          {d}
                        </button>
                      );
                    }
                    return cells;
                  })()}
                </div>
              </div>
            </div>

            {/* Today's Highlighted Topic */}
            {todayHighlight && (
              <div className="bg-white/95 backdrop-blur-[10px] p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/20 mb-5">
                <h3 className="mb-4 text-lg font-semibold border-b-[3px] border-blue-500 pb-2 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  📚 Today's Focus
                </h3>
                <div
                  className="text-white text-sm px-3 py-2.5 rounded-xl text-center font-medium"
                  style={{ backgroundColor: todayHighlight.color }}
                >
                  {todayHighlight.icon} {todayHighlight.subject}
                </div>
                <p className="text-sm text-muted-foreground mt-2 text-center">{todayHighlight.topic}</p>
              </div>
            )}

            {/* Today's Info Card */}
            <div className="bg-white/95 backdrop-blur-[10px] p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/20 mb-5">
              <h3 className="mb-4 text-lg font-semibold border-b-[3px] border-blue-500 pb-2 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                📅 Today
              </h3>
              <div className="text-center text-lg font-semibold mb-4 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </div>
              <button className="w-full bg-gradient-to-r from-orange-50 to-pink-50 text-orange-700 p-4 rounded-xl border-l-4 border-orange-500 font-medium border-none text-left cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all">
                📝 Today's Draft
              </button>

              {/* Daily Knowledge Quiz - unlocks at 100% */}
              {progressPercent >= 100 ? (
                <button
                  onClick={() => setDailyQuizOpen(true)}
                  className="w-full mt-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 rounded-xl font-semibold border-none text-center cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all animate-pulse"
                >
                  🧠 Daily Knowledge Quiz — Unlocked! 🎉
                </button>
              ) : (
                <div className="w-full mt-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-400 p-4 rounded-xl font-medium text-center cursor-not-allowed border-none">
                  🔒 Daily Quiz — Complete all classes to unlock
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white/95 backdrop-blur-[10px] p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/20">
              <h3 className="mb-4 text-lg font-semibold border-b-[3px] border-blue-500 pb-2 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                📊 Quick Stats
              </h3>
              {[
                { label: "Subjects Today:", value: String(totalClasses) },
                { label: "Completed:", value: String(completedClasses) },
                { label: "Remaining:", value: String(totalClasses - completedClasses) },
                { label: "Progress:", value: `${progressPercent}%` },
                ...(dailyQuizScore ? [{ label: "Daily Quiz:", value: `${dailyQuizScore.score}/${dailyQuizScore.total}` }] : []),
              ].map((stat, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-gray-100/50 last:border-none hover:bg-blue-500/5 hover:rounded-lg hover:px-2.5 transition-all">
                  <span className="text-gray-500 text-sm font-medium">{stat.label}</span>
                  <span className="font-bold text-lg bg-gradient-to-r from-blue-500 to-[#2c3e50] bg-clip-text text-transparent">{stat.value}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <section className="flex-1">
            <div className="bg-white/95 backdrop-blur-[10px] rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/20 h-full">
              <div className="mb-6 border-b-[3px] border-blue-500 pb-4">
                <h2 className="text-[28px] bg-gradient-to-r from-[#2c3e50] to-blue-500 bg-clip-text text-transparent mb-1 font-bold">
                  📝 Today's Class Schedule
                </h2>
                <p className="text-gray-500 text-base italic">
                  {loading ? "Loading schedule..." : "Synced from your teacher's calendar — click to mark complete!"}
                </p>
              </div>

              <div className="grid gap-5 grid-cols-[repeat(auto-fit,minmax(350px,1fr))] mb-8">
                {todayScheduleItems.map((item, i) => {
                  const isCompleted = completedItems.includes(i);
                  const badge = getTypeBadge(item.type);

                  return (
                    <button
                      key={i}
                      onClick={() => toggleComplete(i)}
                      className={`text-[#333] p-6 rounded-2xl cursor-pointer transition-all border-2 text-left relative overflow-hidden group
                        ${isCompleted
                          ? "bg-gradient-to-br from-green-100 to-green-50 border-emerald-500 scale-[0.98]"
                          : "bg-gradient-to-br from-white to-gray-50 border-blue-500/20 hover:border-blue-500 hover:shadow-[0_8px_25px_rgba(52,152,219,0.25)] hover:-translate-y-1 hover:scale-[1.02]"
                        }`}
                    >
                      {isCompleted && (
                        <span className="absolute top-4 right-4 text-emerald-500 font-bold text-xl animate-scale-in">✓</span>
                      )}

                      {/* Type indicator bar */}
                      <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ backgroundColor: item.color }} />

                      <span className="text-[13px] font-semibold text-gray-500 mb-1 block pl-3">{item.time}</span>
                      <div className="text-lg font-bold text-[#2c3e50] mb-2 pl-3">
                        {item.icon} {item.subject}
                        {item.type === "break" && <span className="ml-2 text-xs font-normal text-gray-400 italic">Refresh and Energize</span>}
                      </div>
                      <span className="text-sm text-gray-500 italic py-1 px-2.5 bg-blue-500/10 rounded-full inline-block ml-3">{item.topic}</span>

                      {item.type !== "break" && (
                        <div className="flex gap-2 mt-3 pt-2 border-t border-blue-500/20 pl-3" onClick={(e) => e.stopPropagation()}>
                          <span className={`py-1.5 px-3.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-gradient-to-r ${badge.bg} ${badge.text} border ${badge.border} hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer`}>
                            {badge.label}
                          </span>
                          <span
                            className="py-1.5 px-3.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 border border-purple-300 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              const topicMatch = findTextbookMatch(item.topic);
                              navigate(`/student/deep-dive?topic=${encodeURIComponent(item.topic)}&subject=${encodeURIComponent(item.subject)}&date=${todayKey}${topicMatch ? `&chapter=${topicMatch.chapterId}` : ""}`);
                            }}
                          >
                            🔍 Deep Dive
                          </span>
                          <span
                            className="py-1.5 px-3.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-800 border border-emerald-300 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuizSubject(item.subject);
                            }}
                          >
                            ⚡ Pop Quiz
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Progress Section */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border border-blue-500/20 shadow-inner">
                <h3 className="text-[#2c3e50] text-xl mb-4 text-center font-semibold">📈 Progress Today</h3>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden my-4 shadow-inner">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-600" style={{ width: `${progressPercent}%` }} />
                </div>
                <p className="text-center text-gray-500 text-base font-semibold">{progressPercent}% Complete</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Pop Quiz Modal */}
      {quizSubject && (
        <PopQuizModal
          open={!!quizSubject}
          onClose={() => setQuizSubject(null)}
          subject={quizSubject}
        />
      )}

      {/* Daily Knowledge Quiz Modal */}
      {dailyQuizOpen && (
        <PopQuizModal
          open={dailyQuizOpen}
          onClose={() => setDailyQuizOpen(false)}
          subject="All Subjects"
          mode="daily"
          onComplete={(score, total) => setDailyQuizScore({ score, total })}
        />
      )}
    </DashboardLayout>
  );
};

export default StudentDashboard;