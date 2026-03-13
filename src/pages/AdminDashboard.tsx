import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const CLASS_LIST = ["Class 10", "Class 9", "Class 8"];

const AdminDashboard = () => {
  const { data: classStats, isLoading } = useQuery({
    queryKey: ["admin-class-stats"],
    queryFn: async () => {
      const results = await Promise.all(
        CLASS_LIST.map(async (className) => {
          const { data } = await supabase.rpc("get_class_averages", { _class_name: className });
          const row = (data as any)?.[0];
          return {
            class: className,
            students: Number(row?.student_count ?? 0),
            clarity: Math.round(Number(row?.avg_clarity ?? 0)),
            thinking: Math.round(Number(row?.avg_thinking ?? 0)),
            attention: Math.round(Number(row?.avg_attention ?? 0)),
            overall: Math.round(Number(row?.avg_overall ?? 0)),
          };
        })
      );
      return results;
    },
  });

  const totalStudents = (classStats ?? []).reduce((s, c) => s + c.students, 0);
  const avgOverall = totalStudents > 0
    ? Math.round((classStats ?? []).reduce((s, c) => s + c.overall * c.students, 0) / totalStudents)
    : 0;

  return (
    <DashboardLayout role="admin">
      <main className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">
        <div className="bg-white/10 backdrop-blur-[10px] rounded-2xl p-5 md:p-8 text-white text-center shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">School Analytics</h1>
          <p className="text-sm md:text-lg opacity-90 mb-6">Delhi Public School — Academic Year 2025–26</p>
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {[
              { value: String(totalStudents), label: "Total Students" },
              { value: `${avgOverall}%`, label: "Avg. Overall Score" },
            ].map((s, i) => (
              <div key={i} className="bg-white/20 rounded-2xl p-4 md:p-6 text-center backdrop-blur-[10px]">
                <div className="text-2xl md:text-[2.5rem] font-bold mb-1 md:mb-2">{isLoading ? "..." : s.value}</div>
                <div className="text-xs md:text-base opacity-90">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 md:p-8">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 md:mb-6">Class Performance</h2>
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            {isLoading ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : (
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b-2 border-border bg-muted/50">
                    <th className="text-left p-2 md:p-3 font-semibold text-muted-foreground">Class</th>
                    <th className="text-center p-2 md:p-3 font-semibold text-muted-foreground">Students</th>
                    <th className="text-center p-2 md:p-3 font-semibold text-muted-foreground">Clarity</th>
                    <th className="text-center p-2 md:p-3 font-semibold text-muted-foreground">Thinking</th>
                    <th className="text-center p-2 md:p-3 font-semibold text-muted-foreground">Attention</th>
                    <th className="text-center p-2 md:p-3 font-semibold text-muted-foreground">Overall</th>
                  </tr>
                </thead>
                <tbody>
                  {(classStats ?? []).map((c, i) => (
                    <tr key={i} className="border-b border-border hover:bg-accent/50 transition-colors">
                      <td className="p-2 md:p-3 font-medium text-foreground">{c.class}</td>
                      <td className="p-2 md:p-3 text-center">{c.students}</td>
                      <td className="p-2 md:p-3 text-center">{c.clarity}%</td>
                      <td className="p-2 md:p-3 text-center">{c.thinking}%</td>
                      <td className="p-2 md:p-3 text-center">{c.attention}%</td>
                      <td className="p-2 md:p-3 text-center">{c.overall}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default AdminDashboard;
