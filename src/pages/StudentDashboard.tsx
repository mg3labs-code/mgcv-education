import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { findTextbookMatch } from "@/data/topicTextbookMap";
import PopQuizModal from "@/components/student/PopQuizModal";
import LearnTab from "@/components/student/LearnTab";
import TasksTab from "@/components/student/TasksTab";
import GrowthTab from "@/components/student/GrowthTab";

interface ScheduleItem {
  type: string;
  title?: string;
  label?: string;
  cssClass?: string;
  chapterId?: string;
  isNational?: boolean;
}

interface SubjectSchedule {
  subject: string;
  schedule: Record<string, ScheduleItem>;
  chapters: { id: string; name: string; colorHex: string }[];
}

const SUBJECT_META: Record<string, { icon: string; time: string; color: string }> = {
  "Mathematics": { icon: "📐", time: "9:00 AM", color: "#7C3AED" },
  "Science": { icon: "🔬", time: "10:00 AM", color: "#059669" },
  "English": { icon: "📖", time: "11:15 AM", color: "#2563EB" },
  "Social Science": { icon: "🌍", time: "1:00 PM", color: "#F59E0B" },
  "Hindi": { icon: "🇮🇳", time: "2:00 PM", color: "#f56565" },
  "Sanskrit": { icon: "🕉️", time: "3:00 PM", color: "#38b2ac" },
};

const BREAKS = [
  { time: "11:00 AM", subject: "Break", icon: "☕", topic: "Refresh & Energize", type: "break" as const },
  { time: "12:15 PM", subject: "Lunch Break", icon: "🍽️", topic: "Nutrition and Rest", type: "break" as const },
];

// ============ INLINE-STYLED COMPONENTS (from user's provided JSX) ============

function FadeSlide({ children, delay = 0, show = true }: { children: React.ReactNode; delay?: number; show?: boolean }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (show) { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }
    else setVisible(false);
  }, [show, delay]);
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(12px)",
      transition: "opacity 0.4s ease, transform 0.4s ease",
    }}>
      {children}
    </div>
  );
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "white", borderRadius: 16, border: "1px solid #E7E5E4",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: 24, ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, title, badge = null }: { icon: string; title: string; badge?: { text: string; color: string } | null }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 20, fontWeight: 700, color: "#1C1917", margin: 0 }}>
        {icon} {title}
      </h3>
      {badge && (
        <span style={{ background: badge.color + "15", color: badge.color, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
          {badge.text}
        </span>
      )}
    </div>
  );
}

function ScheduleWidget({ items, compact = false, onOpenTopic }: {
  items: { time: string; subject: string; icon: string; topic: string; type: string; color: string }[];
  compact?: boolean;
  onOpenTopic?: (topic: string) => void;
}) {
  const classes = items.filter(i => i.type !== "break");
  const display = compact ? classes.slice(0, 3) : classes.slice(0, 5);

  return (
    <Card>
      <SectionTitle icon="📅" title="Today's Classes" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {display.map((c, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
            borderRadius: 12, background: i === 0 ? "#F0FDFA" : "#FAFAF9",
            borderLeft: `4px solid ${c.color}`, cursor: i === 0 ? "pointer" : "default",
          }} onClick={() => i === 0 && onOpenTopic?.(c.topic)}>
            <span style={{ fontSize: 12, color: "#78716C", minWidth: 60, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{c.time}</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: "#1C1917" }}>{c.subject}</span>
            {c.type !== "break" && <span style={{ fontSize: 13, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>{c.topic}</span>}
            {i === 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669", animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'DM Sans', sans-serif" }}>HAPPENING NOW</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function ContinueLearning({ chapter = "Real Numbers", episode = "The Number Family", progress = 35, onContinue }: {
  chapter?: string; episode?: string; progress?: number; onContinue?: () => void;
}) {
  return (
    <Card>
      <SectionTitle icon="📖" title="Continue Learning" />
      <div style={{
        display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
        borderRadius: 14, background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)",
        border: "1px solid #BFDBFE",
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: "linear-gradient(135deg, #3B82F6, #6366F1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontSize: 20, fontWeight: 700, fontFamily: "'Source Serif 4', serif",
          flexShrink: 0,
        }}>1</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 15, color: "#1C1917" }}>{chapter}</div>
          <div style={{ fontSize: 13, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>{episode}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1, height: 6, background: "#DBEAFE", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #3B82F6, #6366F1)", borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#3B82F6", fontFamily: "'DM Sans', sans-serif" }}>{progress}%</span>
          </div>
        </div>
        <button onClick={onContinue} style={{
          background: "#0D9488", color: "white", border: "none", padding: "10px 20px",
          borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
        }}>
          Continue →
        </button>
      </div>
    </Card>
  );
}

function InnerOS({ position = "normal", scores }: {
  position?: "normal" | "hero";
  scores: { name: string; score: number; icon: string; color: string; prev: number }[];
}) {
  const avgScore = Math.round(scores.reduce((a, d) => a + d.score, 0) / scores.length);

  if (position === "hero") {
    return (
      <div style={{
        background: "linear-gradient(135deg, #0D9488, #134E4A)",
        borderRadius: 20, padding: "32px 28px", color: "white",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -40, right: -40, width: 200, height: 200,
          borderRadius: "50%", background: "rgba(255,255,255,0.06)",
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
              <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="white" strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={`${(avgScore / 100) * 314} 314`} />
              </svg>
              <div style={{
                position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Source Serif 4', serif" }}>{avgScore}%</span>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 22, fontWeight: 700, margin: 0 }}>Your Learning Strengths</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: "4px 0 8px", fontFamily: "'DM Sans', sans-serif" }}>Growing stronger every day</p>
              <span style={{
                background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: 20,
                fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
              }}>↑ +5% this week</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginTop: 24 }}>
            {scores.map(d => {
              const change = d.score - d.prev;
              return (
                <div key={d.name} style={{
                  textAlign: "center", padding: "12px 8px",
                  background: "rgba(255,255,255,0.08)", borderRadius: 12,
                }}>
                  <div style={{ fontSize: 24 }}>{d.icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Source Serif 4', serif", marginTop: 4 }}>{d.score}%</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "'DM Sans', sans-serif" }}>{d.name}</div>
                  {change > 0 && <div style={{ fontSize: 10, color: "#6EE7B7", fontWeight: 600, marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>+{change}%</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Normal card version (Phase 2)
  return (
    <Card>
      <SectionTitle icon="📊" title="Your Learning Strengths" badge={{ text: "NEW", color: "#0D9488" }} />
      <p style={{ fontSize: 13, color: "#78716C", margin: "-8px 0 16px", fontFamily: "'DM Sans', sans-serif" }}>
        These grow as you learn. Complete more lessons to strengthen them!
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        {scores.map(d => (
          <div key={d.name} style={{ textAlign: "center", padding: "12px 8px" }}>
            <div style={{ fontSize: 28 }}>{d.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1C1917", fontFamily: "'Source Serif 4', serif", marginTop: 4 }}>{d.score}%</div>
            <div style={{ fontSize: 11, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>{d.name}</div>
            <div style={{ width: "100%", height: 4, background: "#E7E5E4", borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
              <div style={{ width: `${d.score}%`, height: "100%", background: d.color, borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ScholarMethods({ methodCounts }: { methodCounts: Record<string, number> }) {
  const methods = [
    { key: "tutorial_defense", icon: "🛡️", name: "Debate Challenge", desc: "Defend your understanding in 6 rounds of AI questioning", tag: "5 min", color: "#0D9488" },
    { key: "first_principles", icon: "🔬", name: "Break It Down", desc: "Strip concepts to basics. Rebuild from scratch, like Feynman.", tag: "10 min", color: "#7C3AED" },
    { key: "case_study", icon: "📋", name: "Case Study", desc: "Apply what you learned to real-world problems", tag: "8 min", color: "#2563EB" },
    { key: "peer_teaching", icon: "🎤", name: "Teach It", desc: "Explain the concept as if teaching a friend", tag: "Coming Soon", color: "#A8A29E" },
  ];

  return (
    <Card>
      <SectionTitle icon="🎓" title="Think Like a Scholar" />
      <p style={{ fontSize: 13, color: "#78716C", margin: "-8px 0 16px", fontFamily: "'DM Sans', sans-serif" }}>
        World-class thinking tools adapted for you
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {methods.map(m => {
          const sessions = methodCounts?.[m.key] ?? 0;
          const isAvailable = m.key !== "peer_teaching";
          return (
            <div key={m.key} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
              borderRadius: 12, border: "1px solid #E7E5E4",
              background: isAvailable ? "white" : "#FAFAF9",
              opacity: isAvailable ? 1 : 0.6,
              cursor: isAvailable ? "pointer" : "not-allowed",
            }}>
              <span style={{ fontSize: 28 }}>{m.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, color: "#1C1917" }}>{m.name}</div>
                <div style={{ fontSize: 12, color: "#78716C", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{m.desc}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: m.color,
                    background: m.color + "12", padding: "2px 8px", borderRadius: 12,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>{m.tag}</span>
                  {isAvailable && (
                    <span style={{ fontSize: 11, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>{sessions} done</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function StatsRow({ streakDays, episodesCompleted }: { streakDays: number; episodesCompleted: number }) {
  const stats = [
    { label: "Episodes", value: String(episodesCompleted), icon: "📖" },
    { label: "Study Time", value: "4.2h", icon: "⏱" },
    { label: "Streak", value: `${streakDays} days`, icon: "🔥" },
    { label: "Gems", value: "45", icon: "💎" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background: "white", borderRadius: 14, border: "1px solid #E7E5E4",
          padding: "16px 12px", textAlign: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{ fontSize: 24 }}>{s.icon}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1C1917", fontFamily: "'Source Serif 4', serif", marginTop: 4 }}>{s.value}</div>
          <div style={{ fontSize: 11, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function LockedPlaceholder({ icon, title, unlockText }: { icon: string; title: string; unlockText: string }) {
  return (
    <div style={{
      background: "#FAFAF9", border: "1px dashed #D6D3D1", borderRadius: 16,
      padding: "40px 24px", textAlign: "center",
    }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 16, color: "#78716C" }}>{title}</div>
      <div style={{ fontSize: 12, color: "#A8A29E", marginTop: 6, fontFamily: "'DM Sans', sans-serif" }}>🔒 {unlockText}</div>
    </div>
  );
}

function BuddyFAB() {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, width: 56, height: 56,
      borderRadius: "50%", background: "#0D9488",
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", boxShadow: "0 4px 20px rgba(13,148,136,0.4)",
      fontSize: 24, zIndex: 50,
    }}>
      💬
    </div>
  );
}

// ============ MAIN COMPONENT ============

const StudentDashboard = () => {
  const { fullName, user } = useAuth();
  const navigate = useNavigate();
  const firstName = fullName?.split(" ")[0] || "Student";
  const [subjectSchedules, setSubjectSchedules] = useState<SubjectSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizSubject, setQuizSubject] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("home");

  const { data: innerOS } = useQuery({
    queryKey: ["student-inner-os", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("student_inner_os").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: methodCounts } = useQuery({
    queryKey: ["student-method-counts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("method_sessions").select("method_type, completed").eq("user_id", user!.id);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((s) => { counts[s.method_type] = (counts[s.method_type] || 0) + 1; });
      return counts;
    },
    enabled: !!user,
  });

  const { data: episodeCount } = useQuery({
    queryKey: ["student-episode-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase.from("episode_progress").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: breakthroughs } = useQuery({
    queryKey: ["student-breakthroughs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("student_breakthroughs").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const streakDays = innerOS?.streak_days ?? 0;
  const accountCreated = innerOS?.created_at ? new Date(innerOS.created_at) : null;
  const accountAgeDays = accountCreated ? Math.floor((Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  // Phase computation
  const phase = useMemo(() => {
    const eps = episodeCount ?? 0;
    if (accountAgeDays >= 14) return 4;
    if (accountAgeDays >= 7) return 3;
    if (eps >= 3) return 2;
    return 1;
  }, [episodeCount, accountAgeDays]);

  useEffect(() => {
    const fetchAllSchedules = async () => {
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("class_name").eq("user_id", user.id).maybeSingle();
      if (!profile?.class_name) { setLoading(false); return; }
      const { data: schedules } = await supabase.from("teaching_schedules").select("subject, schedule_data, chapters_data").eq("class_name", profile.class_name);
      if (schedules) {
        setSubjectSchedules(schedules.map((s) => ({
          subject: s.subject,
          schedule: s.schedule_data as unknown as Record<string, ScheduleItem>,
          chapters: (s.chapters_data as unknown as { id: string; name: string; colorHex: string }[]) || [],
        })));
      }
      setLoading(false);
    };
    fetchAllSchedules();
  }, [user]);

  const todayKey = new Date().toISOString().split("T")[0];

  const todayScheduleItems = useMemo(() => {
    const items: { time: string; subject: string; icon: string; topic: string; type: string; color: string }[] = [];
    const orderedSubjects = Object.keys(SUBJECT_META);
    orderedSubjects.forEach((subjectName) => {
      const subSchedule = subjectSchedules.find((s) => s.subject === subjectName);
      const meta = SUBJECT_META[subjectName];
      const todayItem = subSchedule?.schedule[todayKey];
      if (todayItem) {
        const chapterName = todayItem.chapterId ? subSchedule?.chapters.find((c) => c.id === todayItem.chapterId)?.name : undefined;
        let topic = todayItem.title || todayItem.label || "Scheduled";
        if (chapterName) topic = `${chapterName}: ${topic}`;
        items.push({ time: meta.time, subject: subjectName, icon: meta.icon, topic, type: todayItem.type, color: meta.color });
      } else {
        items.push({ time: meta.time, subject: subjectName, icon: meta.icon, topic: "Regular Class", type: "class", color: meta.color });
      }
      if (subjectName === "Science") items.push({ time: BREAKS[0].time, subject: BREAKS[0].subject, icon: BREAKS[0].icon, topic: BREAKS[0].topic, type: "break", color: "#A8A29E" });
      if (subjectName === "English") items.push({ time: BREAKS[1].time, subject: BREAKS[1].subject, icon: BREAKS[1].icon, topic: BREAKS[1].topic, type: "break", color: "#A8A29E" });
    });
    return items;
  }, [subjectSchedules, todayKey]);

  const dimensionScores = [
    { name: "Clarity", score: innerOS?.clarity_score ?? 45, icon: "👁️", color: "#0D9488", prev: 38 },
    { name: "Thinking", score: innerOS?.thinking_score ?? 48, icon: "🧠", color: "#7C3AED", prev: 40 },
    { name: "Focus", score: innerOS?.attention_score ?? 42, icon: "🎯", color: "#F59E0B", prev: 42 },
    { name: "Momentum", score: innerOS?.momentum_score ?? 38, icon: "⚡", color: "#3B82F6", prev: 30 },
    { name: "Character", score: innerOS?.character_score ?? 44, icon: "❤️", color: "#EC4899", prev: 40 },
  ];

  const greeting = phase === 1 ? "Let's start your learning journey"
    : phase === 2 ? "You're making progress! Keep going"
    : phase === 3 ? "Your thinking is getting sharper"
    : "You're on fire this week!";

  return (
    <DashboardLayout role="student" phase={phase} activeTab={activeTab} onTabChange={(tab) => {
      if (tab === "calendar") { navigate("/student/calendar"); return; }
      setActiveTab(tab);
    }}>
      <div style={{
        background: "#FFFBF5", minHeight: "100vh",
        fontFamily: "'DM Sans', sans-serif", color: "#1C1917",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
          <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>

          {/* ===== HOME TAB ===== */}
          {activeTab === "home" && (
            <>
              {/* Greeting */}
              <FadeSlide>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 26, fontWeight: 700, color: "#1C1917" }}>
                    Hi, {firstName}! 👋
                  </div>
                  <p style={{ fontSize: 14, color: "#78716C", margin: "4px 0 0" }}>{greeting}</p>
                </div>
              </FadeSlide>

              {/* PHASE 4: Inner OS as hero */}
              <FadeSlide show={phase >= 4} delay={0}>
                {phase >= 4 && <InnerOS position="hero" scores={dimensionScores} />}
              </FadeSlide>

              {/* PHASE 4: Stats row */}
              <FadeSlide show={phase >= 4} delay={100}>
                {phase >= 4 && (
                  <div style={{ marginTop: 16 }}>
                    <StatsRow streakDays={streakDays} episodesCompleted={episodeCount ?? 0} />
                  </div>
                )}
              </FadeSlide>

              {/* ALWAYS: Today's Schedule */}
              <div style={{ marginTop: 20 }}>
                <FadeSlide delay={50}>
                  {loading ? (
                    <Card><p style={{ textAlign: "center", color: "#78716C", padding: 24 }}>Loading schedule...</p></Card>
                  ) : (
                    <ScheduleWidget
                      items={todayScheduleItems}
                      compact={phase <= 2}
                      onOpenTopic={(topic) => {
                        const match = findTextbookMatch(topic);
                        if (match?.episodeId) navigate(`/student/textbook/${match.chapterId}/${match.episodeId}`);
                        else navigate("/student/textbook");
                      }}
                    />
                  )}
                </FadeSlide>
              </div>

              {/* ALWAYS: Continue Learning */}
              <div style={{ marginTop: 16 }}>
                <FadeSlide delay={100}>
                  <ContinueLearning onContinue={() => navigate("/student/textbook/ch1")} />
                </FadeSlide>
              </div>

              {/* PHASE 2: Inner OS as normal card */}
              {phase === 2 || phase === 3 ? (
                <div style={{ marginTop: 16 }}>
                  <FadeSlide show={phase >= 2} delay={150}>
                    <InnerOS position="normal" scores={dimensionScores} />
                  </FadeSlide>
                </div>
              ) : null}

              {/* PHASE 3+: Scholar Methods */}
              {phase >= 3 && (
                <div style={{ marginTop: 16 }}>
                  <FadeSlide show={phase >= 3} delay={200}>
                    <ScholarMethods methodCounts={methodCounts ?? {}} />
                  </FadeSlide>
                </div>
              )}

              {/* PHASE 1-2: Locked placeholders */}
              {phase < 2 && (
                <div style={{ marginTop: 16 }}>
                  <FadeSlide delay={200}>
                    <LockedPlaceholder icon="📊" title="Your Learning Strengths" unlockText="Complete 3 episodes to unlock" />
                  </FadeSlide>
                </div>
              )}
              {phase < 3 && (
                <div style={{ marginTop: 16 }}>
                  <FadeSlide delay={250}>
                    <LockedPlaceholder icon="🎓" title="Think Like a Scholar" unlockText="Unlocks after 1 week of learning" />
                  </FadeSlide>
                </div>
              )}
            </>
          )}

          {/* ===== LEARN TAB ===== */}
          {activeTab === "learn" && (
            <LearnTab methodCounts={methodCounts ?? {}} />
          )}

          {/* ===== TASKS TAB ===== */}
          {activeTab === "tasks" && (
            <TasksTab onOpenQuiz={(subject) => setQuizSubject(subject)} />
          )}

          {/* ===== GROWTH TAB ===== */}
          {activeTab === "growth" && phase >= 2 && (
            <>
              <FadeSlide>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 26, fontWeight: 700, color: "#1C1917" }}>
                    📊 My Growth
                  </div>
                  <p style={{ fontSize: 14, color: "#78716C", margin: "4px 0 0" }}>Track your learning journey</p>
                </div>
              </FadeSlide>
              <InnerOS position="hero" scores={dimensionScores} />
              <div style={{ marginTop: 16 }}>
                <StatsRow streakDays={streakDays} episodesCompleted={episodeCount ?? 0} />
              </div>
            </>
          )}
        </div>

        <BuddyFAB />
      </div>

      {quizSubject && <PopQuizModal open={!!quizSubject} onClose={() => setQuizSubject(null)} subject={quizSubject} />}
    </DashboardLayout>
  );
};

export default StudentDashboard;
