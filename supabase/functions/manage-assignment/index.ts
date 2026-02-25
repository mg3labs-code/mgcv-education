import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const body = await req.json();
    const { action } = body;

    // Use service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    switch (action) {
      case "create_assignment": {
        const { title, description, instructions, class_name, subject, questions, unlock_date, due_date } = body;

        // Create assignment
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

        // Create questions
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

        // Check if already finalized
        if (submission.status === "finalized" || submission.status === "submitted") {
          return new Response(
            JSON.stringify({ error: "Submission already finalized" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Upsert answer - save immediately, return success
        const { data: answer, error: ansErr } = await supabase
          .from("student_answers")
          .upsert(
            {
              submission_id: submission.id,
              question_id,
              student_id: userId,
              extracted_text: extracted_text || null,
              processing_status: extracted_text ? "pending" : "pending",
            },
            { onConflict: "submission_id,question_id" }
          )
          .select()
          .single();

        if (ansErr) throw ansErr;

        // Trigger async AI evaluation (fire and forget)
        if (extracted_text) {
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

        // Check all questions answered
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

        // Trigger re-evaluation
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
