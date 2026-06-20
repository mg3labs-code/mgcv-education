import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import TeachingCalendar, { type ChapterDef, type ScheduleItem } from "@/components/teacher/TeachingCalendar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTeacherAssignments } from "@/hooks/useTeacherAssignments";
import { useChaptersForCourse } from "@/hooks/useChaptersForCourse";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";

const TeacherSchedule = () => {
  const { user } = useAuth();
  const { entries, assignments, classes, subjectsForClass, loading: loadingAssign } = useTeacherAssignments();
  const [isSaving, setIsSaving] = useState(false);
  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("Mathematics");
  // Saved schedule loaded from teaching_schedules for the current
  // (teacher, class, subject). When present, the calendar hydrates from
  // this instead of regenerating from chapters, so teacher edits survive
  // a page refresh.
  const [savedSchedule, setSavedSchedule] = useState<Record<string, ScheduleItem> | null>(null);
  const [savedChapters, setSavedChapters] = useState<ChapterDef[] | null>(null);
  const [savedKey, setSavedKey] = useState<string>("");
  const [autoHomework, setAutoHomework] = useState(true);

  // Initialize class & subject from teacher's first assignment.
  useEffect(() => {
    if (!loadingAssign && assignments.length > 0 && !className) {
      setClassName(assignments[0].class_name);
      setSubject(assignments[0].subject);
    }
  }, [assignments, loadingAssign, className]);

  // Keep subject valid when class changes.
  const subjectsForCurrent = useMemo(
    () => (className ? subjectsForClass(className) : []),
    [className, subjectsForClass]
  );
  useEffect(() => {
    if (className && subjectsForCurrent.length > 0 && !subjectsForCurrent.includes(subject)) {
      setSubject(subjectsForCurrent[0]);
    }
  }, [subjectsForCurrent, subject, className]);

  // Derive (board, grade) for the selected (class, subject) so chapters
  // can be loaded scoped to THIS class — different classes now see different
  // schedules instead of every teacher getting the same hardcoded Math one.
  const gradeNum = useMemo(() => {
    const n = parseInt(className.replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? n : undefined;
  }, [className]);
  const board = useMemo(() => {
    const match = entries.find(e => e.grade === gradeNum && e.subject === subject);
    return match?.board;
  }, [entries, gradeNum, subject]);
  const { data: courseChapters } = useChaptersForCourse(board, gradeNum, subject);

  // Load any previously-saved schedule for this (teacher, class, subject)
  // so teacher edits persist across refreshes. If none exists, the calendar
  // falls back to generating one from chapters.
  useEffect(() => {
    if (!user || !className || !subject) return;
    const key = `${user.id}|${className}|${subject}`;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("teaching_schedules")
        .select("schedule_data, chapters_data")
        .eq("teacher_id", user.id)
        .eq("class_name", className)
        .eq("subject", subject)
        .maybeSingle();
      if (cancelled) return;
      setSavedKey(key);
      if (data?.schedule_data) {
        setSavedSchedule(data.schedule_data as unknown as Record<string, ScheduleItem>);
        const ch = data.chapters_data as any;
        setSavedChapters(Array.isArray(ch) && ch.length > 0 ? (ch as ChapterDef[]) : null);
      } else {
        setSavedSchedule(null);
        setSavedChapters(null);
      }
    })();
    return () => { cancelled = true; };
  }, [user, className, subject]);

  /**
   * Sync the in-memory generated schedule into the per-date `calendar` table,
   * replacing all rows for this teacher × class × subject in one shot.
   *
   * Chapter metadata (name/color/class/section/subject) is upserted into the
   * normalized `calendar_chapters` table; each per-date row in `calendar`
   * stores a `chapter_ref_id` pointing back at that chapter row, so the
   * student side can resolve chapter identity from the database alone.
   *
   * Every date (including Saturdays, Sundays, and holidays) is persisted so
   * the student calendar renders entirely from backend data.
   */
  const syncCalendarRows = async (
    teacherId: string,
    schedule: Record<string, ScheduleItem>,
    chaptersArr: ChapterDef[],
  ) => {
    // 1a. Wipe prior per-date rows for this scope.
    await supabase
      .from("calendar")
      .delete()
      .eq("teacher_id", teacherId)
      .eq("class_name", className)
      .eq("subject", subject);

    // 1b. Upsert chapter metadata rows, then build chapterId -> uuid map.
    const chapterRows = chaptersArr.map((c, idx) => ({
      teacher_id: teacherId,
      class_name: className,
      subject,
      board: board ?? null,
      section: null as string | null,
      chapter_id: c.id,
      chapter_name: c.name,
      chapter_color: c.colorHex,
      sort_order: idx,
    }));

    let chapterRefMap: Record<string, string> = {};
    if (chapterRows.length > 0) {
      const { data: upserted, error: chErr } = await supabase
        .from("calendar_chapters")
        .upsert(chapterRows, { onConflict: "teacher_id,class_name,subject,chapter_id" })
        .select("id, chapter_id");
      if (chErr) { console.error("calendar_chapters upsert error", chErr); throw chErr; }
      chapterRefMap = Object.fromEntries((upserted || []).map((r: any) => [r.chapter_id, r.id]));
    }

    // 2. Build row inserts for EVERY date — Sat/Sun/holiday entries are
    //    now persisted so the student view doesn't depend on client-side
    //    weekday inference.
    const chapterById: Record<string, ChapterDef> = {};
    chaptersArr.forEach(c => { chapterById[c.id] = c; });

    const rows = Object.entries(schedule).map(([date, item]) => ({
      teacher_id: teacherId,
      class_name: className,
      subject,
      date,
      entry_type: item.type,
      chapter_id: item.chapterId ?? null,
      chapter_ref_id: item.chapterId ? chapterRefMap[item.chapterId] ?? null : null,
      chapter_name: item.chapterId ? chapterById[item.chapterId]?.name ?? null : null,
      chapter_color: item.chapterId ? chapterById[item.chapterId]?.colorHex ?? null : null,
      topic_key: item.key ?? null,
      topic_title: item.title ?? null,
      label: item.label ?? null,
      is_national_holiday: !!item.isNational,
    }));


    if (rows.length === 0) return;
    // Batch insert in chunks of 500 to stay under PostgREST payload size.
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const { error } = await supabase.from("calendar").insert(chunk);
      if (error) {
        console.error("calendar insert error", error);
        throw error;
      }
    }
  };

  const handleSave = async (scheduleData: Record<string, ScheduleItem>, chaptersArr: ChapterDef[]) => {
    if (!user) return;
    if (!className.trim() || !subject.trim()) {
      toast({
        title: "Class & subject required",
        description: "Pick a class and subject you teach before publishing.",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      const chaptersData = chaptersArr.map(ch => ({
        id: ch.id,
        name: ch.name,
        colorHex: ch.colorHex,
      }));

      // Legacy JSONB upsert (kept for backward compatibility with other reads).
      // Scope the existing-row lookup by subject too — otherwise saving a
      // schedule for one subject (e.g. Physics) would overwrite the row that
      // belongs to another subject (e.g. Mathematics) in the same class,
      // because the prior lookup matched any row for (teacher, class).
      const { data: existing } = await supabase
        .from("teaching_schedules")
        .select("id")
        .eq("teacher_id", user.id)
        .eq("class_name", className)
        .eq("subject", subject)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("teaching_schedules")
          .update({
            schedule_data: scheduleData as any,
            chapters_data: chaptersData as any,
            subject,
          })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("teaching_schedules")
          .insert({
            teacher_id: user.id,
            subject,
            class_name: className,
            schedule_data: scheduleData as any,
            chapters_data: chaptersData as any,
          });
      }

      // New row-per-date sync — drives the student calendar with realtime.
      await syncCalendarRows(user.id, scheduleData, chaptersArr);

      toast({
        title: "Schedule Published! 🎉",
        description: `Students in ${className} (${subject}) now see the updated schedule live.`,
      });

      // Auto-generate homework for today's topic if enabled
      if (autoHomework) {
        const today = new Date().toISOString().split("T")[0];
        const todayItem = scheduleData[today];

        if (todayItem && todayItem.type === "topic" && todayItem.title) {
          const chapter = chaptersArr.find(ch => ch.id === todayItem.chapterId);

          try {
            const { data: hwResult, error: hwError } = await supabase.functions.invoke(
              "generate-daily-homework",
              {
                body: {
                  class_name: className,
                  subject,
                  teacher_id: user.id,
                  topic_key: todayItem.key || todayItem.title,
                  topic_title: todayItem.title,
                  chapter_name: chapter?.name || subject,
                },
              }
            );

            if (hwError) {
              console.error("Homework generation error:", hwError);
            } else if (hwResult?.success) {
              toast({
                title: "📝 Homework Generated!",
                description: `"${hwResult.title}" — ${hwResult.question_count} questions auto-created for students.`,
              });
            }
          } catch (err) {
            console.error("Failed to generate homework:", err);
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Error saving schedule",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Gating UI when teacher hasn't picked any class/subject yet.
  if (!loadingAssign && assignments.length === 0) {
    return (
      <DashboardLayout role="teacher" breadcrumbItems={[{ label: "Dashboard", href: "/teacher" }, { label: "Schedule" }]}>
        <main className="p-8 max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">No classes assigned yet</h2>
          <p className="text-muted-foreground mb-6">
            You haven't told us which classes & subjects you teach. Pick them in Settings to start publishing schedules.
          </p>
          <Link
            to="/teacher/settings"
            className="inline-block px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold"
          >
            Open Teacher Settings
          </Link>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="teacher" breadcrumbItems={[{ label: "Dashboard", href: "/teacher" }, { label: "Schedule" }]}>
      <main className="p-4 md:p-8 max-w-[1400px] mx-auto">
        {/* Auto Homework Toggle + Manage classes link */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Link to="/teacher/settings" className="text-xs text-primary hover:underline">Manage classes…</Link>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-sm text-muted-foreground font-medium">
              📝 Auto-generate daily homework
            </span>
            <button
              onClick={() => setAutoHomework(!autoHomework)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                autoHomework ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  autoHomework ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </label>
        </div>

        <TeachingCalendar
          onSave={handleSave}
          isSaving={isSaving}
          selectedClass={className}
          onClassChange={setClassName}
          selectedSubject={subject}
          onSubjectChange={setSubject}
          availableClasses={classes}
          availableSubjects={subjectsForCurrent}
          initialChapters={courseChapters}
        />
      </main>

    </DashboardLayout>
  );
};

export default TeacherSchedule;
