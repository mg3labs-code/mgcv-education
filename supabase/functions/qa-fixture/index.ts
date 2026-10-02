// TEMPORARY QA fixture creator. Delete after pilot QA.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";
const KEY = "qa-7f3c9e1b-pilot-fixture-2026";
const PASS = "PilotQa#2026x";
const T = (n: string, b: string, s: string) => ({ role: "teacher", full_name: n, school_name: "QA School", sections: [s], teaching_map: [{ subject: "Mathematics", board: b, grade: 9, section: s }] });
const S = (n: string, b: string, s: string) => ({ role: "student", full_name: n, board: b, grade: 9, class_name: "Class 9", section: s, school_name: "QA School" });
const USERS: Record<string, any> = {
  "qa.t1@mgcv-pilot.test": T("QA Teacher 9A", "CBSE", "A"),
  "qa.t2@mgcv-pilot.test": T("QA Teacher 9B", "CBSE", "B"),
  "qa.s1@mgcv-pilot.test": S("QA Student One", "CBSE", "A"),
  "qa.s2@mgcv-pilot.test": S("QA Student Two", "CBSE", "A"),
  "qa.s3@mgcv-pilot.test": S("QA Student 9B", "CBSE", "B"),
  "qa.s4@mgcv-pilot.test": S("QA Student ICSE", "ICSE", "A"),
};
Deno.serve(async (req) => {
  const { key } = await req.json().catch(() => ({}));
  if (key !== KEY) return new Response("no", { status: 403 });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const out: any[] = [];
  for (const [email, meta] of Object.entries(USERS)) {
    const { data, error } = await admin.auth.admin.createUser({ email, password: PASS, email_confirm: true, user_metadata: meta });
    out.push({ email, id: data?.user?.id, error: error?.message });
    if (meta.role === "student" && data?.user) {
      await admin.from("student_preferences").update({ onboarding_completed: true }).eq("user_id", data.user.id);
    }
  }
  return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json" } });
});
