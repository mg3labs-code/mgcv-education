import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import TeachingCalendar from "@/components/student/TeachingCalendar";

const scheduleItems = [
  { time: "09:00 AM – 10:00 AM", subject: "Mathematics", icon: "📐", topic: "Chapter 1: Real Numbers - Rational Numbers", type: "class" },
  { time: "10:00 AM – 11:00 AM", subject: "Science", icon: "🔬", topic: "Chapter 1: Light - Reflection and Refraction", type: "class" },
  { time: "11:00 AM – 11:15 AM", subject: "Short Break", icon: "☕", topic: "Refresh and Energize", type: "break" },
  { time: "11:15 AM – 12:15 PM", subject: "English", icon: "📖", topic: "Chapter 1: A Letter to God - Reading Comprehension", type: "class" },
  { time: "12:15 PM – 01:00 PM", subject: "Lunch Break", icon: "🍽️", topic: "Nutrition and Rest", type: "break" },
  { time: "01:00 PM – 02:00 PM", subject: "Social Studies", icon: "🌍", topic: "Chapter 1: Resources and Development", type: "class" },
  { time: "02:00 PM – 03:00 PM", subject: "Computer Science", icon: "💻", topic: "Chapter 1: Introduction to Programming", type: "class" },
  { time: "03:00 PM – 04:00 PM", subject: "Physical Education", icon: "🏃", topic: "Chapter 1: Health and Fitness", type: "class" },
];

const calendarDays = ["S", "M", "T", "W", "T", "F", "S"];

const StudentDashboard = () => {
  const { fullName } = useAuth();
  const firstName = fullName?.split(" ")[0] || "Student";
  const [completedItems, setCompletedItems] = useState<number[]>([]);

  const toggleComplete = (index: number) => {
    setCompletedItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const totalClasses = scheduleItems.filter((s) => s.type === "class").length;
  const completedClasses = completedItems.filter((i) => scheduleItems[i]?.type === "class").length;
  const progressPercent = totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0;

  return (
    <DashboardLayout role="student">
      <div className="flex flex-col gap-[30px] p-[30px] min-h-[calc(100vh-80px)]">
        {/* Teaching Calendar - Full Width */}
        <TeachingCalendar />

        {/* Main Content */}
        <section>
          <div className="bg-white/95 backdrop-blur-[10px] rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/20 h-full">
            <div className="mb-6 border-b-[3px] border-blue-500 pb-4">
              <h2 className="text-[28px] bg-gradient-to-r from-[#2c3e50] to-blue-500 bg-clip-text text-transparent mb-1 font-bold">
                📝 Today's Class Schedule
              </h2>
              <p className="text-gray-500 text-base italic">Click on each class as you complete them - Quiz unlocks at 100% completion!</p>
            </div>

            <div className="grid gap-5 grid-cols-[repeat(auto-fit,minmax(350px,1fr))] mb-8">
              {scheduleItems.map((item, i) => {
                const isCompleted = completedItems.includes(i);
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
                    <span className="text-[13px] font-semibold text-gray-500 mb-1 block">{item.time}</span>
                    <div className="text-lg font-bold text-[#2c3e50] mb-2">{item.icon} {item.subject}
                      {item.type === "break" && <span className="ml-2 text-xs font-normal text-gray-400 italic">Refresh and Energize</span>}
                    </div>
                    <span className="text-sm text-gray-400 italic py-1 px-2.5 bg-blue-500/10 rounded-full inline-block">{item.topic}</span>
                    <div className="flex gap-2 justify-center mt-3 pt-2 border-t border-blue-500/20" onClick={(e) => e.stopPropagation()}>
                      {item.type === "class" && (
                        <>
                          <span className="py-1.5 px-3.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border border-blue-300 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer">
                            📋 Overview
                          </span>
                          <span className="py-1.5 px-3.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 border border-purple-300 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer">
                            🔍 Deep Dive
                          </span>
                          <span className="py-1.5 px-3.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 border border-purple-300 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer">
                            Pop Quiz
                          </span>
                        </>
                      )}
                      {item.type === "break" && item.subject === "Short Break" && (
                        <span className="py-1.5 px-3.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 border border-purple-300 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer">
                          🔍 Break Tips
                        </span>
                      )}
                      {item.type === "break" && item.subject === "Lunch Break" && (
                        <span className="py-1.5 px-3.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 border border-purple-300 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer">
                          🔍 Nutrition Guide
                        </span>
                      )}
                    </div>
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

    </DashboardLayout>
  );
};

export default StudentDashboard;
