import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ScheduleItem {
  type: string;
  title?: string;
  label?: string;
  cssClass?: string;
  chapterId?: string;
  isNational?: boolean;
  key?: string;
}

interface SubjectConfig {
  name: string;
  icon: string;
  color: string;
  gradient: string;
}

const SUBJECTS: SubjectConfig[] = [
  { name: "Mathematics", icon: "🔢", color: "#667eea", gradient: "from-indigo-500 to-purple-600" },
  { name: "Science", icon: "🔬", color: "#48bb78", gradient: "from-green-500 to-teal-600" },
  { name: "Social Science", icon: "🌍", color: "#ed8936", gradient: "from-orange-500 to-amber-600" },
  { name: "English", icon: "📖", color: "#9f7aea", gradient: "from-purple-500 to-pink-600" },
  { name: "Hindi", icon: "🇮🇳", color: "#f56565", gradient: "from-red-500 to-rose-600" },
  { name: "Sanskrit", icon: "🕉️", color: "#38b2ac", gradient: "from-teal-500 to-cyan-600" },
];

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const toKey = (date: Date) => date.toISOString().split("T")[0];

interface TopicModalData {
  title: string;
  subject: string;
  type: string;
  chapterName?: string;
}

const StudentCalendar = () => {
  const { user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [schedulesBySubject, setSchedulesBySubject] = useState<Record<string, { schedule: Record<string, ScheduleItem>; chapters: { id: string; name: string; colorHex: string }[] }>>({});
  const [monthIndex, setMonthIndex] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [modalTopic, setModalTopic] = useState<TopicModalData | null>(null);

  // Fetch all schedules for the student's class
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("class_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile?.class_name) return;

      const { data: schedules } = await supabase
        .from("teaching_schedules")
        .select("subject, schedule_data, chapters_data")
        .eq("class_name", profile.class_name);

      if (schedules) {
        const map: typeof schedulesBySubject = {};
        schedules.forEach((s) => {
          map[s.subject] = {
            schedule: s.schedule_data as unknown as Record<string, ScheduleItem>,
            chapters: (s.chapters_data as unknown as { id: string; name: string; colorHex: string }[]) || [],
          };
        });
        setSchedulesBySubject(map);
      }
    };
    fetchSchedules();
  }, [user]);

  const now = new Date();
  const monthDate = new Date(Date.UTC(year, monthIndex, 1));
  const monthName = monthDate.toLocaleString("default", { month: "long", timeZone: "UTC" });
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  let firstDay = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  firstDay = firstDay === 0 ? 6 : firstDay - 1;

  const prevMonth = () => {
    if (monthIndex === 0) { setMonthIndex(11); setYear((y) => y - 1); }
    else setMonthIndex((m) => m - 1);
  };
  const nextMonth = () => {
    if (monthIndex === 11) { setMonthIndex(0); setYear((y) => y + 1); }
    else setMonthIndex((m) => m + 1);
  };

  const currentSchedule = selectedSubject ? schedulesBySubject[selectedSubject] : null;

  const chapterColorMap = useMemo(() => {
    if (!currentSchedule?.chapters) return {};
    const m: Record<string, { name: string; hex: string }> = {};
    currentSchedule.chapters.forEach((c) => { m[c.id] = { name: c.name, hex: c.colorHex }; });
    return m;
  }, [currentSchedule]);

  const chaptersInMonth = useMemo(() => {
    if (!currentSchedule) return [];
    const ids = new Set<string>();
    for (let d = 1; d <= daysInMonth; d++) {
      const key = toKey(new Date(Date.UTC(year, monthIndex, d)));
      const item = currentSchedule.schedule[key];
      if (item?.chapterId) ids.add(item.chapterId);
    }
    return Array.from(ids).map((id) => chapterColorMap[id]).filter(Boolean);
  }, [currentSchedule, monthIndex, year, daysInMonth, chapterColorMap]);

  const hasSchedule = (subjectName: string) => !!schedulesBySubject[subjectName];

  // Subject selection view
  if (!selectedSubject) {
    return (
      <DashboardLayout role="student" breadcrumbItems={[{ label: "Dashboard", href: "/student" }, { label: "Calendar" }]}>
        <div className="p-8 max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1e3c72] to-[#2a5298] text-white text-center py-10 px-8 rounded-2xl mb-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
            <h1 className="text-3xl font-bold mb-2 relative z-10">🎓 CBSE Class 10 Learning Calendar</h1>
            <p className="text-lg opacity-90 relative z-10">Interactive Subject-wise Study Planner • Academic Year 2025–26</p>
          </div>

          {/* Subject cards */}
          <h2 className="text-2xl font-semibold text-card-foreground mb-6 text-center">Choose Your Subject to Begin</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[900px] mx-auto">
            {SUBJECTS.map((sub) => {
              const available = hasSchedule(sub.name);
              return (
                <button
                  key={sub.name}
                  onClick={() => setSelectedSubject(sub.name)}
                  className={`bg-gradient-to-br ${sub.gradient} rounded-2xl p-8 text-white text-left cursor-pointer transition-all border-none relative overflow-hidden group hover:-translate-y-2 hover:shadow-xl`}
                >
                  <span className="text-4xl block mb-3">{sub.icon}</span>
                  <span className="text-lg font-semibold block">{sub.name}</span>
                  {available && (
                    <span className="text-xs mt-2 block opacity-80 bg-white/20 rounded-full px-3 py-1 w-fit">📅 Schedule Available</span>
                  )}
                  {!available && (
                    <span className="text-xs mt-2 block opacity-60">Coming soon</span>
                  )}
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Calendar view for selected subject
  const subjectConfig = SUBJECTS.find((s) => s.name === selectedSubject)!;

  const days: JSX.Element[] = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="min-h-[120px] bg-muted/30 rounded-lg" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const key = toKey(new Date(Date.UTC(year, monthIndex, d)));
    const item = currentSchedule?.schedule[key];
    const isToday = d === now.getDate() && monthIndex === now.getMonth() && year === now.getFullYear();
    const dayOfWeek = new Date(Date.UTC(year, monthIndex, d)).getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let cellClasses = "bg-card";
    if (isToday) cellClasses = "ring-2 ring-primary shadow-lg";
    if (isWeekend && !item) cellClasses = "bg-muted/50 opacity-70";
    if (item?.isNational) cellClasses = "bg-orange-50 border-2 border-orange-400";
    else if (item?.type === "holiday") cellClasses = "bg-red-50 border-red-200";

    days.push(
      <div
        key={d}
        className={`min-h-[120px] p-3 rounded-lg border border-border/30 relative transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 cursor-pointer ${cellClasses}`}
        onClick={() => {
          if (item) {
            setModalTopic({
              title: item.title || item.label || "No topic",
              subject: selectedSubject,
              type: item.type,
              chapterName: item.chapterId ? chapterColorMap[item.chapterId]?.name : undefined,
            });
          }
        }}
      >
        <div className={`text-sm font-semibold mb-2 ${isToday ? "text-primary" : "text-card-foreground"}`}>
          {d}
        </div>
        {item && (
          <>
            {item.isNational && (
              <div className="bg-orange-500 text-white text-[11px] px-2 py-1.5 rounded-md text-center font-medium animate-fade-in">
                {item.label}
              </div>
            )}
            {!item.isNational && item.type === "holiday" && (
              <div className="bg-red-500 text-white text-[11px] px-2 py-1.5 rounded-md text-center font-medium">
                {item.label}
              </div>
            )}
            {item.type === "topic" && (
              <div
                className="text-white text-[11px] px-2 py-1.5 rounded-md text-center font-medium leading-tight transition-all hover:scale-105"
                style={{ backgroundColor: (item.chapterId && chapterColorMap[item.chapterId]?.hex) || subjectConfig.color }}
              >
                {item.title}
              </div>
            )}
            {item.type === "practice" && (
              <div className="bg-cyan-500 text-white text-[11px] px-2 py-1.5 rounded-md text-center font-medium">
                Practice Day
              </div>
            )}
            {item.type === "test" && (
              <div className="bg-red-500 text-white text-[11px] px-2 py-1.5 rounded-md text-center font-medium">
                {item.title}
              </div>
            )}
            {item.type === "assignment" && (
              <div className="bg-amber-500 text-gray-900 text-[11px] px-2 py-1.5 rounded-md text-center font-medium">
                {item.title}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <DashboardLayout role="student">
      <div className="p-8 max-w-[1400px] mx-auto">
        <div className="bg-card/95 backdrop-blur rounded-2xl overflow-hidden shadow-lg border border-border/20">
          {/* Header */}
          <div className={`bg-gradient-to-r ${subjectConfig.gradient} text-white py-8 px-8 text-center relative`}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
            <h1 className="text-2xl font-bold mb-1 relative z-10">{subjectConfig.icon} {selectedSubject} Calendar</h1>
            <p className="opacity-90 relative z-10">CBSE Class 10 • Academic Year 2025–26</p>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center px-6 py-4 bg-secondary/50 border-b border-border/30">
            <button
              onClick={() => setSelectedSubject(null)}
              className="flex items-center gap-2 bg-muted hover:bg-muted/80 text-card-foreground border-none px-4 py-2 rounded-full cursor-pointer font-medium transition-all"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Subjects
            </button>
            <div className="flex items-center gap-4">
              <button onClick={prevMonth} className="w-10 h-10 rounded-full text-white flex items-center justify-center transition-all border-none cursor-pointer hover:scale-110" style={{ background: subjectConfig.color }}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h3 className="text-lg font-semibold text-card-foreground min-w-[160px] text-center">
                {monthName} {year}
              </h3>
              <button onClick={nextMonth} className="w-10 h-10 rounded-full text-white flex items-center justify-center transition-all border-none cursor-pointer hover:scale-110" style={{ background: subjectConfig.color }}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div />
          </div>

          {/* Calendar Grid */}
          {currentSchedule ? (
            <>
              <div className="grid grid-cols-7 gap-px p-5">
                {DAY_HEADERS.map((h) => (
                  <div key={h} className="bg-gray-700 text-white py-3 text-center text-xs font-semibold rounded-md">
                    {h}
                  </div>
                ))}
                {days}
              </div>

              {/* Legend */}
              <div className="px-6 py-4 bg-secondary/50 border-t border-border/30 flex flex-wrap gap-4 justify-center">
                {chaptersInMonth.map((ch) => (
                  <div key={ch.name} className="flex items-center gap-1.5 text-xs font-medium text-card-foreground">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: ch.hex }} />
                    <span>{ch.name}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 text-xs font-medium text-card-foreground">
                  <div className="w-4 h-4 rounded bg-cyan-500" />
                  <span>Practice</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-card-foreground">
                  <div className="w-4 h-4 rounded bg-red-500" />
                  <span>Test</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-card-foreground">
                  <div className="w-4 h-4 rounded bg-amber-500" />
                  <span>Assignment</span>
                </div>
              </div>
            </>
          ) : (
            <div className="p-16 text-center">
              <div className="text-5xl mb-4">{subjectConfig.icon}</div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">No Schedule Published Yet</h3>
              <p className="text-muted-foreground">Your teacher hasn't published the {selectedSubject} schedule yet. Check back later!</p>
            </div>
          )}
        </div>
      </div>

      {/* Topic Modal */}
      {modalTopic && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1001]" onClick={() => setModalTopic(null)}>
          <div className="bg-card rounded-2xl max-w-[600px] w-[90%] max-h-[80vh] overflow-y-auto shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className={`bg-gradient-to-r ${subjectConfig.gradient} text-white p-8 rounded-t-2xl text-center relative`}>
              <button onClick={() => setModalTopic(null)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 border-none rounded-full w-9 h-9 text-white text-lg cursor-pointer transition-all">
                ×
              </button>
              <h2 className="text-xl font-bold mb-1">{modalTopic.title}</h2>
              <p className="opacity-90 text-sm">{modalTopic.subject}{modalTopic.chapterName ? ` • ${modalTopic.chapterName}` : ""}</p>
            </div>
            <div className="p-8">
              <div className="mb-6">
                <div className="flex items-center gap-2 font-semibold text-card-foreground mb-3">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm" style={{ background: subjectConfig.color }}>📚</span>
                  Overview
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  This is an important topic in {modalTopic.subject}. Focus on understanding the core concepts and practice regularly.
                </p>
              </div>

              <div className="p-5 rounded-xl text-white text-center" style={{ background: `linear-gradient(135deg, ${subjectConfig.color}, ${subjectConfig.color}dd)` }}>
                <h3 className="font-semibold mb-2">📖 Study Tips</h3>
                <ul className="text-left text-sm space-y-2 mx-auto max-w-xs">
                  <li>✦ Read the chapter thoroughly</li>
                  <li>✦ Make important notes</li>
                  <li>✦ Practice questions daily</li>
                  <li>✦ Discuss with classmates</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentCalendar;
