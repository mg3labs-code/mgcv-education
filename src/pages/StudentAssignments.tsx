import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, Send, CheckCircle, Clock, AlertTriangle, Loader2, FileImage, FileText, X, ClipboardList } from "lucide-react";
import EmptyState from "@/components/EmptyState";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const StudentAssignments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState<Record<string, string>>({});
  const [answerFiles, setAnswerFiles] = useState<Record<string, File>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

      const { data: submission } = await supabase
        .from("student_submissions")
        .select("*, answers:student_answers(*)")
        .eq("assignment_id", selectedAssignment)
        .eq("student_id", user!.id)
        .maybeSingle();

      return { questions, submission };
    },
    enabled: !!selectedAssignment && !!user,
    refetchInterval: 5000,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ question_id, text, file }: { question_id: string; text?: string; file?: File }) => {
      if (file) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append("action", "upload_answer");
        formData.append("assignment_id", selectedAssignment!);
        formData.append("question_id", question_id);
        formData.append("file", file);
        if (text) formData.append("extracted_text", text);

        const { data: { session } } = await supabase.auth.getSession();
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-assignment`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: formData,
          }
        );
        if (!resp.ok) {
          const err = await resp.json();
          throw new Error(err.error || "Upload failed");
        }
        return resp.json();
      } else {
        // Text-only via JSON
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
      }
    },
    onSuccess: (_, vars) => {
      toast.success(vars.file ? "File uploaded! AI is extracting text & evaluating..." : "Answer submitted! AI is evaluating...");
      queryClient.invalidateQueries({ queryKey: ["assignment-detail"] });
      // Clear file after upload
      setAnswerFiles((prev) => {
        const next = { ...prev };
        delete next[vars.question_id];
        return next;
      });
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

  const handleFileSelect = (questionId: string, file: File | null) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum 10MB allowed.");
      return;
    }
    if (!ACCEPTED_TYPES.split(",").includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP images and PDF files are accepted.");
      return;
    }
    setAnswerFiles((prev) => ({ ...prev, [questionId]: file }));
  };

  const removeFile = (questionId: string) => {
    setAnswerFiles((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const statusIcon: Record<string, JSX.Element> = {
    pending: <Clock className="h-4 w-4 text-muted-foreground" />,
    processing: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
    success: <CheckCircle className="h-4 w-4 text-green-500" />,
    failed: <AlertTriangle className="h-4 w-4 text-destructive" />,
  };

  return (
    <DashboardLayout role="student" breadcrumbItems={[{ label: "Dashboard", href: "/student" }, { label: "Assignments" }]}>
      <main className="p-3 sm:p-4 md:p-6 max-w-[1000px] mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">📝 My Assignments</h1>
        <p className="text-sm text-muted-foreground mb-6">View and submit your assignments</p>

        {!selectedAssignment ? (
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
              <EmptyState
                icon={ClipboardList}
                title="No Assignments Yet"
                description="Your teacher hasn't published any assignments yet. Check back soon!"
              />
            )}
          </div>
        ) : (
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
                const selectedFile = answerFiles[q.id];
                return (
                  <Card key={q.id} className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold">Q{q.question_number}. {q.question_text}</h4>
                      <span className="text-xs text-muted-foreground">{q.max_score} marks</span>
                    </div>

                    {answer ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {statusIcon[answer.processing_status] || null}
                          <Badge variant="outline">{answer.processing_status}</Badge>
                          {answer.ai_confidence != null && (
                            <Badge variant="secondary">AI Confidence: {answer.ai_confidence}%</Badge>
                          )}
                          {answer.file_type && (
                            <Badge variant="outline" className="gap-1">
                              {answer.file_type?.includes("pdf") ? <FileText className="h-3 w-3" /> : <FileImage className="h-3 w-3" />}
                              File uploaded
                            </Badge>
                          )}
                        </div>

                        {answer.processing_status === "processing" && (
                          <p className="text-sm text-blue-600">🔄 AI is evaluating your answer...</p>
                        )}

                        {answer.processing_status === "failed" && (
                          <p className="text-sm text-destructive">⚠️ {answer.processing_error || "Evaluation failed"}</p>
                        )}

                        {answer.extracted_text && (
                          <div className="bg-muted/30 rounded-lg p-3 text-sm">
                            <p className="text-xs text-muted-foreground mb-1 font-semibold">Extracted / Submitted Text:</p>
                            <p className="text-foreground whitespace-pre-wrap line-clamp-6">{answer.extracted_text}</p>
                          </div>
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
                        {/* File Upload Area */}
                        <div
                          className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                          onClick={() => fileInputRefs.current[q.id]?.click()}
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const file = e.dataTransfer.files[0];
                            if (file) handleFileSelect(q.id, file);
                          }}
                        >
                          <input
                            ref={(el) => { fileInputRefs.current[q.id] = el; }}
                            type="file"
                            accept={ACCEPTED_TYPES}
                            className="hidden"
                            onChange={(e) => handleFileSelect(q.id, e.target.files?.[0] || null)}
                          />
                          {selectedFile ? (
                            <div className="flex items-center justify-center gap-3">
                              {selectedFile.type.includes("pdf") ? (
                                <FileText className="h-8 w-8 text-red-500" />
                              ) : (
                                <FileImage className="h-8 w-8 text-blue-500" />
                              )}
                              <div className="text-left">
                                <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-2"
                                onClick={(e) => { e.stopPropagation(); removeFile(q.id); }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">
                                <span className="font-semibold text-primary">Click to upload</span> or drag & drop
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                PDF, JPEG, PNG, WebP • Max 10MB
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1 border-t border-muted-foreground/20" />
                          <span className="text-xs text-muted-foreground">or type your answer</span>
                          <div className="flex-1 border-t border-muted-foreground/20" />
                        </div>

                        <Textarea
                          placeholder="Type your answer here..."
                          value={answerText[q.id] || ""}
                          onChange={(e) => setAnswerText((p) => ({ ...p, [q.id]: e.target.value }))}
                          rows={4}
                        />
                        <Button
                          size="sm"
                          disabled={(!answerText[q.id]?.trim() && !selectedFile) || uploadMutation.isPending}
                          onClick={() =>
                            uploadMutation.mutate({
                              question_id: q.id,
                              text: answerText[q.id],
                              file: selectedFile,
                            })
                          }
                          className="gap-2"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          {uploadMutation.isPending
                            ? "Uploading..."
                            : selectedFile
                            ? "Upload File & Submit"
                            : "Submit Answer"}
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
