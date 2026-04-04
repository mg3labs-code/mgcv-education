import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowLeft, BookOpen, Search as SearchIcon, Zap, Clock } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { findTextbookMatch } from "@/data/topicTextbookMap";
import PopQuizModal from "@/components/student/PopQuizModal";
import ScheduleCalendar from "@/components/student/ScheduleCalendar";

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

const SUBJECT_META: Record<string, { icon: string; time: string; color: string; gradient: string }> = {
  "Mathematics": { icon: "🔢", time: "09:00 – 10:00", color: "#7C3AED", gradient: "from-violet-500 to-purple-600" },
  "Science":     { icon: "🔬", time: "10:00 – 11:00", color: "#059669", gradient: "from-emerald-500 to-teal-600" },
  "English":     { icon: "📖", time: "11:15 – 12:15", color: "#2563EB", gradient: "from-blue-500 to-indigo-600" },
  "Social Science": { icon: "🌍", time: "01:00 – 02:00", color: "#F59E0B", gradient: "from-amber-500 to-orange-600" },
  "Hindi":       { icon: "🇮🇳", time: "02:00 – 03:00", color: "#EF4444", gradient: "from-red-500 to-rose-600" },
  "Sanskrit":    { icon: "🕉️", time: "03:00 – 04:00", color: "#06B6D4", gradient: "from-cyan-500 to-teal-600" },
};

const BREAKS = [
  { time: "11:00 – 11:15", subject: "Short Break", icon: "☕", topic: "Refresh & Energize", type: "break" as const },
  { time: "12:15 – 01:00", subject: "Lunch Break", icon: "🍱", topic: "Nutrition & Rest", type: "break" as const },
];

const SUBJECTS_LIST = [
  { id: "Mathematics", label: "Mathematics", icon: "🔢", color: "#7C3AED" },
  { id: "Science", label: "Science", icon: "🔬", color: "#059669" },
  { id: "English", label: "English", icon: "📖", color: "#2563EB" },
  { id: "Social Science", label: "Social Science", icon: "🌍", color: "#F59E0B" },
  { id: "Hindi", label: "Hindi", icon: "🇮🇳", color: "#EF4444" },
  { id: "Sanskrit", label: "Sanskrit", icon: "🕉️", color: "#06B6D4" },
];

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const toKey = (date: Date) => date.toISOString().split("T")[0];

const StudentCalendar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<"today" | "monthly">("today");
  const [subjectSchedules, setSubjectSchedules] = useState<SubjectSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [quizSubject, setQuizSubject] = useState<string | null>(null);

  // Monthly view state
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");
  const now = new Date();
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("class_name").eq("user_id", user.id).maybeSingle();
      if (!profile?.class_name) { setLoading(false); return; }
      const { data: schedules } = await supabase.from("teaching_schedules").select("subject, schedule_data, chapters_data").eq("class_name", profile.class_name);
      if (schedules) {
        setSubjectSchedules(schedules.map((s) => ({
          subject: s.subject,
          schedule: s.schedule_data as unknown as Record<string, ScheduleItem>,
          chapters: (s.chapters_data as unknown as { id: string; name: string; colorHex: string }[]) || [],
        })));
      }
      setLoading(false);
    };
    fetchSchedules();
  }, [user]);

  const todayKey = now.toISOString().split("T")[0];

  // Build today's full timeline
  const todayTimeline = useMemo(() => {
    const items: { time: string; subject: string; icon: string; topic: string; type: string; color: string; isBreak: boolean }[] = [];
    const orderedSubjects = Object.keys(SUBJECT_META);

    orderedSubjects.forEach((subjectName) => {
      const subSchedule = subjectSchedules.find((s) => s.subject === subjectName);
      const meta = SUBJECT_META[subjectName];
      const todayItem = subSchedule?.schedule[todayKey];

      let topic = "Regular Class";
      if (todayItem) {
        const chapterName = todayItem.chapterId ? subSchedule?.chapters.find((c) => c.id === todayItem.chapterId)?.name : undefined;
        topic = todayItem.title || todayItem.label || "Scheduled";
        if (chapterName) topic = `${chapterName}: ${topic}`;
      }

      items.push({ time: meta.time, subject: subjectName, icon: meta.icon, topic, type: todayItem?.type || "class", color: meta.color, isBreak: false });

      if (subjectName === "Science") items.push({ time: BREAKS[0].time, subject: BREAKS[0].subject, icon: BREAKS[0].icon, topic: BREAKS[0].topic, type: "break", color: "#9CA3AF", isBreak: true });
      if (subjectName === "English") items.push({ time: BREAKS[1].time, subject: BREAKS[1].subject, icon: BREAKS[1].icon, topic: BREAKS[1].topic, type: "break", color: "#9CA3AF", isBreak: true });
    });
    return items;
  }, [subjectSchedules, todayKey]);

  // Determine "now" class (simplified: based on hour)
  const currentHour = now.getHours();
  const nowIndex = currentHour < 10 ? 0 : currentHour < 11 ? 1 : currentHour < 12 ? 3 : currentHour < 13 ? -1 : currentHour < 14 ? 5 : currentHour < 15 ? 6 : currentHour < 16 ? 7 : -1;

  const handleClassOpen = (subject: string, topic: string) => {
    const match = findTextbookMatch(topic);
    if (match && match.episodeId) {
      navigate(`/student/textbook/${match.chapterId}/${match.episodeId}`);
    } else {
      navigate(`/student/textbook`);
    }
  };

  const handleDeepDive = (subject: string, topic: string) => {
    const match = findTextbookMatch(topic);
    if (match && match.episodeId) {
      navigate(`/student/textbook/${match.chapterId}/${match.episodeId}?layer=deep`);
    } else {
      navigate(`/student/textbook`);
    }
  };

  const handlePopQuiz = (subject: string) => {
    setQuizSubject(subject);
  };

  // Monthly view helpers
  const monthDate = new Date(Date.UTC(year, monthIndex, 1));
  const monthName = monthDate.toLocaleString("default", { month: "long", timeZone: "UTC" });
  const currentSubjectSchedule = subjectSchedules.find(s => s.subject === selectedSubject);

  return (
    <DashboardLayout role="student" breadcrumbItems={[{ label: "Dashboard", href: "/student" }, { label: "Calendar" }]}>
      <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">📅 Calendar</h1>
            <p className="text-sm text-muted-foreground mt-1">Your daily plan with quick actions to learn, dive deep, or quiz yourself.</p>
          </div>
          {/* View Toggle */}
          <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
            {[
              { id: "today" as const, label: "Today's Plan" },
              { id: "monthly" as const, label: "Monthly" },
            ].map(v => (
              <button key={v.id} onClick={() => setView(v.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border-none cursor-pointer ${
                  view === v.id ? "bg-card text-foreground shadow-sm" : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ TODAY'S PLAN ═══ */}
        {view === "today" && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground mb-4">
              {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} • Full day plan with quick actions
            </p>

            {loading ? (
              <div className="text-center py-16 text-muted-foreground">Loading schedule...</div>
            ) : (
              <div className="relative">
                {todayTimeline.map((cls, i) => {
                  const isNow = i === nowIndex;
                  const actionKey = `action-${i}`;

                  return (
                    <div key={i} className="flex gap-4 mb-1">
                      {/* Time column */}
                      <div className="w-[70px] shrink-0 text-right pt-5">
                        <span className="text-xs font-semibold text-muted-foreground">{cls.time.split("–")[0].trim()}</span>
                      </div>

                      {/* Timeline dot + line */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className={`w-3 h-3 rounded-full mt-5 shrink-0 ${isNow ? "ring-4 ring-primary/30" : ""}`}
                          style={{ backgroundColor: cls.isBreak ? "#D1D5DB" : cls.color }} />
                        {i < todayTimeline.length - 1 && (
                          <div className="w-0.5 flex-1 min-h-[20px] bg-border/50" />
                        )}
                      </div>

                      {/* Content card */}
                      <div className={`flex-1 mb-3 rounded-xl border p-4 transition-all ${
                        cls.isBreak
                          ? "bg-muted/30 border-border/30"
                          : isNow
                          ? "bg-card border-primary shadow-md ring-1 ring-primary/20"
                          : "bg-card border-border hover:border-primary/30 hover:shadow-sm"
                      }`}>
                        {cls.isBreak ? (
                          <p className="text-sm text-muted-foreground">{cls.icon} {cls.topic}</p>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-lg">{cls.icon}</span>
                                  <span className="font-semibold text-foreground">{cls.subject}</span>
                                  {isNow && (
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> LIVE
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{cls.topic}</p>
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-2 mt-3">
                              <button onClick={() => {
                                if (expandedAction === `${i}-class`) { handleClassOpen(cls.subject, cls.topic); }
                                else setExpandedAction(`${i}-class`);
                              }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border-2 border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer">
                                <BookOpen className="h-3.5 w-3.5" /> Class
                              </button>
                              <button onClick={() => {
                                if (expandedAction === `${i}-deep`) { handleDeepDive(cls.subject, cls.topic); }
                                else setExpandedAction(`${i}-deep`);
                              }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border-2 border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-all cursor-pointer">
                                <SearchIcon className="h-3.5 w-3.5" /> Deep Dive
                              </button>
                              <button onClick={() => handlePopQuiz(cls.subject)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border-2 border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-all cursor-pointer">
                                <Zap className="h-3.5 w-3.5" /> Pop Quiz
                              </button>
                            </div>

                            {/* Expanded action description */}
                            {expandedAction === `${i}-class` && (
                              <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-muted-foreground animate-fade-in">
                                📖 <strong>Class</strong> → Opens the lesson for "{cls.topic}" in the textbook. Click again to go!
                                <button onClick={() => handleClassOpen(cls.subject, cls.topic)}
                                  className="block mt-2 text-primary font-semibold text-xs cursor-pointer bg-transparent border-none hover:underline">
                                  Open Lesson →
                                </button>
                              </div>
                            )}
                            {expandedAction === `${i}-deep` && (
                              <div className="mt-3 p-3 rounded-lg bg-purple-50 border border-purple-200 text-sm text-muted-foreground animate-fade-in">
                                🔍 <strong>Deep Dive</strong> → Opens the "Go Deeper" layer for "{cls.topic}". Ask WHY, bust myths, explore connections.
                                <button onClick={() => handleDeepDive(cls.subject, cls.topic)}
                                  className="block mt-2 text-purple-700 font-semibold text-xs cursor-pointer bg-transparent border-none hover:underline">
                                  Start Deep Dive →
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ MONTHLY VIEW ═══ */}
        {view === "monthly" && (
          <div className="space-y-4">
            {/* Subject filter tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {SUBJECTS_LIST.map(s => (
                <button key={s.id} onClick={() => setSelectedSubject(s.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border-none cursor-pointer whitespace-nowrap transition-all"
                  style={{
                    background: selectedSubject === s.id ? s.color : undefined,
                    color: selectedSubject === s.id ? "white" : undefined,
                  }}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>

            {/* Use existing ScheduleCalendar component */}
            {currentSubjectSchedule ? (
              <ScheduleCalendar
                scheduleData={currentSubjectSchedule.schedule}
                className="Class 10"
                subject={selectedSubject}
                chaptersData={currentSubjectSchedule.chapters}
              />
            ) : (
              <div className="text-center py-16 bg-card rounded-2xl border">
                <span className="text-4xl block mb-3">{SUBJECTS_LIST.find(s => s.id === selectedSubject)?.icon}</span>
                <h3 className="text-lg font-semibold text-foreground mb-2">No Schedule Published Yet</h3>
                <p className="text-sm text-muted-foreground">Your teacher hasn't published the {selectedSubject} schedule yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {quizSubject && <PopQuizModal open={!!quizSubject} onClose={() => setQuizSubject(null)} subject={quizSubject} />}
    </DashboardLayout>
  );
};

export default StudentCalendar;
