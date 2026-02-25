import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";

const students = [
  { name: "Arjun Reddy", initials: "AR", note: "Excellent progress in algebra", score: 95, perf: "excellent" as const, gradient: "from-emerald-500 to-emerald-600" },
  { name: "Priya Sharma", initials: "PS", note: "Needs support with geometry", score: 67, perf: "needs-support" as const, gradient: "from-orange-400 to-red-500" },
  { name: "Rahul Kumar", initials: "RK", note: "Good improvement shown", score: 82, perf: "good" as const, gradient: "from-blue-500 to-blue-600" },
];

const toolActions: Record<string, string> = {
  "Grade Assignments": "/teacher/assignments",
  "Take Attendance": "/teacher/attendance",
  "Performance Report": "/teacher/performance",
  "Quiz": "/teacher/quiz",
};

const tools = [
  { icon: "📋", label: "Take Attendance" },
  { icon: "📝", label: "Grade Assignments" },
  { icon: "📊", label: "Performance Report" },
  { icon: "🧩", label: "Quiz" },
];

const announcements = [
  { title: "🎓 Mid-Term Exam Schedule Released", desc: "The mid-term examination schedule for all grades has been published. Mathematics exams are scheduled for July 15-18." },
  { title: "📚 New Digital Learning Resources Available", desc: "Interactive mathematics modules and virtual lab simulations are now available on the school portal." },
  { title: "🏆 National Mathematics Olympiad Registration", desc: "Registration is now open for talented students. Deadline: July 30th." },
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
          {/* Student Spotlight */}
          <div className="glass-card p-8" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-[50px] h-[50px] rounded-xl flex items-center justify-center text-2xl text-white bg-gradient-to-br from-emerald-500 to-emerald-600">👥</div>
              <h2 className="text-2xl font-semibold text-foreground">Student Spotlight</h2>
            </div>
            {students.map((s, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl mb-4 transition-all hover:bg-accent/30">
                <div className={`w-[50px] h-[50px] rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br ${s.gradient}`}>
                  {s.initials}
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 text-foreground">{s.name}</h4>
                  <p className="text-muted-foreground text-sm">{s.note}</p>
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
              <h2 className="text-2xl font-semibold text-foreground">Quick Teaching Tools</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {tools.map((tool, i) => (
                <button key={i} onClick={() => toolActions[tool.label] && navigate(toolActions[tool.label])} className="flex flex-col items-center p-6 rounded-xl bg-accent/30 transition-all cursor-pointer hover:bg-accent/50 hover:-translate-y-0.5 border-none text-inherit">
                  <div className="text-[2rem] mb-2">{tool.icon}</div>
                  <span className="text-sm font-medium text-foreground">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Announcements */}
          <div className="glass-card p-8" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-[50px] h-[50px] rounded-xl flex items-center justify-center text-2xl text-white bg-gradient-to-br from-blue-500 to-blue-600">📢</div>
              <h2 className="text-2xl font-semibold text-foreground">School Updates & Announcements</h2>
            </div>
            {announcements.map((a, i) => (
              <div key={i} className="p-4 border-l-4 border-primary bg-accent/20 rounded-lg mb-4">
                <h4 className="text-foreground mb-2">{a.title}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>

          {/* Teaching Achievements */}
          <div className="glass-card p-8" style={{ animationDelay: "0.5s" }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-[50px] h-[50px] rounded-xl flex items-center justify-center text-2xl text-white bg-gradient-to-br from-yellow-400 to-orange-400">🏆</div>
              <h2 className="text-2xl font-semibold text-foreground">Teaching Achievements</h2>
            </div>
            <div className="bg-gradient-to-br from-pink-400 to-yellow-300 rounded-2xl p-6 text-center text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-xl font-bold mb-2">🏆 100% Assignment Completion</div>
                <div>✨ Award Winner</div>
                <div className="text-sm opacity-90 mt-2">Your innovative teaching methods have increased class participation by 40% this semester. Keep inspiring!</div>
              </div>
            </div>
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
