import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";

const scheduleItems = [
  { time: "9:00 AM", class: "10th CBSE Mathematics", room: "Room 302", topic: "Real Numbers Introduction", status: "completed" as const, color: "#4299e1" },
  { time: "11:00 AM", class: "9th CBSE Mathematics", room: "Room 205", topic: "Number Systems", status: "upcoming" as const, color: "#48bb78" },
  { time: "12:00 PM", class: "8th CBSE Mathematics", room: "Room 101", topic: "Rational Numbers", status: "upcoming" as const, color: "#ed64a6" },
];

const students = [
  { name: "Arjun Reddy", initials: "AR", note: "Excellent progress in algebra", score: 95, perf: "excellent" as const, gradient: "from-emerald-500 to-emerald-600" },
  { name: "Priya Sharma", initials: "PS", note: "Needs support with geometry", score: 67, perf: "needs-support" as const, gradient: "from-orange-400 to-red-500" },
  { name: "Rahul Kumar", initials: "RK", note: "Good improvement shown", score: 82, perf: "good" as const, gradient: "from-blue-500 to-blue-600" },
];

const toolActions: Record<string, string> = {
  "Grade Assignments": "/teacher/assignments",
};

const tools = [
  { icon: "📋", label: "Take Attendance" },
  { icon: "📝", label: "Grade Assignments" },
  { icon: "❓", label: "Create Quiz" },
  { icon: "📤", label: "Share Resources" },
];

const announcements = [
  { title: "🎓 Mid-Term Exam Schedule Released", desc: "The mid-term examination schedule for all grades has been published. Mathematics exams are scheduled for July 15-18." },
  { title: "📚 New Digital Learning Resources Available", desc: "Interactive mathematics modules and virtual lab simulations are now available on the school portal." },
  { title: "🏆 National Mathematics Olympiad Registration", desc: "Registration is now open for talented students. Deadline: July 30th." },
];

const tasks = [
  { icon: "📝", label: "Grade 10th Math Quiz", desc: "23 submissions waiting", due: "Due Today", dueClass: "bg-red-100 text-red-800", gradient: "from-pink-500 to-pink-600" },
  { icon: "🧪", label: "Prepare Lab Materials", desc: "For tomorrow's experiment", due: "Tomorrow", dueClass: "bg-blue-100 text-blue-700", gradient: "from-emerald-500 to-emerald-600" },
  { icon: "📞", label: "Parent Conference Call", desc: "Discuss student progress", due: "3:30 PM", dueClass: "bg-green-100 text-green-800", gradient: "from-indigo-500 to-purple-500" },
];

const perfBadgeClass = {
  "excellent": "bg-green-100 text-green-800",
  "needs-support": "bg-red-100 text-red-800",
  "good": "bg-blue-100 text-blue-700",
};

const TeacherDashboard = () => {
  const { fullName } = useAuth();
  const navigate = useNavigate();
  const firstName = fullName?.split(" ")[0] || "Teacher";

  return (
    <DashboardLayout role="teacher">
      <main className="p-8 max-w-[1400px] mx-auto">
        {/* Welcome Header */}
        <div className="bg-white/10 backdrop-blur-[10px] rounded-[20px] p-8 mb-8 text-white text-center shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
          <h1 className="text-[2.5rem] mb-2 text-shadow-lg">Good Morning, {firstName}!</h1>
          <p className="text-lg opacity-90 mb-4">Ready to inspire 127 students today? Your dedicated teaching is shaping the future!</p>
          <div className="flex items-center justify-center gap-2.5 text-lg mb-6">
            <span>🔥 15 consecutive days of excellence!</span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 mt-6">
            {[
              { value: "127", label: "Active Students" },
              { value: "6", label: "Classes Today" },
              { value: "23", label: "Assignments to Review" },
              { value: "94%", label: "Class Average" },
            ].map((stat, i) => (
              <div key={i} className="bg-white/20 rounded-2xl p-6 text-center backdrop-blur-[10px]">
                <div className="text-[2.5rem] font-bold mb-2">{stat.value}</div>
                <div className="text-base opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-8 mb-8">
          {/* Teaching Schedule */}
          <div className="glass-card p-8" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-[50px] h-[50px] rounded-xl flex items-center justify-center text-2xl text-white bg-gradient-to-br from-indigo-500 to-purple-500">📚</div>
              <h2 className="text-2xl font-semibold text-[#2d3748]">Today's Teaching Schedule</h2>
            </div>
            {scheduleItems.map((item, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl mb-4 transition-all border-l-4 border-transparent hover:bg-[#f8f9ff] hover:translate-x-1" style={{ borderLeftColor: item.color }}>
                <div className="font-bold text-blue-500 min-w-[80px]">{item.time}</div>
                <div>
                  <h4 className="mb-1 text-[#2d3748]">{item.class}</h4>
                  <p className="text-gray-500 text-sm">{item.room} • {item.topic}</p>
                  <span className={`py-1 px-3 rounded-full text-xs font-medium mt-2 inline-block ${item.status === "completed" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-700"}`}>
                    {item.status === "completed" ? "Completed" : "Upcoming"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Student Spotlight */}
          <div className="glass-card p-8" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-[50px] h-[50px] rounded-xl flex items-center justify-center text-2xl text-white bg-gradient-to-br from-emerald-500 to-emerald-600">👥</div>
              <h2 className="text-2xl font-semibold text-[#2d3748]">Student Spotlight</h2>
            </div>
            {students.map((s, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl mb-4 transition-all hover:bg-[#f8f9ff]">
                <div className={`w-[50px] h-[50px] rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br ${s.gradient}`}>
                  {s.initials}
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 text-[#2d3748]">{s.name}</h4>
                  <p className="text-gray-500 text-sm">{s.note}</p>
                </div>
                <span className={`py-1 px-3 rounded-full text-xs font-semibold ml-auto ${perfBadgeClass[s.perf]}`}>
                  {s.score}%
                </span>
              </div>
            ))}
          </div>

          {/* Quick Teaching Tools */}
          <div className="glass-card p-8" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-[50px] h-[50px] rounded-xl flex items-center justify-center text-2xl text-white bg-gradient-to-br from-yellow-400 to-orange-400">⚡</div>
              <h2 className="text-2xl font-semibold text-[#2d3748]">Quick Teaching Tools</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {tools.map((tool, i) => (
                <button key={i} onClick={() => toolActions[tool.label] && navigate(toolActions[tool.label])} className="flex flex-col items-center p-6 rounded-xl bg-[#f8f9ff] transition-all cursor-pointer hover:bg-blue-50 hover:-translate-y-0.5 border-none text-inherit">
                  <div className="text-[2rem] mb-2">{tool.icon}</div>
                  <span className="text-sm font-medium text-[#2d3748]">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Announcements */}
          <div className="glass-card p-8" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-[50px] h-[50px] rounded-xl flex items-center justify-center text-2xl text-white bg-gradient-to-br from-blue-500 to-blue-600">📢</div>
              <h2 className="text-2xl font-semibold text-[#2d3748]">School Updates & Announcements</h2>
            </div>
            {announcements.map((a, i) => (
              <div key={i} className="p-4 border-l-4 border-blue-500 bg-[#f8f9ff] rounded-lg mb-4">
                <h4 className="text-[#2d3748] mb-2">{a.title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>

          {/* Teaching Achievements */}
          <div className="glass-card p-8" style={{ animationDelay: "0.5s" }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-[50px] h-[50px] rounded-xl flex items-center justify-center text-2xl text-white bg-gradient-to-br from-yellow-400 to-orange-400">🏆</div>
              <h2 className="text-2xl font-semibold text-[#2d3748]">Teaching Achievements</h2>
            </div>
            <div className="bg-gradient-to-br from-pink-400 to-yellow-300 rounded-2xl p-6 text-center text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-xl font-bold mb-2">🏆 100% Assignment Completion</div>
                <div>✨ Award Winner</div>
                <div className="text-sm opacity-90 mt-2">Your innovative teaching methods have increased class participation by 40% this semester. Keep inspiring!</div>
              </div>
            </div>
          </div>

          {/* Priority Tasks */}
          <div className="glass-card p-8" style={{ animationDelay: "0.6s" }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-[50px] h-[50px] rounded-xl flex items-center justify-center text-2xl text-white bg-gradient-to-br from-emerald-500 to-emerald-600">✅</div>
              <h2 className="text-2xl font-semibold text-[#2d3748]">Today's Priority Tasks</h2>
            </div>
            {tasks.map((task, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl mb-4 bg-[#f8f9ff] transition-all hover:bg-blue-50">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-white text-xl bg-gradient-to-br ${task.gradient}`}>
                    {task.icon}
                  </div>
                  <div>
                    <h4 className="mb-1 text-[#2d3748]">{task.label}</h4>
                    <p className="text-gray-500 text-sm">{task.desc}</p>
                  </div>
                </div>
                <span className={`py-1 px-3 rounded-full text-xs font-medium ${task.dueClass}`}>{task.due}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-[#0f1419]/95 text-white py-8 mt-12 rounded-[20px]">
          <div className="max-w-[1400px] mx-auto px-8 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-8">
            <div>
              <h4 className="mb-4 text-blue-400">EduTech</h4>
              <p className="text-gray-400 leading-relaxed">Empowering education through innovative technology solutions.</p>
            </div>
            <div>
              <h4 className="mb-4 text-blue-400">Quick Links</h4>
              <p className="text-gray-400 leading-relaxed">Dashboard • Schedule • Metrics • Settings</p>
            </div>
            <div>
              <h4 className="mb-4 text-blue-400">Support</h4>
              <p className="text-gray-400 leading-relaxed">mg3labs@gmail.com</p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-4 text-center text-gray-500">
            © 2025 EduTech. All rights reserved.
          </div>
        </footer>
      </main>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
