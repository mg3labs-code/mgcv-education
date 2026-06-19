import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type TeacherRow = {
  teacher_id: string;
  subject: string;
  full_name: string;
  phone: string | null;
  school_name: string | null;
};

const subjectIcon: Record<string, string> = {
  Mathematics: "🔢", Science: "🔬", Physics: "⚛️", Chemistry: "🧪",
  Biology: "🧬", "Social Science": "🌍", English: "📖",
  Hindi: "🇮🇳", Sanskrit: "📜", Telugu: "🪔",
};

const MyTeachersSection = () => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [ctx, setCtx] = useState<{ board: string; grade: number; section: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const { data: prof } = await (supabase as any)
        .from("student_profiles")
        .select("board, grade, section")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!prof) { setLoading(false); return; }
      if (!cancelled) setCtx(prof);

      const { data: maps } = await (supabase as any)
        .from("teacher_teaching_map")
        .select("teacher_id, subject")
        .eq("board", prof.board)
        .eq("grade", prof.grade)
        .eq("section", prof.section);

      const ids = Array.from(new Set((maps ?? []).map((m: any) => m.teacher_id)));
      if (ids.length === 0) { if (!cancelled) { setTeachers([]); setLoading(false); } return; }

      const { data: profs } = await (supabase as any)
        .from("teacher_profiles")
        .select("user_id, full_name, school_name")
        .in("user_id", ids);

      const byId = new Map<string, any>((profs ?? []).map((p: any) => [p.user_id, p]));
      const rows: TeacherRow[] = (maps ?? []).map((m: any) => {
        const p = byId.get(m.teacher_id);
        return {
          teacher_id: m.teacher_id,
          subject: m.subject,
          full_name: p?.full_name ?? "Teacher",
          phone: p?.phone ?? null,
          school_name: p?.school_name ?? null,
        };
      });
      if (!cancelled) { setTeachers(rows); setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 20, fontWeight: 700, color: "#1C1917" }}>
          👩‍🏫 My Teachers
        </h3>
        <p style={{ fontSize: 13, color: "#78716C", margin: "2px 0 0" }}>
          {ctx ? `Teachers assigned to ${ctx.board} • Class ${ctx.grade} • Section ${ctx.section}` : "Loading your class context…"}
        </p>
      </div>

      {loading ? (
        <div style={{ color: "#78716C", fontSize: 14 }}>Loading teachers…</div>
      ) : teachers.length === 0 ? (
        <div style={{
          padding: 20, borderRadius: 14, background: "#FFFBF5",
          border: "1.5px dashed #E7E5E4", color: "#78716C", fontSize: 14,
        }}>
          No teachers are registered for your class and section yet.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
          {teachers.map((t, i) => (
            <div key={`${t.teacher_id}-${t.subject}-${i}`} style={{
              padding: 16, borderRadius: 14, background: "white",
              border: "1.5px solid #E7E5E4",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "linear-gradient(135deg, #0D9488, #14B8A6)",
                color: "white", fontWeight: 700, fontSize: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {t.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "#1C1917", fontSize: 14 }}>{t.full_name}</div>
                <div style={{ fontSize: 12, color: "#0D9488", fontWeight: 600, marginTop: 2 }}>
                  {subjectIcon[t.subject] ?? "📚"} {t.subject}
                </div>
                {t.school_name && (
                  <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 2 }}>{t.school_name}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTeachersSection;
