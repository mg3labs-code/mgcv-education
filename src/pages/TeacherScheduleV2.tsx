import { useEffect, useMemo, useState, useCallback } from "react";
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
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * NEW parallel calendar view backed by m_calendar / m_holidays.
 *
 * - Reads the visible month from `m_get_calendar_range` (RPC) — one row per
 *   date, already merged with weekends + school-wide holidays.
 * - Writes a single edited day via `m_set_calendar_day` (RPC) — never touches
 *   m_calendar directly.
 * - p_teacher = the logged-in auth user id (uuid string). Confirm the
 *   m_calendar rows you want to read/write use the same uuid in their
 *   `teacher` column.
 *
 * Does NOT touch the legacy `calendar`, `calendar_chapters`, or
 * `teaching_schedules` tables, nor any existing component/route.
 */

type EntryType = "class" | "holiday" | "free" | "cancelled" | "unplanned";

interface DayRow {
  date: string; // YYYY-MM-DD
  entry_type: EntryType;
  topic_title: string | null;
  chapter_name: string | null;
  notes: string | null;
  holiday_label: string | null;
}

const DAY_HEADERS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const toKey = (d: Date) => d.toISOString().split("T")[0];
const fmtDate = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

const entryStyles: Record<EntryType, { bg: string; label: string; pill: string }> = {
  class:     { bg: "bg-card",                                 label: "Class",     pill: "bg-blue-500 text-white" },
  holiday:   { bg: "bg-red-50 border-red-200",                label: "Holiday",   pill: "bg-red-500 text-white" },
  free:      { bg: "bg-sky-50 border-sky-200",                label: "Free",      pill: "bg-sky-500 text-white" },
  cancelled: { bg: "bg-zinc-100 border-zinc-300",             label: "Cancelled", pill: "bg-zinc-500 text-white line-through" },
  unplanned: { bg: "bg-card/40",                              label: "Unplanned", pill: "bg-muted text-muted-foreground" },
};

const TeacherScheduleV2 = () => {
  const { user } = useAuth();
  const { entries, classes, subjectsForClass, loading: loadingAssign } = useTeacherAssignments();

  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");
  const now = new Date();
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const [rows, setRows] = useState<DayRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<DayRow | null>(null);
  const [saving, setSaving] = useState(false);

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

  // Resolve board + section for current (class, subject) from teacher_teaching_map.
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

  const monthStart = useMemo(() => new Date(Date.UTC(year, monthIndex, 1)), [year, monthIndex]);
  const monthEnd = useMemo(() => new Date(Date.UTC(year, monthIndex + 1, 0)), [year, monthIndex]);

  const fetchRange = useCallback(async () => {
    if (!user || !className || !subject || !board || !section) {
      setRows([]);
      return;
    }
    setLoading(true);
    const { data, error } = await (supabase as any).rpc("m_get_calendar_range", {
      p_teacher: user.id,
      p_board: board,
      p_class_name: className,
      p_section: section,
      p_subject: subject,
      p_start_date: fmtDate(monthStart),
      p_end_date: fmtDate(monthEnd),
    });
    if (error) {
      toast({ title: "Failed to load calendar", description: error.message, variant: "destructive" });
      setRows([]);
    } else {
      setRows((data ?? []) as DayRow[]);
    }
    setLoading(false);
  }, [user, className, subject, board, section, monthStart, monthEnd]);

  useEffect(() => { fetchRange(); }, [fetchRange]);

  const byDate = useMemo(() => {
    const m: Record<string, DayRow> = {};
    rows.forEach(r => { m[r.date] = r; });
    return m;
  }, [rows]);

  const prevMonth = () => {
    if (monthIndex === 0) { setMonthIndex(11); setYear(y => y - 1); }
    else setMonthIndex(m => m - 1);
  };
  const nextMonth = () => {
    if (monthIndex === 11) { setMonthIndex(0); setYear(y => y + 1); }
    else setMonthIndex(m => m + 1);
  };

  const monthName = monthStart.toLocaleString("default", { month: "long", timeZone: "UTC" });
  const daysInMonth = monthEnd.getUTCDate();
  let firstDay = monthStart.getUTCDay();
  firstDay = firstDay === 0 ? 6 : firstDay - 1;

  const saveDay = async () => {
    if (!editing || !user) return;
    const payload: Record<string, string> = { entry_type: editing.entry_type };
    if (editing.topic_title) payload.topic_title = editing.topic_title;
    if (editing.chapter_name) payload.chapter_name = editing.chapter_name;
    if (editing.notes) payload.notes = editing.notes;

    setSaving(true);
    const { error } = await (supabase as any).rpc("m_set_calendar_day", {
      p_teacher: user.id,
      p_board: board,
      p_class_name: className,
      p_section: section,
      p_subject: subject,
      p_date: editing.date,
      p_day_entry: payload,
    });
    setSaving(false);

    if (error) {
      toast({ title: "Could not save day", description: error.message, variant: "destructive" });
      return;
    }
    // Optimistic local update + refetch for the visible month.
    setRows(prev => prev.map(r => r.date === editing.date ? { ...r, ...editing } : r));
    setEditing(null);
    fetchRange();
    toast({ title: "Saved", description: `${editing.date} updated.` });
  };

  const cells: JSX.Element[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`empty-${i}`} className="min-h-[96px] bg-card/30" />);
  for (let d = 1; d <= daysInMonth; d++) {
    const key = fmtDate(new Date(Date.UTC(year, monthIndex, d)));
    const row = byDate[key];
    const type: EntryType = (row?.entry_type as EntryType) ?? "unplanned";
    const style = entryStyles[type] ?? entryStyles.unplanned;
    const isToday = key === toKey(new Date());

    cells.push(
      <button
        key={key}
        onClick={() => setEditing(row ?? { date: key, entry_type: "unplanned", topic_title: "", chapter_name: "", notes: "", holiday_label: null })}
        className={`min-h-[96px] p-2 border border-border/30 text-left relative transition-colors hover:ring-1 hover:ring-primary/50 ${style.bg} ${isToday ? "ring-2 ring-primary" : ""}`}
      >
        <div className="text-sm font-semibold mb-1">{d}</div>
        {row && (
          <div className={`text-[10px] px-2 py-1 rounded-full text-center font-medium leading-tight ${style.pill}`}>
            {type === "class" ? (row.topic_title || "Class")
              : type === "holiday" ? (row.holiday_label || row.notes || "Holiday")
              : style.label}
          </div>
        )}
        {row?.chapter_name && type === "class" && (
          <div className="text-[10px] text-muted-foreground mt-1 truncate">{row.chapter_name}</div>
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
          Parallel calendar (m_calendar). Identifying teacher as <code className="font-mono">auth.uid()</code> = <span className="font-mono">{user?.id}</span>.
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
          </div>
        </div>

        <div className="bg-card/95 backdrop-blur rounded-2xl overflow-hidden shadow border border-border/20">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-5 px-6">
            <h2 className="text-xl font-light mb-1">{subject || "—"} Teaching Schedule</h2>
            <p className="text-sm opacity-90">{className || "—"} • Section {section || "—"}</p>
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
      </main>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit {editing?.date}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Entry type</label>
                <Select
                  value={editing.entry_type === "unplanned" ? "class" : editing.entry_type}
                  onValueChange={(v) => setEditing({ ...editing, entry_type: v as EntryType })}
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
                  Topic title {editing.entry_type === "class" && <span className="text-red-500">*</span>}
                </label>
                <Input
                  value={editing.topic_title ?? ""}
                  onChange={(e) => setEditing({ ...editing, topic_title: e.target.value })}
                  placeholder="e.g. Real Numbers, Natural Numbers"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Chapter name</label>
                <Input
                  value={editing.chapter_name ?? ""}
                  onChange={(e) => setEditing({ ...editing, chapter_name: e.target.value })}
                  placeholder="e.g. Chapter 1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Notes</label>
                <Textarea
                  value={editing.notes ?? ""}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveDay} disabled={saving}>{saving ? "Saving…" : "Save day"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TeacherScheduleV2;
