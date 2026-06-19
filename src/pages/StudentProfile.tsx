import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import MyTeachersSection from "@/components/student/MyTeachersSection";
import ScheduleCalendar from "@/components/student/ScheduleCalendar";

interface ScheduleItem {
  type: string;
  title?: string;
  label?: string;
  chapterId?: string;
  isNational?: boolean;
}

interface Profile {
  full_name: string;
  board: string;
  grade: number;
  section: string;
  school_name: string | null;
  phone: string | null;
}

interface Prefs {
  preferred_language: string;
  difficulty_level: string;
  learning_style: string | null;
  interests: string[] | null;
  interest_domains: string[];
}

const StudentProfile = () => {
  const { user } = useAuth();
  const email = user?.email;
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [loading, setLoading] = useState(true);

  // Monthly calendar data
  const [schedule, setSchedule] = useState<Record<string, ScheduleItem>>({});
  const [chapters, setChapters] = useState<{ id: string; name: string; colorHex: string }[]>([]);
  const [calSubject] = useState("Mathematics");

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [{ data: prof }, { data: pref }, { data: phone }] = await Promise.all([
        (supabase as any).from("student_profiles").select("full_name,board,grade,section,school_name").eq("user_id", user.id).maybeSingle(),
        (supabase as any).from("student_preferences").select("preferred_language,difficulty_level,learning_style,interests,interest_domains").eq("user_id", user.id).maybeSingle(),
        (supabase as any).rpc("get_my_student_phone"),
      ]);
      setProfile(prof ? { ...prof, phone: phone ?? null } : prof);
      setPrefs(pref);

      if (prof) {
        const className = `Class ${prof.grade}`;
        const { data: rows } = await (supabase as any)
          .from("calendar")
          .select("subject,date,entry_type,chapter_id,chapter_name,chapter_color,topic_title,label,is_national_holiday")
          .eq("class_name", className)
          .eq("subject", calSubject);

        const sched: Record<string, ScheduleItem> = {};
        const chMap = new Map<string, { id: string; name: string; colorHex: string }>();
        (rows ?? []).forEach((r: any) => {
          sched[r.date] = {
            type: r.entry_type,
            title: r.topic_title || r.label || undefined,
            label: r.label || undefined,
            chapterId: r.chapter_id || undefined,
            isNational: r.is_national_holiday,
          };
          if (r.chapter_id && !chMap.has(r.chapter_id)) {
            chMap.set(r.chapter_id, { id: r.chapter_id, name: r.chapter_name || r.chapter_id, colorHex: r.chapter_color || "#6b7280" });
          }
        });
        setSchedule(sched);
        setChapters(Array.from(chMap.values()));
      }
      setLoading(false);
    })();
  }, [user, calSubject]);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "S";

  return (
    <DashboardLayout role="student" breadcrumbItems={[{ label: "Dashboard", href: "/student" }, { label: "My Profile" }]}>
      <div style={{ background: "#FFFBF5", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", padding: "24px 16px" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <h1 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 28, fontWeight: 700, color: "#1C1917", marginBottom: 4 }}>
            👤 My Profile
          </h1>
          <p style={{ fontSize: 14, color: "#78716C", marginBottom: 20 }}>
            Your onboarding details, learning preferences, teachers, and monthly schedule.
          </p>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#78716C" }}>Loading profile…</div>
          ) : (
            <>
              {/* Profile + preferences CARD with edit icon top-right */}
              <div style={{
                position: "relative",
                background: "linear-gradient(135deg, #FFFFFF 0%, #FEFCE8 100%)",
                borderRadius: 20,
                border: "1.5px solid #E7E5E4",
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                padding: 24,
                marginBottom: 28,
              }}>
                {/* Edit button top-right */}
                <button
                  onClick={() => navigate("/student/onboarding")}
                  aria-label="Edit profile"
                  title="Edit profile & preferences"
                  style={{
                    position: "absolute", top: 14, right: 14,
                    width: 38, height: 38, borderRadius: "50%",
                    background: "white", border: "1.5px solid #E7E5E4",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "#0D9488",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </button>

                {/* Top: avatar + identity */}
                <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 20 }}>
                  <div style={{
                    width: 76, height: 76, borderRadius: "50%",
                    background: "linear-gradient(135deg, #0D9488, #14B8A6)",
                    color: "white", fontWeight: 700, fontSize: 28,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 6px 16px rgba(13,148,136,0.25)",
                  }}>
                    {initials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 22, fontWeight: 700, color: "#1C1917" }}>
                      {profile?.full_name || "Student"}
                    </div>
                    <div style={{ fontSize: 13, color: "#78716C", marginTop: 2 }}>{email}</div>
                    {profile?.school_name && (
                      <div style={{ fontSize: 12, color: "#A8A29E", marginTop: 2 }}>🏫 {profile.school_name}</div>
                    )}
                  </div>
                </div>

                {/* Detail grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                  {[
                    { label: "Board", value: profile?.board, icon: "🎓" },
                    { label: "Class", value: profile ? `Class ${profile.grade}` : "—", icon: "📚" },
                    { label: "Section", value: profile?.section, icon: "🏷️" },
                    { label: "Phone", value: profile?.phone || "—", icon: "📞" },
                    { label: "Language", value: prefs?.preferred_language || "English", icon: "🌐" },
                    { label: "Difficulty", value: prefs?.difficulty_level || "medium", icon: "⚙️" },
                    { label: "Learning Style", value: prefs?.learning_style || "—", icon: "🎨" },
                  ].map((d) => (
                    <div key={d.label} style={{
                      background: "white", border: "1px solid #E7E5E4", borderRadius: 12, padding: "10px 12px",
                    }}>
                      <div style={{ fontSize: 11, color: "#A8A29E", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>
                        {d.icon} {d.label}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1C1917", marginTop: 4, textTransform: "capitalize" }}>
                        {d.value || "—"}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Interests chips */}
                {(prefs?.interests?.length || prefs?.interest_domains?.length) ? (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 11, color: "#A8A29E", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>
                      ✨ Interests
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {[...(prefs?.interests ?? []), ...(prefs?.interest_domains ?? [])].map((it, i) => (
                        <span key={`${it}-${i}`} style={{
                          padding: "4px 10px", borderRadius: 999,
                          background: "#F0FDFA", color: "#0D9488",
                          fontSize: 12, fontWeight: 600, border: "1px solid #CCFBF1",
                        }}>{it}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Teachers (uneditable cards) */}
              <MyTeachersSection />

              {/* Monthly calendar */}
              <div style={{ marginTop: 32 }}>
                <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 20, fontWeight: 700, color: "#1C1917", marginBottom: 12 }}>
                  📅 Monthly Schedule
                </h3>
                <ScheduleCalendar
                  scheduleData={schedule}
                  className={profile ? `Class ${profile.grade} ${profile.board}` : "Class"}
                  subject={calSubject}
                  chaptersData={chapters}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentProfile;
