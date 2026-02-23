import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";

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
      <div className="flex min-h-[calc(100vh-80px)] gap-[30px] p-[30px]">
        {/* Sidebar */}
        <aside className="w-[350px] flex-shrink-0">
          {/* Calendar Card */}
          <div className="bg-[#1a1a1a]/90 text-white rounded-2xl p-5 mb-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-lg font-medium">Day 23</div>
                <div className="text-xs text-gray-500">0/2238 left</div>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-gray-500 hover:text-white transition-colors text-lg bg-transparent border-none cursor-pointer">‹</button>
                <div className="bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-yellow-400 rounded-xl py-2 px-3 flex items-center gap-2">
                  <span className="text-base text-yellow-400 font-bold">6</span>
                  <span className="text-[10px] text-gray-300">MIN</span>
                </div>
                <button className="text-gray-500 hover:text-white transition-colors text-lg bg-transparent border-none cursor-pointer">›</button>
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
                  const isToday = day === 24;
                  const isCompleted = day < 24 && day > 15;
                  const isMissed = day <= 15 && [8, 9, 10].includes(day);
                  return (
                    <button
                      key={i}
                      className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium cursor-pointer transition-all border-none relative
                        ${isToday ? "bg-emerald-500 text-white" : ""}
                        ${isCompleted ? "bg-gray-700 text-emerald-500" : ""}
                        ${isMissed ? "text-red-500" : ""}
                        ${!isToday && !isCompleted && !isMissed ? "bg-transparent text-white hover:bg-[#3a3a3a]" : ""}
                      `}
                    >
                      {day}
                      {isCompleted && <span className="absolute top-0.5 right-0.5 text-[10px] text-emerald-500">✓</span>}
                      {isMissed && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Weekly Premium */}
            <div className="bg-gradient-to-br from-amber-900 to-amber-700 rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-yellow-400 font-semibold flex items-center gap-2">ⓘ Weekly Premium</div>
                <div className="text-yellow-300 text-xs">4 days left</div>
              </div>
              <div className="flex justify-between items-center">
                {["W1", "W2", "W3", "W4", "W5"].map((d, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${i === 1 ? "bg-yellow-400 text-[#1a1a1a]" : "bg-yellow-400/20 text-yellow-400"}`}>
                    {d}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-500 rounded rotate-45" />
                <span className="text-emerald-500 text-sm">0 Redeem</span>
              </div>
              <span className="text-gray-500 text-sm cursor-pointer hover:text-white transition-colors">Rules</span>
            </div>
          </div>

          {/* Today's Info Card */}
          <div className="bg-white/95 backdrop-blur-[10px] p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/20 mb-5">
            <h3 className="mb-4 text-lg font-semibold border-b-[3px] border-blue-500 pb-2 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              📅 Today
            </h3>
            <div className="text-center text-lg font-semibold mb-4 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Monday, February 23, 2026
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 p-4 rounded-xl border-l-4 border-blue-500 font-medium animate-pulse mb-3">
              🔔 AI Quiz on June 10
            </div>
            <button disabled className="w-full bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 p-4 rounded-xl border-l-4 border-blue-500 font-medium opacity-50 cursor-not-allowed border-none text-left mb-3">
              🔒 Quiz Locked
            </button>
            <button className="w-full bg-gradient-to-r from-orange-50 to-pink-50 text-orange-700 p-4 rounded-xl border-l-4 border-orange-500 font-medium border-none text-left cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all">
              📝 Today's Draft
            </button>
          </div>

          {/* Quick Stats */}
          <div className="bg-white/95 backdrop-blur-[10px] p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/20">
            <h3 className="mb-4 text-lg font-semibold border-b-[3px] border-blue-500 pb-2 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              📊 Quick Stats
            </h3>
            {[
              { label: "Classes Today:", value: String(totalClasses) },
              { label: "Completed:", value: String(completedClasses) },
              { label: "Remaining:", value: String(totalClasses - completedClasses) },
              { label: "Quiz Score:", value: "--" },
            ].map((stat, i) => (
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

      {/* Footer */}
      <footer className="bg-[#1e293b] text-[#cbd5e1] py-12 px-[5%]">
        <div className="max-w-[1200px] mx-auto grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-8">
          <div>
            <h3 className="text-white mb-4 text-xl">EduTech</h3>
            <p className="text-[#94a3b8] leading-relaxed">Revolutionary AI-powered educational platform offering personalized learning experiences with 1:2 mentoring and adaptive teaching methods. Empowering students globally with cutting-edge technology and expert guidance.</p>
          </div>
          <div>
            <h3 className="text-white mb-4 text-xl">Our Services</h3>
            <div className="flex flex-col gap-2">
              {["Personal Mentoring", "AI Adaptive Learning", "Progress Analytics", "Skill Development", "Mobile Learning"].map((s) => (
                <span key={s} className="text-[#94a3b8] hover:text-blue-400 cursor-pointer transition-colors">{s}</span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-white mb-4 text-xl">Quick Links</h3>
            <div className="flex flex-col gap-2">
              {["About Us", "Services", "Success Stories", "Contact", "Terms of Service", "Privacy Policy"].map((s) => (
                <span key={s} className="text-[#94a3b8] hover:text-blue-400 cursor-pointer transition-colors">{s}</span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-white mb-4 text-xl">Contact Us</h3>
            <p className="text-[#94a3b8] leading-relaxed">Global Headquarters<br />New Delhi, India<br />Mumbai • Bangalore • Hyderabad</p>
            <p className="text-[#94a3b8] mt-2">+91 98765 43210<br />+91 87654 32109</p>
            <p className="text-[#94a3b8] mt-2">support@edutech.com</p>
          </div>
        </div>
        <div className="border-t border-[#334155] mt-8 pt-6 text-center text-[#64748b]">
          © 2025 EduTech Platform. All rights reserved. | Revolutionizing Education Through AI
        </div>
      </footer>
    </DashboardLayout>
  );
};

export default StudentDashboard;
