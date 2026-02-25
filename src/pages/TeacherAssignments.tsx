import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Send, Eye, Trash2 } from "lucide-react";

const TeacherAssignments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [viewSubmissions, setViewSubmissions] = useState<string | null>(null);
  const [gradeModal, setGradeModal] = useState<any>(null);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    instructions: "",
    class_name: "Class 10",
    subject: "Mathematics",
    questions: [{ question_text: "", max_score: 10, expected_answer_hints: "", rubric: [] as any[] }],
  });

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["teacher-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("teacher_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-assignment", {
        body: { action: "create_assignment", ...newAssignment },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Assignment created!");
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
      setShowCreate(false);
      setNewAssignment({
        title: "", description: "", instructions: "", class_name: "Class 10",
        subject: "Mathematics", questions: [{ question_text: "", max_score: 10, expected_answer_hints: "", rubric: [] }],
      });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.functions.invoke("manage-assignment", {
        body: { action: "publish_assignment", assignment_id: id },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Assignment published!");
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
    },
  });

  const { data: submissions } = useQuery({
    queryKey: ["assignment-submissions", viewSubmissions],
    queryFn: async () => {
      if (!viewSubmissions) return [];
      const { data, error } = await supabase
        .from("student_submissions")
        .select(`
          *,
          student:profiles!student_id(full_name),
          answers:student_answers(
            *,
            question:assignment_questions!question_id(question_text, max_score)
          )
        `)
        .eq("assignment_id", viewSubmissions);
      if (error) throw error;
      return data;
    },
    enabled: !!viewSubmissions,
  });

  const gradeMutation = useMutation({
    mutationFn: async ({ answer_id, teacher_feedback, teacher_score }: any) => {
      const { error } = await supabase.functions.invoke("manage-assignment", {
        body: { action: "teacher_grade", answer_id, teacher_feedback, teacher_score },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Grade saved!");
      queryClient.invalidateQueries({ queryKey: ["assignment-submissions"] });
      setGradeModal(null);
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: async ({ submission_id, total_score, teacher_remarks }: any) => {
      const { error } = await supabase.functions.invoke("manage-assignment", {
        body: { action: "teacher_finalize", submission_id, total_score, teacher_remarks },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Submission finalized!");
      queryClient.invalidateQueries({ queryKey: ["assignment-submissions"] });
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (answer_id: string) => {
      const { error } = await supabase.functions.invoke("manage-assignment", {
        body: { action: "retry_evaluation", answer_id },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Re-evaluation triggered");
      queryClient.invalidateQueries({ queryKey: ["assignment-submissions"] });
    },
  });

  const addQuestion = () => {
    setNewAssignment((prev) => ({
      ...prev,
      questions: [...prev.questions, { question_text: "", max_score: 10, expected_answer_hints: "", rubric: [] }],
    }));
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    setNewAssignment((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === idx ? { ...q, [field]: value } : q)),
    }));
  };

  const statusColor: Record<string, string> = {
    in_progress: "bg-yellow-100 text-yellow-800",
    submitted: "bg-blue-100 text-blue-800",
    graded: "bg-purple-100 text-purple-800",
    finalized: "bg-green-100 text-green-800",
  };

  const processingColor: Record<string, string> = {
    pending: "bg-gray-100 text-gray-800",
    processing: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };

  return (
    <DashboardLayout role="teacher">
      <main className="p-6 max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">📝 Assignments</h1>
            <p className="text-muted-foreground">Create, publish, and grade assignments</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create Assignment
          </Button>
        </div>

        {/* Assignment List */}
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <div className="grid gap-4">
            {assignments?.map((a: any) => (
              <Card key={a.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-card-foreground">{a.title}</h3>
                    <p className="text-sm text-muted-foreground">{a.subject} • {a.class_name}</p>
                    {a.description && <p className="text-sm mt-1 text-muted-foreground">{a.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={a.is_published ? "default" : "secondary"}>
                      {a.is_published ? "Published" : "Draft"}
                    </Badge>
                    {!a.is_published && (
                      <Button size="sm" variant="outline" onClick={() => publishMutation.mutate(a.id)}>
                        <Send className="h-3.5 w-3.5 mr-1" /> Publish
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setViewSubmissions(a.id)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> View Submissions
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {(!assignments || assignments.length === 0) && (
              <p className="text-center text-muted-foreground py-12">No assignments yet. Create your first one!</p>
            )}
          </div>
        )}

        {/* Create Assignment Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Assignment Title" value={newAssignment.title}
                onChange={(e) => setNewAssignment((p) => ({ ...p, title: e.target.value }))} />
              <Textarea placeholder="Description (optional)" value={newAssignment.description}
                onChange={(e) => setNewAssignment((p) => ({ ...p, description: e.target.value }))} />
              <Textarea placeholder="Instructions for students" value={newAssignment.instructions}
                onChange={(e) => setNewAssignment((p) => ({ ...p, instructions: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Class" value={newAssignment.class_name}
                  onChange={(e) => setNewAssignment((p) => ({ ...p, class_name: e.target.value }))} />
                <Input placeholder="Subject" value={newAssignment.subject}
                  onChange={(e) => setNewAssignment((p) => ({ ...p, subject: e.target.value }))} />
              </div>

              <h4 className="font-semibold pt-2">Questions</h4>
              {newAssignment.questions.map((q, i) => (
                <div key={i} className="border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Q{i + 1}</span>
                    {i > 0 && (
                      <Button size="sm" variant="ghost" onClick={() =>
                        setNewAssignment((p) => ({ ...p, questions: p.questions.filter((_, j) => j !== i) }))
                      }>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <Textarea placeholder="Question text" value={q.question_text}
                    onChange={(e) => updateQuestion(i, "question_text", e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" placeholder="Max score" value={q.max_score}
                      onChange={(e) => updateQuestion(i, "max_score", Number(e.target.value))} />
                    <Input placeholder="Answer hints (optional)" value={q.expected_answer_hints}
                      onChange={(e) => updateQuestion(i, "expected_answer_hints", e.target.value)} />
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addQuestion} className="w-full">+ Add Question</Button>
              <Button onClick={() => createMutation.mutate()} disabled={!newAssignment.title || createMutation.isPending}
                className="w-full">
                {createMutation.isPending ? "Creating..." : "Create Assignment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Submissions Dialog */}
        <Dialog open={!!viewSubmissions} onOpenChange={() => setViewSubmissions(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Student Submissions</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {submissions?.map((sub: any) => (
                <Card key={sub.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-semibold">{sub.student?.full_name || "Unknown"}</span>
                      <Badge className={`ml-2 ${statusColor[sub.status] || ""}`}>{sub.status}</Badge>
                    </div>
                    {sub.status === "submitted" && (
                      <Button size="sm" onClick={() => {
                        const total = sub.answers?.reduce((s: number, a: any) =>
                          s + (a.teacher_score ?? a.ai_score ?? 0), 0) || 0;
                        finalizeMutation.mutate({ submission_id: sub.id, total_score: total, teacher_remarks: "" });
                      }}>
                        Finalize
                      </Button>
                    )}
                  </div>
                  {sub.answers?.map((ans: any) => (
                    <div key={ans.id} className="bg-muted/50 rounded-lg p-3 mb-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{ans.question?.question_text}</span>
                        <div className="flex items-center gap-2">
                          <Badge className={processingColor[ans.processing_status] || ""}>
                            {ans.processing_status}
                          </Badge>
                          {ans.ai_confidence != null && (
                            <Badge variant="outline">AI Confidence: {ans.ai_confidence}%</Badge>
                          )}
                        </div>
                      </div>
                      {ans.processing_status === "failed" && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-destructive">{ans.processing_error}</span>
                          <Button size="sm" variant="outline" onClick={() => retryMutation.mutate(ans.id)}>
                            Retry AI
                          </Button>
                        </div>
                      )}
                      {ans.ai_feedback && (
                        <div className="text-xs space-y-1 mb-2">
                          <p><strong>AI Score:</strong> {ans.ai_score}/{ans.question?.max_score}</p>
                          {(ans.ai_feedback as any)?.strengths?.length > 0 && (
                            <p className="text-green-600">✅ {((ans.ai_feedback as any).strengths as string[]).join(", ")}</p>
                          )}
                          {(ans.ai_feedback as any)?.mistakes?.length > 0 && (
                            <p className="text-red-600">❌ {((ans.ai_feedback as any).mistakes as string[]).join(", ")}</p>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {ans.is_teacher_reviewed && (
                          <Badge variant="default">Teacher: {ans.teacher_score}/{ans.question?.max_score}</Badge>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setGradeModal({
                          ...ans,
                          teacher_feedback: ans.teacher_feedback || "",
                          teacher_score: ans.teacher_score ?? ans.ai_score ?? 0,
                        })}>
                          {ans.is_teacher_reviewed ? "Edit Grade" : "Grade"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </Card>
              ))}
              {(!submissions || submissions.length === 0) && (
                <p className="text-center text-muted-foreground py-8">No submissions yet</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Grade Modal */}
        <Dialog open={!!gradeModal} onOpenChange={() => setGradeModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grade Answer</DialogTitle>
            </DialogHeader>
            {gradeModal && (
              <div className="space-y-4">
                {gradeModal.extracted_text && (
                  <div className="bg-muted p-3 rounded text-sm max-h-40 overflow-y-auto">
                    <strong>Student Answer:</strong>
                    <p className="mt-1 whitespace-pre-wrap">{gradeModal.extracted_text}</p>
                  </div>
                )}
                {gradeModal.ai_feedback && (
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded text-sm">
                    <strong>AI Suggestion:</strong> {gradeModal.ai_score} pts, {gradeModal.ai_confidence}% confidence
                  </div>
                )}
                <Input type="number" placeholder="Score" value={gradeModal.teacher_score}
                  onChange={(e) => setGradeModal((p: any) => ({ ...p, teacher_score: Number(e.target.value) }))} />
                <Textarea placeholder="Feedback" value={gradeModal.teacher_feedback}
                  onChange={(e) => setGradeModal((p: any) => ({ ...p, teacher_feedback: e.target.value }))} />
                <Button className="w-full" onClick={() => gradeMutation.mutate({
                  answer_id: gradeModal.id,
                  teacher_feedback: gradeModal.teacher_feedback,
                  teacher_score: gradeModal.teacher_score,
                })}>
                  Save Grade
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </DashboardLayout>
  );
};

export default TeacherAssignments;
