import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubjects, useChapters } from "@/hooks/useTextbookData";

interface LearnTabProps {
  methodCounts: Record<string, number>;
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

function SectionTitle({ icon, title, subtitle, right }: { icon: string; title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div>
        <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 20, fontWeight: 700, color: "#1C1917", margin: 0 }}>
          {icon} {title}
        </h3>
        {subtitle && <p style={{ fontSize: 13, color: "#78716C", margin: "4px 0 0", fontFamily: "'DM Sans', sans-serif" }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

const SUBJECT_ICONS: Record<string, string> = {
  Mathematics: "🔢", Science: "🔬", English: "📖", "Social Science": "🌍",
  Hindi: "📝", Telugu: "📝", Sanskrit: "🕉️", Physics: "⚛️", Chemistry: "🧪", Biology: "🧬",
};

const LearnTab = ({ methodCounts }: LearnTabProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: subjects } = useSubjects();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);

  // Auto-select first subject
  const activeSubjectName = selectedSubject || subjects?.[0]?.name || null;
  const { data: chapters } = useChapters(activeSubjectName || undefined);

  // Continue learning — latest incomplete episode
  const { data: continueData } = useQuery({
    queryKey: ["learn-continue", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episode_progress")
        .select("chapter_id, episode_id, completion_pct, started_at")
        .eq("user_id", user!.id)
        .lt("completion_pct", 100)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Recently visited episodes
  const { data: recentEpisodes } = useQuery({
    queryKey: ["learn-recent", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episode_progress")
        .select("chapter_id, episode_id, completion_pct, started_at")
        .eq("user_id", user!.id)
        .order("started_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // Chapter progress counts (episodes completed per chapter for this user)
  const { data: chapterProgress } = useQuery({
    queryKey: ["learn-chapter-progress", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episode_progress")
        .select("chapter_id, completion_pct")
        .eq("user_id", user!.id);
      if (error) throw error;
      const map: Record<string, { completed: number; total: number }> = {};
      (data ?? []).forEach((ep) => {
        if (!map[ep.chapter_id]) map[ep.chapter_id] = { completed: 0, total: 0 };
        map[ep.chapter_id].total++;
        if (ep.completion_pct >= 100) map[ep.chapter_id].completed++;
      });
      return map;
    },
    enabled: !!user,
  });

  const continueChapterId = continueData?.chapter_id || "ch1";
  const continueEpisodeId = continueData?.episode_id || "";
  const continueProgress = continueData?.completion_pct ?? 0;

  // Find chapter/episode titles from chapters data
  const continueChapter = chapters?.find((c) => c.id === continueChapterId);
  const continueEpisode = continueChapter?.episodes?.find((e) => e.id === continueEpisodeId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Continue Learning */}
      <Card>
        <SectionTitle icon="📖" title="Continue Learning" />
        <div
          style={{
            display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
            borderRadius: 14, background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)",
            border: "1px solid #BFDBFE", cursor: "pointer",
          }}
          onClick={() => navigate(`/student/textbook/${continueChapterId}${continueEpisodeId ? `/${continueEpisodeId}` : ""}`)}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "linear-gradient(135deg, #3B82F6, #6366F1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 20, fontWeight: 700, fontFamily: "'Source Serif 4', serif",
            flexShrink: 0,
          }}>
            {continueChapter?.number ?? "1"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 15, color: "#1C1917" }}>
              {continueChapter?.title ?? "Real Numbers"}
            </div>
            <div style={{ fontSize: 13, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>
              {continueEpisode?.title ? `Ep ${continueEpisode.number}: ${continueEpisode.title}` : "Start learning"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <div style={{ flex: 1, height: 6, background: "#DBEAFE", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${continueProgress}%`, height: "100%", background: "linear-gradient(90deg, #3B82F6, #6366F1)", borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#3B82F6", fontFamily: "'DM Sans', sans-serif" }}>{continueProgress}%</span>
            </div>
          </div>
          <span style={{
            background: "#0D9488", color: "white", border: "none", padding: "10px 20px",
            borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
          }}>
            Continue →
          </span>
        </div>
      </Card>

      {/* Recently Visited */}
      {recentEpisodes && recentEpisodes.length > 0 && (
        <Card>
          <h4 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 16, fontWeight: 600, color: "#1C1917", margin: "0 0 12px" }}>Recently Visited</h4>
          <div style={{ display: "flex", gap: 12, overflowX: "auto" }}>
            {recentEpisodes.map((ep, i) => {
              const ch = chapters?.find((c) => c.id === ep.chapter_id);
              const subj = subjects?.find((s) => {
                // Try matching by looking up which subject's chapters contain this chapter
                return true; // fallback - show with chapter info
              });
              const timeDiff = Date.now() - new Date(ep.started_at).getTime();
              const hours = Math.floor(timeDiff / 3600000);
              const timeLabel = hours < 1 ? "Just now" : hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
              return (
                <div key={i} onClick={() => navigate(`/student/textbook/${ep.chapter_id}/${ep.episode_id}`)} style={{
                  minWidth: 180, padding: "14px 16px", borderRadius: 12, border: "1px solid #E7E5E4",
                  cursor: "pointer", background: "#FAFAF9",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 14 }}>📖</span>
                    <span style={{ fontSize: 11, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>{timeLabel}</span>
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, color: "#1C1917" }}>
                    {ch?.title ?? ep.chapter_id}
                  </div>
                  <div style={{ fontSize: 12, color: "#78716C", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
                    {ep.completion_pct}% complete
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Subject → Chapter Browser */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {/* Subject tabs */}
        <div style={{ display: "flex", overflowX: "auto", borderBottom: "1px solid #E7E5E4" }}>
          {(subjects ?? []).map((s) => (
            <button key={s.id} onClick={() => { setSelectedSubject(s.name); setExpandedChapter(null); }} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "14px 18px", border: "none",
              borderBottom: activeSubjectName === s.name ? `2.5px solid ${s.color || "#6366f1"}` : "2.5px solid transparent",
              background: activeSubjectName === s.name ? `${s.color || "#6366f1"}06` : "white",
              fontSize: 13, fontWeight: activeSubjectName === s.name ? 700 : 400,
              color: activeSubjectName === s.name ? (s.color || "#6366f1") : "#78716C",
              cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {s.icon || SUBJECT_ICONS[s.name] || "📚"} {s.name}
            </button>
          ))}
        </div>

        {/* Chapter list */}
        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: "#78716C", marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}>
            {chapters?.length ?? 0} chapters • Class 10 • {subjects?.find(s => s.name === activeSubjectName)?.board || "CBSE"}
          </div>

          {(chapters ?? []).map((ch) => {
            const progress = chapterProgress?.[ch.id];
            const completed = progress?.completed ?? 0;
            const totalEps = ch.episodes?.length ?? 0;
            const pct = totalEps > 0 ? Math.round((completed / totalEps) * 100) : 0;
            const isExpanded = expandedChapter === ch.number;

            return (
              <div key={ch.id} style={{ marginBottom: 4 }}>
                <button
                  onClick={() => setExpandedChapter(isExpanded ? null : ch.number)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                    borderRadius: isExpanded ? "10px 10px 0 0" : 10,
                    border: "none", background: isExpanded ? "#F0FDFA" : "white",
                    cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: pct > 0 ? (ch.color || "#7C3AED") : "#E7E5E4",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: pct > 0 ? "white" : "#78716C",
                    fontSize: 16, fontWeight: 800, flexShrink: 0,
                  }}>
                    {ch.number}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: "#1C1917" }}>{ch.title}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <div style={{ flex: 1, maxWidth: 120, height: 4, background: "#E7E5E4", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: ch.color || "#7C3AED", borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 11, color: "#78716C" }}>{completed}/{totalEps} lessons</span>
                    </div>
                  </div>

                  <span style={{ color: "#78716C", fontSize: 18 }}>›</span>
                </button>

                {isExpanded && (
                  <div style={{ background: "#F0FDFA", padding: "12px 16px", borderRadius: "0 0 10px 10px", borderTop: "1px solid #D1FAE5" }}>
                    {ch.episodes?.map((ep, ei) => {
                      const epProgress = chapterProgress?.[ch.id];
                      const done = ei < (epProgress?.completed ?? 0);
                      const isCurrent = ei === (epProgress?.completed ?? 0);
                      return (
                        <div
                          key={ep.id}
                          onClick={() => navigate(`/student/textbook/${ch.id}/${ep.id}`)}
                          style={{
                            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                            borderRadius: 8, cursor: "pointer", marginBottom: 4,
                            background: isCurrent ? "white" : "transparent",
                            border: isCurrent ? "1px solid #0D948830" : "1px solid transparent",
                          }}
                        >
                          <div style={{
                            width: 24, height: 24, borderRadius: "50%",
                            background: done ? "#0D9488" : isCurrent ? "white" : "#E7E5E4",
                            border: isCurrent ? "2px solid #0D9488" : "none",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: done ? "white" : "#78716C", fontSize: 11, fontWeight: 700,
                          }}>
                            {done ? "✓" : ei + 1}
                          </div>
                          <span style={{ fontSize: 13, color: isCurrent ? "#0D9488" : done ? "#1C1917" : "#78716C", fontWeight: isCurrent ? 600 : 400 }}>
                            Episode {ei + 1}: {ep.title}{isCurrent ? " — In Progress" : done ? " — Complete" : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Scholar Methods */}
      <Card>
        <SectionTitle icon="🎓" title="Think Like a Scholar" subtitle="World-class thinking tools adapted for you" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {[
            { key: "tutorial_defense", icon: "🛡️", name: "Debate Challenge", desc: "Defend your understanding", time: "5 min", color: "#0D9488" },
            { key: "first_principles", icon: "🔬", name: "Break It Down", desc: "Strip to first principles", time: "10 min", color: "#7C3AED" },
            { key: "case_study", icon: "📋", name: "Case Study", desc: "Apply to real scenarios", time: "8 min", color: "#2563EB" },
            { key: "peer_teaching", icon: "🎤", name: "Teach It", desc: "Explain to master", time: "Soon", color: "#A8A29E", locked: true },
          ].map((m) => (
            <div key={m.key} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "16px 14px",
              borderRadius: 14, border: "1px solid #E7E5E4",
              background: m.locked ? "#FAFAF9" : "white",
              opacity: m.locked ? 0.6 : 1,
              cursor: m.locked ? "not-allowed" : "pointer",
            }}>
              <span style={{ fontSize: 28 }}>{m.icon}</span>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, color: "#1C1917" }}>{m.name}</div>
                <div style={{ fontSize: 12, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>{m.desc}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: m.color,
                    background: m.color + "12", padding: "2px 8px", borderRadius: 12,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>{m.time}</span>
                  {!m.locked && (
                    <span style={{ fontSize: 11, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>{methodCounts?.[m.key] ?? 0} done</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default LearnTab;
