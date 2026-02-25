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
    const { answer_id } = await req.json();
    if (!answer_id) {
      return new Response(JSON.stringify({ error: "answer_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch answer with question context
    const { data: answer, error: fetchErr } = await supabaseAdmin
      .from("student_answers")
      .select(`
        id, file_url, file_type, extracted_text, retry_count,
        question:assignment_questions!question_id (
          question_text, max_score, rubric, expected_answer_hints
        )
      `)
      .eq("id", answer_id)
      .single();

    if (fetchErr || !answer) {
      return new Response(JSON.stringify({ error: "Answer not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as processing
    await supabaseAdmin
      .from("student_answers")
      .update({ processing_status: "processing", processing_error: null })
      .eq("id", answer_id);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      await supabaseAdmin
        .from("student_answers")
        .update({ processing_status: "failed", processing_error: "AI service not configured" })
        .eq("id", answer_id);
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: If no extracted text but has file, do OCR via AI vision
    let studentText = answer.extracted_text || "";

    if (!studentText && answer.file_url) {
      try {
        // Use AI to describe/extract text from image
        const ocrResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: "You are an OCR system. Extract ALL handwritten or printed text from the image exactly as written. Preserve formatting, equations, and diagrams described textually. Output only the extracted text, nothing else.",
              },
              {
                role: "user",
                content: [
                  { type: "text", text: "Extract all text from this student answer sheet:" },
                  { type: "image_url", image_url: { url: answer.file_url } },
                ],
              },
            ],
          }),
        });

        if (ocrResponse.ok) {
          const ocrData = await ocrResponse.json();
          studentText = ocrData.choices?.[0]?.message?.content || "";
          
          // Save extracted text
          await supabaseAdmin
            .from("student_answers")
            .update({ extracted_text: studentText })
            .eq("id", answer_id);
        }
      } catch (ocrErr) {
        console.error("OCR failed:", ocrErr);
        // Continue with empty text — LLM can still evaluate if text was typed
      }
    }

    if (!studentText) {
      await supabaseAdmin
        .from("student_answers")
        .update({
          processing_status: "failed",
          processing_error: "No text could be extracted from the submission",
          retry_count: (answer.retry_count || 0) + 1,
        })
        .eq("id", answer_id);
      return new Response(JSON.stringify({ error: "No text extracted" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: LLM Evaluation with structured grading
    const question = answer.question as any;
    const rubricItems = Array.isArray(question.rubric) && question.rubric.length > 0
      ? question.rubric.map((r: any) => `- ${r.criterion}: ${r.max_marks} marks`).join("\n")
      : `- Overall correctness: ${question.max_score} marks`;

    const evalPrompt = `You are a strict academic evaluator for school students. Evaluate the following student answer.

QUESTION: ${question.question_text}

RUBRIC (evaluate against each criterion):
${rubricItems}

MAXIMUM SCORE: ${question.max_score}
${question.expected_answer_hints ? `EXPECTED ANSWER HINTS: ${question.expected_answer_hints}` : ""}

STUDENT ANSWER:
${studentText.substring(0, 4000)}

Respond using the suggest_evaluation tool with your evaluation.`;

    const evalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert academic evaluator. Be fair, precise, and constructive." },
          { role: "user", content: evalPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_evaluation",
              description: "Return structured evaluation of the student answer",
              parameters: {
                type: "object",
                properties: {
                  score: { type: "number", description: "Score out of max_score" },
                  confidence: { type: "number", description: "How confident you are in this evaluation, 0-100" },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of things the student did well",
                  },
                  mistakes: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of errors or misconceptions",
                  },
                  suggestions: {
                    type: "array",
                    items: { type: "string" },
                    description: "Improvement suggestions for the student",
                  },
                  rubric_scores: {
                    type: "object",
                    description: "Score per rubric criterion (criterion_name: score)",
                  },
                },
                required: ["score", "confidence", "strengths", "mistakes", "suggestions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_evaluation" } },
      }),
    });

    if (!evalResponse.ok) {
      const status = evalResponse.status;
      const errText = await evalResponse.text();
      console.error("AI eval error:", status, errText);

      const errorMsg = status === 429
        ? "Rate limit exceeded, please retry later"
        : status === 402
        ? "AI credits exhausted"
        : "AI evaluation failed";

      await supabaseAdmin
        .from("student_answers")
        .update({
          processing_status: "failed",
          processing_error: errorMsg,
          retry_count: (answer.retry_count || 0) + 1,
        })
        .eq("id", answer_id);

      return new Response(JSON.stringify({ error: errorMsg }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const evalData = await evalResponse.json();
    let evaluation: any;

    try {
      const toolCall = evalData.choices?.[0]?.message?.tool_calls?.[0];
      evaluation = JSON.parse(toolCall.function.arguments);
    } catch {
      // Fallback: try parsing content as JSON
      try {
        evaluation = JSON.parse(evalData.choices?.[0]?.message?.content || "{}");
      } catch {
        await supabaseAdmin
          .from("student_answers")
          .update({
            processing_status: "failed",
            processing_error: "Could not parse AI evaluation",
            retry_count: (answer.retry_count || 0) + 1,
          })
          .eq("id", answer_id);

        return new Response(JSON.stringify({ error: "Parse error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Clamp score
    const clampedScore = Math.min(Math.max(evaluation.score || 0, 0), question.max_score);
    const confidence = Math.min(Math.max(evaluation.confidence || 50, 0), 100);

    // Save ONLY on success — never save errors as feedback
    await supabaseAdmin
      .from("student_answers")
      .update({
        processing_status: "success",
        processing_error: null,
        ai_score: clampedScore,
        ai_confidence: confidence,
        ai_feedback: {
          strengths: evaluation.strengths || [],
          mistakes: evaluation.mistakes || [],
          suggestions: evaluation.suggestions || [],
          rubric_scores: evaluation.rubric_scores || {},
        },
      })
      .eq("id", answer_id);

    return new Response(
      JSON.stringify({
        success: true,
        score: clampedScore,
        confidence,
        feedback: evaluation,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("evaluate-answer error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
