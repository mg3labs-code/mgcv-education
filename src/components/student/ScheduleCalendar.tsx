import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ScheduleItem {
  type: string;
  title?: string;
  label?: string;
  cssClass?: string;
  chapterId?: string;
  isNational?: boolean;
}

const topicColorMap: Record<string, string> = {
  intro: "bg-blue-500",
  polynomial: "bg-purple-600",
  linearEquations: "bg-pink-500",
  triangle: "bg-emerald-500",
  practice: "bg-cyan-500",
  test: "bg-red-500",
  assignment: "bg-amber-500",
};

const chapterColors: Record<string, { name: string; hex: string }> = {
  real_numbers: { name: "Real Numbers", hex: "#3b82f6" },
  polynomials: { name: "Polynomials", hex: "#7c3aed" },
  linearEquations: { name: "Linear Equations", hex: "#ec4899" },
  triangles: { name: "Triangles", hex: "#10b981" },
};

const DAY_HEADERS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const toKey = (date: Date) => date.toISOString().split("T")[0];

interface ScheduleCalendarProps {
  scheduleData: Record<string, ScheduleItem>;
  className?: string;
  subject?: string;
}

const ScheduleCalendar = ({ scheduleData, className: classLabel, subject }: ScheduleCalendarProps) => {
  const now = new Date();
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

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
      const item = scheduleData[key];
      if (item?.chapterId) ids.add(item.chapterId);
    }
    return Array.from(ids)
      .map(id => chapterColors[id])
      .filter(Boolean);
  }, [scheduleData, monthIndex, year, daysInMonth]);

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="min-h-[90px] bg-card/50" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const key = toKey(new Date(Date.UTC(year, monthIndex, d)));
    const item = scheduleData[key];
    const isToday = d === now.getDate() && monthIndex === now.getMonth() && year === now.getFullYear();

    let cellBg = "bg-card";
    if (item?.isNational) cellBg = "bg-orange-50 border-orange-400 border-2";
    else if (item?.type === "holiday") cellBg = "bg-red-50 border-red-200";

    days.push(
      <div
        key={d}
        className={`min-h-[90px] p-2 border border-border/30 relative ${cellBg} ${isToday ? "ring-2 ring-primary" : ""}`}
      >
        <div className={`text-sm font-semibold mb-1 ${isToday ? "text-primary" : "text-card-foreground"}`}>
          {d}
        </div>
        {item && (
          <>
            {item.isNational && (
              <div className="bg-orange-500 text-white text-[10px] px-2 py-1 rounded-full text-center font-medium mt-3">
                {item.label}
              </div>
            )}
            {!item.isNational && item.type === "holiday" && (
              <div className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-full text-center font-medium mt-3">
                {item.label}
              </div>
            )}
            {item.type === "topic" && (
              <div className={`w-full text-white text-[10px] px-2 py-1 rounded-full text-center font-medium leading-tight ${topicColorMap[item.cssClass || ""] || "bg-gray-500"}`}>
                {item.title}
              </div>
            )}
            {item.type === "practice" && (
              <div className="w-full bg-cyan-500 text-white text-[10px] px-2 py-1 rounded-full text-center font-medium">
                Practice Day
              </div>
            )}
            {item.type === "test" && (
              <div className="w-full bg-red-500 text-white text-[10px] px-2 py-1 rounded-full text-center font-medium">
                {item.title}
              </div>
            )}
            {item.type === "assignment" && (
              <div className="w-full bg-amber-500 text-gray-900 text-[10px] px-2 py-1 rounded-full text-center font-medium">
                {item.title}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card/95 backdrop-blur-[10px] rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-border/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-5 px-6">
        <h2 className="text-xl font-light mb-1">{subject || "Mathematics"} Teaching Schedule</h2>
        <p className="text-sm opacity-90">{classLabel || "Class"} • 2025–26</p>
      </div>

      {/* Month Navigation */}
      <div className="flex justify-between items-center px-5 py-3 bg-secondary/50 border-b border-border/30">
        <button
          onClick={prevMonth}
          className="w-9 h-9 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all border-none cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="text-lg font-semibold text-card-foreground">
          {monthName} {year}
        </h3>
        <button
          onClick={nextMonth}
          className="w-9 h-9 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all border-none cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-border/30">
        {DAY_HEADERS.map((h) => (
          <div key={h} className="bg-gray-700 text-white py-2.5 text-center text-xs font-semibold">
            {h}
          </div>
        ))}
        {days}
      </div>

      {/* Legend */}
      <div className="px-5 py-3 bg-secondary/50 border-t border-border/30 flex flex-wrap gap-4 justify-center">
        {chaptersInMonth.length === 0 ? (
          <span className="text-xs text-muted-foreground">No chapters scheduled this month.</span>
        ) : (
          chaptersInMonth.map((ch) => (
            <div key={ch.name} className="flex items-center gap-1.5 text-xs font-medium text-card-foreground">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: ch.hex }} />
              <span>{ch.name}</span>
            </div>
          ))
        )}
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
    </div>
  );
};

export default ScheduleCalendar;
