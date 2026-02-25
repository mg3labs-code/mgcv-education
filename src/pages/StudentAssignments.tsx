import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, Send, CheckCircle, Clock, AlertTriangle, Loader2 } from "lucide-react";

const StudentAssignments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState<Record<string, string>>({});

  // Fetch student profile for class_name
  const { data: profile } = useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("class_name")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch published assignments for student's class
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["student-assignments", profile?.class_name],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("class_name", profile!.class_name!)
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.class_name,
  });

  // Fetch questions and existing answers for selected assignment
  const { data: assignmentDetail } = useQuery({
    queryKey: ["assignment-detail", selectedAssignment],
    queryFn: async () => {
      if (!selectedAssignment) return null;

      const { data: questions, error: qErr } = await supabase
        .from("assignment_questions")
        .select("*")
        .eq("assignment_id", selectedAssignment)
        .order("question_number");
      if (qErr) throw qErr;

      // Get existing submission
      const { data: submission } = await supabase
        .from("student_submissions")
        .select("*, answers:student_answers(*)")
        .eq("assignment_id", selectedAssignment)
        .eq("student_id", user!.id)
        .maybeSingle();

      return { questions, submission };
    },
    enabled: !!selectedAssignment && !!user,
    refetchInterval: 5000, // Poll for processing updates
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ question_id, text }: { question_id: string; text: string }) => {
      const { data, error } = await supabase.functions.invoke("manage-assignment", {
        body: {
          action: "upload_answer",
          assignment_id: selectedAssignment,
          question_id,
          extracted_text: text,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Answer submitted! AI is evaluating...");
      queryClient.invalidateQueries({ queryKey: ["assignment-detail"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("manage-assignment", {
        body: { action: "finalize_submission", assignment_id: selectedAssignment },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Assignment submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["assignment-detail", "student-assignments"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const isFinalized = assignmentDetail?.submission?.status === "submitted" ||
    assignmentDetail?.submission?.status === "finalized";

  const getAnswerForQuestion = (questionId: string) => {
    return assignmentDetail?.submission?.answers?.find((a: any) => a.question_id === questionId);
  };

  const statusIcon: Record<string, JSX.Element> = {
    pending: <Clock className="h-4 w-4 text-muted-foreground" />,
    processing: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
    success: <CheckCircle className="h-4 w-4 text-green-500" />,
    failed: <AlertTriangle className="h-4 w-4 text-destructive" />,
  };

  return (
    <DashboardLayout role="student">
      <main className="p-6 max-w-[1000px] mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">📝 My Assignments</h1>
        <p className="text-muted-foreground mb-8">View and submit your assignments</p>

        {!selectedAssignment ? (
          /* Assignment List */
          <div className="grid gap-4">
            {isLoading && <p className="text-muted-foreground">Loading assignments...</p>}
            {assignments?.map((a: any) => (
              <Card key={a.id} className="p-5 cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedAssignment(a.id)}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{a.title}</h3>
                    <p className="text-sm text-muted-foreground">{a.subject} • {a.class_name}</p>
                    {a.description && <p className="text-sm mt-1 text-muted-foreground">{a.description}</p>}
                    {a.due_date && (
                      <p className="text-xs mt-2 text-muted-foreground">
                        Due: {new Date(a.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline">Open</Badge>
                </div>
              </Card>
            ))}
            {(!assignments || assignments.length === 0) && !isLoading && (
              <p className="text-center text-muted-foreground py-12">No assignments available yet</p>
            )}
          </div>
        ) : (
          /* Assignment Detail */
          <div>
            <Button variant="ghost" className="mb-4" onClick={() => setSelectedAssignment(null)}>
              ← Back to Assignments
            </Button>

            {isFinalized && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
                <p className="text-green-700 dark:text-green-300 font-semibold">
                  ✅ This assignment has been submitted
                </p>
                {assignmentDetail?.submission?.total_score != null && (
                  <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                    Final Score: {assignmentDetail.submission.total_score}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-6">
              {assignmentDetail?.questions?.map((q: any) => {
                const answer = getAnswerForQuestion(q.id);
                return (
                  <Card key={q.id} className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold">Q{q.question_number}. {q.question_text}</h4>
                      <span className="text-xs text-muted-foreground">{q.max_score} marks</span>
                    </div>

                    {answer ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          {statusIcon[answer.processing_status] || null}
                          <Badge variant="outline">{answer.processing_status}</Badge>
                          {answer.ai_confidence != null && (
                            <Badge variant="secondary">AI Confidence: {answer.ai_confidence}%</Badge>
                          )}
                        </div>

                        {answer.processing_status === "processing" && (
                          <p className="text-sm text-blue-600">🔄 AI is evaluating your answer...</p>
                        )}

                        {answer.processing_status === "failed" && (
                          <p className="text-sm text-destructive">⚠️ {answer.processing_error || "Evaluation failed"}</p>
                        )}

                        {answer.ai_feedback && answer.processing_status === "success" && (
                          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                            <p><strong>AI Score:</strong> {answer.ai_score}/{q.max_score}</p>
                            {(answer.ai_feedback as any)?.strengths?.length > 0 && (
                              <div>
                                <strong className="text-green-600">Strengths:</strong>
                                <ul className="list-disc ml-5 mt-1">
                                  {((answer.ai_feedback as any).strengths as string[]).map((s: string, i: number) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {(answer.ai_feedback as any)?.mistakes?.length > 0 && (
                              <div>
                                <strong className="text-red-600">Areas to improve:</strong>
                                <ul className="list-disc ml-5 mt-1">
                                  {((answer.ai_feedback as any).mistakes as string[]).map((m: string, i: number) => (
                                    <li key={i}>{m}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {(answer.ai_feedback as any)?.suggestions?.length > 0 && (
                              <div>
                                <strong className="text-blue-600">Suggestions:</strong>
                                <ul className="list-disc ml-5 mt-1">
                                  {((answer.ai_feedback as any).suggestions as string[]).map((s: string, i: number) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {answer.is_teacher_reviewed && (
                          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
                            <p><strong>Teacher Score:</strong> {answer.teacher_score}/{q.max_score}</p>
                            {answer.teacher_feedback && <p className="mt-1">{answer.teacher_feedback}</p>}
                          </div>
                        )}
                      </div>
                    ) : !isFinalized ? (
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Type your answer here..."
                          value={answerText[q.id] || ""}
                          onChange={(e) => setAnswerText((p) => ({ ...p, [q.id]: e.target.value }))}
                          rows={4}
                        />
                        <Button
                          size="sm"
                          disabled={!answerText[q.id]?.trim() || uploadMutation.isPending}
                          onClick={() => uploadMutation.mutate({ question_id: q.id, text: answerText[q.id] })}
                          className="gap-2"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          {uploadMutation.isPending ? "Submitting..." : "Submit Answer"}
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No answer submitted</p>
                    )}
                  </Card>
                );
              })}
            </div>

            {!isFinalized && assignmentDetail?.submission?.answers?.length > 0 && (
              <div className="mt-8 text-center">
                <Button size="lg" onClick={() => finalizeMutation.mutate()} disabled={finalizeMutation.isPending}
                  className="gap-2">
                  <Send className="h-4 w-4" />
                  {finalizeMutation.isPending ? "Submitting..." : "Finalize & Submit Assignment"}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">⚠️ You cannot edit after finalizing</p>
              </div>
            )}
          </div>
        )}
      </main>
    </DashboardLayout>
  );
};

export default StudentAssignments;
