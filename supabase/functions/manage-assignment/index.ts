import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const ActionSchema = z.enum([
  "create_assignment", "get_assignments", "get_assignment_detail",
  "submit_answer", "get_submissions", "get_submission_detail",
  "grade_answer", "retry_evaluation", "finalize_submission",
  "publish_assignment", "delete_assignment",
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

    const { action } = body;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    switch (action) {
      case "create_assignment": {
        const { title, description, instructions, class_name, subject, questions, unlock_date, due_date } = body;

        const { data: assignment, error: aErr } = await supabase
          .from("assignments")
          .insert({
            teacher_id: userId,
            title,
            description,
            instructions,
            class_name,
            subject: subject || "Mathematics",
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
        const { error } = await supabase
          .from("assignments")
          .update({ is_published: true })
          .eq("id", assignment_id)
          .eq("teacher_id", userId);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "upload_answer": {
        const { assignment_id, question_id, extracted_text } = body;

        // Upsert submission
        const { data: submission, error: subErr } = await supabase
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

        // Upload file to storage if provided
        let fileUrl: string | null = null;
        let detectedFileType: string | null = fileType;

        if (fileData && fileName) {
          const ext = fileName.split(".").pop() || "bin";
          const storagePath = `${userId}/${assignment_id}/${question_id}.${ext}`;

          const { error: uploadErr } = await supabaseAdmin.storage
            .from("answer-files")
            .upload(storagePath, fileData, {
              contentType: fileType || "application/octet-stream",
              upsert: true,
            });

          if (uploadErr) {
            console.error("Storage upload error:", uploadErr);
            throw new Error("File upload failed: " + uploadErr.message);
          }

          // Generate a signed URL for OCR (valid 1 hour)
          const { data: signedData } = await supabaseAdmin.storage
            .from("answer-files")
            .createSignedUrl(storagePath, 3600);

          fileUrl = signedData?.signedUrl || null;
        }

        // Upsert answer — store raw storage path (not signed URL) for permanent access
        const answerData: any = {
          submission_id: submission.id,
          question_id,
          student_id: userId,
          processing_status: "pending",
        };

        if (extracted_text) answerData.extracted_text = extracted_text;
        if (fileData && fileName) {
          const ext = fileName.split(".").pop() || "bin";
          answerData.file_url = `${userId}/${assignment_id}/${question_id}.${ext}`;
        }
        if (detectedFileType) answerData.file_type = detectedFileType;

        const { data: answer, error: ansErr } = await supabase
          .from("student_answers")
          .upsert(answerData, { onConflict: "submission_id,question_id" })
          .select()
          .single();

        if (ansErr) throw ansErr;

        // Trigger async AI evaluation (fire and forget)
        if (extracted_text || fileUrl) {
          const evalUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/evaluate-answer`;
          fetch(evalUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({ answer_id: answer.id }),
          }).catch((e) => console.error("Failed to trigger evaluation:", e));
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

        const { error } = await supabase
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

        const { error } = await supabaseAdmin
          .from("student_answers")
          .update({
            teacher_feedback,
            teacher_score,
            is_teacher_reviewed: true,
          })
          .eq("id", answer_id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "teacher_finalize": {
        const { submission_id, total_score, teacher_remarks } = body;

        const { error } = await supabaseAdmin
          .from("student_submissions")
          .update({
            status: "finalized",
            finalized_at: new Date().toISOString(),
            finalized_by: userId,
            total_score,
            teacher_remarks,
          })
          .eq("id", submission_id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "retry_evaluation": {
        const { answer_id } = body;

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
