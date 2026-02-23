import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";

const scheduleItems = [
  { time: "10:00 - 10:35", subject: "Mathematics", topic: "Polynomials - Factor Theorem", color: "#3498db" },
  { time: "10:40 - 11:15", subject: "Science", topic: "Atoms & Molecules", color: "#2ecc71" },
  { time: "11:20 - 11:55", subject: "English", topic: "Poetry Analysis", color: "#e74c3c" },
  { time: "12:00 - 12:35", subject: "Social Science", topic: "French Revolution", color: "#f39c12" },
  { time: "1:30 - 2:05", subject: "Hindi", topic: "Premchand Stories", color: "#9b59b6" },
  { time: "2:10 - 2:45", subject: "Computer Science", topic: "Python Basics", color: "#1abc9c" },
];

const stats = [
  { label: "Episodes Done", value: "13/42" },
  { label: "Avg. Accuracy", value: "84%" },
  { label: "Study Streak", value: "7 days" },
  { label: "Retention Score", value: "78%" },
];

const calendarDays = ["S", "M", "T", "W", "T", "F", "S"];

const StudentDashboard = () => {
  const { fullName } = useAuth();
  const firstName = fullName?.split(" ")[0] || "Student";

  return (
    <DashboardLayout role="student">
      {/* Top Navbar with nav items handled by DashboardLayout */}

      <div className="flex min-h-[calc(100vh-80px)] gap-[30px] p-[30px]">
        {/* Sidebar */}
        <aside className="w-[350px] flex-shrink-0">
          {/* Calendar Card */}
          <div className="bg-[#1a1a1a]/90 text-white rounded-2xl p-5 mb-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-lg font-medium">Today</div>
                <div className="text-xs text-gray-500">Class 9 · CBSE</div>
              </div>
              <div className="bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-yellow-400 rounded-xl py-2 px-3 flex items-center gap-2">
                <span className="text-base text-yellow-400 font-bold">7</span>
                <span className="text-[10px] text-gray-300">Day<br />Streak</span>
              </div>
            </div>

            {/* Mini Calendar */}
            <div className="mb-5">
              <div className="text-sm text-gray-500 mb-2 text-center">February 2026</div>
              <div className="grid grid-cols-7 gap-1 mb-3">
                {calendarDays.map((d, i) => (
                  <div key={i} className="text-center text-xs text-gray-500 py-2 font-medium">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {[...Array(28)].map((_, i) => {
                  const day = i + 1;
                  const isToday = day === 23;
                  const isCompleted = day < 23 && day > 15;
                  return (
                    <button
                      key={i}
                      className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium cursor-pointer transition-all border-none relative
                        ${isToday ? "bg-emerald-500 text-white" : ""}
                        ${isCompleted ? "bg-gray-700 text-emerald-500" : ""}
                        ${!isToday && !isCompleted ? "bg-transparent text-white hover:bg-[#3a3a3a]" : ""}
                      `}
                    >
                      {day}
                      {isCompleted && <span className="absolute top-0.5 right-0.5 text-[10px] text-emerald-500">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Premium Section */}
            <div className="bg-gradient-to-br from-amber-900 to-amber-700 rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-yellow-400 font-semibold flex items-center gap-2">🔥 Weekly Goal</div>
                <div className="text-yellow-300 text-xs">5/7 days</div>
              </div>
              <div className="flex justify-between items-center">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                      ${i < 5 ? "bg-yellow-400 text-[#1a1a1a]" : "bg-yellow-400/20 text-yellow-400"}
                    `}
                  >
                    {d}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white/95 backdrop-blur-[10px] p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/20">
            <h3 className="mb-4 text-[#2c3e50] text-lg font-semibold border-b-[3px] border-blue-500 pb-2 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Quick Stats
            </h3>
            {stats.map((stat, i) => (
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
                Today's Schedule
              </h2>
              <p className="text-gray-500 text-base italic">Good morning, {firstName}! Here's your learning plan for today.</p>
            </div>

            <div className="grid gap-5 grid-cols-[repeat(auto-fit,minmax(400px,1fr))] mb-8">
              {scheduleItems.map((item, i) => (
                <button
                  key={i}
                  className="bg-gradient-to-br from-white to-gray-50 text-[#333] p-6 rounded-2xl cursor-pointer transition-all border-2 border-blue-500/20 text-left relative overflow-hidden hover:border-blue-500 hover:shadow-[0_8px_25px_rgba(52,152,219,0.25)] hover:-translate-y-1 hover:scale-[1.02] group"
                >
                  <span className="text-[13px] font-semibold text-gray-500 mb-1 block">{item.time}</span>
                  <div className="text-lg font-bold text-[#2c3e50] mb-2">{item.subject}</div>
                  <span className="text-sm text-gray-400 italic mt-1 py-1 px-2.5 bg-blue-500/10 rounded-full inline-block">{item.topic}</span>
                  <div className="flex gap-2 justify-center mt-3 pt-2 border-t border-blue-500/20">
                    <span className="py-1.5 px-3.5 border-none rounded-full cursor-pointer text-[11px] font-semibold transition-all uppercase tracking-wide bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border border-blue-500 hover:-translate-y-0.5 hover:shadow-md">
                      Overview
                    </span>
                    <span className="py-1.5 px-3.5 border-none rounded-full cursor-pointer text-[11px] font-semibold transition-all uppercase tracking-wide bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 border border-purple-500 hover:-translate-y-0.5 hover:shadow-md">
                      Detail
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Completion Section */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border border-blue-500/20 shadow-inner">
              <h3 className="text-[#2c3e50] text-xl mb-4 text-center font-semibold">Today's Progress</h3>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden my-4 shadow-inner">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all" style={{ width: "33%" }} />
              </div>
              <p className="text-center text-gray-500 text-base font-semibold">2 of 6 classes completed (33%)</p>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
