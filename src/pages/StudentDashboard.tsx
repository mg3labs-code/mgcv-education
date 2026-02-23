import PageLayout from "@/components/PageLayout";
import MetricCard from "@/components/MetricCard";
import SkillBar from "@/components/SkillBar";
import EpisodeCard from "@/components/EpisodeCard";
import { Brain, Target, Clock, TrendingUp, CalendarCheck } from "lucide-react";

const episodes = [
  { id: "ep-1", number: 1, title: "Number Systems — Foundations", duration: "7 min", status: "completed" as const, blocks: 5, completedBlocks: 5 },
  { id: "ep-2", number: 2, title: "Rational & Irrational Numbers", duration: "8 min", status: "completed" as const, blocks: 5, completedBlocks: 5 },
  { id: "ep-3", number: 3, title: "Polynomials — Structure", duration: "7 min", status: "in-progress" as const, blocks: 5, completedBlocks: 3 },
  { id: "ep-4", number: 4, title: "Polynomial Factorization", duration: "6 min", status: "available" as const, blocks: 5, completedBlocks: 0 },
  { id: "ep-5", number: 5, title: "Coordinate Geometry Basics", duration: "8 min", status: "locked" as const, blocks: 5, completedBlocks: 0 },
  { id: "ep-6", number: 6, title: "Linear Equations in Two Variables", duration: "7 min", status: "locked" as const, blocks: 5, completedBlocks: 0 },
];

const reviews = [
  { chapter: "Number Systems", dueIn: "Today", type: "Day 7 Review" },
  { chapter: "Rational Numbers", dueIn: "Tomorrow", type: "Day 21 Mastery" },
];

const StudentDashboard = () => (
  <PageLayout role="student">
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-serif text-foreground">Good morning, Arjun</h1>
        <p className="text-muted-foreground mt-1">Class 9 · Mathematics · Chapter 1: Number Systems</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard title="Episodes Completed" value="13" subtitle="of 42 total" icon={Target} trend={{ value: 12, positive: true }} />
        <MetricCard title="Avg. Accuracy" value="84%" subtitle="Last 7 episodes" icon={Brain} trend={{ value: 5, positive: true }} />
        <MetricCard title="Study Time" value="2.4h" subtitle="This week" icon={Clock} />
        <MetricCard title="Retention Score" value="78%" subtitle="Based on reviews" icon={TrendingUp} trend={{ value: 8, positive: true }} />
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-semibold font-serif text-foreground mb-4">Current Chapter Episodes</h2>
            <div className="grid grid-cols-2 gap-3">
              {episodes.map((ep) => (
                <EpisodeCard key={ep.id} {...ep} />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold font-serif text-foreground mb-4">Skill Progress</h2>
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <SkillBar label="Critical Thinking" value={72} colorClass="bg-metric-critical-thinking" />
              <SkillBar label="Conceptual Clarity" value={85} colorClass="bg-metric-conceptual-clarity" />
              <SkillBar label="Retention" value={68} colorClass="bg-metric-retention" />
              <SkillBar label="Pattern Recognition" value={77} colorClass="bg-metric-pattern" />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold font-serif text-foreground mb-4">Scheduled Reviews</h2>
            <div className="space-y-2">
              {reviews.map((r, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
                  <CalendarCheck className="h-4 w-4 text-accent shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">{r.chapter}</p>
                    <p className="text-xs text-muted-foreground">{r.type} · {r.dueIn}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
);

export default StudentDashboard;
