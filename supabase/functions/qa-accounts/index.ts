// QA-only account setup. Admin-only. Touches ONLY @mgcv-pilot.test accounts:
// sets the shared QA test password and creates one test teacher per CBSE 9A subject.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (s: number, b: unknown) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const DOMAIN = "@mgcv-pilot.test";
const PASSWORD = "12345678";
const SUBJECT_TEACHERS: Array<[string, string, string]> = [
  ["qa.science", "QA Science Teacher", "Science"],
  ["qa.physics", "QA Physics Teacher", "Physics"],
  ["qa.chemistry", "QA Chemistry Teacher", "Chemistry"],
  ["qa.biology", "QA Biology Teacher", "Biology"],
  ["qa.english", "QA English Teacher", "English"],
  ["qa.hindi", "QA Hindi Teacher", "Hindi"],
  ["qa.sst", "QA Social Science Teacher", "Social Science"],
  ["qa.sanskrit", "QA Sanskrit Teacher", "Sanskrit"],
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return json(401, { error: "Unauthorized" });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user } } = await admin.auth.getUser(auth.slice(7));
  if (!user) return json(401, { error: "Unauthorized" });
  const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
  if (isAdmin !== true) return json(403, { error: "Admins only" });

  const out: Record<string, string> = {};
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = new Map((list?.users ?? []).map((u) => [u.email ?? "", u.id]));

  for (const [name, full, subject] of SUBJECT_TEACHERS) {
    const email = name + DOMAIN;
    if (existing.has(email)) continue;
    const { data, error } = await admin.auth.admin.createUser({
      email, password: PASSWORD, email_confirm: true,
      user_metadata: {
        full_name: full, role: "teacher", school_name: "MGCV QA School", class_name: "",
        teaching_map: [{ subject, board: "CBSE", grade: 9, section: "A" }],
      },
    });
    out[email] = error ? `create failed: ${error.message}` : "created";
    if (data?.user) existing.set(email, data.user.id);
  }
  for (const [email, id] of existing) {
    if (!email.endsWith(DOMAIN)) continue; // never touch real accounts
    const { error } = await admin.auth.admin.updateUserById(id, { password: PASSWORD });
    out[email] = (out[email] ? out[email] + "; " : "") + (error ? `password failed: ${error.message}` : "password set");
  }
  return json(200, out);
});
