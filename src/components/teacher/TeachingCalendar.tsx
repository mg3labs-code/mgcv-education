import { useState, useMemo, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Undo2, Redo2, Save, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NATIONAL_HOLIDAYS } from "@/data/nationalHolidays";

// ── Types ──
export interface ChapterDef {
  id: string;
  name: string;
  teachingDays: number;
  practiceDays: number;
  testDays: number;
  colorClass: string;
  colorHex: string;
  topics: { key: string; title: string; cssClass: string }[];
}

export interface ScheduleItem {
  type: "topic" | "practice" | "test" | "holiday" | "assignment";
  title?: string;
  label?: string;
  cssClass?: string;
  chapterId?: string;
  isNational?: boolean;
  key?: string;
}

// ── Default data ──
const getDefaultChapters = (): ChapterDef[] => [
  {
    id: "real_numbers", name: "Real Numbers", teachingDays: 15, practiceDays: 5, testDays: 1,
    colorClass: "bg-blue-500", colorHex: "#3b82f6",
    topics: [
      { key: "realNumbersIntro", title: "Introduction", cssClass: "intro" },
      { key: "euclidDivision", title: "Euclid's Division Lemma", cssClass: "intro" },
      { key: "fundamentalTheorem", title: "Fundamental Theorem", cssClass: "intro" },
      { key: "hcfLcm", title: "HCF and LCM", cssClass: "intro" },
      { key: "primeFactorization", title: "Prime Factorization", cssClass: "intro" },
      { key: "rationalNumbers", title: "Rational Numbers", cssClass: "intro" },
      { key: "irrationalNumbers", title: "Irrational Numbers", cssClass: "intro" },
      { key: "realNumberSystem", title: "Real Number System", cssClass: "intro" },
      { key: "decimalRepresentation", title: "Decimal Representation", cssClass: "intro" },
      { key: "operationsReal", title: "Operations on Real Numbers", cssClass: "intro" },
      { key: "propertiesReal", title: "Properties of Real Numbers", cssClass: "intro" },
      { key: "rationalDecimals", title: "Rationals as Decimals", cssClass: "intro" },
      { key: "irrationalProperties", title: "Irrational Properties", cssClass: "intro" },
      { key: "realNumberLine", title: "Real Numbers on Line", cssClass: "intro" },
      { key: "revision1", title: "Chapter Revision", cssClass: "intro" },
    ],
  },
  {
    id: "polynomials", name: "Polynomials", teachingDays: 10, practiceDays: 4, testDays: 1,
    colorClass: "bg-purple-600", colorHex: "#7c3aed",
    topics: [
      { key: "polynomialIntro", title: "Introduction", cssClass: "polynomial" },
      { key: "polynomialTypes", title: "Types of Polynomials", cssClass: "polynomial" },
      { key: "polynomialOperations", title: "Operations", cssClass: "polynomial" },
      { key: "polynomialFactorization", title: "Factorization", cssClass: "polynomial" },
      { key: "polynomialZeros", title: "Zeros of Polynomials", cssClass: "polynomial" },
      { key: "polynomialTheorems", title: "Polynomial Theorems", cssClass: "polynomial" },
      { key: "polynomialGraphs", title: "Graphical Representation", cssClass: "polynomial" },
      { key: "polynomialApplications", title: "Applications", cssClass: "polynomial" },
      { key: "polynomialProblems", title: "Problem Solving", cssClass: "polynomial" },
      { key: "revision2", title: "Chapter Revision", cssClass: "polynomial" },
    ],
  },
  {
    id: "linearEquations", name: "Pair of Linear Equations", teachingDays: 12, practiceDays: 4, testDays: 1,
    colorClass: "bg-pink-500", colorHex: "#ec4899",
    topics: [
      { key: "linearEqIntro", title: "Introduction", cssClass: "linearEquations" },
      { key: "linearEqGraphical", title: "Graphical Method", cssClass: "linearEquations" },
      { key: "linearEqConsistency", title: "Consistency & Nature", cssClass: "linearEquations" },
      { key: "linearEqSubstitution", title: "Substitution Method", cssClass: "linearEquations" },
      { key: "linearEqElimination", title: "Elimination Method", cssClass: "linearEquations" },
      { key: "linearEqReducible", title: "Equations Reducible to Linear Form", cssClass: "linearEquations" },
      { key: "linearEqApplications", title: "Applications (Word Problems)", cssClass: "linearEquations" },
      { key: "linearEqProblems", title: "Problem Solving & Exercises", cssClass: "linearEquations" },
      { key: "revision3", title: "Chapter Revision & Summary", cssClass: "linearEquations" },
    ],
  },
  {
    id: "triangles", name: "Triangles", teachingDays: 12, practiceDays: 4, testDays: 1,
    colorClass: "bg-emerald-500", colorHex: "#10b981",
    topics: [
      { key: "triangleIntro", title: "Introduction", cssClass: "triangle" },
      { key: "similarFigures", title: "Similar Figures", cssClass: "triangle" },
      { key: "triangleSimilarity", title: "Similarity of Triangles", cssClass: "triangle" },
      { key: "basicProportionality", title: "Basic Proportionality Theorem", cssClass: "triangle" },
      { key: "converseProportionality", title: "Converse of Basic Proportionality", cssClass: "triangle" },
      { key: "similarityCriteriaSAS", title: "SAS Similarity Criterion", cssClass: "triangle" },
      { key: "rhsSimilarity", title: "RHS Criterion (Right-Triangle)", cssClass: "triangle" },
      { key: "triangleApplications", title: "Applications & Examples", cssClass: "triangle" },
      { key: "triangleProblems", title: "Problem Solving / Exercises", cssClass: "triangle" },
      { key: "revision6", title: "Chapter Revision & Summary", cssClass: "triangle" },
    ],
  },
];

const nationalHolidays: Record<string, string> = NATIONAL_HOLIDAYS;

const toKey = (date: Date) => date.toISOString().split("T")[0];
const fromKey = (key: string) => new Date(key + "T12:00:00Z");

const topicColorMap: Record<string, string> = {
  intro: "bg-blue-500 hover:bg-blue-600",
  polynomial: "bg-purple-600 hover:bg-purple-700",
  linearEquations: "bg-pink-500 hover:bg-pink-600",
  triangle: "bg-emerald-500 hover:bg-emerald-600",
  practice: "bg-cyan-500 hover:bg-cyan-600",
  test: "bg-red-500 hover:bg-red-600",
  assignment: "bg-amber-500 hover:bg-amber-600",
};

// ── Schedule generation ──
function generateSchedule(chapters: ChapterDef[]): Record<string, ScheduleItem> {
  const schedule: Record<string, ScheduleItem> = {};

  Object.entries(nationalHolidays).forEach(([dateKey, label]) => {
    schedule[dateKey] = { type: "holiday", label, isNational: true };
  });

  const isWorkingDay = (date: Date) => {
    const dow = date.getUTCDay();
    if (dow === 0 || dow === 6) return false;
    const key = toKey(date);
    return !schedule[key]?.isNational && schedule[key]?.type !== "holiday";
  };

  const getNextSlot = (after: Date) => {
    const d = new Date(after);
    while (true) {
      d.setUTCDate(d.getUTCDate() + 1);
      if (isWorkingDay(d)) return new Date(d);
    }
  };

  // Anchor to the start of the current academic year (June 1).
  // If we're already past June, use this calendar year; otherwise the previous one.
  const _today = new Date();
  const _ayYear = _today.getUTCMonth() >= 5 ? _today.getUTCFullYear() : _today.getUTCFullYear() - 1;
  // Use May 31 so the first getNextSlot() lands on the first working day of June.
  let currentDate = new Date(Date.UTC(_ayYear, 4, 31, 12, 0, 0));

  chapters.forEach((chapter) => {
    for (let i = 0; i < chapter.teachingDays; i++) {
      currentDate = getNextSlot(currentDate);
      const topic = chapter.topics[i] || {
        key: `extra_${chapter.id}_${i}`,
        title: `Extra Topic ${i + 1}`,
        cssClass: chapter.topics[0]?.cssClass,
      };
      schedule[toKey(currentDate)] = {
        type: "topic",
        title: topic.title,
        cssClass: topic.cssClass,
        chapterId: chapter.id,
        key: topic.key,
      };
    }
    for (let i = 0; i < chapter.practiceDays; i++) {
      currentDate = getNextSlot(currentDate);
      schedule[toKey(currentDate)] = {
        type: "practice",
        title: "Practice Day",
        cssClass: "practice",
        chapterId: chapter.id,
      };
    }
    for (let i = 0; i < chapter.testDays; i++) {
      currentDate = getNextSlot(currentDate);
      schedule[toKey(currentDate)] = {
        type: "test",
        title: `Test: ${chapter.name}`,
        cssClass: "test",
        chapterId: chapter.id,
      };
    }
  });

  const fillStart = new Date("2025-01-01T12:00:00Z");
  const fillEnd = new Date("2026-12-31T12:00:00Z");
  const fillDate = new Date(fillStart);
  while (fillDate <= fillEnd) {
    const key = toKey(fillDate);
    if (!schedule[key]) {
      const dow = fillDate.getUTCDay();
      if (dow === 0) schedule[key] = { type: "holiday", label: "Sunday" };
      else if (dow === 6) schedule[key] = { type: "assignment", title: "Weekly Assignments", cssClass: "assignment" };
    }
    fillDate.setUTCDate(fillDate.getUTCDate() + 1);
  }

  return schedule;
}

export { getDefaultChapters as defaultChaptersFactory, toKey, generateSchedule };
export const defaultChapters = getDefaultChapters();

const DAY_HEADERS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

// ── Modal types ──
type ModalType = null | "extend" | "holiday" | "reschedule" | "delete";
type SubSection = null | "extendTopic" | "extendChapter" | "insertTopic" | "deleteTopic" | "deleteChapter" | "swapTopics" | "swapChapters";

interface TeachingCalendarProps {
  onSave?: (schedule: Record<string, ScheduleItem>, chapters: ChapterDef[]) => void;
  isSaving?: boolean;
  selectedClass?: string;
  onClassChange?: (className: string) => void;
  selectedSubject?: string;
  onSubjectChange?: (subject: string) => void;
  availableClasses?: string[];
  availableSubjects?: string[];
  /**
   * Chapters loaded from the DB for the currently-selected (board, class, subject).
   * When this changes, the calendar rebuilds so each class gets its OWN schedule
   * instead of every teacher seeing the same hardcoded Math chapters.
   */
  initialChapters?: ChapterDef[];
}

const DEFAULT_CLASSES = [
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12"
];

const TeachingCalendar = ({ onSave, isSaving, selectedClass, onClassChange, selectedSubject, onSubjectChange, availableClasses, availableSubjects, initialChapters }: TeachingCalendarProps) => {
  const CLASSES = availableClasses && availableClasses.length > 0 ? availableClasses : DEFAULT_CLASSES;
  const SUBJECTS = availableSubjects && availableSubjects.length > 0 ? availableSubjects : [];


  const now = new Date();
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  // Mutable state — seeded from initialChapters (DB) if provided, else defaults.
  const _seedChapters = initialChapters && initialChapters.length > 0 ? initialChapters : getDefaultChapters();
  const [chapters, setChapters] = useState<ChapterDef[]>(() => _seedChapters);
  const [schedule, setSchedule] = useState<Record<string, ScheduleItem>>(() => generateSchedule(_seedChapters));
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // History (undo/redo)
  const [history, setHistory] = useState<{ chapters: ChapterDef[]; schedule: Record<string, ScheduleItem> }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // When the parent feeds in a fresh set of chapters (e.g. teacher switched
  // class or subject), rebuild the calendar from those instead of keeping
  // the previous class's schedule on screen.
  useEffect(() => {
    if (!initialChapters || initialChapters.length === 0) return;
    setChapters(initialChapters);
    setSchedule(generateSchedule(initialChapters));
    setHasUnsavedChanges(false);
    setHistory([]);
    setHistoryIndex(-1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialChapters]);

  // Modal state
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [subSection, setSubSection] = useState<SubSection>(null);

  // Form state
  const [selectedTopic, setSelectedTopic] = useState("");
  const [extendDays, setExtendDays] = useState("1");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [extendChapterDays, setExtendChapterDays] = useState("1");
  const [insertAfterTopic, setInsertAfterTopic] = useState("");
  const [insertTopicName, setInsertTopicName] = useState("");
  const [insertTopicChapter, setInsertTopicChapter] = useState("");
  const [deleteTopicKey, setDeleteTopicKey] = useState("");
  const [deleteChapterId, setDeleteChapterId] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [swapTopic1, setSwapTopic1] = useState("");
  const [swapTopic2, setSwapTopic2] = useState("");
  const [swapChapter1, setSwapChapter1] = useState("");
  const [swapChapter2, setSwapChapter2] = useState("");
  // "Extend to next day" — when checked, the topic is placed on the next
  // working day and trailing topics shift forward one slot each until the
  // next Practice Day is consumed (Sat/Sun/holidays are skipped).
  const [extendToNextDay, setExtendToNextDay] = useState(false);

  /**
   * Walk forward from `anchorKey` (exclusive), skipping Sat/Sun/holidays,
   * and shift each topic/test/assignment one working day to the right until
   * the next Practice Day slot is reached. That Practice Day is consumed
   * (overwritten by the previous topic), and the original next-working-day
   * slot is returned so the caller can place the new/extended item there.
   *
   * Returns the date key of the freed slot, or null if no Practice Day is
   * found in the remainder of the schedule.
   */
  const shiftAndConsumeNextPractice = (
    sched: Record<string, ScheduleItem>,
    anchorKey: string,
  ): string | null => {
    const isWorking = (d: Date) => {
      const dow = d.getUTCDay();
      if (dow === 0 || dow === 6) return false;
      const k = toKey(d);
      const it = sched[k];
      return !(it?.type === "holiday");
    };
    const nextWorking = (from: Date) => {
      const d = new Date(from);
      while (true) {
        d.setUTCDate(d.getUTCDate() + 1);
        if (isWorking(d)) return new Date(d);
      }
    };

    // Collect the contiguous chain of working-day slots starting after anchor,
    // up to and INCLUDING the first practice day.
    const chain: string[] = [];
    let cursor = fromKey(anchorKey);
    for (let safety = 0; safety < 400; safety++) {
      cursor = nextWorking(cursor);
      const k = toKey(cursor);
      chain.push(k);
      if (sched[k]?.type === "practice") break;
    }
    if (chain.length === 0) return null;
    if (sched[chain[chain.length - 1]]?.type !== "practice") return null;

    // Shift right: chain[i+1] = chain[i] for i from end-1 down to 0.
    // The practice slot gets overwritten; chain[0] becomes empty.
    for (let i = chain.length - 1; i > 0; i--) {
      sched[chain[i]] = sched[chain[i - 1]];
    }
    delete sched[chain[0]];
    return chain[0];
  };


  const pushHistory = useCallback((newChapters: ChapterDef[], newSchedule: Record<string, ScheduleItem>) => {
    setHistory(prev => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, { chapters: JSON.parse(JSON.stringify(newChapters)), schedule: JSON.parse(JSON.stringify(newSchedule)) }];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const applyChange = useCallback((newChapters: ChapterDef[]) => {
    const newSchedule = generateSchedule(newChapters);
    setChapters(newChapters);
    setSchedule(newSchedule);
    pushHistory(newChapters, newSchedule);
    setHasUnsavedChanges(true);
  }, [pushHistory]);

  const undo = () => {
    if (historyIndex <= 0) return;
    const newIdx = historyIndex - 1;
    const state = history[newIdx];
    setChapters(JSON.parse(JSON.stringify(state.chapters)));
    setSchedule(JSON.parse(JSON.stringify(state.schedule)));
    setHistoryIndex(newIdx);
    setHasUnsavedChanges(true);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIdx = historyIndex + 1;
    const state = history[newIdx];
    setChapters(JSON.parse(JSON.stringify(state.chapters)));
    setSchedule(JSON.parse(JSON.stringify(state.schedule)));
    setHistoryIndex(newIdx);
    setHasUnsavedChanges(true);
  };

  const resetSchedule = () => {
    if (!confirm("Reset the entire schedule to default? This cannot be undone.")) return;
    const def = getDefaultChapters();
    const sched = generateSchedule(def);
    setChapters(def);
    setSchedule(sched);
    setHistory([{ chapters: JSON.parse(JSON.stringify(def)), schedule: JSON.parse(JSON.stringify(sched)) }]);
    setHistoryIndex(0);
    setHasUnsavedChanges(true);
  };

  // Calendar rendering
  const monthDate = new Date(Date.UTC(year, monthIndex, 1));
  const monthName = monthDate.toLocaleString("default", { month: "long", timeZone: "UTC" });
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  let firstDay = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  firstDay = firstDay === 0 ? 6 : firstDay - 1;

  const prevMonth = () => {
    if (monthIndex === 0) { setMonthIndex(11); setYear(y => y - 1); }
    else setMonthIndex(m => m - 1);
  };
  const nextMonth = () => {
    if (monthIndex === 11) { setMonthIndex(0); setYear(y => y + 1); }
    else setMonthIndex(m => m + 1);
  };

  const chaptersInMonth = useMemo(() => {
    const ids = new Set<string>();
    for (let d = 1; d <= daysInMonth; d++) {
      const key = toKey(new Date(Date.UTC(year, monthIndex, d)));
      const item = schedule[key];
      if (item?.chapterId) ids.add(item.chapterId);
    }
    return chapters.filter((c) => ids.has(c.id));
  }, [schedule, chapters, monthIndex, year, daysInMonth]);

  // Get all scheduled topics for dropdowns
  const allTopics = useMemo(() => {
    return Object.entries(schedule)
      .filter(([, v]) => v.type === "topic")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, item]) => ({ dateKey, title: item.title || "", chapterId: item.chapterId || "" }));
  }, [schedule]);

  // Available working dates for holidays
  const availableHolidayDates = useMemo(() => {
    const dates: { key: string; label: string }[] = [];
    let d = new Date("2025-01-01T12:00:00Z");
    const end = new Date("2026-12-31T12:00:00Z");
    while (d <= end) {
      const dow = d.getUTCDay();
      const key = toKey(d);
      if (dow !== 0 && !nationalHolidays[key] && schedule[key]?.type !== "holiday") {
        const dayName = d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
        dates.push({ key, label: `${key} (${dayName})` });
      }
      d = new Date(d);
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return dates;
  }, [schedule]);

  const closeModal = () => {
    setActiveModal(null);
    setSubSection(null);
    setSelectedTopic(""); setExtendDays("1"); setSelectedChapter(""); setExtendChapterDays("1");
    setInsertAfterTopic(""); setInsertTopicName(""); setInsertTopicChapter("");
    setDeleteTopicKey(""); setDeleteChapterId("");
    setHolidayDate(""); setHolidayName("");
    setSwapTopic1(""); setSwapTopic2(""); setSwapChapter1(""); setSwapChapter2("");
  };

  // ── Action handlers ──

  const handleExtendChapter = () => {
    if (!selectedChapter) return;
    const numDays = parseInt(extendChapterDays, 10);
    const newChapters = JSON.parse(JSON.stringify(chapters)) as ChapterDef[];
    const ch = newChapters.find(c => c.id === selectedChapter);
    if (!ch) return;
    ch.teachingDays += numDays;
    ch.practiceDays += Math.floor(numDays / 3);
    for (let i = 1; i <= numDays; i++) {
      ch.topics.push({ key: `ext_${ch.id}_${ch.topics.length + i}`, title: `Extension Day ${i}`, cssClass: ch.topics[0]?.cssClass || "intro" });
    }
    applyChange(newChapters);
    closeModal();
  };

  const handleInsertTopic = () => {
    if (!insertTopicName.trim() || !insertTopicChapter) return;
    const newChapters = JSON.parse(JSON.stringify(chapters)) as ChapterDef[];
    const ch = newChapters.find(c => c.id === insertTopicChapter);
    if (!ch) return;
    ch.teachingDays++;
    ch.topics.push({ key: `inserted_${Date.now()}`, title: insertTopicName.trim(), cssClass: ch.topics[0]?.cssClass || "intro" });
    applyChange(newChapters);
    closeModal();
  };

  const handleDeleteTopic = () => {
    if (!deleteTopicKey) return;
    const item = schedule[deleteTopicKey];
    if (!item || item.type !== "topic") return;
    const newChapters = JSON.parse(JSON.stringify(chapters)) as ChapterDef[];
    const ch = newChapters.find(c => c.id === item.chapterId);
    if (ch) {
      const idx = ch.topics.findIndex(t => t.key === item.key);
      if (idx > -1) { ch.topics.splice(idx, 1); ch.teachingDays--; }
    }
    applyChange(newChapters);
    closeModal();
  };

  const handleDeleteChapter = () => {
    if (!deleteChapterId) return;
    const newChapters = chapters.filter(c => c.id !== deleteChapterId);
    applyChange(newChapters);
    closeModal();
  };

  const handleAddHoliday = () => {
    if (!holidayDate) return;
    const name = holidayName.trim() || "Holiday";
    // Add as custom holiday - regenerate schedule with it
    const newSchedule = { ...schedule };
    newSchedule[holidayDate] = { type: "holiday", label: name };
    // Regenerate to shift topics
    const regen = generateSchedule(chapters);
    // Merge custom holidays
    regen[holidayDate] = { type: "holiday", label: name };
    setSchedule(regen);
    pushHistory(chapters, regen);
    setHasUnsavedChanges(true);
    closeModal();
  };

  const handleSwapTopics = () => {
    if (!swapTopic1 || !swapTopic2 || swapTopic1 === swapTopic2) return;
    const newSchedule = { ...schedule };
    const item1 = { ...newSchedule[swapTopic1] };
    const item2 = { ...newSchedule[swapTopic2] };
    newSchedule[swapTopic1] = item2;
    newSchedule[swapTopic2] = item1;
    setSchedule(newSchedule);
    pushHistory(chapters, newSchedule);
    setHasUnsavedChanges(true);
    closeModal();
  };

  const handleSwapChapters = () => {
    if (!swapChapter1 || !swapChapter2 || swapChapter1 === swapChapter2) return;
    const newChapters = [...chapters];
    const i1 = newChapters.findIndex(c => c.id === swapChapter1);
    const i2 = newChapters.findIndex(c => c.id === swapChapter2);
    if (i1 === -1 || i2 === -1) return;
    [newChapters[i1], newChapters[i2]] = [newChapters[i2], newChapters[i1]];
    applyChange(newChapters);
    closeModal();
  };

  const handleSavePublish = () => {
    if (onSave) onSave(schedule, chapters);
    setHasUnsavedChanges(false);
  };

  // ── Calendar grid ──
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="min-h-[120px] bg-card/50" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const key = toKey(new Date(Date.UTC(year, monthIndex, d)));
    const item = schedule[key];
    const isToday = d === now.getDate() && monthIndex === now.getMonth() && year === now.getFullYear();

    let cellBg = "bg-card";
    if (item?.isNational) cellBg = "bg-orange-50 border-orange-400 border-2";
    else if (item?.type === "holiday") cellBg = "bg-red-50 border-red-200";

    days.push(
      <div
        key={d}
        className={`min-h-[120px] p-2 border border-border/30 relative ${cellBg} ${isToday ? "ring-2 ring-primary" : ""}`}
      >
        <div className={`text-sm font-semibold mb-2 ${isToday ? "text-primary" : "text-card-foreground"}`}>{d}</div>
        {item && (
          <>
            {item.isNational && (
              <div className="bg-orange-500 text-white text-[11px] px-2 py-1.5 rounded-full text-center font-medium mt-4">{item.label}</div>
            )}
            {!item.isNational && item.type === "holiday" && (
              <div className="bg-red-500 text-white text-[11px] px-2 py-1.5 rounded-full text-center font-medium mt-4">{item.label}</div>
            )}
            {item.type === "topic" && (
              <button className={`w-full text-white text-[11px] px-2 py-1.5 rounded-full text-center font-medium leading-tight transition-all hover:-translate-y-0.5 hover:shadow-md border-none cursor-pointer ${topicColorMap[item.cssClass || ""] || "bg-gray-500"}`}>
                {item.title}
              </button>
            )}
            {item.type === "practice" && (
              <button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white text-[11px] px-2 py-1.5 rounded-full text-center font-medium transition-all hover:-translate-y-0.5 border-none cursor-pointer">Practice Day</button>
            )}
            {item.type === "test" && (
              <button className="w-full bg-red-500 hover:bg-red-600 text-white text-[11px] px-2 py-1.5 rounded-full text-center font-medium transition-all hover:-translate-y-0.5 border-none cursor-pointer">{item.title}</button>
            )}
            {item.type === "assignment" && (
              <button className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 text-[11px] px-2 py-1.5 rounded-full text-center font-medium transition-all hover:-translate-y-0.5 border-none cursor-pointer">{item.title}</button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="bg-card/95 backdrop-blur-[10px] rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-border/20">
        {/* Header with action buttons */}
        <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white text-center py-6 px-8">
          <h2 className="text-2xl font-light mb-1">Mathematics Teaching Schedule</h2>
          <div className="flex flex-col items-center gap-2 mt-1">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Select value={selectedClass} onValueChange={onClassChange}>
                <SelectTrigger className="w-[160px] bg-white/20 border-white/30 text-white h-8 text-sm">
                  <SelectValue placeholder="Select class..." />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {CLASSES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {SUBJECTS.length > 0 && (
                <Select value={selectedSubject} onValueChange={onSubjectChange}>
                  <SelectTrigger className="w-[160px] bg-white/20 border-white/30 text-white h-8 text-sm">
                    <SelectValue placeholder="Select subject..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <p className="text-xs opacity-80 uppercase tracking-wider font-medium">CBSE • 2025–26</p>
          </div>


          <div className="flex justify-center gap-3 mt-5 flex-wrap">
            <button onClick={() => { setActiveModal("extend"); setSubSection(null); }} className="bg-white/20 text-white border-2 border-green-400/60 px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-white/30 hover:-translate-y-0.5 transition-all cursor-pointer backdrop-blur-sm">
              Extend & Insert
            </button>
            <button onClick={() => setActiveModal("holiday")} className="bg-white/20 text-white border-2 border-yellow-400/60 px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-white/30 hover:-translate-y-0.5 transition-all cursor-pointer backdrop-blur-sm">
              Add Holiday
            </button>
            <button onClick={() => { setActiveModal("reschedule"); setSubSection(null); }} className="bg-white/20 text-white border-2 border-cyan-400/60 px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-white/30 hover:-translate-y-0.5 transition-all cursor-pointer backdrop-blur-sm">
              Reschedule
            </button>
            <button onClick={() => { setActiveModal("delete"); setSubSection(null); }} className="bg-white/20 text-white border-2 border-red-400/60 px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-white/30 hover:-translate-y-0.5 transition-all cursor-pointer backdrop-blur-sm">
              Delete
            </button>
          </div>
        </div>

        {/* Month Navigation with undo/redo/save/reset */}
        <div className="flex justify-between items-center px-6 py-4 bg-secondary/50 border-b border-border/30">
          <button onClick={prevMonth} className="w-10 h-10 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all hover:-translate-y-0.5 border-none cursor-pointer">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <button onClick={undo} disabled={historyIndex <= 0} className="w-10 h-10 rounded-lg bg-gray-500 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all border-none cursor-pointer" title="Undo">
              <Undo2 className="h-4 w-4" />
            </button>
            <h3 className="text-xl font-semibold text-card-foreground">{monthName} {year}</h3>
            <button onClick={handleSavePublish} disabled={isSaving} className={`w-10 h-10 rounded-lg text-white flex items-center justify-center transition-all border-none cursor-pointer ${hasUnsavedChanges ? "bg-green-500 hover:bg-green-600 animate-pulse" : "bg-gray-500 hover:bg-gray-600"}`} title="Save & Publish">
              <Save className="h-4 w-4" />
            </button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} className="w-10 h-10 rounded-lg bg-gray-500 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all border-none cursor-pointer" title="Redo">
              <Redo2 className="h-4 w-4" />
            </button>
            <button onClick={resetSchedule} className="w-10 h-10 rounded-lg bg-gray-500 hover:bg-gray-600 text-white flex items-center justify-center transition-all border-none cursor-pointer" title="Reset to Default">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          <button onClick={nextMonth} className="w-10 h-10 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all hover:-translate-y-0.5 border-none cursor-pointer">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-border/30">
          {DAY_HEADERS.map((h) => (
            <div key={h} className="bg-gray-700 text-white py-3 text-center text-sm font-semibold">{h}</div>
          ))}
          {days}
        </div>

        {/* Legend */}
        <div className="px-6 py-4 bg-secondary/50 border-t border-border/30 flex flex-wrap gap-5 justify-center">
          {chaptersInMonth.length === 0 ? (
            <span className="text-sm text-muted-foreground">No chapters scheduled this month.</span>
          ) : (
            chaptersInMonth.map((ch) => (
              <div key={ch.id} className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                <div className="w-5 h-5 rounded" style={{ backgroundColor: ch.colorHex }} />
                <span>{ch.name}</span>
              </div>
            ))
          )}
          <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
            <div className="w-5 h-5 rounded bg-cyan-500" /><span>Practice</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
            <div className="w-5 h-5 rounded bg-red-500" /><span>Test</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
            <div className="w-5 h-5 rounded bg-amber-500" /><span>Assignment</span>
          </div>
        </div>
      </div>

      {/* ── EXTEND & INSERT MODAL ── */}
      <Dialog open={activeModal === "extend"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-green-700">Extend & Insert</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 justify-center flex-wrap mb-4">
            <Button variant="secondary" size="sm" onClick={() => setSubSection("extendTopic")}>Extend Topic</Button>
            <Button variant="secondary" size="sm" onClick={() => setSubSection("extendChapter")}>Extend Chapter</Button>
            <Button variant="secondary" size="sm" onClick={() => setSubSection("insertTopic")}>Insert Topic</Button>
          </div>

          {subSection === "extendTopic" && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-semibold">Extend a Topic</h4>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger><SelectValue placeholder="Select a topic..." /></SelectTrigger>
                <SelectContent>{allTopics.map(t => <SelectItem key={t.dateKey} value={t.dateKey}>{t.dateKey} - {t.title}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={extendDays} onValueChange={setExtendDays}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} Day{n > 1 ? "s" : ""}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Practice days from the chapter will be converted to extend this topic.</p>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => {
                // Simple extend: increase teaching days
                if (!selectedTopic) return;
                const item = schedule[selectedTopic];
                if (!item) return;
                const newChapters = JSON.parse(JSON.stringify(chapters)) as ChapterDef[];
                const ch = newChapters.find(c => c.id === item.chapterId);
                if (!ch) return;
                const days = parseInt(extendDays, 10);
                ch.teachingDays += days;
                for (let i = 0; i < days; i++) {
                  ch.topics.push({ key: `${item.key}_ext_${i}`, title: `${item.title} (Day ${i + 2})`, cssClass: item.cssClass || "intro" });
                }
                if (ch.practiceDays >= days) ch.practiceDays -= days;
                applyChange(newChapters);
                closeModal();
              }}>Apply Extension</Button>
            </div>
          )}

          {subSection === "extendChapter" && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-semibold">Extend Chapter</h4>
              <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                <SelectTrigger><SelectValue placeholder="Select chapter..." /></SelectTrigger>
                <SelectContent>{chapters.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={extendChapterDays} onValueChange={setExtendChapterDays}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[1,2,3,4,5,6,7,8,9,10].map(n => <SelectItem key={n} value={String(n)}>{n} Day{n > 1 ? "s" : ""}</SelectItem>)}</SelectContent>
              </Select>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleExtendChapter}>Extend Chapter</Button>
            </div>
          )}

          {subSection === "insertTopic" && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-semibold">Insert New Topic</h4>
              <Select value={insertAfterTopic} onValueChange={setInsertAfterTopic}>
                <SelectTrigger><SelectValue placeholder="Insert after topic..." /></SelectTrigger>
                <SelectContent>{allTopics.map(t => <SelectItem key={t.dateKey} value={t.dateKey}>{t.dateKey} - {t.title}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="New topic name" value={insertTopicName} onChange={e => setInsertTopicName(e.target.value)} />
              <Select value={insertTopicChapter} onValueChange={setInsertTopicChapter}>
                <SelectTrigger><SelectValue placeholder="Assign to chapter..." /></SelectTrigger>
                <SelectContent>{chapters.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleInsertTopic}>Insert Topic</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── ADD HOLIDAY MODAL ── */}
      <Dialog open={activeModal === "holiday"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Holiday</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={holidayDate} onValueChange={setHolidayDate}>
              <SelectTrigger><SelectValue placeholder="Select a date..." /></SelectTrigger>
              <SelectContent className="max-h-60">{availableHolidayDates.map(d => <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Holiday name" value={holidayName} onChange={e => setHolidayName(e.target.value)} />
            <Button onClick={handleAddHoliday}>Add Holiday</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── RESCHEDULE MODAL ── */}
      <Dialog open={activeModal === "reschedule"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-cyan-700">Reschedule</DialogTitle></DialogHeader>
          <div className="flex gap-2 justify-center mb-4">
            <Button variant="secondary" size="sm" onClick={() => setSubSection("swapTopics")}>Swap Topics</Button>
            <Button variant="secondary" size="sm" onClick={() => setSubSection("swapChapters")}>Swap Chapters</Button>
          </div>

          {subSection === "swapTopics" && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-semibold">Swap Two Topics</h4>
              <Select value={swapTopic1} onValueChange={setSwapTopic1}>
                <SelectTrigger><SelectValue placeholder="Topic 1..." /></SelectTrigger>
                <SelectContent>{allTopics.map(t => <SelectItem key={t.dateKey} value={t.dateKey}>{t.dateKey} - {t.title}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={swapTopic2} onValueChange={setSwapTopic2}>
                <SelectTrigger><SelectValue placeholder="Topic 2..." /></SelectTrigger>
                <SelectContent>{allTopics.map(t => <SelectItem key={t.dateKey} value={t.dateKey}>{t.dateKey} - {t.title}</SelectItem>)}</SelectContent>
              </Select>
              <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={handleSwapTopics}>Swap Topics</Button>
            </div>
          )}

          {subSection === "swapChapters" && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-semibold">Swap Two Chapters</h4>
              <Select value={swapChapter1} onValueChange={setSwapChapter1}>
                <SelectTrigger><SelectValue placeholder="Chapter 1..." /></SelectTrigger>
                <SelectContent>{chapters.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={swapChapter2} onValueChange={setSwapChapter2}>
                <SelectTrigger><SelectValue placeholder="Chapter 2..." /></SelectTrigger>
                <SelectContent>{chapters.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={handleSwapChapters}>Swap Chapters</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── DELETE MODAL ── */}
      <Dialog open={activeModal === "delete"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-red-700">Delete</DialogTitle></DialogHeader>
          <div className="flex gap-2 justify-center mb-4">
            <Button variant="secondary" size="sm" onClick={() => setSubSection("deleteTopic")}>Delete Topic</Button>
            <Button variant="secondary" size="sm" onClick={() => setSubSection("deleteChapter")}>Delete Chapter</Button>
          </div>

          {subSection === "deleteTopic" && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-semibold">Delete a Topic</h4>
              <Select value={deleteTopicKey} onValueChange={setDeleteTopicKey}>
                <SelectTrigger><SelectValue placeholder="Select topic to delete..." /></SelectTrigger>
                <SelectContent>{allTopics.map(t => <SelectItem key={t.dateKey} value={t.dateKey}>{t.dateKey} - {t.title}</SelectItem>)}</SelectContent>
              </Select>
              {deleteTopicKey && schedule[deleteTopicKey] && (
                <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
                  Deleting "{schedule[deleteTopicKey]?.title}" will shift all subsequent topics forward.
                </p>
              )}
              <Button variant="destructive" onClick={handleDeleteTopic}>Delete Topic</Button>
            </div>
          )}

          {subSection === "deleteChapter" && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-semibold">Delete a Chapter</h4>
              <Select value={deleteChapterId} onValueChange={setDeleteChapterId}>
                <SelectTrigger><SelectValue placeholder="Select chapter to delete..." /></SelectTrigger>
                <SelectContent>{chapters.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              {deleteChapterId && (
                <p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">
                  ⚠️ This will permanently delete the entire "{chapters.find(c => c.id === deleteChapterId)?.name}" chapter and regenerate the schedule.
                </p>
              )}
              <Button variant="destructive" onClick={handleDeleteChapter}>Delete Chapter</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TeachingCalendar;
