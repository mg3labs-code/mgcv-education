import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AssignmentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const assignments = [
  {
    subject: "Mathematics", icon: "📐", color: "#e74c3c",
    due: "June 15, 2025", status: "PENDING", priority: "HIGH",
    chapter: "Real Numbers",
    tasks: [
      "Exercise 1.1: Q1-10 (Rational number identification)",
      "Exercise 1.2: Q1-8 (Decimal expansions)",
      "Practice Set: Convert fractions to decimals",
      "Word Problems: Real life applications of rational numbers",
    ],
  },
  {
    subject: "Science", icon: "🔬", color: "#e67e22",
    due: "June 16, 2025", status: "PENDING", priority: "HIGH",
    chapter: "Light - Reflection and Refraction",
    tasks: [
      "Exercise 10.1: Q1-12 (Laws of reflection)",
      "Exercise 10.2: Q1-10 (Refraction problems)",
      "Practical: Draw ray diagrams for plane mirrors",
      "Assignment: Real life examples of reflection and refraction",
    ],
  },
  {
    subject: "English", icon: "📖", color: "#2ecc71",
    due: "June 17, 2025", status: "IN PROGRESS", priority: "MEDIUM",
    chapter: "A Letter to God",
    tasks: [
      "Read and summarize the story in 150 words",
      "Character analysis of Lencho (200 words)",
      "Answer questions 1-8 from textbook",
      "Creative writing: Write a letter to someone you trust",
    ],
  },
  {
    subject: "Social Studies", icon: "🌍", color: "#f39c12",
    due: "June 18, 2025", status: "PENDING", priority: "MEDIUM",
    chapter: "Resources and Development",
    tasks: [
      "Map work: Identify major mineral resources in India",
      "Project: Renewable vs Non-renewable resources comparison",
      "Exercise 1.1: Q1-15 (Resource classification)",
      "Case study: Water conservation methods",
    ],
  },
  {
    subject: "Computer Science", icon: "💻", color: "#3498db",
    due: "June 20, 2025", status: "COMPLETED", priority: "LOW",
    chapter: "Introduction to Programming",
    tasks: [
      "Install Python IDE and create first program",
      "Write algorithms for 5 basic problems",
      "Practice: Variables and data types exercises",
      "Mini project: Simple calculator program",
    ],
  },
  {
    subject: "Physical Education", icon: "🏃", color: "#9b59b6",
    due: "June 19, 2025", status: "IN PROGRESS", priority: "LOW",
    chapter: "Health and Fitness",
    tasks: [
      "Maintain fitness diary for one week",
      "Design a 30-minute workout routine",
      "Research: Benefits of cardiovascular exercises",
      "Practical: Demonstrate 10 flexibility exercises",
    ],
  },
];

const tests = [
  { title: "Mathematics – Unit Test", date: "June 22, 2025", topics: "Real Numbers, Polynomials (Introduction)" },
  { title: "Science – Practical Exam", date: "June 24, 2025", topics: "Light experiments, Ray diagrams" },
  { title: "English – Reading Comprehension Test", date: "June 25, 2025", topics: "A Letter to God, Grammar exercises" },
];

const statusColor: Record<string, string> = {
  COMPLETED: "#27ae60",
  "IN PROGRESS": "#f39c12",
  PENDING: "#e74c3c",
};

const priorityColor: Record<string, string> = {
  HIGH: "#e74c3c",
  MEDIUM: "#f39c12",
  LOW: "#95a5a6",
};

const AssignmentsModal = ({ open, onOpenChange }: AssignmentsModalProps) => {
  const completed = assignments.filter(a => a.status === "COMPLETED").length;
  const inProgress = assignments.filter(a => a.status === "IN PROGRESS").length;
  const pending = assignments.filter(a => a.status === "PENDING").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center border-b-[3px] border-blue-500 pb-5">
          <DialogTitle className="text-[28px] text-[#2c3e50]">📚 WEEKLY ASSIGNMENTS & HOMEWORK</DialogTitle>
          <div className="flex justify-center gap-8 mt-4">
            {[
              { n: completed, label: "COMPLETED" },
              { n: inProgress, label: "IN PROGRESS" },
              { n: pending, label: "PENDING" },
            ].map((s) => (
              <div key={s.label} className="text-center px-5 py-2.5 bg-blue-500/10 rounded-xl">
                <span className="block text-2xl font-bold text-blue-500">{s.n}</span>
                <span className="text-xs text-gray-500 font-semibold uppercase">{s.label}</span>
              </div>
            ))}
          </div>
        </DialogHeader>

        <h3 className="text-lg font-semibold text-[#2c3e50] mt-4 mb-3">📝 Current Assignments</h3>
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          {assignments.map((a, i) => (
            <div key={i} className="rounded-xl p-5 border-t-4 transition-all hover:-translate-y-1 hover:shadow-lg"
              style={{ borderTopColor: a.color, background: `linear-gradient(135deg, ${a.color}10, ${a.color}05)` }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{a.icon}</span>
                <h4 className="font-bold text-[#2c3e50]">{a.subject}</h4>
              </div>
              <div className="flex items-center gap-2 mb-2 text-xs">
                <span className="text-gray-500">📅 Due: {a.due}</span>
                <span className="px-2 py-0.5 rounded-full text-white font-bold" style={{ background: statusColor[a.status] }}>{a.status}</span>
                <span className="px-2 py-0.5 rounded-full text-white font-bold" style={{ background: priorityColor[a.priority] }}>{a.priority}</span>
              </div>
              <p className="text-sm font-semibold text-[#2c3e50] mb-2">📖 Chapter: {a.chapter}</p>
              <ul className="mb-3">
                {a.tasks.map((t, j) => (
                  <li key={j} className="text-[13px] text-gray-600 py-1.5 border-b border-black/5 pl-5 relative before:content-['📌'] before:absolute before:left-0 before:top-1.5">{t}</li>
                ))}
              </ul>
              <div className="flex gap-2">
                <button className="flex-1 py-2 px-4 rounded-full text-[11px] font-semibold uppercase text-white bg-gradient-to-r from-emerald-500 to-emerald-400 hover:-translate-y-0.5 hover:shadow-md transition-all">
                  ✅ Mark Complete
                </button>
                <button className="flex-1 py-2 px-4 rounded-full text-[11px] font-semibold uppercase text-white bg-gradient-to-r from-blue-500 to-blue-400 hover:-translate-y-0.5 hover:shadow-md transition-all">
                  📋 View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        <h3 className="text-lg font-semibold text-[#2c3e50] mt-6 mb-3">📅 Upcoming Tests & Exams</h3>
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
          {tests.map((t, i) => (
            <div key={i} className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white p-5 rounded-xl shadow-lg hover:-translate-y-1 transition-all">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">{t.title}</h4>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-lg">📅 {t.date}</span>
              </div>
              <p className="text-sm opacity-90">Topics: {t.topics}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentsModal;
