import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  action: z.enum(["predict", "benchmark"]).default("predict"),
  chapterId: z.string().min(1).max(200).optional(),
  episodeId: z.string().min(1).max(200).optional(),
  conceptKey: z.string().min(1).max(200).optional(),
  conceptLabel: z.string().min(1).max(300).optional(),
  studentId: z.string().uuid().optional(),
});

type PilotScore = { score?: number; band?: string; feedback?: string; next_step?: string };

type Prediction = {
  user_id: string;
  chapter_id: string;
  episode_id: string;
  concept_key: string;
  concept_label: string;
  risk_score: number;
  risk_level: "low" | "medium" | "high";
  confidence: number;
  signals: Record<string, unknown>;
  recommended_action: string;
  predicted_for_date: string;
};

type BenchmarkRow = {
  student_id: string;
  risk_score: number;
  completion_pct: number;
  explain_average: number;
  day1_detective_correct: boolean;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asScore(value: unknown): PilotScore | null {
  const record = asRecord(value);
  const score = Number(record.score);
  if (!Number.isFinite(score)) return null;
  return {
    score,
    band: typeof record.band === "string" ? record.band : undefined,
    feedback: typeof record.feedback === "string" ? record.feedback : undefined,
    next_step: typeof record.next_step === "string" ? record.next_step : undefined,
  };
}

function nextWeekDate() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().slice(0, 10);
}

function buildPrediction(input: {
  userId: string;
  chapterId: string;
  episodeId: string;
  conceptKey: string;
  conceptLabel: string;
  layerScores: Record<string, unknown>;
}): Prediction {
  const day1Done = Boolean(input.layerScores.day1_completed_at);
  const day2Done = Boolean(input.layerScores.day2_completed_at);
  const day3Done = Boolean(input.layerScores.day3_completed_at);
  const day1DetectiveCorrect = input.layerScores.day1_detective_correct === true;
  const day2Score = asScore(input.layerScores.day2_explain_score);
  const day3Score = asScore(input.layerScores.day3_explain_score);
  const completionCount = [day1Done, day2Done, day3Done].filter(Boolean).length;
  const completionPct = (completionCount / 3) * 100;
  const explainScores = [day2Score?.score, day3Score?.score].filter((s): s is number => typeof s === "number");
  const explainAvg = explainScores.length ? explainScores.reduce((a, b) => a + b, 0) / explainScores.length : 55;
  const detectiveBoost = day1DetectiveCorrect ? 8 : -8;
  const missingExplainPenalty = (2 - explainScores.length) * 8;
  const incompletePenalty = (100 - completionPct) * 0.35;
  const riskScore = clamp(100 - explainAvg + incompletePenalty + missingExplainPenalty - detectiveBoost);
  const riskLevel: Prediction["risk_level"] = riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low";
  const confidence = clamp(40 + completionCount * 12 + explainScores.length * 10 + (day1Done ? 6 : 0));
  const recommended_action = riskLevel === "high"
    ? "Review the concept with one example, then ask the student to explain it again."
    : riskLevel === "medium"
      ? "Give a five-minute recap and one fresh practice question next week."
      : "Use a quick retrieval question next week to keep memory strong.";

  return {
    user_id: input.userId,
    chapter_id: input.chapterId,
    episode_id: input.episodeId,
    concept_key: input.conceptKey,
    concept_label: input.conceptLabel,
    risk_score: riskScore,
    risk_level: riskLevel,
    confidence,
    signals: {
      day1_completed: day1Done,
      day2_completed: day2Done,
      day3_completed: day3Done,
      day1_detective_correct: day1DetectiveCorrect,
      day2_explain_score: day2Score?.score ?? null,
      day3_explain_score: day3Score?.score ?? null,
      completion_pct: Math.round(completionPct),
      explain_average: Math.round(explainAvg),
    },
    recommended_action,
    predicted_for_date: nextWeekDate(),
  };
}

function percentile(value: number, values: number[]) {
  if (!values.length) return null;
  const belowOrEqual = values.filter((v) => v <= value).length;
  return clamp((belowOrEqual / values.length) * 100);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Please sign in to generate retention predictions." }, 401);

    const token = authHeader.slice("Bearer ".length).trim();
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) return json({ error: "Please sign in to generate retention predictions." }, 401);

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }, 400);

    const requesterId = userData.user.id;
    const targetUserId = parsed.data.studentId ?? requesterId;

    if (targetUserId !== requesterId) {
      const { data: isTeacher } = await supabaseAdmin.rpc("has_role", { _user_id: requesterId, _role: "teacher" });
      const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: requesterId, _role: "admin" });
      if (!isTeacher && !isAdmin) return json({ error: "Only teachers can generate predictions for another student." }, 403);
    }

    if (parsed.data.action === "benchmark") {
      if (!parsed.data.chapterId || !parsed.data.episodeId) {
        return json({ error: "Chapter and episode are required for peer benchmarks." }, 400);
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("class_name")
        .eq("user_id", targetUserId)
        .maybeSingle();
      const className = profile?.class_name;
      if (!className) return json({ benchmark: null, error: "Class benchmark is not available yet." }, 200);

      const { data: classProfiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("class_name", className);
      const classUserIds = (classProfiles ?? []).map((p) => p.user_id).filter(Boolean);
      if (classUserIds.length < 2) return json({ benchmark: null, error: "Need more class data for a benchmark." }, 200);

      const { data: progressRows, error: benchError } = await supabaseAdmin
        .from("episode_progress")
        .select("user_id, layer_scores, completion_pct")
        .in("user_id", classUserIds)
        .eq("chapter_id", parsed.data.chapterId)
        .eq("episode_id", parsed.data.episodeId);
      if (benchError) return json({ error: "Could not read class pilot signals." }, 500);

      const rows: BenchmarkRow[] = (progressRows ?? []).map((row) => {
        const layerScores = asRecord(row.layer_scores);
        const prediction = buildPrediction({
          userId: row.user_id,
          chapterId: parsed.data.chapterId!,
          episodeId: parsed.data.episodeId!,
          conceptKey: parsed.data.conceptKey ?? parsed.data.episodeId!,
          conceptLabel: parsed.data.conceptLabel ?? parsed.data.episodeId!.replace(/-/g, " "),
          layerScores,
        });
        const signals = prediction.signals as Record<string, unknown>;
        return {
          student_id: row.user_id,
          risk_score: prediction.risk_score,
          completion_pct: Number(signals.completion_pct ?? row.completion_pct ?? 0),
          explain_average: Number(signals.explain_average ?? 55),
          day1_detective_correct: signals.day1_detective_correct === true,
        };
      });

      const student = rows.find((r) => r.student_id === targetUserId);
      if (!student) return json({ benchmark: null, error: "Student pilot signal is not available yet." }, 200);
      const riskValues = rows.map((r) => r.risk_score);
      const explainValues = rows.map((r) => r.explain_average);
      const completionValues = rows.map((r) => r.completion_pct);
      return json({
        benchmark: {
          class_name: className,
          concept_key: parsed.data.conceptKey ?? parsed.data.episodeId,
          concept_label: parsed.data.conceptLabel ?? parsed.data.episodeId.replace(/-/g, " "),
          sample_size: rows.length,
          student,
          distribution: {
            avg_risk_score: clamp(riskValues.reduce((a, b) => a + b, 0) / riskValues.length),
            avg_explain_score: clamp(explainValues.reduce((a, b) => a + b, 0) / explainValues.length),
            avg_completion_pct: clamp(completionValues.reduce((a, b) => a + b, 0) / completionValues.length),
            detective_accuracy_pct: clamp((rows.filter((r) => r.day1_detective_correct).length / rows.length) * 100),
          },
          percentile: {
            risk: percentile(student.risk_score, riskValues),
            explain: percentile(student.explain_average, explainValues),
            completion: percentile(student.completion_pct, completionValues),
          },
        },
      });
    }

    let progressQuery = supabaseAdmin
      .from("episode_progress")
      .select("user_id, chapter_id, episode_id, layer_scores, completed_at")
      .eq("user_id", targetUserId);

    if (parsed.data.chapterId) progressQuery = progressQuery.eq("chapter_id", parsed.data.chapterId);
    if (parsed.data.episodeId) progressQuery = progressQuery.eq("episode_id", parsed.data.episodeId);

    const { data: progressRows, error: progressError } = await progressQuery;
    if (progressError) return json({ error: "Could not read pilot progress." }, 500);

    const rows = (progressRows ?? []).filter((row) => {
      const scores = asRecord(row.layer_scores);
      return Boolean(scores.day1_completed_at || scores.day2_completed_at || scores.day3_completed_at);
    });

    const predictions = rows.map((row) => {
      const fallbackConcept = parsed.data.conceptLabel ?? row.episode_id.replace(/-/g, " ");
      return buildPrediction({
        userId: row.user_id,
        chapterId: row.chapter_id,
        episodeId: row.episode_id,
        conceptKey: parsed.data.conceptKey ?? row.episode_id,
        conceptLabel: fallbackConcept,
        layerScores: asRecord(row.layer_scores),
      });
    });

    if (predictions.length > 0) {
      const { error: upsertError } = await supabaseAdmin
        .from("retention_predictions")
        .upsert(predictions, { onConflict: "user_id,chapter_id,episode_id,concept_key,predicted_for_date" });
      if (upsertError) return json({ error: "Could not save retention predictions." }, 500);
    }

    return json({ predictions });
  } catch (error) {
    console.error("predict-retention error", error);
    return json({ error: "Retention prediction is not available right now." }, 500);
  }
});
