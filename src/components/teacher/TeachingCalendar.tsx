import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Chapter data matching the HTML schedule
const defaultChapters = [
  {
    id: "real_numbers",
    name: "Real Numbers",
    teachingDays: 15,
    practiceDays: 5,
    testDays: 1,
    colorClass: "bg-blue-500",
    colorHex: "#3b82f6",
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
    id: "polynomials",
    name: "Polynomials",
    teachingDays: 10,
    practiceDays: 4,
    testDays: 1,
    colorClass: "bg-purple-600",
    colorHex: "#7c3aed",
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
    id: "linearEquations",
    name: "Linear Equations",
    teachingDays: 12,
    practiceDays: 4,
    testDays: 1,
    colorClass: "bg-pink-500",
    colorHex: "#ec4899",
    topics: [
      { key: "linearEqIntro", title: "Introduction", cssClass: "linearEquations" },
      { key: "linearEqGraphical", title: "Graphical Method", cssClass: "linearEquations" },
      { key: "linearEqConsistency", title: "Consistency & Nature", cssClass: "linearEquations" },
      { key: "linearEqSubstitution", title: "Substitution Method", cssClass: "linearEquations" },
      { key: "linearEqElimination", title: "Elimination Method", cssClass: "linearEquations" },
      { key: "linearEqReducible", title: "Reducible to Linear", cssClass: "linearEquations" },
      { key: "linearEqApplications", title: "Word Problems", cssClass: "linearEquations" },
      { key: "linearEqProblems", title: "Problem Solving", cssClass: "linearEquations" },
      { key: "revision3", title: "Chapter Revision", cssClass: "linearEquations" },
    ],
  },
  {
    id: "triangles",
    name: "Triangles",
    teachingDays: 12,
    practiceDays: 4,
    testDays: 1,
    colorClass: "bg-emerald-500",
    colorHex: "#10b981",
    topics: [
      { key: "triangleIntro", title: "Introduction", cssClass: "triangle" },
      { key: "similarFigures", title: "Similar Figures", cssClass: "triangle" },
      { key: "triangleSimilarity", title: "Similarity of Triangles", cssClass: "triangle" },
      { key: "basicProportionality", title: "Basic Proportionality", cssClass: "triangle" },
      { key: "converseProportionality", title: "Converse Proportionality", cssClass: "triangle" },
      { key: "similarityCriteriaSAS", title: "SAS Similarity", cssClass: "triangle" },
      { key: "rhsSimilarity", title: "RHS Criterion", cssClass: "triangle" },
      { key: "triangleApplications", title: "Applications", cssClass: "triangle" },
      { key: "triangleProblems", title: "Problem Solving", cssClass: "triangle" },
      { key: "revision6", title: "Chapter Revision", cssClass: "triangle" },
    ],
  },
];

const nationalHolidays: Record<string, string> = {
  "2025-01-26": "Republic Day",
  "2025-02-26": "Maha Shivaratri",
  "2025-03-14": "Holi",
  "2025-03-31": "Eid-ul-Fitr",
  "2025-04-18": "Good Friday",
  "2025-05-12": "Buddha Purnima",
  "2025-06-07": "Eid al-Adha",
  "2025-07-07": "Muharram",
  "2025-08-15": "Independence Day",
  "2025-08-19": "Raksha Bandhan",
  "2025-08-26": "Janmashtami",
  "2025-10-02": "Gandhi Jayanti",
  "2025-10-20": "Dussehra",
  "2025-10-21": "Diwali",
  "2025-11-15": "Guru Nanak Jayanti",
  "2025-12-25": "Christmas Day",
  "2026-01-26": "Republic Day",
  "2026-08-15": "Independence Day",
  "2026-10-02": "Gandhi Jayanti",
  "2026-12-25": "Christmas Day",
};

export interface ScheduleItem {
  type: "topic" | "practice" | "test" | "holiday" | "assignment";
  title?: string;
  label?: string;
  cssClass?: string;
  chapterId?: string;
  isNational?: boolean;
}

const toKey = (date: Date) => date.toISOString().split("T")[0];

export { toKey, generateSchedule, defaultChapters };


const topicColorMap: Record<string, string> = {
  intro: "bg-blue-500 hover:bg-blue-600",
  polynomial: "bg-purple-600 hover:bg-purple-700",
  linearEquations: "bg-pink-500 hover:bg-pink-600",
  triangle: "bg-emerald-500 hover:bg-emerald-600",
  practice: "bg-cyan-500 hover:bg-cyan-600",
  test: "bg-red-500 hover:bg-red-600",
  assignment: "bg-amber-500 hover:bg-amber-600",
};

function generateSchedule(): Record<string, ScheduleItem> {
  const schedule: Record<string, ScheduleItem> = {};

  // Add national holidays
  Object.entries(nationalHolidays).forEach(([dateKey, label]) => {
    schedule[dateKey] = { type: "holiday", label, isNational: true };
  });

  const isWorkingDay = (date: Date) => {
    const dow = date.getUTCDay();
    if (dow === 0 || dow === 6) return false;
    const key = toKey(date);
    return !schedule[key]?.isNational;
  };

  const getNextSlot = (after: Date) => {
    const d = new Date(after);
    while (true) {
      d.setUTCDate(d.getUTCDate() + 1);
      if (isWorkingDay(d)) return new Date(d);
    }
  };

  // Generate teaching schedule starting July 2025
  let currentDate = new Date("2025-06-30T12:00:00Z");

  defaultChapters.forEach((chapter) => {
    for (let i = 0; i < chapter.teachingDays; i++) {
      currentDate = getNextSlot(currentDate);
      const topic = chapter.topics[i] || {
        key: `extra_${chapter.id}_${i}`,
        title: `Topic ${i + 1}`,
        cssClass: chapter.topics[0]?.cssClass,
      };
      schedule[toKey(currentDate)] = {
        type: "topic",
        title: topic.title,
        cssClass: topic.cssClass,
        chapterId: chapter.id,
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

  // Fill weekends
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

const DAY_HEADERS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

interface TeachingCalendarProps {
  onSave?: (schedule: Record<string, ScheduleItem>) => void;
  isSaving?: boolean;
}

const TeachingCalendar = ({ onSave, isSaving }: TeachingCalendarProps) => {
  const now = new Date();
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const schedule = useMemo(() => generateSchedule(), []);

  const monthDate = new Date(Date.UTC(year, monthIndex, 1));
  const monthName = monthDate.toLocaleString("default", { month: "long", timeZone: "UTC" });
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  let firstDay = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  firstDay = firstDay === 0 ? 6 : firstDay - 1; // Monday start

  const prevMonth = () => {
    if (monthIndex === 0) { setMonthIndex(11); setYear(y => y - 1); }
    else setMonthIndex(m => m - 1);
  };
  const nextMonth = () => {
    if (monthIndex === 11) { setMonthIndex(0); setYear(y => y + 1); }
    else setMonthIndex(m => m + 1);
  };

  // Chapters in current month for legend
  const chaptersInMonth = useMemo(() => {
    const ids = new Set<string>();
    for (let d = 1; d <= daysInMonth; d++) {
      const key = toKey(new Date(Date.UTC(year, monthIndex, d)));
      const item = schedule[key];
      if (item?.chapterId) ids.add(item.chapterId);
    }
    return defaultChapters.filter((c) => ids.has(c.id));
  }, [schedule, monthIndex, year, daysInMonth]);

  const days = [];
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="min-h-[100px] bg-card/50" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const key = toKey(new Date(Date.UTC(year, monthIndex, d)));
    const item = schedule[key];
    const isToday =
      d === now.getDate() && monthIndex === now.getMonth() && year === now.getFullYear();

    let cellBg = "bg-card";
    if (item?.isNational) cellBg = "bg-orange-50 border-orange-400 border-2";
    else if (item?.type === "holiday") cellBg = "bg-red-50 border-red-200";

    days.push(
      <div
        key={d}
        className={`min-h-[100px] p-2 border border-border/30 relative ${cellBg} ${isToday ? "ring-2 ring-primary" : ""}`}
      >
        <div className={`text-sm font-semibold mb-1.5 ${isToday ? "text-primary" : "text-card-foreground"}`}>
          {d}
        </div>
        {item && (
          <>
            {item.isNational && (
              <div className="bg-orange-500 text-white text-[10px] px-2 py-1 rounded-full text-center font-medium mt-4">
                {item.label}
              </div>
            )}
            {!item.isNational && item.type === "holiday" && (
              <div className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-full text-center font-medium mt-4">
                {item.label}
              </div>
            )}
            {item.type === "topic" && (
              <button
                className={`w-full text-white text-[11px] px-2 py-1.5 rounded-full text-center font-medium leading-tight transition-all hover:-translate-y-0.5 hover:shadow-md border-none cursor-pointer ${topicColorMap[item.cssClass || ""] || "bg-gray-500"}`}
              >
                {item.title}
              </button>
            )}
            {item.type === "practice" && (
              <button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white text-[11px] px-2 py-1.5 rounded-full text-center font-medium transition-all hover:-translate-y-0.5 border-none cursor-pointer">
                Practice Day
              </button>
            )}
            {item.type === "test" && (
              <button className="w-full bg-red-500 hover:bg-red-600 text-white text-[11px] px-2 py-1.5 rounded-full text-center font-medium transition-all hover:-translate-y-0.5 border-none cursor-pointer">
                {item.title}
              </button>
            )}
            {item.type === "assignment" && (
              <button className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 text-[11px] px-2 py-1.5 rounded-full text-center font-medium transition-all hover:-translate-y-0.5 border-none cursor-pointer">
                {item.title}
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card/95 backdrop-blur-[10px] rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-border/20">
      {/* Header */}
      <div className="gradient-bg text-white text-center py-6 px-8">
        <h2 className="text-2xl font-light mb-1">Mathematics Teaching Schedule</h2>
        <p className="text-base opacity-90">Class 10th CBSE • 2025–26</p>
      </div>

      {/* Month Navigation */}
      <div className="flex justify-between items-center px-6 py-4 bg-secondary/50 border-b border-border/30">
        <button
          onClick={prevMonth}
          className="w-10 h-10 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all hover:-translate-y-0.5 border-none cursor-pointer"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold text-card-foreground">
            {monthName} {year}
          </h3>
          {onSave && (
            <button
              onClick={() => onSave(schedule)}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold transition-all border-none cursor-pointer"
            >
              {isSaving ? "Saving..." : "💾 Save & Publish"}
            </button>
          )}
        </div>
        <button
          onClick={nextMonth}
          className="w-10 h-10 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all hover:-translate-y-0.5 border-none cursor-pointer"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-border/30">
        {DAY_HEADERS.map((h) => (
          <div key={h} className="bg-gray-700 text-white py-3 text-center text-sm font-semibold">
            {h}
          </div>
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
          <div className="w-5 h-5 rounded bg-cyan-500" />
          <span>Practice</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
          <div className="w-5 h-5 rounded bg-red-500" />
          <span>Test</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
          <div className="w-5 h-5 rounded bg-amber-500" />
          <span>Assignment</span>
        </div>
      </div>
    </div>
  );
};

export default TeachingCalendar;
