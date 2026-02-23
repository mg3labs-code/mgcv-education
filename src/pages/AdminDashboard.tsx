import DashboardLayout from "@/components/DashboardLayout";

const classData = [
  { class: "Class 9-A", teacher: "Mrs. Kapoor", students: 32, mastery: 76, engagement: 84, completion: 71 },
  { class: "Class 9-B", teacher: "Mr. Verma", students: 30, mastery: 69, engagement: 72, completion: 64 },
  { class: "Class 10-A", teacher: "Mrs. Sharma", students: 35, mastery: 81, engagement: 88, completion: 78 },
  { class: "Class 10-B", teacher: "Mr. Iyer", students: 28, mastery: 73, engagement: 79, completion: 68 },
  { class: "Class 8-A", teacher: "Mrs. Das", students: 34, mastery: 65, engagement: 70, completion: 58 },
];

const AdminDashboard = () => (
  <DashboardLayout role="admin">
    <main className="p-8 max-w-[1400px] mx-auto">
      <div className="bg-white/10 backdrop-blur-[10px] rounded-[20px] p-8 mb-8 text-white text-center shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
        <h1 className="text-[2.5rem] mb-2">School Analytics</h1>
        <p className="text-lg opacity-90 mb-6">Delhi Public School — Academic Year 2025–26</p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
          {[
            { value: "159", label: "Total Students" },
            { value: "79%", label: "Active Engagement" },
            { value: "73%", label: "Avg. Mastery" },
            { value: "22 min", label: "Avg. Session Time" },
          ].map((s, i) => (
            <div key={i} className="bg-white/20 rounded-2xl p-6 text-center backdrop-blur-[10px]">
              <div className="text-[2.5rem] font-bold mb-2">{s.value}</div>
              <div className="text-base opacity-90">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-8 mb-8">
        <h2 className="text-2xl font-semibold text-[#2d3748] mb-6">Class Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="text-left p-3 font-semibold text-gray-600">Class</th>
                <th className="text-left p-3 font-semibold text-gray-600">Teacher</th>
                <th className="text-center p-3 font-semibold text-gray-600">Students</th>
                <th className="text-center p-3 font-semibold text-gray-600">Mastery</th>
                <th className="text-center p-3 font-semibold text-gray-600">Engagement</th>
                <th className="text-center p-3 font-semibold text-gray-600">Completion</th>
              </tr>
            </thead>
            <tbody>
              {classData.map((c, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                  <td className="p-3 font-medium text-[#2d3748]">{c.class}</td>
                  <td className="p-3 text-gray-500">{c.teacher}</td>
                  <td className="p-3 text-center">{c.students}</td>
                  <td className="p-3 text-center">{c.mastery}%</td>
                  <td className="p-3 text-center">{c.engagement}%</td>
                  <td className="p-3 text-center">{c.completion}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card p-8">
        <h2 className="text-2xl font-semibold text-[#2d3748] mb-6">Pilot KPIs</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Test Score Improvement", value: "+18%" },
            { label: "Retention Increase", value: "+26%" },
            { label: "Cramming Reduction", value: "-42%" },
            { label: "Explanation Ability", value: "+31%" },
          ].map((kpi, i) => (
            <div key={i} className="flex justify-between items-center p-4 bg-[#f8f9ff] rounded-xl">
              <span className="text-gray-500">{kpi.label}</span>
              <span className="font-bold text-emerald-600 text-lg">{kpi.value}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  </DashboardLayout>
);

export default AdminDashboard;
