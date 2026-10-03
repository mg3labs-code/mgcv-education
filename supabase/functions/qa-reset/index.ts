// QA-only reset for the pilot Golden Journey.
// Scope is a hard allowlist: six QA account IDs + homework owned by the QA teachers.
// Requires: signed-in admin AND app_config.qa_reset_enabled = 'true'.
// Order: storage files (Storage API) -> student_answers -> student_submissions.
// Idempotent: re-running after a partial failure only removes what is left.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const QA_TEACHERS = [
  "584d68ef-c42f-4b53-9ffa-bdce38622355", // qa.t1
  "74accab5-d420-46a6-97ac-de6a5fdae9d8", // qa.t2
];
const QA_STUDENTS = [
  "e7367856-41e7-47eb-9fdf-4ef8a814c350", // qa.s1
  "1f2cd957-7a8f-49d2-90a7-cd38673c5bb7", // qa.s2
  "3a0055a7-36e9-4296-81a3-7288f22fbe66", // qa.s3
  "bdff5dbb-559b-42e6-9276-461b7bbffa8a", // qa.s4
];
const BUCKET = "answer-files";

const Body = z.object({
  assignment_ids: z.array(z.string().uuid()).min(1).max(10),
  dry_run: z.boolean().default(true),
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "POST only" });

  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return json(401, { error: "Unauthorized" });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user } } = await admin.auth.getUser(auth.slice(7));
  if (!user) return json(401, { error: "Unauthorized" });
  const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
  if (isAdmin !== true) return json(403, { error: "Admins only" });

  const { data: flag } = await admin.from("app_config").select("value").eq("key", "qa_reset_enabled").maybeSingle();
  if (flag?.value !== "true") return json(403, { error: "QA reset is disabled in this environment" });

  let parsed;
  try { parsed = Body.safeParse(await req.json()); } catch { return json(400, { error: "Invalid JSON" }); }
  if (!parsed.success) return json(400, { error: parsed.error.flatten().fieldErrors });
  const { assignment_ids, dry_run } = parsed.data;

  // Every requested homework must exist and belong to a QA teacher.
  const { data: asg, error: aErr } = await admin.from("assignments").select("id, teacher_id").in("id", assignment_ids);
  if (aErr) return json(500, { error: aErr.message });
  const bad = assignment_ids.filter((id) => !(asg || []).some((a) => a.id === id && QA_TEACHERS.includes(a.teacher_id)));
  if (bad.length) return json(403, { error: "Not QA homework", assignment_ids: bad });

  const { data: subs, error: sErr } = await admin.from("student_submissions")
    .select("id, student_id, assignment_id").in("assignment_id", assignment_ids).in("student_id", QA_STUDENTS);
  if (sErr) return json(500, { error: sErr.message });
  const subIds = (subs || []).map((s) => s.id);

  const { data: answers, error: ansErr } = subIds.length
    ? await admin.from("student_answers").select("id, file_url, student_id").in("submission_id", subIds)
    : { data: [], error: null };
  if (ansErr) return json(500, { error: ansErr.message });

  // Files: referenced paths plus anything left in each QA student's folder for these homework.
  // Paths are built server-side from the allowlist; client paths are never accepted.
  const paths = new Set<string>();
  const inScope = (p: string) => QA_STUDENTS.some((s) => assignment_ids.some((a) => p.startsWith(`${s}/${a}/`)));
  for (const a of answers || []) if (a.file_url && inScope(a.file_url)) paths.add(a.file_url);
  const listFailures: string[] = [];
  for (const s of QA_STUDENTS) for (const a of assignment_ids) {
    const { data: objs, error } = await admin.storage.from(BUCKET).list(`${s}/${a}`, { limit: 1000 });
    if (error) { listFailures.push(`${s}/${a}: ${error.message}`); continue; }
    for (const o of objs || []) if (o.id) paths.add(`${s}/${a}/${o.name}`);
  }

  // Guard counts of data that must not change.
  const guard = async () => {
    const c = async (t: string, f?: (q: any) => any) => {
      let q: any = admin.from(t).select("*", { count: "exact", head: true });
      if (f) q = f(q);
      const { count } = await q; return count ?? -1;
    };
    return {
      assignments: await c("assignments"),
      assignment_questions: await c("assignment_questions"),
      calendar: await c("calendar"),
      user_roles: await c("user_roles"),
      other_submissions: await c("student_submissions", (q: any) => q.not("id", "in", `(${subIds.length ? subIds.join(",") : "00000000-0000-0000-0000-000000000000"})`)),
    };
  };

  const plan = {
    submissions: subIds.length,
    answers: (answers || []).length,
    files: [...paths],
    list_failures: listFailures,
  };
  if (dry_run) return json(200, { dry_run: true, plan, guard: await guard() });
  if (listFailures.length) return json(502, { error: "Could not list files; nothing deleted", plan });

  const before = await guard();
  const report: Record<string, unknown> = {};
  const fileList = [...paths];
  if (fileList.length) {
    const { data: removed, error } = await admin.storage.from(BUCKET).remove(fileList);
    if (error) return json(502, { error: "File removal failed; rows kept so retry is safe", detail: error.message, plan });
    report.files_removed = (removed || []).length;
  } else report.files_removed = 0;

  if ((answers || []).length) {
    const { error, count } = await admin.from("student_answers").delete({ count: "exact" }).in("submission_id", subIds);
    if (error) return json(500, { error: "Answer delete failed (files already gone); retry is safe", detail: error.message, report });
    report.answers_deleted = count;
  } else report.answers_deleted = 0;

  if (subIds.length) {
    const { error, count } = await admin.from("student_submissions").delete({ count: "exact" }).in("id", subIds);
    if (error) return json(500, { error: "Submission delete failed; retry is safe", detail: error.message, report });
    report.submissions_deleted = count;
  } else report.submissions_deleted = 0;

  const after = await guard();
  const unchanged = JSON.stringify(before) === JSON.stringify(after);
  return json(unchanged ? 200 : 500, { dry_run: false, report, guard_before: before, guard_after: after, unrelated_unchanged: unchanged });
});
