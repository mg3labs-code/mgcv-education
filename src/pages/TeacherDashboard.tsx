import PageLayout from "@/components/PageLayout";
import MetricCard from "@/components/MetricCard";
import SkillBar from "@/components/SkillBar";
import { Users, Target, Clock, TrendingUp, AlertTriangle } from "lucide-react";

const students = [
  { name: "Arjun Sharma", mastery: 85, accuracy: 88, episodes: 13, retention: 82, risk: false },
  { name: "Priya Patel", mastery: 92, accuracy: 94, episodes: 15, retention: 90, risk: false },
  { name: "Rahul Gupta", mastery: 54, accuracy: 61, episodes: 8, retention: 45, risk: true },
  { name: "Ananya Singh", mastery: 78, accuracy: 82, episodes: 12, retention: 75, risk: false },
  { name: "Vikram Mehta", mastery: 48, accuracy: 55, episodes: 6, retention: 38, risk: true },
  { name: "Sneha Reddy", mastery: 88, accuracy: 91, episodes: 14, retention: 85, risk: false },
];

const weakConcepts = [
  { concept: "Polynomial Factorization", avgScore: 42, students: 12 },
  { concept: "Irrational Numbers on Number Line", avgScore: 51, students: 9 },
  { concept: "Remainder Theorem", avgScore: 58, students: 7 },
];

const TeacherDashboard = () => (
  <PageLayout role="teacher">
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-serif text-foreground">Class Dashboard</h1>
        <p className="text-muted-foreground mt-1">Class 9-A · Mathematics · 32 Students</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard title="Class Accuracy" value="76%" icon={Target} trend={{ value: 4, positive: true }} />
        <MetricCard title="Concept Mastery" value="71%" icon={TrendingUp} trend={{ value: 6, positive: true }} />
        <MetricCard title="Avg. Time/Module" value="6.2 min" icon={Clock} />
        <MetricCard title="Revision Compliance" value="64%" subtitle="21 of 32 on track" icon={Users} trend={{ value: -3, positive: false }} />
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
          <h2 className="text-lg font-semibold font-serif text-foreground mb-4">Student Performance</h2>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Student</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Mastery</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Accuracy</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Episodes</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Retention</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium text-card-foreground">{s.name}</td>
                    <td className="p-3 text-center">{s.mastery}%</td>
                    <td className="p-3 text-center">{s.accuracy}%</td>
                    <td className="p-3 text-center">{s.episodes}/42</td>
                    <td className="p-3 text-center">{s.retention}%</td>
                    <td className="p-3 text-center">
                      {s.risk ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                          <AlertTriangle className="h-3 w-3" /> At Risk
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-success">On Track</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold font-serif text-foreground mb-4">Weakest Concepts</h2>
            <div className="space-y-3">
              {weakConcepts.map((c, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm font-medium text-card-foreground mb-1">{c.concept}</p>
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>Avg Score: {c.avgScore}%</span>
                    <span>{c.students} students struggling</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-destructive/70" style={{ width: `${c.avgScore}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold font-serif text-foreground mb-4">Class Skill Averages</h2>
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <SkillBar label="Critical Thinking" value={68} colorClass="bg-metric-critical-thinking" />
              <SkillBar label="Conceptual Clarity" value={74} colorClass="bg-metric-conceptual-clarity" />
              <SkillBar label="Retention" value={61} colorClass="bg-metric-retention" />
              <SkillBar label="Pattern Recognition" value={72} colorClass="bg-metric-pattern" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
);

export default TeacherDashboard;
