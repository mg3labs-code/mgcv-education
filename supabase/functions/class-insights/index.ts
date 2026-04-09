import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const BodySchema = z.object({
  action: z.enum(["common_mistakes", "student_growth"]),
});

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

    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { action } = parsed.data;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    switch (action) {
      case "common_mistakes": {
        // Get all assignments by this teacher
        const { data: assignments, error: aErr } = await supabase
          .from("assignments")
          .select("id, title, subject, class_name")
          .eq("teacher_id", user.id)
          .eq("is_published", true);
        if (aErr) throw aErr;
        if (!assignments || assignments.length === 0) {
          return new Response(JSON.stringify({ mistakes: [], summary: "No published assignments found." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get all evaluated answers for these assignments
        const { data: answers, error: ansErr } = await supabaseAdmin
          .from("student_answers")
          .select(`
            ai_feedback, ai_score, question_id,
            question:assignment_questions!question_id(question_text, max_score, assignment_id)
          `)
          .eq("processing_status", "success")
          .not("ai_feedback", "is", null);
        if (ansErr) throw ansErr;

        // Filter to only this teacher's assignments
        const assignmentIds = new Set(assignments.map(a => a.id));
        const teacherAnswers = (answers || []).filter((a: any) => 
          a.question && assignmentIds.has(a.question.assignment_id)
        );

        if (teacherAnswers.length === 0) {
          return new Response(JSON.stringify({ mistakes: [], summary: "No evaluated answers yet." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Aggregate all mistakes from AI feedback
        const allMistakes: string[] = [];
        const questionMistakes: Record<string, string[]> = {};

        teacherAnswers.forEach((a: any) => {
          const feedback = a.ai_feedback as any;
          if (feedback?.mistakes?.length > 0) {
            feedback.mistakes.forEach((m: string) => {
              allMistakes.push(m);
              const qKey = a.question?.question_text || "Unknown";
              if (!questionMistakes[qKey]) questionMistakes[qKey] = [];
              questionMistakes[qKey].push(m);
            });
          }
        });

        // Use AI to analyze and categorize common mistakes
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY || allMistakes.length === 0) {
          return new Response(JSON.stringify({
            mistakes: allMistakes.slice(0, 20),
            summary: `Found ${allMistakes.length} mistakes across ${teacherAnswers.length} answers.`,
            questionBreakdown: Object.entries(questionMistakes).map(([q, m]) => ({
              question: q, count: m.length, samples: [...new Set(m)].slice(0, 5),
            })),
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "You are an academic analyst. Analyze student mistakes and provide actionable insights for teachers." },
              {
                role: "user",
                content: `Analyze these common mistakes from ${teacherAnswers.length} student answers across ${assignments.length} assignments.

MISTAKES LIST:
${allMistakes.slice(0, 100).join("\n")}

Categorize them and provide:
1. Top 5 most common mistake patterns
2. Root causes for each pattern
3. Suggested teaching interventions

Use the analyze_mistakes tool.`,
              },
            ],
            tools: [{
              type: "function",
              function: {
                name: "analyze_mistakes",
                description: "Return categorized mistake analysis",
                parameters: {
                  type: "object",
                  properties: {
                    patterns: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          category: { type: "string" },
                          frequency: { type: "string", description: "High/Medium/Low" },
                          examples: { type: "array", items: { type: "string" } },
                          root_cause: { type: "string" },
                          intervention: { type: "string" },
                        },
                        required: ["category", "frequency", "examples", "root_cause", "intervention"],
                        additionalProperties: false,
                      },
                    },
                    overall_summary: { type: "string" },
                    priority_focus: { type: "string" },
                  },
                  required: ["patterns", "overall_summary", "priority_focus"],
                  additionalProperties: false,
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "analyze_mistakes" } },
          }),
        });

        let analysis: any = null;
        if (analysisResponse.ok) {
          const data = await analysisResponse.json();
          try {
            const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
            analysis = JSON.parse(toolCall.function.arguments);
          } catch {
            try {
              analysis = JSON.parse(data.choices?.[0]?.message?.content || "{}");
            } catch { /* ignore */ }
          }
        }

        return new Response(JSON.stringify({
          totalAnswers: teacherAnswers.length,
          totalMistakes: allMistakes.length,
          analysis,
          questionBreakdown: Object.entries(questionMistakes).map(([q, m]) => ({
            question: q, count: m.length, samples: [...new Set(m)].slice(0, 5),
          })),
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "student_growth": {
        // Get teacher's assignments ordered by date
        const { data: assignments, error: aErr } = await supabase
          .from("assignments")
          .select("id, title, subject, class_name, created_at")
          .eq("teacher_id", user.id)
          .eq("is_published", true)
          .order("created_at", { ascending: true });
        if (aErr) throw aErr;

        if (!assignments || assignments.length === 0) {
          return new Response(JSON.stringify({ students: [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get all submissions with scores
        const { data: submissions, error: sErr } = await supabaseAdmin
          .from("student_submissions")
          .select(`
            student_id, assignment_id, total_score, status, submitted_at,
            answers:student_answers(ai_score, teacher_score, is_teacher_reviewed, question:assignment_questions!question_id(max_score))
          `)
          .in("assignment_id", assignments.map(a => a.id));
        if (sErr) throw sErr;

        // Get student names
        const studentIds = [...new Set((submissions || []).map((s: any) => s.student_id))];
        let nameMap: Record<string, string> = {};
        if (studentIds.length > 0) {
          const { data: profiles } = await supabaseAdmin
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", studentIds);
          profiles?.forEach((p: any) => { nameMap[p.user_id] = p.full_name; });
        }

        // Build growth data per student
        const studentGrowth: Record<string, any[]> = {};
        (submissions || []).forEach((sub: any) => {
          const assignmentTitle = assignments.find(a => a.id === sub.assignment_id)?.title || "Unknown";
          const maxScore = sub.answers?.reduce((s: number, a: any) => s + (a.question?.max_score || 0), 0) || 1;
          const actualScore = sub.answers?.reduce((s: number, a: any) => {
            return s + (a.is_teacher_reviewed ? (a.teacher_score || 0) : (a.ai_score || 0));
          }, 0) || 0;
          const percent = Math.round((actualScore / maxScore) * 100);

          if (!studentGrowth[sub.student_id]) studentGrowth[sub.student_id] = [];
          studentGrowth[sub.student_id].push({
            assignment: assignmentTitle,
            score: percent,
            date: sub.submitted_at || assignments.find(a => a.id === sub.assignment_id)?.created_at,
          });
        });

        // Calculate trends
        const students = Object.entries(studentGrowth).map(([id, scores]) => {
          scores.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          const avg = Math.round(scores.reduce((s, x) => s + x.score, 0) / scores.length);
          const trend = scores.length >= 2
            ? scores[scores.length - 1].score - scores[0].score
            : 0;
          return {
            id,
            name: nameMap[id] || "Unknown",
            scores,
            average: avg,
            trend,
            totalAssignments: scores.length,
          };
        });

        return new Response(JSON.stringify({ students }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (e) {
    console.error("class-insights error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
