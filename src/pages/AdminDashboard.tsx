import PageLayout from "@/components/PageLayout";
import MetricCard from "@/components/MetricCard";
import { GraduationCap, Users, BookOpen, TrendingUp, BarChart3, Clock } from "lucide-react";

const classData = [
  { class: "Class 9-A", teacher: "Mrs. Kapoor", students: 32, mastery: 76, engagement: 84, completion: 71 },
  { class: "Class 9-B", teacher: "Mr. Verma", students: 30, mastery: 69, engagement: 72, completion: 64 },
  { class: "Class 10-A", teacher: "Mrs. Sharma", students: 35, mastery: 81, engagement: 88, completion: 78 },
  { class: "Class 10-B", teacher: "Mr. Iyer", students: 28, mastery: 73, engagement: 79, completion: 68 },
  { class: "Class 8-A", teacher: "Mrs. Das", students: 34, mastery: 65, engagement: 70, completion: 58 },
];

const chapterAdoption = [
  { chapter: "Number Systems", adoption: 92, avgScore: 78 },
  { chapter: "Polynomials", adoption: 74, avgScore: 71 },
  { chapter: "Coordinate Geometry", adoption: 45, avgScore: 68 },
  { chapter: "Linear Equations", adoption: 32, avgScore: 0 },
];

const AdminDashboard = () => (
  <PageLayout role="admin">
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-serif text-foreground">School Analytics</h1>
        <p className="text-muted-foreground mt-1">Delhi Public School — Academic Year 2025–26</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard title="Total Students" value="159" subtitle="Across 5 classes" icon={Users} />
        <MetricCard title="Active Engagement" value="79%" icon={TrendingUp} trend={{ value: 7, positive: true }} />
        <MetricCard title="Avg. Mastery" value="73%" icon={GraduationCap} trend={{ value: 4, positive: true }} />
        <MetricCard title="Avg. Session Time" value="22 min" subtitle="Per student/week" icon={Clock} />
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
          <h2 className="text-lg font-semibold font-serif text-foreground mb-4">Class Performance</h2>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Class</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Teacher</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Students</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Mastery</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Engagement</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Completion</th>
                </tr>
              </thead>
              <tbody>
                {classData.map((c, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium text-card-foreground">{c.class}</td>
                    <td className="p-3 text-muted-foreground">{c.teacher}</td>
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

        <div>
          <h2 className="text-lg font-semibold font-serif text-foreground mb-4">Chapter Adoption</h2>
          <div className="space-y-3">
            {chapterAdoption.map((ch, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-medium text-card-foreground">{ch.chapter}</p>
                  <span className="text-xs font-medium text-muted-foreground">{ch.adoption}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${ch.adoption}%` }} />
                </div>
                {ch.avgScore > 0 && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" /> Avg. Score: {ch.avgScore}%
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold font-serif text-foreground mb-4">Pilot KPIs</h2>
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Test Score Improvement</span>
                <span className="text-sm font-semibold text-success">+18%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Retention Increase</span>
                <span className="text-sm font-semibold text-success">+26%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cramming Reduction</span>
                <span className="text-sm font-semibold text-success">-42%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Explanation Ability</span>
                <span className="text-sm font-semibold text-success">+31%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
);

export default AdminDashboard;
