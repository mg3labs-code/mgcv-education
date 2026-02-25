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
import { Plus, Send, Eye, Trash2, Brain, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ExtractedTextPreview = ({ text }: { text: string }) => {
  const [expanded, setExpanded] = useState(false);
  const truncated = text.length > 200;
  return (
    <div className="bg-background border border-border rounded p-2 text-xs">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 font-medium text-muted-foreground mb-1 hover:text-foreground">
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Extracted Text
      </button>
      {expanded && (
        <p className="whitespace-pre-wrap text-muted-foreground max-h-48 overflow-y-auto">
          {text}
        </p>
      )}
      {!expanded && truncated && (
        <p className="text-muted-foreground truncate">{text.substring(0, 200)}…</p>
      )}
      {!expanded && !truncated && (
        <p className="text-muted-foreground">{text}</p>
      )}
    </div>
  );
};

const BOARD_RUBRICS: Record<string, { label: string; criteria: { criterion: string; max_marks: number }[] }> = {
  cbse: {
    label: "CBSE",
    criteria: [
      { criterion: "Conceptual Understanding", max_marks: 4 },
      { criterion: "Application & Method", max_marks: 3 },
      { criterion: "Accuracy of Answer", max_marks: 2 },
      { criterion: "Presentation & Clarity", max_marks: 1 },
    ],
  },
  icse: {
    label: "ICSE",
    criteria: [
      { criterion: "Knowledge & Recall", max_marks: 3 },
      { criterion: "Analytical Reasoning", max_marks: 3 },
      { criterion: "Problem Solving", max_marks: 2 },
      { criterion: "Neatness & Stepwise Working", max_marks: 2 },
    ],
  },
  state: {
    label: "State Board",
    criteria: [
      { criterion: "Content Accuracy", max_marks: 5 },
      { criterion: "Method & Steps", max_marks: 3 },
      { criterion: "Diagram/Illustration", max_marks: 2 },
    ],
  },
  custom: { label: "Custom", criteria: [] },
};

const QUESTION_TYPES = [
  { value: "short_answer", label: "Short Answer (1-2 marks)" },
  { value: "long_answer", label: "Long Answer (3-5 marks)" },
  { value: "case_based", label: "Case-Based (4-5 marks)" },
  { value: "mcq", label: "MCQ (1 mark)" },
  { value: "numerical", label: "Numerical (3-5 marks)" },
];

const TeacherAssignments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [viewSubmissions, setViewSubmissions] = useState<string | null>(null);
  const [gradeModal, setGradeModal] = useState<any>(null);
  const [selectedBoard, setSelectedBoard] = useState("cbse");
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    instructions: "",
    class_name: "Class 10",
    subject: "Mathematics",
    board: "cbse",
    questions: [{ question_text: "", max_score: 10, expected_answer_hints: "", rubric: [] as any[], question_type: "short_answer" }],
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
        subject: "Mathematics", board: "cbse", questions: [{ question_text: "", max_score: 10, expected_answer_hints: "", rubric: [], question_type: "short_answer" }],
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
      const { data: subs, error } = await supabase
        .from("student_submissions")
        .select(`
          *,
          answers:student_answers(
            *,
            question:assignment_questions!question_id(question_text, max_score)
          )
        `)
        .eq("assignment_id", viewSubmissions);
      if (error) throw error;
      
      // Fetch student names separately since there's no FK to profiles
      const studentIds = [...new Set((subs || []).map((s: any) => s.student_id))];
      let profileMap: Record<string, string> = {};
      if (studentIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", studentIds);
        profiles?.forEach((p: any) => { profileMap[p.user_id] = p.full_name; });
      }
      
      return (subs || []).map((s: any) => ({
        ...s,
        student: { full_name: profileMap[s.student_id] || "Unknown Student" },
      }));
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
      questions: [...prev.questions, { question_text: "", max_score: 10, expected_answer_hints: "", rubric: [], question_type: "short_answer" }],
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/teacher/insights")} className="gap-2">
              <Brain className="h-4 w-4" /> Class Insights
            </Button>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Create Assignment
            </Button>
          </div>
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
              <div className="grid grid-cols-3 gap-3">
                <Input placeholder="Class" value={newAssignment.class_name}
                  onChange={(e) => setNewAssignment((p) => ({ ...p, class_name: e.target.value }))} />
                <Input placeholder="Subject" value={newAssignment.subject}
                  onChange={(e) => setNewAssignment((p) => ({ ...p, subject: e.target.value }))} />
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Board</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newAssignment.board}
                    onChange={(e) => {
                      const board = e.target.value;
                      setNewAssignment((p) => ({
                        ...p,
                        board,
                        questions: p.questions.map(q => ({
                          ...q,
                          rubric: board !== "custom" ? BOARD_RUBRICS[board].criteria : q.rubric,
                        })),
                      }));
                    }}
                  >
                    {Object.entries(BOARD_RUBRICS).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Board rubric preview */}
              {newAssignment.board !== "custom" && (
                <div className="bg-muted/50 rounded-lg p-3 text-xs">
                  <span className="font-semibold text-muted-foreground">
                    {BOARD_RUBRICS[newAssignment.board].label} Rubric:
                  </span>
                  <span className="text-muted-foreground ml-1">
                    {BOARD_RUBRICS[newAssignment.board].criteria.map(c => `${c.criterion} (${c.max_marks}m)`).join(" • ")}
                  </span>
                </div>
              )}

              <h4 className="font-semibold pt-2">Questions</h4>
              {newAssignment.questions.map((q, i) => (
                <div key={i} className="border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Q{i + 1}</span>
                    <div className="flex items-center gap-2">
                      <select
                        className="text-xs rounded border border-input bg-background px-2 py-1"
                        value={q.question_type}
                        onChange={(e) => updateQuestion(i, "question_type", e.target.value)}
                      >
                        {QUESTION_TYPES.map(qt => (
                          <option key={qt.value} value={qt.value}>{qt.label}</option>
                        ))}
                      </select>
                      {i > 0 && (
                        <Button size="sm" variant="ghost" onClick={() =>
                          setNewAssignment((p) => ({ ...p, questions: p.questions.filter((_, j) => j !== i) }))
                        }>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
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
                  {sub.answers?.map((ans: any) => {
                    const feedback = ans.ai_feedback as any;
                    const rubricScores = feedback?.rubric_scores || {};
                    const hasRubricScores = Object.keys(rubricScores).length > 0;
                    return (
                      <div key={ans.id} className="bg-muted/50 rounded-lg p-3 mb-2 space-y-2">
                        {/* Header: question + status */}
                        <div className="flex items-center justify-between">
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

                        {/* Error + retry */}
                        {ans.processing_status === "failed" && (
                          <div className="flex items-center gap-2 bg-destructive/10 rounded p-2">
                            <span className="text-sm text-destructive flex-1">{ans.processing_error}</span>
                            <Button size="sm" variant="outline" onClick={() => retryMutation.mutate(ans.id)}>
                              Retry AI
                            </Button>
                          </div>
                        )}

                        {/* Uploaded file link */}
                        {ans.file_url && (
                          <a href={ans.file_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            <ExternalLink className="h-3 w-3" /> View Original File
                          </a>
                        )}

                        {/* Extracted text (collapsible) */}
                        {ans.extracted_text && (
                          <ExtractedTextPreview text={ans.extracted_text} />
                        )}

                        {/* AI Evaluation */}
                        {feedback && (
                          <div className="space-y-2 text-xs">
                            <p className="font-semibold">AI Score: {ans.ai_score}/{ans.question?.max_score}</p>

                            {/* Rubric breakdown */}
                            {hasRubricScores && (
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(rubricScores).map(([criterion, score]) => (
                                  <Badge key={criterion} variant="outline" className="font-normal">
                                    {criterion}: {String(score)}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {feedback.strengths?.length > 0 && (
                              <div>
                                <span className="font-medium text-emerald-600 dark:text-emerald-400">Strengths:</span>
                                <ul className="list-disc list-inside ml-1 text-muted-foreground">
                                  {(feedback.strengths as string[]).map((s: string, i: number) => <li key={i}>{s}</li>)}
                                </ul>
                              </div>
                            )}
                            {feedback.mistakes?.length > 0 && (
                              <div>
                                <span className="font-medium text-destructive">Mistakes:</span>
                                <ul className="list-disc list-inside ml-1 text-muted-foreground">
                                  {(feedback.mistakes as string[]).map((m: string, i: number) => <li key={i}>{m}</li>)}
                                </ul>
                              </div>
                            )}
                            {feedback.suggestions?.length > 0 && (
                              <div>
                                <span className="font-medium text-primary">Suggestions:</span>
                                <ul className="list-disc list-inside ml-1 text-muted-foreground">
                                  {(feedback.suggestions as string[]).map((s: string, i: number) => <li key={i}>{s}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Grade actions */}
                        <div className="flex items-center gap-2 pt-1">
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
                    );
                  })}
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
