import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";
import { z } from "https://esm.sh/zod@3.23.8";

const ActionSchema = z.enum([
  "create_assignment", "get_assignments", "get_assignment_detail",
  "submit_answer", "get_submissions", "get_submission_detail",
  "grade_answer", "retry_evaluation", "finalize_submission",
  "publish_assignment", "delete_assignment", "upload_answer", "teacher_grade", "teacher_finalize",
]);
const BaseBodySchema = z.object({
  action: ActionSchema,
}).passthrough();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Check content type to decide parsing
    const contentType = req.headers.get("content-type") || "";
    let body: any;
    let fileData: Uint8Array | null = null;
    let fileName: string | null = null;
    let fileType: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = {
        action: formData.get("action") as string,
        assignment_id: formData.get("assignment_id") as string,
        question_id: formData.get("question_id") as string,
        extracted_text: formData.get("extracted_text") as string || null,
      };
      const file = formData.get("file") as File | null;
      if (file) {
        fileData = new Uint8Array(await file.arrayBuffer());
        fileName = file.name;
        fileType = file.type;
      }
    } else {
      body = await req.json();
    }

    const actionParsed = BaseBodySchema.safeParse(body);
    if (!actionParsed.success) {
      return new Response(JSON.stringify({ error: "Invalid request", details: actionParsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action } = body;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const jsonErr = (status: number, error: string) =>
      new Response(JSON.stringify({ error }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    const isTeacher = async (uid: string) => {
      const { data } = await supabaseAdmin.rpc("has_role", { _user_id: uid, _role: "teacher" });
      return data === true;
    };

    switch (action) {
      case "create_assignment": {
        const { title, description, instructions, class_name, subject, board, section, questions, unlock_date, due_date } = body;

        const { data: assignment, error: aErr } = await supabase
          .from("assignments")
          .insert({
            teacher_id: userId,
            title,
            description,
            instructions,
            class_name,
            subject: subject || "Mathematics",
            board: board || null,
            section: section || null,
            max_total_score: questions?.reduce((s: number, q: any) => s + (q.max_score || 10), 0) || 0,
            unlock_date: unlock_date || null,
            due_date: due_date || null,
            is_published: false,
          })
          .select()
          .single();

        if (aErr) throw aErr;

        if (questions?.length > 0) {
          const questionRows = questions.map((q: any, i: number) => ({
            assignment_id: assignment.id,
            question_number: i + 1,
            question_text: q.question_text,
            max_score: q.max_score || 10,
            rubric: q.rubric || [],
            expected_answer_hints: q.expected_answer_hints || null,
          }));

          const { error: qErr } = await supabase
            .from("assignment_questions")
            .insert(questionRows);

          if (qErr) throw qErr;
        }

        return new Response(JSON.stringify({ assignment }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "publish_assignment": {
        const { assignment_id } = body;
        const { data: own } = await supabaseAdmin
          .from("assignments").select("teacher_id").eq("id", assignment_id).maybeSingle();
        if (!own || own.teacher_id !== userId || !(await isTeacher(userId))) return jsonErr(403, "Forbidden");
        // Final integrity check: total marks = sum of the remaining questions.
        const { data: qs, error: qsErr } = await supabaseAdmin
          .from("assignment_questions").select("max_score").eq("assignment_id", assignment_id);
        if (qsErr) throw qsErr;
        const total = (qs || []).reduce((s: number, q: any) => s + Number(q.max_score || 0), 0);
        const { error } = await supabase
          .from("assignments")
          .update({ is_published: true, max_total_score: total })
          .eq("id", assignment_id)
          .eq("teacher_id", userId);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "upload_answer": {
        const { assignment_id, question_id, extracted_text } = body;

        // The student's own client must be able to see the assignment (published,
        // their class/board/section) — RLS enforces that. Writes then go through
        // the admin client so students have no direct write access to scores.
        const { data: visible } = await supabase
          .from("assignments").select("id").eq("id", assignment_id).maybeSingle();
        const { data: questionRow } = await supabaseAdmin
          .from("assignment_questions").select("id")
          .eq("id", question_id).eq("assignment_id", assignment_id).maybeSingle();
        if (!visible || !questionRow) {
          return new Response(JSON.stringify({ error: "Assignment not available" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: existingSub } = await supabaseAdmin
          .from("student_submissions").select("id, status")
          .eq("assignment_id", assignment_id).eq("student_id", userId).maybeSingle();
        if (existingSub && (existingSub.status === "finalized" || existingSub.status === "submitted")) {
          return new Response(
            JSON.stringify({ error: "Submission already finalized" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Upsert submission
        const { data: submission, error: subErr } = await supabaseAdmin
          .from("student_submissions")
          .upsert(
            { assignment_id, student_id: userId, status: "in_progress" },
            { onConflict: "assignment_id,student_id" }
          )
          .select()
          .single();

        if (subErr) throw subErr;

        if (submission.status === "finalized" || submission.status === "submitted") {
          return new Response(
            JSON.stringify({ error: "Submission already finalized" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Upload file to storage if provided — always a new unique path, never overwrite.
        let fileUrl: string | null = null;
        let detectedFileType: string | null = fileType;
        let storagePath: string | null = null;
        const lockedResponse = () => new Response(
          JSON.stringify({ error: "Submission already finalized" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

        if (fileData && fileName) {
          const ext = (fileName.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
          storagePath = `${userId}/${assignment_id}/${question_id}-${crypto.randomUUID()}.${ext}`;

          const { error: uploadErr } = await supabaseAdmin.storage
            .from("answer-files")
            .upload(storagePath, fileData, {
              contentType: fileType || "application/octet-stream",
              upsert: false,
            });

          if (uploadErr) {
            console.error("Storage upload error:", uploadErr);
            throw new Error("File upload failed: " + uploadErr.message);
          }

          const { data: signedData } = await supabaseAdmin.storage
            .from("answer-files")
            .createSignedUrl(storagePath, 3600);

          fileUrl = signedData?.signedUrl || null;
        }

        const removeUnattached = async () => {
          if (storagePath) {
            const { error } = await supabaseAdmin.storage.from("answer-files").remove([storagePath]);
            if (error) console.error("Failed to remove unattached upload:", error);
          }
        };

        // Recheck the submission is still editable after the upload finished.
        const { data: recheck } = await supabaseAdmin
          .from("student_submissions").select("status").eq("id", submission.id).single();
        if (!recheck || recheck.status === "finalized" || recheck.status === "submitted") {
          await removeUnattached();
          return lockedResponse();
        }

        const answerData: any = {
          submission_id: submission.id,
          question_id,
          student_id: userId,
          processing_status: "pending",
        };

        if (extracted_text) answerData.extracted_text = extracted_text;
        if (storagePath) answerData.file_url = storagePath;
        if (detectedFileType) answerData.file_type = detectedFileType;

        const { data: previous } = await supabaseAdmin
          .from("student_answers").select("file_url")
          .eq("submission_id", submission.id).eq("question_id", question_id).maybeSingle();

        // The database trigger refuses file changes once the submission is
        // submitted/finalized, so a finalize that wins the race leaves the
        // marked file reference untouched.
        const { data: answer, error: ansErr } = await supabaseAdmin
          .from("student_answers")
          .upsert(answerData, { onConflict: "submission_id,question_id" })
          .select()
          .single();

        if (ansErr) {
          await removeUnattached();
          if (String(ansErr.message || "").includes("answer_locked")) return lockedResponse();
          throw ansErr;
        }

        // Replaced (pre-finalization) file is no longer referenced — clean it up.
        if (storagePath && previous?.file_url && previous.file_url !== storagePath) {
          await supabaseAdmin.storage.from("answer-files").remove([previous.file_url]);
        }

        // Trigger async AI evaluation (fire and forget)
        if (extracted_text || fileUrl) {
          const evalUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/evaluate-answer`;
          const evaluationRequest = fetch(evalUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({ answer_id: answer.id }),
          }).catch((e) => console.error("Failed to trigger evaluation:", e));

          // @ts-ignore - EdgeRuntime is available in Deno edge runtime
          if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
            // @ts-ignore
            EdgeRuntime.waitUntil(evaluationRequest);
          } else {
            await evaluationRequest;
          }
        }

        return new Response(
          JSON.stringify({ success: true, answer_id: answer.id, status: "processing" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "finalize_submission": {
        const { assignment_id } = body;

        const { data: submission } = await supabase
          .from("student_submissions")
          .select("id, status")
          .eq("assignment_id", assignment_id)
          .eq("student_id", userId)
          .single();

        if (!submission) {
          return new Response(JSON.stringify({ error: "No submission found" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (submission.status === "finalized") {
          return new Response(JSON.stringify({ error: "Already finalized" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error } = await supabaseAdmin
          .from("student_submissions")
          .update({ status: "submitted", submitted_at: new Date().toISOString() })
          .eq("id", submission.id)
          .eq("student_id", userId);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "teacher_grade": {
        const { answer_id, teacher_feedback, teacher_score } = body;
        if (typeof answer_id !== "string") return jsonErr(400, "answer_id required");

        const { data: ans } = await supabaseAdmin
          .from("student_answers")
          .select(`id, submission:student_submissions!submission_id ( status, assignment:assignments!assignment_id ( teacher_id ) ), question:assignment_questions!question_id ( max_score )`)
          .eq("id", answer_id).maybeSingle();
        const ownerTeacher = (ans as any)?.submission?.assignment?.teacher_id;
        if (!ans || ownerTeacher !== userId || !(await isTeacher(userId))) return jsonErr(403, "Forbidden");
        if ((ans as any).submission?.status === "finalized") return jsonErr(409, "Submission already finalized");

        const maxScore = Number((ans as any).question?.max_score ?? 0);
        const score = Number(teacher_score);
        if (teacher_score === null || teacher_score === undefined || teacher_score === "" ||
            !Number.isFinite(score) || score < 0 || score > maxScore) {
          return jsonErr(400, `Score must be a number between 0 and ${maxScore}`);
        }
        if (teacher_feedback != null && (typeof teacher_feedback !== "string" || teacher_feedback.length > 5000)) {
          return jsonErr(400, "Invalid feedback");
        }

        const { error } = await supabaseAdmin
          .from("student_answers")
          .update({ teacher_feedback: teacher_feedback ?? null, teacher_score: score, is_teacher_reviewed: true })
          .eq("id", answer_id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "teacher_finalize": {
        // total_score from the client is ignored — computed server-side.
        const { submission_id, teacher_remarks } = body;
        if (typeof submission_id !== "string") return jsonErr(400, "submission_id required");

        const { data: sub } = await supabaseAdmin
          .from("student_submissions")
          .select("id, status, assignment:assignments!assignment_id ( teacher_id )")
          .eq("id", submission_id).maybeSingle();
        if (!sub || (sub as any).assignment?.teacher_id !== userId || !(await isTeacher(userId))) {
          return jsonErr(403, "Forbidden");
        }
        if (teacher_remarks != null && (typeof teacher_remarks !== "string" || teacher_remarks.length > 5000)) {
          return jsonErr(400, "Invalid remarks");
        }

        const { data: answers, error: aErr } = await supabaseAdmin
          .from("student_answers")
          .select("id, ai_score, teacher_score, is_teacher_reviewed, processing_status")
          .eq("submission_id", submission_id);
        if (aErr) throw aErr;
        if (!answers || answers.length === 0) return jsonErr(400, "No answers to finalize");

        let total = 0;
        const unscored: string[] = [];
        for (const a of answers as any[]) {
          if (a.is_teacher_reviewed && a.teacher_score != null && Number.isFinite(Number(a.teacher_score))) {
            total += Number(a.teacher_score);
          } else if (a.processing_status === "success" && a.ai_score != null && Number.isFinite(Number(a.ai_score))) {
            total += Number(a.ai_score);
          } else {
            unscored.push(a.id);
          }
        }
        if (unscored.length > 0) {
          return jsonErr(400, `${unscored.length} answer(s) still need a score before finalizing`);
        }
        total = Math.round(total * 100) / 100;

        if ((sub as any).status === "finalized") {
          // Idempotent: repeat finalize returns the stored result without rewriting it.
          const { data: cur } = await supabaseAdmin.from("student_submissions")
            .select("total_score").eq("id", submission_id).single();
          return new Response(JSON.stringify({ success: true, total_score: cur?.total_score, already_finalized: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Single-row update guarded on status = atomic transition.
        const { data: updated, error } = await supabaseAdmin
          .from("student_submissions")
          .update({
            status: "finalized",
            finalized_at: new Date().toISOString(),
            finalized_by: userId,
            total_score: total,
            teacher_remarks: teacher_remarks ?? null,
          })
          .eq("id", submission_id)
          .neq("status", "finalized")
          .select("total_score");
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, total_score: updated?.[0]?.total_score ?? total }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "retry_evaluation": {
        const { answer_id } = body;
        if (typeof answer_id !== "string") return jsonErr(400, "answer_id required");
        const { data: ans } = await supabaseAdmin
          .from("student_answers")
          .select("id, student_id, submission:student_submissions!submission_id ( status, assignment:assignments!assignment_id ( teacher_id ) )")
          .eq("id", answer_id).maybeSingle();
        const a: any = ans;
        if (!a || (a.student_id !== userId && a.submission?.assignment?.teacher_id !== userId)) {
          return jsonErr(403, "Forbidden");
        }
        if (a.submission?.status === "finalized") return jsonErr(409, "Submission already finalized");

        const evalUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/evaluate-answer`;
        await fetch(evalUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ answer_id }),
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (e) {
    console.error("manage-assignment error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
