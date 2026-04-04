import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubjects, useChapters } from "@/hooks/useTextbookData";

interface LearnTabProps {
  methodCounts: Record<string, number>;
}

const SUBJECT_ICONS: Record<string, string> = {
  Mathematics: "🔢", Science: "🔬", English: "📖", "Social Science": "🌍",
  Hindi: "📝", Telugu: "📜", Sanskrit: "🕉️", Physics: "⚛️", Chemistry: "🧪", Biology: "🧬",
};

const LearnTab = ({ methodCounts }: LearnTabProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: subjects } = useSubjects();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);

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

  // Chapter progress counts
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

  const continueChapter = chapters?.find((c) => c.id === continueChapterId);
  const continueEpisode = continueChapter?.episodes?.find((e) => e.id === continueEpisodeId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ═══ Continue Where You Left Off ═══ */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #E7E5E4", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 20, fontWeight: 700, color: "#1C1917", margin: 0 }}>
            ▶️ Continue Where You Left Off
          </h3>
        </div>
        <div
          onClick={() => navigate(`/student/textbook/${continueChapterId}${continueEpisodeId ? `/${continueEpisodeId}` : ""}`)}
          style={{
            display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
            borderRadius: 14, background: "linear-gradient(135deg, #F0FDFA, #EFF6FF)",
            border: "1px solid #CCFBF1", cursor: "pointer", transition: "all 0.15s",
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "linear-gradient(135deg, #0D9488, #0F766E)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 20, fontWeight: 700, fontFamily: "'Source Serif 4', serif",
            flexShrink: 0,
          }}>
            {continueEpisode?.number ?? continueChapter?.number ?? "1"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 15, color: "#1C1917" }}>
              {continueEpisode?.title ?? continueChapter?.title ?? "Start Learning"}
            </div>
            <div style={{ fontSize: 13, color: "#78716C", fontFamily: "'DM Sans', sans-serif" }}>
              {continueChapter ? `Chapter ${continueChapter.number}` : ""}{continueEpisode ? ` • Lesson ${continueEpisode.number}` : ""}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <div style={{ flex: 1, height: 6, background: "#CCFBF1", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${continueProgress}%`, height: "100%", background: "linear-gradient(90deg, #0D9488, #14B8A6)", borderRadius: 3, transition: "width 0.3s" }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#0D9488", fontFamily: "'DM Sans', sans-serif" }}>{continueProgress}%</span>
            </div>
          </div>
          <span style={{
            background: "#0D9488", color: "white", border: "none", padding: "11px 22px",
            borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
            cursor: "pointer",
          }}>
            Continue →
          </span>
        </div>
      </div>

      {/* ═══ Recently Visited ═══ */}
      {recentEpisodes && recentEpisodes.length > 0 && (
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #E7E5E4", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: 24 }}>
          <h4 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 16, fontWeight: 600, color: "#1C1917", margin: "0 0 12px" }}>Recently Visited</h4>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
            {recentEpisodes.map((ep, i) => {
              const ch = chapters?.find((c) => c.id === ep.chapter_id);
              const subjectForEp = subjects?.find(s => {
                // Match subject by checking if this chapter belongs to it
                return ch ? true : false;
              });
              const timeDiff = Date.now() - new Date(ep.started_at).getTime();
              const hours = Math.floor(timeDiff / 3600000);
              const timeLabel = hours < 1 ? "Just now" : hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
              return (
                <div key={i} onClick={() => navigate(`/student/textbook/${ep.chapter_id}/${ep.episode_id}`)} style={{
                  minWidth: 210, padding: "12px 14px", borderRadius: 10, border: "1px solid #E7E5E4",
                  cursor: "pointer", background: "white", flexShrink: 0, transition: "all 0.15s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 14 }}>{SUBJECT_ICONS[activeSubjectName || ""] || "📖"}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#57534E", fontFamily: "'DM Sans', sans-serif" }}>{activeSubjectName || "Math"}</span>
                    <span style={{ fontSize: 11, color: "#A8A29E", fontFamily: "'DM Sans', sans-serif", marginLeft: "auto" }}>{timeLabel}</span>
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, color: "#1C1917" }}>
                    {ch?.title ?? ep.chapter_id}
                  </div>
                  <div style={{ fontSize: 12, color: "#78716C", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
                    Ep: {ep.episode_id.split("-").pop()}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                    <div style={{ flex: 1, height: 4, background: "#E7E5E4", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${ep.completion_pct}%`, height: "100%", background: "#0D9488", borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#0D9488", fontFamily: "'DM Sans', sans-serif" }}>{ep.completion_pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ My Textbook — Subject → Chapter → Lesson Browser ═══ */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #E7E5E4", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>

        {/* My Textbook header */}
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 20, fontWeight: 700, color: "#1C1917", margin: 0 }}>
              📚 My Textbook
            </h3>
            <span style={{ fontSize: 12, color: "#78716C", fontFamily: "'DM Sans', sans-serif", background: "#F5F5F4", padding: "4px 10px", borderRadius: 8 }}>
              Class X • {subjects?.find(s => s.name === activeSubjectName)?.board || "CBSE"}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#78716C", fontFamily: "'DM Sans', sans-serif", margin: "6px 0 16px" }}>
            Every chapter transformed into bite-sized lessons
          </p>
        </div>

        {/* Subject tabs */}
        <div style={{ display: "flex", overflowX: "auto", borderBottom: "1px solid #E7E5E4" }}>
          {(subjects ?? []).map((s) => (
            <button key={s.id} onClick={() => { setSelectedSubject(s.name); setExpandedChapter(null); }} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "12px 16px", border: "none",
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
          {(chapters ?? []).map((ch) => {
            const progress = chapterProgress?.[ch.id];
            const completed = progress?.completed ?? 0;
            const totalEps = ch.episodes?.length ?? 0;
            const pct = totalEps > 0 ? Math.round((completed / totalEps) * 100) : 0;
            const isExpanded = expandedChapter === ch.number;
            const hasNoEpisodes = totalEps === 0;

            return (
              <div key={ch.id} style={{ marginBottom: 4 }}>
                <button
                  onClick={() => !hasNoEpisodes && setExpandedChapter(isExpanded ? null : ch.number)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                    borderRadius: isExpanded ? "12px 12px 0 0" : 12,
                    border: "none", background: isExpanded ? "#F0FDFA" : hasNoEpisodes ? "#FAFAF9" : "white",
                    cursor: hasNoEpisodes ? "default" : "pointer", textAlign: "left", transition: "all 0.15s",
                    fontFamily: "'DM Sans', sans-serif", opacity: hasNoEpisodes ? 0.55 : 1,
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: hasNoEpisodes ? "#E7E5E4" : pct > 0 ? (ch.color || "#7C3AED") : "#E7E5E4",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: hasNoEpisodes ? "#78716C" : pct > 0 ? "white" : "#78716C",
                    fontSize: 16, fontWeight: 800, flexShrink: 0,
                  }}>
                    {hasNoEpisodes ? "🔒" : ch.number}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: "#1C1917" }}>{ch.title}</span>
                      {hasNoEpisodes && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#A8A29E", background: "#F5F5F4", padding: "2px 8px", borderRadius: 8 }}>Coming Soon</span>
                      )}
                    </div>
                    {ch.subtitle && (
                      <div style={{ fontSize: 12, color: "#A8A29E", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{ch.subtitle}</div>
                    )}
                    {!hasNoEpisodes && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ flex: "0 0 auto", width: 100, height: 4, background: "#E7E5E4", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: ch.color || "#7C3AED", borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 11, color: "#78716C" }}>{completed}/{totalEps} lessons</span>
                        </div>
                        {ch.periods && <span style={{ fontSize: 11, color: "#A8A29E" }}>⏱ {ch.periods} periods</span>}
                        {ch.pageRange && <span style={{ fontSize: 11, color: "#A8A29E" }}>📄 Pages {ch.pageRange}</span>}
                      </div>
                    )}
                  </div>

                  {!hasNoEpisodes && (
                    <span style={{ color: "#78716C", fontSize: 18, transition: "transform 0.15s", transform: isExpanded ? "rotate(90deg)" : "rotate(0)" }}>›</span>
                  )}
                </button>

                {/* Expanded lessons */}
                {isExpanded && !hasNoEpisodes && (
                  <div style={{ background: "#F0FDFA", padding: "12px 16px", borderRadius: "0 0 12px 12px", borderTop: "1px solid #D1FAE5" }}>
                    {ch.episodes?.map((ep, ei) => {
                      const epProgress = chapterProgress?.[ch.id];
                      const done = ei < (epProgress?.completed ?? 0);
                      const isCurrent = ei === (epProgress?.completed ?? 0);
                      const isLocked = ei > (epProgress?.completed ?? 0);
                      return (
                        <div
                          key={ep.id}
                          onClick={() => !isLocked && navigate(`/student/textbook/${ch.id}/${ep.id}`)}
                          style={{
                            display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                            borderRadius: 10, cursor: isLocked ? "default" : "pointer", marginBottom: 4,
                            background: isCurrent ? "white" : "transparent",
                            border: isCurrent ? "1.5px solid #0D9488" : "1.5px solid transparent",
                            boxShadow: isCurrent ? "0 2px 8px rgba(13,148,136,0.08)" : "none",
                            opacity: isLocked ? 0.45 : 1, transition: "all 0.15s",
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
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 13, color: isCurrent ? "#0D9488" : done ? "#1C1917" : "#78716C", fontWeight: isCurrent ? 600 : 400 }}>
                              Episode {ei + 1}: {ep.title}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                              {ep.duration && <span style={{ fontSize: 11, color: "#A8A29E" }}>⏱ {ep.duration}</span>}
                              {ep.type && (
                                <span style={{ fontSize: 10, fontWeight: 600, color: ch.color || "#7C3AED", background: (ch.color || "#7C3AED") + "12", padding: "1px 6px", borderRadius: 6 }}>{ep.type}</span>
                              )}
                            </div>
                          </div>
                          {isCurrent && (
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#0D9488", whiteSpace: "nowrap" }}>Continue →</span>
                          )}
                          {done && (
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#0D9488" }}>✓ Done</span>
                          )}
                          {isLocked && (
                            <span style={{ fontSize: 14 }}>🔒</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ Scholar Methods ═══ */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #E7E5E4", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 20, fontWeight: 700, color: "#1C1917", margin: 0 }}>
            🎓 Think Like a Scholar
          </h3>
          <p style={{ fontSize: 13, color: "#78716C", margin: "4px 0 0", fontFamily: "'DM Sans', sans-serif" }}>Practice anytime</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {[
            { key: "tutorial_defense", icon: "🛡️", name: "Debate Challenge", desc: "Defend your reasoning in 6 rounds", time: "5 min", color: "#0D9488" },
            { key: "first_principles", icon: "🔬", name: "Break It Down", desc: "Strip to basics like Feynman", time: "10 min", color: "#7C3AED" },
            { key: "case_study", icon: "📋", name: "Case Study", desc: "Real-world problem solving", time: "8 min", color: "#2563EB" },
            { key: "peer_teaching", icon: "🎤", name: "Teach It", desc: "Explain to truly master", time: "Coming Soon", color: "#A8A29E", locked: true },
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
      </div>
    </div>
  );
};

export default LearnTab;
