import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTeacherAssignments } from "@/hooks/useTeacherAssignments";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, CalendarX } from "lucide-react";
import EmptyState from "@/components/EmptyState";

/**
 * Parallel calendar view — loads the raw `calendar_data` JSON blob directly
 * from `m_calendar` for the (board, class_name, section, subject) tuple
 * that the logged-in teacher is assigned to. Nothing else is rendered.
 */

type EntryType = "class" | "holiday" | "free" | "cancelled";

interface DayEntry {
  entry_type: EntryType;
  topic_title?: string;
  chapter_name?: string;
  notes?: string;
}

type CalendarData = Record<string, DayEntry>;

const DAY_HEADERS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const fmtDate = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

const entryStyles: Record<EntryType, { bg: string; pill: string; label: string }> = {
  class:     { bg: "bg-card",                     pill: "bg-blue-500 text-white",                   label: "Class" },
  holiday:   { bg: "bg-red-50 border-red-200",    pill: "bg-red-500 text-white",                    label: "Holiday" },
  free:      { bg: "bg-sky-50 border-sky-200",    pill: "bg-sky-500 text-white",                    label: "Free" },
  cancelled: { bg: "bg-zinc-100 border-zinc-300", pill: "bg-zinc-500 text-white line-through",      label: "Cancelled" },
};

const TeacherScheduleV2 = () => {
  const { user } = useAuth();
  const { entries, classes, subjectsForClass, loading: loadingAssign } = useTeacherAssignments();

  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");
  const now = new Date();
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [rowId, setRowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<{ date: string; entry: DayEntry } | null>(null);
  const [saving, setSaving] = useState(false);
  const autoJumpedKeyRef = useRef<string | null>(null);

  // Init class/subject from teacher's assignments.
  useEffect(() => {
    if (!loadingAssign && classes.length > 0 && !className) {
      setClassName(classes[0]);
      const subs = subjectsForClass(classes[0]);
      if (subs.length > 0) setSubject(subs[0]);
    }
  }, [loadingAssign, classes, className, subjectsForClass]);

  const subjectsForCurrent = useMemo(
    () => (className ? subjectsForClass(className) : []),
    [className, subjectsForClass],
  );
  useEffect(() => {
    if (className && subjectsForCurrent.length > 0 && !subjectsForCurrent.includes(subject)) {
      setSubject(subjectsForCurrent[0]);
    }
  }, [subjectsForCurrent, subject, className]);

  // Resolve board + section + grade from teacher_teaching_map.
  const gradeNum = useMemo(() => {
    const n = parseInt(className.replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? n : undefined;
  }, [className]);
  const assignment = useMemo(
    () => entries.find(e => e.grade === gradeNum && e.subject === subject),
    [entries, gradeNum, subject],
  );
  const board = assignment?.board ?? "";
  const section = assignment?.section ?? "";

  const fetchCalendar = useCallback(async () => {
    if (!board || !section || !subject || gradeNum === undefined) {
      setCalendarData({});
      setRowId(null);
      return;
    }
    setLoading(true);
    // Case-insensitive match on text columns (DB stores e.g. "cbse" / "9").
    const { data, error } = await (supabase as any)
      .from("m_calendar")
      .select("id, calendar_data")
      .ilike("board", board)
      .ilike("class_name", String(gradeNum))
      .ilike("section", section)
      .ilike("subject", subject)
      .maybeSingle();

    if (error) {
      toast({ title: "Failed to load calendar", description: error.message, variant: "destructive" });
      setCalendarData({});
      setRowId(null);
    } else if (!data) {
      setCalendarData({});
      setRowId(null);
    } else {
      const cd = (data.calendar_data ?? {}) as CalendarData;
      setCalendarData(cd);
      setRowId(data.id);
      const selectionKey = `${className}|${subject}`;
      const keys = Object.keys(cd).sort();
      if (keys.length > 0 && autoJumpedKeyRef.current !== selectionKey) {
        const [y, m] = keys[0].split("-").map(Number);
        if (Number.isFinite(y) && Number.isFinite(m)) {
          setYear(y);
          setMonthIndex(m - 1);
        }
        autoJumpedKeyRef.current = selectionKey;
      }
    }
    setLoading(false);
  }, [board, section, subject, gradeNum, className]);

  useEffect(() => {
    autoJumpedKeyRef.current = null;
  }, [className, subject]);

  useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

  const monthStart = useMemo(() => new Date(Date.UTC(year, monthIndex, 1)), [year, monthIndex]);
  const monthEnd = useMemo(() => new Date(Date.UTC(year, monthIndex + 1, 0)), [year, monthIndex]);
  const monthName = monthStart.toLocaleString("default", { month: "long", timeZone: "UTC" });
  const daysInMonth = monthEnd.getUTCDate();
  let firstDay = monthStart.getUTCDay();
  firstDay = firstDay === 0 ? 6 : firstDay - 1;

  const prevMonth = () => {
    if (monthIndex === 0) { setMonthIndex(11); setYear(y => y - 1); }
    else setMonthIndex(m => m - 1);
  };
  const nextMonth = () => {
    if (monthIndex === 11) { setMonthIndex(0); setYear(y => y + 1); }
    else setMonthIndex(m => m + 1);
  };

  const saveDay = async () => {
    if (!editing || !rowId) {
      toast({ title: "No calendar row", description: "Cannot save: no m_calendar row exists for this assignment yet.", variant: "destructive" });
      return;
    }
    if (editing.entry.entry_type === "class" && !editing.entry.topic_title?.trim()) {
      toast({ title: "Topic required", description: "Class entries need a topic_title.", variant: "destructive" });
      return;
    }
    const cleaned: DayEntry = { entry_type: editing.entry.entry_type };
    if (editing.entry.topic_title?.trim()) cleaned.topic_title = editing.entry.topic_title.trim();
    if (editing.entry.chapter_name?.trim()) cleaned.chapter_name = editing.entry.chapter_name.trim();
    if (editing.entry.notes?.trim()) cleaned.notes = editing.entry.notes.trim();

    const next = { ...calendarData, [editing.date]: cleaned };
    setSaving(true);
    const { error } = await (supabase as any)
      .from("m_calendar")
      .update({ calendar_data: next })
      .eq("id", rowId);
    setSaving(false);

    if (error) {
      toast({ title: "Could not save day", description: error.message, variant: "destructive" });
      return;
    }
    setCalendarData(next);
    setEditing(null);
    toast({ title: "Saved", description: `${editing.date} updated.` });
  };

  const cells: JSX.Element[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`empty-${i}`} className="min-h-[96px] bg-card/30" />);
  for (let d = 1; d <= daysInMonth; d++) {
    const key = fmtDate(new Date(Date.UTC(year, monthIndex, d)));
    const entry = calendarData[key];
    const style = entry ? entryStyles[entry.entry_type] : null;

    cells.push(
      <button
        key={key}
        onClick={() => setEditing({ date: key, entry: entry ?? { entry_type: "class", topic_title: "" } })}
        className={`min-h-[96px] p-2 border border-border/30 text-left transition-colors hover:ring-1 hover:ring-primary/50 ${style?.bg ?? "bg-card/40"}`}
      >
        <div className="text-sm font-semibold mb-1">{d}</div>
        {entry && style && (
          <>
            <div className={`text-[10px] px-2 py-1 rounded-full text-center font-medium leading-tight ${style.pill}`}>
              {entry.entry_type === "class" ? (entry.topic_title || "Class") : style.label}
            </div>
            {entry.chapter_name && (
              <div className="text-[10px] text-muted-foreground mt-1 truncate">{entry.chapter_name}</div>
            )}
            {entry.notes && (
              <div className="text-[10px] text-muted-foreground mt-1 italic truncate">{entry.notes}</div>
            )}
          </>
        )}
      </button>
    );
  }

  if (!loadingAssign && classes.length === 0) {
    return (
      <DashboardLayout role="teacher" breadcrumbItems={[{ label: "Dashboard", href: "/teacher" }, { label: "Schedule v2" }]}>
        <main className="p-8 text-center text-muted-foreground">
          No classes assigned yet. Set them up in Teacher Settings first.
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="teacher" breadcrumbItems={[{ label: "Dashboard", href: "/teacher" }, { label: "Schedule v2" }]}>
      <main className="p-4 md:p-8 max-w-[1400px] mx-auto">
        <div className="mb-2 text-xs text-muted-foreground">
          Loading <code className="font-mono">m_calendar.calendar_data</code> directly for your assignment.
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <Select value={className} onValueChange={setClassName}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>
              {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Subject" /></SelectTrigger>
            <SelectContent>
              {subjectsForCurrent.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground self-center">
            Board: <span className="font-medium">{board || "—"}</span> • Section: <span className="font-medium">{section || "—"}</span>
            {rowId ? <span className="ml-2 text-green-600">• row found</span> : <span className="ml-2 text-amber-600">• no row</span>}
          </div>
        </div>

        <div className="bg-card/95 backdrop-blur rounded-2xl overflow-hidden shadow border border-border/20">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-5 px-6">
            <h2 className="text-xl font-light mb-1">{subject || "—"} Teaching Schedule</h2>
            <p className="text-sm opacity-90">Class {gradeNum ?? "—"} • Section {section || "—"} • {board || "—"}</p>
          </div>

          <div className="flex justify-between items-center px-5 py-3 bg-secondary/50 border-b border-border/30">
            <button onClick={prevMonth} className="w-9 h-9 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-semibold">{monthName} {year} {loading && <span className="text-xs text-muted-foreground ml-2">loading…</span>}</h3>
            <button onClick={nextMonth} className="w-9 h-9 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-px bg-border/30">
            {DAY_HEADERS.map(h => (
              <div key={h} className="bg-gray-700 text-white py-2.5 text-center text-xs font-semibold">{h}</div>
            ))}
            {cells}
          </div>

          <div className="px-5 py-3 bg-secondary/50 border-t border-border/30 flex flex-wrap gap-4 justify-center text-xs">
            {(Object.keys(entryStyles) as EntryType[]).map(t => (
              <div key={t} className="flex items-center gap-1.5"><div className={`w-4 h-4 rounded ${entryStyles[t].pill}`} /><span>{entryStyles[t].label}</span></div>
            ))}
          </div>
        </div>

        <details className="mt-6 text-xs">
          <summary className="cursor-pointer text-muted-foreground">Raw calendar_data JSON</summary>
          <pre className="mt-2 p-3 bg-muted rounded-lg overflow-auto max-h-80">{JSON.stringify(calendarData, null, 2)}</pre>
        </details>
      </main>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit {editing?.date}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Entry type</label>
                <Select
                  value={editing.entry.entry_type}
                  onValueChange={(v) => setEditing({ ...editing, entry: { ...editing.entry, entry_type: v as EntryType } })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class">Class</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Topic title {editing.entry.entry_type === "class" && <span className="text-red-500">*</span>}
                </label>
                <Input
                  value={editing.entry.topic_title ?? ""}
                  onChange={(e) => setEditing({ ...editing, entry: { ...editing.entry, topic_title: e.target.value } })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Chapter name</label>
                <Input
                  value={editing.entry.chapter_name ?? ""}
                  onChange={(e) => setEditing({ ...editing, entry: { ...editing.entry, chapter_name: e.target.value } })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Notes</label>
                <Textarea
                  value={editing.entry.notes ?? ""}
                  onChange={(e) => setEditing({ ...editing, entry: { ...editing.entry, notes: e.target.value } })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveDay} disabled={saving || !rowId}>{saving ? "Saving…" : "Save day"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TeacherScheduleV2;
