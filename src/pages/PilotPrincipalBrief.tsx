import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Eye, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const PilotPrincipalBrief = () => (
  <main className="min-h-screen bg-background px-5 py-10 text-foreground print:bg-card">
    <article className="mx-auto max-w-3xl">
      <Button asChild variant="ghost" className="mb-8 print:hidden"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
      <p className="text-xs font-bold uppercase text-primary">Principal brief · Pilot Edition</p>
      <h1 className="mt-3 text-4xl font-bold">See what your students actually understand.</h1>
      <p className="mt-5 text-lg leading-8 text-muted-foreground">MGCV gives teachers a direct view of students’ own explanations, helping them identify misconceptions before the next lesson.</p>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          [Eye, "Visible thinking", "Teachers read the student’s explanation, not a proxy metric."],
          [CheckCircle2, "Three short sessions", "Spark, Build, and Master collect evidence over three days."],
          [ShieldCheck, "Honest pilot", "Results are measured during the pilot. No outcome is promised in advance."],
        ].map(([Icon, title, text]) => {
          const BriefIcon = Icon as typeof Eye;
          return <div key={title as string} className="border-t-2 border-primary pt-4"><BriefIcon className="h-5 w-5 text-primary" /><h2 className="mt-3 font-semibold">{title as string}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text as string}</p></div>;
        })}
      </section>

      <section className="mt-12 border-y border-border py-8">
        <h2 className="text-2xl font-bold">What the pilot tests</h2>
        <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
          <li>Whether students can explain a concept more clearly after structured practice.</li>
          <li>Whether teachers can identify misconceptions earlier from student explanations.</li>
          <li>Whether tomorrow’s lesson can respond to evidence gathered today.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">The classroom loop</h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">A student completes Day 1. After a deliberate 20-hour pause, Day 2 asks the student to explain the idea in their own words. The teacher sees those explanations, feedback signals, and a suggested opener for the next class.</p>
      </section>

      <footer className="mt-14 border-t border-border pt-5 text-xs text-muted-foreground">MGCV Pilot Edition · No fake students or unverified outcome claims appear in live mode.</footer>
    </article>
  </main>
);

export default PilotPrincipalBrief;