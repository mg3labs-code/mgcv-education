import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { ArcLens, ChoiceOpt } from "@/data/interestArcLenses";

/**
 * Interest-flavoured 3-day arc (cricket / food / travel / nature).
 *
 * Engine is identical across lenses — only the surface story changes.
 *   D1 (Spark · 5 min):  hook → aha → sort → trap → done
 *   D2 (Build · 6 min):  recall ("Yesterday you thought…") → mechanism → teach-back → trap → done
 *   D3 (Master · 8 min): first-principles → real case → teach a friend → OS score
 *
 * Persistence (curiosity_arc_progress):
 *   • Day 1 first-thought saved on submit AND echoed verbatim on Day 2 + Day 3.
 *   • current_day / current_step persisted so reloads land where you left off.
 *   • day1/2/3_completed_at written on transitions.
 *
 * Navigation:
 *   • Per-day step state lives in refs and is restored when toggling days,
 *     so jumping D1 → D2 → D1 returns you to your last D1 screen.
 */

type Day = 1 | 2 | 3;
type Pick = "correct" | "wrong" | null;

interface Props {
  episodeTitle: string;
  lens: ArcLens;
  conceptKey?: string;
  chapterId?: string;
  episodeId?: string;
  initialDay?: Day;
}

interface PersistedState {
  loaded: boolean;
  firstThought: string;
  currentDay: Day;
  currentStep: string;
  day1CompletedAt: string | null;
  day2CompletedAt: string | null;
  day3CompletedAt: string | null;
}

const DEFAULT_PERSISTED: PersistedState = {
  loaded: false, firstThought: "", currentDay: 1, currentStep: "d1:0",
  day1CompletedAt: null, day2CompletedAt: null, day3CompletedAt: null,
};

export default function InterestArcLive({ lens, conceptKey, chapterId, episodeId, initialDay = 1 }: Props) {
  const { user } = useAuth();

  // ──── persistence ────
  const [persisted, setPersisted] = useState<PersistedState>(DEFAULT_PERSISTED);
  const persistedRef = useRef(persisted);
  persistedRef.current = persisted;

  // Load progress once on mount (or when user/concept changes).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user || !conceptKey) { setPersisted((p) => ({ ...p, loaded: true })); return; }
      const { data } = await supabase
        .from("curiosity_arc_progress")
        .select("day1_first_thought, current_day, current_step, day1_completed_at, day2_completed_at, day3_completed_at")
        .eq("user_id", user.id).eq("concept_key", conceptKey).maybeSingle();
      if (cancelled) return;
      setPersisted({
        loaded: true,
        firstThought: data?.day1_first_thought ?? "",
        currentDay: ((data?.current_day as Day) ?? initialDay) || initialDay,
        currentStep: (data?.current_step as string) ?? "d1:0",
        day1CompletedAt: data?.day1_completed_at ?? null,
        day2CompletedAt: data?.day2_completed_at ?? null,
        day3CompletedAt: data?.day3_completed_at ?? null,
      });
    })();
    return () => { cancelled = true; };
  }, [user, conceptKey, initialDay]);

  const persist = useCallback(async (patch: Partial<{
    day1_first_thought: string;
    current_day: number;
    current_step: string;
    day1_completed_at: string;
    day2_completed_at: string;
    day3_completed_at: string;
  }>) => {
    if (!user || !conceptKey) return;
    await supabase.from("curiosity_arc_progress").upsert(
      { user_id: user.id, concept_key: conceptKey, interest_tag: lens.tag, ...patch },
      { onConflict: "user_id,concept_key" } as never,
    );
  }, [user, conceptKey, lens.tag]);

  // ──── per-day step state (survives day toggling) ────
  const [day, setDay] = useState<Day>(initialDay);
  const [d1Step, setD1Step] = useState(0);          // 0..4
  const [d2Step, setD2Step] = useState<"a" | "b" | "c" | "d" | "done">("a");
  const [d3Step, setD3Step] = useState<"a" | "b" | "c" | "d">("a");
  const topRef = useRef<HTMLDivElement>(null);
  const completedTopics = [
    { day: 1 as const, title: "Spark", detail: "Hook · Aha · Trap", done: !!persisted.day1CompletedAt },
    { day: 2 as const, title: "Build", detail: "Recall · Sort · Explain", done: !!persisted.day2CompletedAt },
    { day: 3 as const, title: "Master", detail: "Case · Teach · Growth", done: !!persisted.day3CompletedAt },
  ].filter((topic) => topic.done);

  // Apply persisted state once it loads
  useEffect(() => {
    if (!persisted.loaded) return;
    setDay(persisted.currentDay);
    const [d, s] = (persisted.currentStep ?? "d1:0").split(":");
    if (d === "d1") { const n = parseInt(s, 10); if (!isNaN(n) && n >= 0 && n <= 4) setD1Step(n); }
    if (d === "d2" && ["a","b","c","d","done"].includes(s)) setD2Step(s as typeof d2Step);
    if (d === "d3" && ["a","b","c","d"].includes(s)) setD3Step(s as typeof d3Step);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persisted.loaded]);

  const goDay = (d: Day, fromStart = false) => {
    setDay(d);
    let step = d === 1 ? `d1:${d1Step}` : d === 2 ? `d2:${d2Step}` : `d3:${d3Step}`;
    if (fromStart) {
      if (d === 1) { setD1Step(0); step = "d1:0"; }
      if (d === 2) { setD2Step("a"); step = "d2:a"; }
      if (d === 3) { setD3Step("a"); step = "d3:a"; }
    }
    void persist({ current_day: d, current_step: step });
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  };

  const updateD1 = (n: number) => { setD1Step(n); void persist({ current_day: 1, current_step: `d1:${n}` }); };
  const updateD2 = (s: typeof d2Step) => { setD2Step(s); void persist({ current_day: 2, current_step: `d2:${s}` }); };
  const updateD3 = (s: typeof d3Step) => { setD3Step(s); void persist({ current_day: 3, current_step: `d3:${s}` }); };

  return (
    <div ref={topRef} className="cricket-arc" style={{ background: "#F8F7F4", minHeight: "100vh" }}>
      <style>{CSS}</style>
      <div className="g">
        <div className="arc-bar">
          <div className="arc-days">
            <button className={`arc-day d1c${day === 1 ? " active" : ""}${persisted.day1CompletedAt ? " done" : ""}`} onClick={() => goDay(1, !!persisted.day1CompletedAt)}>Day 1 <span>{persisted.day1CompletedAt ? "Review" : day === 1 ? "Now" : "Open"}</span></button>
            <button className={`arc-day d2c${day === 2 ? " active" : ""}${persisted.day2CompletedAt ? " done" : ""}`} onClick={() => goDay(2, !!persisted.day2CompletedAt)}>Day 2 <span>{persisted.day2CompletedAt ? "Review" : day === 2 ? "Now" : "Open"}</span></button>
            <button className={`arc-day d3c${day === 3 ? " active" : ""}${persisted.day3CompletedAt ? " done" : ""}`} onClick={() => goDay(3, !!persisted.day3CompletedAt)}>Day 3 <span>{persisted.day3CompletedAt ? "Review" : day === 3 ? "Now" : "Open"}</span></button>
          </div>
          <div className="arc-interest" style={{ background: lens.pillBg, color: lens.pillFg, borderColor: lens.pillFg }}>
            {lens.emoji} {lens.label}
          </div>
        </div>

        {completedTopics.length > 0 && (
          <div className="completed-topics" aria-label="Completed arc topics">
            <div className="ct-head">
              <span>Completed topics</span>
              <span>{completedTopics.length}/3 saved</span>
            </div>
            <div className="ct-list">
              {completedTopics.map((topic) => (
                <button key={topic.day} className={`ct-item d${topic.day}c${day === topic.day ? " active" : ""}`} onClick={() => goDay(topic.day, true)}>
                  <span className="ct-check">✓</span>
                  <span className="ct-copy">
                    <strong>Day {topic.day} · {topic.title}</strong>
                    <small>{topic.detail}</small>
                  </span>
                  <span className="ct-action">Review</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {day === 1 && (
          <Day1Flow
            lens={lens}
            step={d1Step}
            setStep={updateD1}
            initialThought={persisted.firstThought}
            onFirstThought={(t) => { setPersisted((p) => ({ ...p, firstThought: t })); void persist({ day1_first_thought: t }); }}
            onDone={() => {
              const ts = new Date().toISOString();
              setPersisted((p) => ({ ...p, day1CompletedAt: ts }));
              void persist({ day1_completed_at: ts });
              goDay(2);
            }}
          />
        )}
        {day === 2 && (
          <Day2Flow
            lens={lens}
            step={d2Step}
            setStep={updateD2}
            firstThought={persisted.firstThought}
            onDone={() => {
              const ts = new Date().toISOString();
              setPersisted((p) => ({ ...p, day2CompletedAt: ts }));
              void persist({ day2_completed_at: ts });
              goDay(3);
            }}
          />
        )}
        {day === 3 && (
          <Day3Flow
            lens={lens}
            step={d3Step}
            setStep={updateD3}
            firstThought={persisted.firstThought}
            chapterId={chapterId}
            episodeId={episodeId}
            userId={user?.id}
            onComplete={() => {
              const ts = new Date().toISOString();
              setPersisted((p) => ({ ...p, day3CompletedAt: ts }));
              void persist({ day3_completed_at: ts });
            }}
            onRestart={() => goDay(1, true)}
          />
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════ DAY 1 · 5-MIN SPARK ════════════════════════════ */

function Day1Flow({
  lens, step, setStep, initialThought, onFirstThought, onDone,
}: {
  lens: ArcLens; step: number; setStep: (n: number) => void;
  initialThought: string; onFirstThought: (t: string) => void; onDone: () => void;
}) {
  const [guess, setGuess] = useState(initialThought);
  const [shownGuess, setShownGuess] = useState(initialThought || "");
  useEffect(() => { if (initialThought && !guess) { setGuess(initialThought); setShownGuess(initialThought); } /* eslint-disable-next-line */ }, [initialThought]);

  const [selected, setSelected] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, "pos" | "neg">>({});
  const [sortFeedback, setSortFeedback] = useState<"" | "correct" | "wrong">("");
  const [bdChoice, setBdChoice] = useState<"" | "believe" | "doubt">("");

  const POS = new Set(lens.d1SortItems.filter((i) => i.pos).map((i) => i.val));
  const NEG = new Set(lens.d1SortItems.filter((i) => !i.pos).map((i) => i.val));

  const STEPS = [
    { label: "Hook", time: "~5 min", pct: 100, color: "#22C55E" },
    { label: "Reveal", time: "~4 min", pct: 80, color: "#22C55E" },
    { label: "Sort it", time: "~3 min", pct: 60, color: "#22C55E" },
    { label: "Detect", time: "~1.5 min", pct: 30, color: "#F59E0B" },
    { label: "Done!", time: "done", pct: 0, color: "#EF4444" },
  ];

  const goNext = (n: number) => {
    if (n === 1) {
      const text = guess.trim();
      setShownGuess(text || "(no guess — that's okay)");
      if (text) onFirstThought(text);
    }
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selItem = (val: string) => { if (placed[val]) return; setSelected(val); };
  const placeTo = (zone: "pos" | "neg") => {
    if (!selected) return;
    setPlaced((p) => ({ ...p, [selected]: zone }));
    setSelected(null);
  };
  const checkSort = () => {
    if (Object.keys(placed).length === 0) { goNext(3); return; }
    let allCorrect = true;
    for (const [v, z] of Object.entries(placed)) {
      const isPos = POS.has(v); const isNeg = NEG.has(v);
      if ((z === "pos" && !isPos) || (z === "neg" && !isNeg)) allCorrect = false;
    }
    setSortFeedback(allCorrect ? "correct" : "wrong");
    setTimeout(() => goNext(3), 800);
  };
  const checkBD = (c: "believe" | "doubt") => setBdChoice(c);

  return (
    <>
      <div className="topbar">
        <div className="tb-left">
          <div className="tb-badge" style={{ background: lens.pillBg, color: lens.pillFg }}>{lens.emoji} {lens.label}</div>
          <div className="tb-steps">
            {STEPS.map((_, i) => (<div key={i} className={"ts" + (i < step ? " done" : i === step ? " active" : "")} />))}
          </div>
        </div>
        <div className="tb-timer">
          <span>{STEPS[step].time}</span>
          <div className="timer-bar"><div className="timer-fill" style={{ width: STEPS[step].pct + "%", background: STEPS[step].color }} /></div>
        </div>
      </div>

      {step === 0 && (
        <div className="main">
          <div className="card-top">
            <div className="step-tag" style={{ color: "#F59E0B" }}>{lens.d1HookStepLabel}</div>
            <div className="story-h">{lens.d1HookH}</div>
          </div>
          <div className="card-body">
            <div className="story-b">{lens.d1HookBody}</div>
            <div className="time-tag">⏱ 60s</div>
            <textarea className="input-area" value={guess} onChange={(e) => setGuess(e.target.value)} placeholder={lens.d1HookPlaceholder} rows={2} />
            <div className="voice-row">
              <button className="voice-btn"><span className="rdot" /> Speak instead</button>
              <span style={{ fontSize: 10, color: "#A8A29E" }}>45 sec, your own words</span>
            </div>
            <button className="act-btn" style={{ background: "#1A1A2E", color: "#fff", marginTop: 10 }} onClick={() => goNext(1)}>Lock in my guess →</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="main">
          <div className="card-top">
            <div className="step-tag" style={{ color: "#22C55E" }}>Aha moment · 60 seconds</div>
            <div className="guess-echo">
              <div className="ge-label">You guessed</div>
              <div className="ge-text">{shownGuess || initialThought || "(no guess — that's okay)"}</div>
            </div>
          </div>
          <div className="card-body">
            <div className="visual-frame" style={{ background: "#F0FDF4", border: "0.5px solid #22C55E" }}>
              <span className="vf-emoji">{lens.emoji}</span>
              <div className="vf-title">{lens.d1AhaTitle}</div>
              <div className="vf-body">{lens.d1AhaBody}</div>
              <div className="vf-formula" style={{ background: "#DCFCE7", color: "#15803D" }}>{lens.d1AhaFormula}</div>
            </div>
            <div style={{ fontSize: 12, color: "#57534E", lineHeight: 1.65, marginBottom: 10 }}>{lens.d1AhaFollowUp}</div>
            <div className="time-tag">⏱ next: 90 sec activity</div>
            <button className="act-btn" style={{ background: "#15803D", color: "#fff" }} onClick={() => goNext(2)}>Got it — now try this →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="main">
          <div className="card-top">
            <div className="step-tag" style={{ color: "#3B82F6" }}>Sort it · 90 seconds</div>
            <div className="story-h">{lens.d1SortH}</div>
          </div>
          <div className="card-body">
            <div className="sort-instruction">{lens.d1SortInstruction}</div>
            <div className="time-tag">⏱ 90s</div>
            <div className="sort-items">
              {lens.d1SortItems.map((it) => {
                const isPlaced = !!placed[it.val]; const isSel = selected === it.val;
                return (
                  <div key={it.val} className={"sort-item" + (isSel ? " sel" : "") + (isPlaced ? " placed" : "")} onClick={() => selItem(it.val)}>{it.label}</div>
                );
              })}
            </div>
            <div className="sort-bins">
              <div className={"bin" + (sortFeedback === "correct" ? " correct" : sortFeedback === "wrong" ? " wrong" : "")} onClick={() => placeTo("pos")}>
                <div className="bin-label" style={{ color: "#15803D" }}>Above zero (+)</div>
                <div className="bin-items">
                  {Object.entries(placed).filter(([, z]) => z === "pos").map(([v]) => (
                    <div key={v} className="bin-chip" style={{ background: "#DCFCE7", color: "#15803D" }}>{v}</div>
                  ))}
                </div>
              </div>
              <div className={"bin" + (sortFeedback === "correct" ? " correct" : sortFeedback === "wrong" ? " wrong" : "")} onClick={() => placeTo("neg")}>
                <div className="bin-label" style={{ color: "#EF4444" }}>Below zero (−)</div>
                <div className="bin-items">
                  {Object.entries(placed).filter(([, z]) => z === "neg").map(([v]) => (
                    <div key={v} className="bin-chip" style={{ background: "#FEF2F2", color: "#B91C1C" }}>{v}</div>
                  ))}
                </div>
              </div>
            </div>
            <button className="act-btn" style={{ background: "#1D4ED8", color: "#fff" }} onClick={checkSort}>Check →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="main">
          <div className="card-top">
            <div className="step-tag" style={{ color: "#8B5CF6" }}>Spot the trap · 45 seconds</div>
          </div>
          <div className="card-body">
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6D28D9", marginBottom: 8, padding: "6px 10px", background: "#F5F3FF", borderRadius: 6, display: "inline-block" }}>{lens.d1TrapKicker}</div>
            <div className="bd-statement">{lens.d1TrapStmt}</div>
            <div className="bd-context">{lens.d1TrapContext}</div>
            <div className="time-tag">⏱ 45s · commit before thinking too long</div>
            <div className="bd-btns">
              <button className={"bd-btn" + (bdChoice === "believe" ? " wrong" : bdChoice ? " disabled" : "")} onClick={() => !bdChoice && checkBD("believe")}>✓ I believe this</button>
              <button className={"bd-btn" + (bdChoice === "doubt" ? " correct" : bdChoice ? " disabled" : "")} onClick={() => !bdChoice && checkBD("doubt")}>⚡ I doubt this</button>
            </div>
            {bdChoice && (
              <div className="bd-reveal on" style={{ background: "#F5F3FF" }}>
                <div style={{ fontSize: 12, lineHeight: 1.65, color: "#1C1917" }}>{lens.d1TrapReveal}</div>
                <div style={{ marginTop: 8, fontSize: 11, color: "#6D28D9", fontWeight: 600 }}>{lens.d1TrapMicro}</div>
              </div>
            )}
            {bdChoice && (
              <button className="act-btn" style={{ background: "#6D28D9", color: "#fff" }} onClick={() => goNext(4)}>See what I learned today →</button>
            )}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="main">
          <div className="card-body">
            <div className="done-wrap">
              <span className="done-icon">⚡</span>
              <div className="done-h">Day 1 done. Real learning in 5 minutes.</div>
              <div className="done-sub">Here's what just happened in your brain:</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
              {lens.d1DoneRows.map((text, i) => (
                <DoneRow key={i} n={i + 1} bg={["#F0FDF4", "#EFF6FF", "#F5F3FF"][i]}>
                  <span dangerouslySetInnerHTML={{ __html: text.replace(/^(.+?) — /, "<strong>$1</strong> — ") }} />
                </DoneRow>
              ))}
            </div>
            <div className="done-gains">
              <DG n="+1%" l="Clarity" c="#22C55E" />
              <DG n="+1%" l="Thinking" c="#3B82F6" />
              <DG n="Day 1" l="Streak started" c="#F59E0B" />
            </div>
            <div className="done-tease" style={{ background: "#FFFBEB", border: "0.5px solid #F59E0B" }}>
              <div className="dt-label" style={{ color: "#B45309" }}>Tomorrow · Day 2 · Build</div>
              <div className="dt-text" style={{ color: "#92400E" }}>{lens.d1DoneTease}</div>
            </div>
            <div className="done-fact" style={{ background: "#F0FDF4", color: "#15803D", border: "0.5px solid #22C55E" }}>
              {lens.d1DoneFactPrefix} <strong>One fact to take out of here:</strong> {lens.d1DoneFact}
            </div>
            <button className="act-btn" style={{ background: "#1A1A2E", color: "#fff" }} onClick={onDone}>Continue to Day 2 →</button>
          </div>
        </div>
      )}
    </>
  );
}

function DoneRow({ n, bg, children }: { n: number; bg: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 8, background: bg, alignItems: "flex-start" }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{n}</span>
      <div style={{ fontSize: 12, color: "#1C1917", lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}
function DG({ n, l, c }: { n: string; l: string; c: string }) {
  return (<div className="dg-card"><div className="dg-num" style={{ color: c }}>{n}</div><div className="dg-lbl">{l}</div></div>);
}

/* ════════════════════════════ DAY 2 · BUILD ════════════════════════════ */

function Day2Flow({
  lens, step, setStep, firstThought, onDone,
}: {
  lens: ArcLens; step: "a" | "b" | "c" | "d" | "done"; setStep: (s: "a" | "b" | "c" | "d" | "done") => void;
  firstThought: string; onDone: () => void;
}) {
  const [aPick, setAPick] = useState<Pick>(null);
  const [feynman, setFeynman] = useState("");
  const [mirror, setMirror] = useState(false);
  const [detPick, setDetPick] = useState<Pick>(null);

  const next = (to: typeof step) => { setStep(to); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const labels = ["Recall", "Mechanism", "Teach back", "Trap", "Done"];
  const stepN = { a: 0, b: 1, c: 2, d: 3, done: 4 }[step];

  const echoLine = firstThought.trim()
    ? `"${firstThought.trim()}"`
    : `"(You didn't type a guess on Day 1 — that's okay, today you'll find one of your own.)"`;

  const pickResult = (opt: ChoiceOpt): "correct" | "wrong" => (opt.correct ? "correct" : "wrong");

  return (
    <>
      <div className="prog-dots">
        {[0, 1, 2, 3].map((i, idx) => (
          <span key={i} style={{ display: "contents" }}>
            <div className={"pd" + (i < stepN ? " done b" : i === stepN ? " cur" : "")} />
            {idx < 3 && <div className="pd-line" />}
          </span>
        ))}
        <div className="pd-label">{labels[stepN]}</div>
      </div>

      {step === "a" && (
        <div className="card">
          <div className="card-top">
            <div className="step-tag" style={{ color: "#0284C7" }}>
              <span className="layer-pill" style={{ background: "#E0F2FE", color: "#0C4A6E" }}>Layer 2 · Mechanism</span>
              Day 2 · Build · 6 min
            </div>
          </div>
          <div className="card-body">
            <div className="recall">
              <div className="recall-tag">Yesterday you thought</div>
              <div className="recall-text">{echoLine}</div>
              <div className="recall-now">{lens.d2RecallNow}</div>
            </div>
            <div className="section-h">{lens.d2PuzzleH}</div>
            <div className="section-b">{lens.d2PuzzleB}</div>
            <div className="compare">
              <div className="cmp-card" style={{ background: "#EFF6FF", border: "1.5px solid #3B82F6" }}>
                <div className="cmp-name" style={{ color: "#1D4ED8" }}>{lens.d2Compare.leftName}</div>
                <div className="cmp-stat" style={{ color: "#1D4ED8" }}>{lens.d2Compare.leftStat}</div>
                <div className="cmp-detail" style={{ color: "#3B82F6" }}>{lens.d2Compare.leftDetail}</div>
                <div className="cmp-result" style={{ background: "#DBEAFE", color: "#1D4ED8" }}>{lens.d2Compare.leftResult}</div>
              </div>
              <div className="cmp-card" style={{ background: "#FEF3C7", border: "1.5px solid #F59E0B" }}>
                <div className="cmp-name" style={{ color: "#B45309" }}>{lens.d2Compare.rightName}</div>
                <div className="cmp-stat" style={{ color: "#B45309" }}>{lens.d2Compare.rightStat}</div>
                <div className="cmp-detail" style={{ color: "#F59E0B" }}>{lens.d2Compare.rightDetail}</div>
                <div className="cmp-result" style={{ background: "#FEF3C7", color: "#B45309" }}>{lens.d2Compare.rightResult}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1C1917", marginBottom: 8 }}>{lens.d2PuzzleQ}</div>
            <div className="choose-row">
              {lens.d2PuzzleChoices.map((c, i) => (
                <ChooseBtn key={i} label={c.label} picked={aPick} mine={pickResult(c)} onPick={() => !aPick && setAPick(pickResult(c))} />
              ))}
            </div>
            {aPick && (
              <div className="reveal on" style={{ background: "#F0FDF4", border: "0.5px solid #22C55E", color: "#14532D" }}>
                {lens.d2PuzzleReveal}
              </div>
            )}
            {aPick && <button className="act act-d2" onClick={() => next("b")}>Next — see the deeper why →</button>}
          </div>
        </div>
      )}

      {step === "b" && (
        <div className="card">
          <div className="card-top">
            <div className="step-tag" style={{ color: "#0284C7" }}>
              <span className="layer-pill" style={{ background: "#E0F2FE", color: "#0C4A6E" }}>Layer 3 · Reasoning</span>
              Why fractions exist
            </div>
          </div>
          <div className="card-body">
            <div className="section-h">{lens.d2MechH}</div>
            <div className="section-b">{lens.d2MechB}</div>
            <div style={{ borderRadius: 10, padding: 12, background: "#EFF6FF", border: "0.5px solid #3B82F6", marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>{lens.d2FormulaTitle}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {lens.d2FormulaRows.map((r, i) => (
                  <div key={i} style={i === 2 ? { ...formulaRowStyle, fontWeight: 600 } : formulaRowStyle}>{r}</div>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#57534E", lineHeight: 1.7, marginBottom: 10, padding: "8px 12px", background: "#F8F7F4", borderRadius: 8, borderLeft: "2px solid #F59E0B" }}>
              <strong style={{ color: "#1C1917" }}>{lens.d2ConnectionTitle}</strong> {lens.d2ConnectionBody}
            </div>
            <button className="act act-d2" onClick={() => next("c")}>Now explain it in your own words →</button>
          </div>
        </div>
      )}

      {step === "c" && (
        <>
          <div className="card">
            <div className="card-top">
              <div className="step-tag" style={{ color: "#0284C7" }}>
                <span className="layer-pill" style={{ background: "#E0F2FE", color: "#0C4A6E" }}>Layer 2 · Prove You Know It</span>
                Teach it back
              </div>
            </div>
            <div className="card-body">
              <div className="explain-box">
                <div className="explain-prompt">{lens.d2TeachPrompt}</div>
                <div className="explain-sub">{lens.d2TeachSub}</div>
                <textarea className="explain-input" value={feynman} onChange={(e) => setFeynman(e.target.value)} placeholder={lens.d2TeachPlaceholder} rows={3} />
                <div className="voice-row"><button className="v-btn"><span className="rdot" /> Say it out loud instead</button><span style={{ fontSize: 10, color: "#A8A29E" }}>45 sec · casual language</span></div>
              </div>
              <button className="act act-d2" onClick={() => setMirror(true)}>Submit →</button>
            </div>
          </div>
          {mirror && (
            <>
              <div className="ai-mirror on">
                <div className="ai-head"><div className="ai-av"><div className="ai-av-i" /></div><div className="ai-name">Inner OS</div></div>
                <div className="ai-body">{lens.d2MirrorBody}</div>
                <div className="ai-gap">{lens.d2MirrorGap}</div>
              </div>
              <button className="act act-d2" onClick={() => next("d")}>One last detective challenge →</button>
            </>
          )}
        </>
      )}

      {step === "d" && (
        <div className="card">
          <div className="card-top">
            <div className="step-tag" style={{ color: "#0284C7" }}>
              <span className="layer-pill" style={{ background: "#E0F2FE", color: "#0C4A6E" }}>Layer 4 · Assumptions</span>
              Spot the trap
            </div>
          </div>
          <div className="card-body">
            <div className="det-header"><div className="det-title">Detective challenge — harder than yesterday</div><div className="det-sub">Most people get this wrong</div></div>
            <div className="stmt">
              <div className="stmt-text">{lens.d2TrapStmt}</div>
              <div className="choose-row">
                {lens.d2TrapChoices.map((c, i) => (
                  <ChooseBtn key={i} label={c.label} picked={detPick} mine={pickResult(c)} onPick={() => !detPick && setDetPick(pickResult(c))} />
                ))}
              </div>
              {detPick && (
                <div className="reveal on" style={{ background: "#F5F3FF", border: "0.5px solid #8B5CF6", color: "#3C1A78" }}>
                  {lens.d2TrapReveal}
                </div>
              )}
            </div>
            {detPick && <button className="act act-d2" onClick={() => next("done")}>Day 2 complete →</button>}
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="card">
          <div className="card-body" style={{ textAlign: "center", padding: "20px 16px" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>{lens.emoji}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1C1917", marginBottom: 4 }}>Day 2 done.</div>
            <div style={{ fontSize: 12, color: "#57534E", marginBottom: 16 }}>{lens.d2DoneSub}</div>
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "#FFFBEB", border: "0.5px solid #F59E0B", textAlign: "left", marginBottom: 14 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#B45309", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Day 3 unlocks · Master</div>
              <div style={{ fontSize: 12, color: "#92400E", lineHeight: 1.65 }}>{lens.d2DoneTease}</div>
            </div>
            <button className="act act-d3" style={{ marginTop: 0 }} onClick={onDone}>Continue to Day 3 →</button>
          </div>
        </div>
      )}
    </>
  );
}

const formulaRowStyle: React.CSSProperties = { fontSize: 12, color: "#1E40AF", padding: "6px 8px", background: "rgba(255,255,255,0.6)", borderRadius: 6 };

function ChooseBtn({ label, picked, mine, onPick }: { label: string; picked: Pick; mine: "correct" | "wrong"; onPick: () => void }) {
  const cls = picked ? (mine === "correct" ? "c-btn cor" : picked === mine ? "c-btn wrg" : "c-btn dis") : "c-btn";
  return <button className={cls} onClick={onPick}>{label}</button>;
}

/* ════════════════════════════ DAY 3 · MASTER ════════════════════════════ */

function Day3Flow({
  lens, step, setStep, firstThought, chapterId, episodeId, userId, onComplete, onRestart,
}: {
  lens: ArcLens; step: "a" | "b" | "c" | "d"; setStep: (s: "a" | "b" | "c" | "d") => void;
  firstThought: string; chapterId?: string; episodeId?: string; userId?: string;
  onComplete: () => void; onRestart: () => void;
}) {
  const [aPick, setAPick] = useState<Pick>(null);
  const [bPick, setBPick] = useState<Pick>(null);
  const [teachIdx, setTeachIdx] = useState<number | null>(null);
  const completedRef = useRef(false);

  const next = (to: typeof step) => { setStep(to); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const labels = ["First principles", "Real case", "Teach friend", "Growth"];
  const stepN = { a: 0, b: 1, c: 2, d: 3 }[step];

  const pickResult = (opt: ChoiceOpt): "correct" | "wrong" => (opt.correct ? "correct" : "wrong");

  useEffect(() => {
    if (step !== "d" || completedRef.current) return;
    completedRef.current = true;
    onComplete();
    if (userId && chapterId && episodeId) {
      supabase.from("episode_progress").upsert(
        { user_id: userId, chapter_id: chapterId, episode_id: episodeId, completion_pct: 100, completed_at: new Date().toISOString(), layer_scores: { [`${lens.tag}_arc`]: "complete" } },
        { onConflict: "user_id,chapter_id,episode_id" },
      ).then(() => {});
    }
  }, [step, userId, chapterId, episodeId, lens.tag, onComplete]);

  return (
    <>
      <div className="prog-dots">
        {[0, 1, 2, 3].map((i, idx) => (
          <span key={i} style={{ display: "contents" }}>
            <div className={"pd" + (i < stepN ? " done" : i === stepN ? " cur" : "")} />
            {idx < 3 && <div className="pd-line" />}
          </span>
        ))}
        <div className="pd-label">{labels[stepN]}</div>
      </div>

      {step === "a" && (
        <div className="card">
          <div className="card-top">
            <div className="step-tag" style={{ color: "#15803D" }}>
              <span className="layer-pill" style={{ background: "#F0FDF4", color: "#14532D" }}>Layer 6 · First Principles</span>
              Day 3 · Master · 8 min
            </div>
          </div>
          <div className="card-body">
            <div className="section-h">{lens.d3FirstH}</div>
            <div className="section-b">{lens.d3FirstB}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              <div style={{ padding: "8px 12px", borderRadius: 8, background: "#FEF3C7", fontSize: 12, color: "#78350F", lineHeight: 1.55 }}>{lens.d3FirstRows[0]}</div>
              <div style={{ padding: "8px 12px", borderRadius: 8, background: "#E0F2FE", fontSize: 12, color: "#0C4A6E", lineHeight: 1.55 }}>{lens.d3FirstRows[1]}</div>
              <div style={{ padding: "8px 12px", borderRadius: 8, background: "#F0FDF4", fontSize: 12, color: "#14532D", lineHeight: 1.55 }}>{lens.d3FirstRows[2]}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1C1917", marginBottom: 8 }}>{lens.d3FirstQ}</div>
            <div className="choose-row">
              {lens.d3FirstChoices.map((c, i) => (
                <ChooseBtn key={i} label={c.label} picked={aPick} mine={pickResult(c)} onPick={() => !aPick && setAPick(pickResult(c))} />
              ))}
            </div>
            {aPick && (
              <div className="reveal on" style={{ background: "#F0FDF4", border: "0.5px solid #22C55E", color: "#14532D" }}>{lens.d3FirstReveal}</div>
            )}
            {aPick && <button className="act act-d3" onClick={() => next("b")}>Go deeper →</button>}
          </div>
        </div>
      )}

      {step === "b" && (
        <div className="card">
          <div className="card-top">
            <div className="step-tag" style={{ color: "#15803D" }}>
              <span className="layer-pill" style={{ background: "#F0FDF4", color: "#14532D" }}>Layer 4 · Real World</span>
              The puzzle most people get wrong
            </div>
          </div>
          <div className="card-body">
            <div style={{ borderRadius: 10, padding: 12, background: "#1A1A2E", marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>{lens.d3CaseScenarioTag}</div>
              <div style={{ fontSize: 13, color: "#fff", lineHeight: 1.65, marginBottom: 10, whiteSpace: "pre-line" }}>{lens.d3CaseBody}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>{lens.d3CaseSub}</div>
            </div>
            <div className="choose-row">
              {lens.d3CaseChoices.map((c, i) => (
                <ChooseBtn key={i} label={c.label} picked={bPick} mine={pickResult(c)} onPick={() => !bPick && setBPick(pickResult(c))} />
              ))}
            </div>
            {bPick && (
              <div className="reveal on" style={{ background: "#FFFBEB", border: "0.5px solid #F59E0B", color: "#78350F" }}>{lens.d3CaseReveal}</div>
            )}
            {bPick && <button className="act act-d3" onClick={() => next("c")}>Now — teach your friend →</button>}
          </div>
        </div>
      )}

      {step === "c" && (
        <>
          <div className="teach-card">
            <div className="teach-top">
              <div className="teach-icon">🗣️</div>
              <div className="teach-top-text">Teach your friend · The moment that proves you understood</div>
            </div>
            <div className="teach-body">
              <div className="teach-scenario">{lens.d3TeachScenario}</div>
              <div className="teach-context">{lens.d3TeachContext}</div>
              <div className="teach-choices">
                {lens.d3TeachLines.map((t, i) => (
                  <button key={i} className={"teach-choice" + (teachIdx === i ? " sel-t" : "")} onClick={() => setTeachIdx(i)}>{t}</button>
                ))}
              </div>
              {teachIdx !== null && (
                <div className="teach-reveal on">
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#14532D", marginBottom: 6 }}>All three are correct — you picked your natural way of explaining. That's exactly what understanding means.</div>
                  <div className="teach-share">
                    <div className="teach-share-label">Your {lens.label.toLowerCase()} fact to share</div>
                    <div className="teach-share-text">{lens.d3TeachLines[teachIdx]}</div>
                    <button className="share-btn">Share with a friend →</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {teachIdx !== null && <button className="act act-d3" onClick={() => next("d")}>See what you've built →</button>}
        </>
      )}

      {step === "d" && (
        <>
          {/* Day-1 first thought reflected back at the end of the arc */}
          {firstThought && (
            <div className="card" style={{ background: "#FFFBEB", border: "0.5px solid #F59E0B" }}>
              <div className="card-body">
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#B45309", marginBottom: 6 }}>Three days ago you wondered</div>
                <div style={{ fontSize: 14, fontStyle: "italic", color: "#92400E", lineHeight: 1.5, marginBottom: 8 }}>"{firstThought}"</div>
                <div style={{ fontSize: 12, color: "#78350F", lineHeight: 1.6 }}>Now you can answer that yourself — in your own words. That's what understanding feels like.</div>
              </div>
            </div>
          )}
          <div className="os-score">
            <div className="os-top">
              <div className="os-top-label">Inner OS · 3-day arc complete</div>
              <div className="os-gains">
                <OG n="+3%" l="Clarity" c="#22C55E" />
                <OG n="+3%" l="Thinking" c="#38BDF8" />
                <OG n="+2%" l="Attention" c="#8B5CF6" />
                <OG n="+2%" l="Momentum" c="#F59E0B" />
                <OG n="+1%" l="Character" c="#EF4444" />
              </div>
            </div>
            <div className="os-body">
              <div style={{ fontSize: 10, fontWeight: 700, color: "#A8A29E", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>7 timeless principles you just lived</div>
              <OP n={1} text={<><strong>Started from reality</strong> — a {lens.label.toLowerCase()} story, not a textbook definition</>} />
              <OP n={3} text={<><strong>Confusion was safe</strong> — your first guess was allowed to be wrong</>} />
              <OP n={4} text={<><strong>Productive discomfort</strong> — the Day 3 case study made you work</>} />
              <OP n={5} text={<><strong>Your words reflected back</strong> — your Day 1 guess appeared on Day 2 and Day 3</>} />
              <OP n={7} text={<><strong>Ended with expression</strong> — you taught your friend. That's mastery.</>} />
            </div>
          </div>
          <div className="unlock-card">
            <div className="unlock-top"><div className="unlock-icon">🔓</div><div className="unlock-top-text">Next arc unlocked — slightly harder, same {lens.label.toLowerCase()} frame</div></div>
            <div className="unlock-body">
              <div className="unlock-h">Ready for the next level?</div>
              <div className="unlock-sub">Same interest. Same {lens.label.toLowerCase()}. But now the questions have more layers — based on how you responded over 3 days.</div>
              <div className="unlock-grid">
                {lens.d3UnlockGrid.map((u, i) => (<UI key={i} label={u.label} text={u.text} />))}
              </div>
            </div>
          </div>
          <button className="act act-d3" onClick={onRestart}>Start next concept →</button>
        </>
      )}
    </>
  );
}

function OG({ n, l, c }: { n: string; l: string; c: string }) {
  return <div className="os-g"><div className="os-n" style={{ color: c }}>{n}</div><div className="os-l">{l}</div></div>;
}
function OP({ n, text }: { n: number; text: React.ReactNode }) {
  return <div className="os-principle"><div className="op-num">{n}</div><div className="op-text">{text}</div></div>;
}
function UI({ label, text }: { label: string; text: string }) {
  return <div className="unlock-item"><div className="ui-label">{label}</div><div className="ui-text">{text}</div></div>;
}

/* ════════════════════════════ STYLES (unchanged from CricketArcLive) ════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
.cricket-arc, .cricket-arc *{box-sizing:border-box;font-family:'Sora',var(--font-sans),sans-serif}
.cricket-arc .g{max-width:480px;margin:0 auto;padding:0 0 24px;background:#F8F7F4}
.cricket-arc button{font-family:'Sora',sans-serif;cursor:pointer}

@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pop{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
@keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}50%{box-shadow:0 0 0 5px rgba(34,197,94,0.15)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}

.cricket-arc .arc-bar{padding:10px 14px;border-bottom:0.5px solid #F1EFE9;background:#fff;display:flex;align-items:center;gap:10px;margin-bottom:12px;position:sticky;top:0;z-index:10}
.cricket-arc .arc-days{display:flex;gap:4px}
.cricket-arc .arc-day{padding:5px 10px;border-radius:20px;font-size:10px;font-weight:700;border:0.5px solid #E7E5E4;background:#fff;color:#A8A29E}
.cricket-arc .arc-day.d1c{background:#FEF3C7;border-color:#F59E0B;color:#B45309}
.cricket-arc .arc-day.d2c{background:#E0F2FE;border-color:#38BDF8;color:#0C4A6E}
.cricket-arc .arc-day.d3c{background:#F0FDF4;border-color:#22C55E;color:#14532D}
.cricket-arc .arc-interest{margin-left:auto;font-size:10px;font-weight:700;padding:4px 10px;border-radius:20px;border:0.5px solid}

.cricket-arc .topbar{position:sticky;top:0;z-index:9;background:#fff;border-bottom:0.5px solid #F1EFE9;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between}
.cricket-arc .tb-left{display:flex;align-items:center;gap:8px}
.cricket-arc .tb-badge{font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px}
.cricket-arc .tb-steps{display:flex;gap:4px}
.cricket-arc .ts{width:6px;height:6px;border-radius:50%;background:#E7E5E4;transition:all 0.3s}
.cricket-arc .ts.done{background:#22C55E}
.cricket-arc .ts.active{background:#1C1917;transform:scale(1.3)}
.cricket-arc .tb-timer{font-size:11px;font-weight:600;color:#57534E;display:flex;align-items:center;gap:5px}
.cricket-arc .timer-bar{width:60px;height:3px;background:#F1EFE9;border-radius:2px;overflow:hidden}
.cricket-arc .timer-fill{height:100%;border-radius:2px;transition:all 0.5s}

.cricket-arc .prog-dots{display:flex;gap:4px;align-items:center;margin-bottom:12px;padding:0 14px}
.cricket-arc .pd{width:7px;height:7px;border-radius:50%;background:#E7E5E4;transition:all 0.3s}
.cricket-arc .pd.done{background:#22C55E}.cricket-arc .pd.done.b{background:#38BDF8}
.cricket-arc .pd.cur{background:#1C1917;transform:scale(1.4)}
.cricket-arc .pd-line{flex:1;height:1px;background:#F1EFE9}
.cricket-arc .pd-label{font-size:10px;color:#A8A29E;margin-left:6px}

.cricket-arc .main, .cricket-arc .card{border:0.5px solid #F1EFE9;border-radius:14px;overflow:hidden;margin:0 14px 10px;background:#fff;animation:fadeUp 0.3s ease}
.cricket-arc .card-top{padding:14px 16px 0}
.cricket-arc .step-tag{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:6px;padding-bottom:8px;border-bottom:0.5px solid #F1EFE9}
.cricket-arc .story-h, .cricket-arc .section-h{font-size:18px;font-weight:800;color:#1C1917;line-height:1.3;margin-bottom:8px}
.cricket-arc .section-h{font-size:16px}
.cricket-arc .story-b{font-size:13px;color:#57534E;line-height:1.7;margin-bottom:12px;padding:10px 12px;border-radius:8px;background:#F8F7F4}
.cricket-arc .section-b{font-size:12px;color:#57534E;line-height:1.7;margin-bottom:10px}
.cricket-arc .card-body{padding:12px 16px 16px}
.cricket-arc .layer-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-right:6px}

.cricket-arc .guess-echo{border-left:3px solid #F59E0B;padding:8px 12px;border-radius:0 8px 8px 0;background:#F8F7F4;margin-bottom:12px}
.cricket-arc .ge-label{font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#B45309;margin-bottom:3px}
.cricket-arc .ge-text{font-size:12px;color:#57534E;font-style:italic}

.cricket-arc .visual-frame{border-radius:10px;padding:16px;margin-bottom:12px;text-align:center}
.cricket-arc .vf-emoji{font-size:44px;margin-bottom:10px;display:block}
.cricket-arc .vf-title{font-size:15px;font-weight:800;color:#1C1917;margin-bottom:6px}
.cricket-arc .vf-body{font-size:12px;color:#57534E;line-height:1.7}
.cricket-arc .vf-formula{font-size:13px;font-weight:700;padding:8px 16px;border-radius:20px;display:inline-block;margin-top:10px}

.cricket-arc .sort-instruction{font-size:12px;color:#57534E;line-height:1.6;padding:8px 12px;border-radius:8px;background:#F8F7F4;margin-bottom:10px}
.cricket-arc .sort-items{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.cricket-arc .sort-item{padding:6px 12px;border-radius:20px;border:1.5px solid #E7E5E4;background:#fff;font-size:12px;font-weight:600;color:#1C1917;user-select:none;cursor:pointer}
.cricket-arc .sort-item.sel{border-color:#3B82F6;background:#EFF6FF;color:#1D4ED8}
.cricket-arc .sort-item.placed{opacity:0.3;cursor:default}
.cricket-arc .sort-bins{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
.cricket-arc .bin{border:1.5px dashed #E7E5E4;border-radius:10px;padding:10px;min-height:60px;cursor:pointer}
.cricket-arc .bin.correct{border-color:#22C55E;background:#F0FDF4;animation:glow 0.5s ease}
.cricket-arc .bin.wrong{border-color:#EF4444;background:#FEF2F2;animation:shake 0.3s ease}
.cricket-arc .bin-label{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px}
.cricket-arc .bin-items{display:flex;flex-wrap:wrap;gap:4px;min-height:24px}
.cricket-arc .bin-chip{font-size:10px;font-weight:600;padding:3px 8px;border-radius:10px}

.cricket-arc .bd-statement{font-size:16px;font-weight:700;color:#1C1917;line-height:1.4;margin-bottom:6px}
.cricket-arc .bd-context{font-size:12px;color:#57534E;line-height:1.55;margin-bottom:14px;font-style:italic}
.cricket-arc .bd-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
.cricket-arc .bd-btn{padding:12px 8px;border-radius:10px;border:1.5px solid #E7E5E4;font-size:13px;font-weight:700;background:#fff;color:#1C1917;text-align:center}
.cricket-arc .bd-btn.correct{background:#F0FDF4;border-color:#22C55E;color:#15803D;animation:glow 0.5s ease}
.cricket-arc .bd-btn.wrong{background:#FEF2F2;border-color:#EF4444;color:#B91C1C;animation:shake 0.3s ease}
.cricket-arc .bd-btn.disabled{opacity:0.35;pointer-events:none}
.cricket-arc .bd-reveal{border-radius:8px;padding:10px 12px;font-size:12px;line-height:1.65;margin-top:8px}
.cricket-arc .bd-reveal.on{animation:fadeUp 0.3s ease}

.cricket-arc .input-area, .cricket-arc .explain-input{border:0.5px solid #E7E5E4;border-radius:10px;padding:10px 12px;background:#F8F7F4;font-size:13px;color:#1C1917;font-family:'Sora',sans-serif;resize:none;width:100%;outline:none;line-height:1.6;min-height:64px}
.cricket-arc .input-area:focus, .cricket-arc .explain-input:focus{border-color:#F59E0B}

.cricket-arc .time-tag{display:inline-flex;font-size:9px;font-weight:600;padding:2px 8px;border-radius:20px;background:#F8F7F4;color:#A8A29E;margin-bottom:8px}

.cricket-arc .voice-row{display:flex;gap:8px;margin-top:8px;align-items:center}
.cricket-arc .voice-btn, .cricket-arc .v-btn{display:flex;align-items:center;gap:5px;padding:7px 12px;border-radius:8px;border:0.5px solid #E7E5E4;background:#fff;font-size:11px;font-weight:500;color:#57534E}
.cricket-arc .rdot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#EF4444;animation:pulse 1.5s infinite}

.cricket-arc .act-btn, .cricket-arc .act{width:100%;padding:13px;border-radius:12px;border:none;font-size:14px;font-weight:700;margin-top:8px}
.cricket-arc .act:active, .cricket-arc .act-btn:active{transform:scale(0.97)}
.cricket-arc .act-d1{background:#F59E0B;color:#fff}
.cricket-arc .act-d2{background:#0284C7;color:#fff}
.cricket-arc .act-d3{background:#15803D;color:#fff}

.cricket-arc .recall{border:0.5px solid #F59E0B;border-radius:10px;padding:12px 14px;background:#FFFBEB;margin-bottom:10px}
.cricket-arc .recall-tag{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#B45309;margin-bottom:5px}
.cricket-arc .recall-text{font-size:13px;color:#92400E;font-style:italic;line-height:1.5}
.cricket-arc .recall-now{font-size:11px;color:#B45309;margin-top:6px;font-weight:600}

.cricket-arc .compare{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
.cricket-arc .cmp-card{border-radius:10px;padding:12px;text-align:center}
.cricket-arc .cmp-name{font-size:11px;font-weight:700;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px}
.cricket-arc .cmp-stat{font-size:22px;font-weight:800;line-height:1;margin-bottom:4px}
.cricket-arc .cmp-detail{font-size:10px;line-height:1.5}
.cricket-arc .cmp-result{border-radius:8px;padding:3px 10px;font-size:10px;font-weight:700;display:inline-block;margin-top:6px}

.cricket-arc .choose-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.cricket-arc .c-btn{padding:8px 14px;border-radius:20px;font-size:12px;font-weight:700;border:1.5px solid #E7E5E4;background:#F8F7F4;color:#1C1917}
.cricket-arc .c-btn.cor{background:#F0FDF4;border-color:#22C55E;color:#15803D;animation:glow 0.4s ease}
.cricket-arc .c-btn.wrg{background:#FEF2F2;border-color:#EF4444;color:#B91C1C;animation:shake 0.3s ease}
.cricket-arc .c-btn.dis{opacity:0.3;pointer-events:none}

.cricket-arc .reveal{border-radius:10px;padding:12px 14px;margin:8px 0;font-size:12px;line-height:1.65}
.cricket-arc .reveal.on{animation:fadeUp 0.3s ease}

.cricket-arc .explain-box{border:0.5px solid #E7E5E4;border-radius:10px;padding:12px;background:#F8F7F4;margin-bottom:10px}
.cricket-arc .explain-prompt{font-size:13px;font-weight:700;color:#1C1917;margin-bottom:8px;line-height:1.4}
.cricket-arc .explain-sub{font-size:11px;color:#57534E;margin-bottom:10px;line-height:1.5;padding:8px 10px;background:#fff;border-radius:8px;border-left:2px solid #F59E0B}

.cricket-arc .ai-mirror{border:0.5px solid #F1EFE9;border-radius:10px;padding:12px 14px;margin:10px 14px;background:#fff;animation:fadeUp 0.4s ease}
.cricket-arc .ai-head{display:flex;align-items:center;gap:7px;margin-bottom:8px}
.cricket-arc .ai-av{width:20px;height:20px;border-radius:50%;background:#EEEDFE;display:flex;align-items:center;justify-content:center}
.cricket-arc .ai-av-i{width:8px;height:8px;border-radius:50%;background:#534AB7}
.cricket-arc .ai-name{font-size:11px;font-weight:600;color:#57534E}
.cricket-arc .ai-body{font-size:12px;color:#1C1917;line-height:1.65}
.cricket-arc .ai-gap{margin-top:8px;padding:8px 10px;background:#FFFBEB;border-radius:7px;font-size:11px;color:#633806;line-height:1.55;font-weight:500}

.cricket-arc .det-header{background:#FEF2F2;border-radius:8px;padding:8px 12px;margin-bottom:10px}
.cricket-arc .det-title{font-size:11px;font-weight:700;color:#B91C1C}
.cricket-arc .det-sub{font-size:10px;color:#EF4444;margin-top:2px}
.cricket-arc .stmt{border:0.5px solid #F1EFE9;border-radius:10px;padding:12px;margin-bottom:8px;background:#fff}
.cricket-arc .stmt-text{font-size:13px;font-weight:600;color:#1C1917;margin-bottom:8px;line-height:1.4}

.cricket-arc .teach-card{border-radius:14px;overflow:hidden;margin:0 14px 10px;border:1.5px solid #22C55E;background:#F0FDF4}
.cricket-arc .teach-top{background:#15803D;padding:10px 14px;display:flex;align-items:center;gap:8px}
.cricket-arc .teach-icon{font-size:18px}
.cricket-arc .teach-top-text{font-size:11px;font-weight:700;color:#fff;letter-spacing:0.5px}
.cricket-arc .teach-body{padding:14px}
.cricket-arc .teach-scenario{font-size:13px;font-weight:700;color:#14532D;line-height:1.4;margin-bottom:8px}
.cricket-arc .teach-context{font-size:12px;color:#166534;line-height:1.6;margin-bottom:12px;padding:8px 10px;background:rgba(255,255,255,0.6);border-radius:8px}
.cricket-arc .teach-choices{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
.cricket-arc .teach-choice{padding:10px 12px;border-radius:8px;border:1.5px solid rgba(20,83,45,0.2);background:rgba(255,255,255,0.5);font-size:12px;font-weight:600;color:#14532D;text-align:left;line-height:1.4}
.cricket-arc .teach-choice.sel-t{background:#fff;border-color:#22C55E;animation:pop 0.25s ease}
.cricket-arc .teach-reveal{padding:10px 12px;background:rgba(255,255,255,0.7);border-radius:8px}
.cricket-arc .teach-reveal.on{animation:fadeUp 0.3s ease}
.cricket-arc .teach-share{border-radius:10px;padding:12px 14px;background:#fff;border:1px solid #22C55E;margin-top:10px}
.cricket-arc .teach-share-label{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#15803D;margin-bottom:6px}
.cricket-arc .teach-share-text{font-size:13px;color:#14532D;line-height:1.6;font-style:italic;font-weight:600}
.cricket-arc .share-btn{margin-top:8px;padding:7px 14px;border-radius:20px;border:none;background:#15803D;color:#fff;font-size:11px;font-weight:700}

.cricket-arc .os-score{border-radius:14px;overflow:hidden;margin:0 14px 10px;border:0.5px solid #F1EFE9;background:#fff}
.cricket-arc .os-top{padding:14px;background:#1A1A2E;color:#fff}
.cricket-arc .os-top-label{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#FBBF24;margin-bottom:10px}
.cricket-arc .os-gains{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.cricket-arc .os-g{text-align:center;background:rgba(255,255,255,0.05);border-radius:8px;padding:8px 4px}
.cricket-arc .os-n{font-size:15px;font-weight:800;line-height:1}
.cricket-arc .os-l{font-size:9px;color:rgba(255,255,255,0.6);margin-top:3px}
.cricket-arc .os-body{padding:14px}
.cricket-arc .os-principle{display:flex;gap:10px;padding:8px 10px;border-radius:8px;background:#F8F7F4;margin-bottom:6px}
.cricket-arc .op-num{width:20px;height:20px;border-radius:50%;background:#1A1A2E;color:#FBBF24;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.cricket-arc .op-text{font-size:11px;color:#1C1917;line-height:1.55}

.cricket-arc .unlock-card{border-radius:14px;overflow:hidden;margin:0 14px 10px;border:1.5px solid #F59E0B;background:#FFFBEB}
.cricket-arc .unlock-top{background:#B45309;padding:10px 14px;display:flex;align-items:center;gap:8px}
.cricket-arc .unlock-icon{font-size:18px}
.cricket-arc .unlock-top-text{font-size:11px;font-weight:700;color:#fff;letter-spacing:0.5px}
.cricket-arc .unlock-body{padding:14px}
.cricket-arc .unlock-h{font-size:14px;font-weight:800;color:#78350F;margin-bottom:4px}
.cricket-arc .unlock-sub{font-size:11px;color:#92400E;line-height:1.55;margin-bottom:10px}
.cricket-arc .unlock-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.cricket-arc .unlock-item{padding:8px 10px;border-radius:8px;background:rgba(255,255,255,0.7);border:0.5px solid #F59E0B}
.cricket-arc .ui-label{font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#B45309;margin-bottom:3px}
.cricket-arc .ui-text{font-size:11px;color:#78350F;line-height:1.45}

.cricket-arc .done-wrap{text-align:center;padding:14px 0 6px}
.cricket-arc .done-icon{font-size:38px;display:block;margin-bottom:6px}
.cricket-arc .done-h{font-size:17px;font-weight:800;color:#1C1917;margin-bottom:4px}
.cricket-arc .done-sub{font-size:12px;color:#57534E}
.cricket-arc .done-gains{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px}
.cricket-arc .dg-card{text-align:center;padding:10px 6px;border-radius:8px;background:#F8F7F4;border:0.5px solid #F1EFE9}
.cricket-arc .dg-num{font-size:15px;font-weight:800;line-height:1;margin-bottom:3px}
.cricket-arc .dg-lbl{font-size:9px;color:#A8A29E}
.cricket-arc .done-tease{border-radius:10px;padding:10px 12px;margin-bottom:10px}
.cricket-arc .dt-label{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px}
.cricket-arc .dt-text{font-size:11px;line-height:1.55}
.cricket-arc .done-fact{border-radius:10px;padding:10px 12px;font-size:11px;line-height:1.55;margin-bottom:10px}
`;
