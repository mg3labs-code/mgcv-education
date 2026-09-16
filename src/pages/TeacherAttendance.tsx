import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, Clock, Users, CalendarDays, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { useTeacherAssignments } from "@/hooks/useTeacherAssignments";
import { assignmentLabel } from "@/lib/classIdentity";

type AttendanceStatus = "present" | "absent" | "late";

const TeacherAttendance = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAssignmentKey, setSelectedAssignmentKey] = useState("");
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const displayDate = format(selectedDate, "EEEE, MMMM d, yyyy");
  const { entries: assignments, loading: assignmentsLoading } = useTeacherAssignments();
  const assignmentKey = (entry: typeof assignments[number]) => `${entry.board}::${entry.grade}::${entry.section}::${entry.subject}`;
  const selectedAssignment = assignments.find((entry) => assignmentKey(entry) === selectedAssignmentKey) ?? assignments[0];
  const className = selectedAssignment ? `Class ${selectedAssignment.grade}` : "";

  // Fetch students in the class
  const { data: students } = useQuery({
    queryKey: ["class-students", selectedAssignment?.board, selectedAssignment?.grade, selectedAssignment?.section],
    queryFn: async () => {
      if (!selectedAssignment) return [];
      const { data, error } = await supabase
        .from("student_profiles")
        .select("user_id, full_name")
        .eq("board", selectedAssignment.board)
        .eq("grade", selectedAssignment.grade)
        .eq("section", selectedAssignment.section);
      if (error) throw error;
      return data.sort((a, b) => a.full_name.localeCompare(b.full_name));
    },
    enabled: !!selectedAssignment,
  });

  // Fetch existing attendance for selected date
  const { data: existingAttendance } = useQuery({
    queryKey: ["attendance", dateStr, selectedAssignment?.board, selectedAssignment?.grade, selectedAssignment?.section, selectedAssignment?.subject],
    queryFn: async () => {
      if (!selectedAssignment) return [];
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("date", dateStr)
        .eq("teacher_id", user?.id ?? "")
        .eq("class_name", className)
        .eq("board", selectedAssignment.board)
        .eq("section", selectedAssignment.section)
        .eq("subject", selectedAssignment.subject);
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!selectedAssignment,
  });

  // Local attendance state
  const [localAttendance, setLocalAttendance] = useState<Record<string, AttendanceStatus>>({});

  // Merge existing with local
  const attendanceMap = useMemo(() => {
    const map: Record<string, AttendanceStatus> = {};
    existingAttendance?.forEach((a: any) => {
      map[a.student_id] = a.status as AttendanceStatus;
    });
    return { ...map, ...localAttendance };
  }, [existingAttendance, localAttendance]);

  const toggleStatus = (studentId: string) => {
    const current = attendanceMap[studentId] || "present";
    const cycle: AttendanceStatus[] = ["present", "absent", "late"];
    const next = cycle[(cycle.indexOf(current) + 1) % cycle.length];
    setLocalAttendance(prev => ({ ...prev, [studentId]: next }));
  };

  const markAll = (status: AttendanceStatus) => {
    const map: Record<string, AttendanceStatus> = {};
    students?.forEach(s => { map[s.user_id] = status; });
    setLocalAttendance(map);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!students || !selectedAssignment || !user) return;
      const records = students.map(s => ({
        teacher_id: user.id,
        student_id: s.user_id,
        class_name: className,
        board: selectedAssignment.board,
        section: selectedAssignment.section,
        subject: selectedAssignment.subject,
        date: dateStr,
        status: attendanceMap[s.user_id] || "present",
      }));

      const { error } = await supabase
        .from("attendance")
        .upsert(records, { onConflict: "student_id,date" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Attendance saved!");
      setLocalAttendance({});
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const stats = useMemo(() => {
    const total = students?.length || 0;
    const present = students?.filter(s => (attendanceMap[s.user_id] || "present") === "present").length || 0;
    const absent = students?.filter(s => attendanceMap[s.user_id] === "absent").length || 0;
    const late = students?.filter(s => attendanceMap[s.user_id] === "late").length || 0;
    return { total, present, absent, late, percent: total > 0 ? Math.round((present / total) * 100) : 0 };
  }, [students, attendanceMap]);

  const statusConfig: Record<AttendanceStatus, { icon: JSX.Element; color: string; bg: string }> = {
    present: { icon: <Check className="h-4 w-4" />, color: "text-green-700", bg: "bg-green-100 hover:bg-green-200" },
    absent: { icon: <X className="h-4 w-4" />, color: "text-red-700", bg: "bg-red-100 hover:bg-red-200" },
    late: { icon: <Clock className="h-4 w-4" />, color: "text-yellow-700", bg: "bg-yellow-100 hover:bg-yellow-200" },
  };

  return (
    <DashboardLayout role="teacher" breadcrumbItems={[{ label: "Dashboard", href: "/teacher" }, { label: "Attendance" }]}>
      <main className="p-4 md:p-6 max-w-[900px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">📋 Take Attendance</h1>
            <p className="text-sm text-muted-foreground mt-1">{selectedAssignment ? `${assignmentLabel(selectedAssignment)} · ${selectedAssignment.subject}` : "Add a class in My Profile"}</p>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !selectedAssignment} className="gap-2 w-fit" size="sm">
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>

        {assignments.length > 0 && (
          <select
            value={selectedAssignment ? assignmentKey(selectedAssignment) : ""}
            onChange={(event) => { setSelectedAssignmentKey(event.target.value); setLocalAttendance({}); }}
            className="mb-6 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
            aria-label="Select class and subject"
          >
            {assignments.map((entry) => <option key={assignmentKey(entry)} value={assignmentKey(entry)}>{assignmentLabel(entry)} · {entry.subject}</option>)}
          </select>
        )}

        {/* Date Navigation */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(d => subDays(d, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <CalendarDays className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="font-semibold text-card-foreground">{displayDate}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(d => addDays(d, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card className="p-3 text-center">
            <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold text-card-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </Card>
          <Card className="p-3 text-center">
            <Check className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <p className="text-xl font-bold text-card-foreground">{stats.present}</p>
            <p className="text-xs text-muted-foreground">Present</p>
          </Card>
          <Card className="p-3 text-center">
            <X className="h-4 w-4 mx-auto mb-1 text-red-500" />
            <p className="text-xl font-bold text-card-foreground">{stats.absent}</p>
            <p className="text-xs text-muted-foreground">Absent</p>
          </Card>
          <Card className="p-3 text-center">
            <Clock className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
            <p className="text-xl font-bold text-card-foreground">{stats.late}</p>
            <p className="text-xs text-muted-foreground">Late</p>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={() => markAll("present")} className="gap-1">
            <Check className="h-3.5 w-3.5" /> All Present
          </Button>
          <Button variant="outline" size="sm" onClick={() => markAll("absent")} className="gap-1">
            <X className="h-3.5 w-3.5" /> All Absent
          </Button>
        </div>

        {/* Student List */}
        <div className="space-y-2">
          {students?.map((student, idx) => {
            const status: AttendanceStatus = attendanceMap[student.user_id] || "present";
            const cfg = statusConfig[status];
            return (
              <Card key={student.user_id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-6 text-right">{idx + 1}.</span>
                    <span className="font-medium text-card-foreground">{student.full_name}</span>
                  </div>
                  <button
                    onClick={() => toggleStatus(student.user_id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${cfg.bg} ${cfg.color}`}
                  >
                    {cfg.icon}
                    <span className="capitalize">{status}</span>
                  </button>
                </div>
              </Card>
            );
          })}
          {!assignmentsLoading && (!students || students.length === 0) && (
            <p className="text-center text-muted-foreground py-12">{selectedAssignment ? "No students linked to this board, class, and section yet" : "Add a class in My Profile to take attendance"}</p>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
};

export default TeacherAttendance;
