import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Cricket 3-day arc — pixel-faithful port of:
 *   public/previews/day1-flow.html  (Day 1 · 5-min Spark)
 *   public/previews/3day-arc.html   (Day 2 Build · Day 3 Master)
 *
 * Hidden 7-layer engine the student lives:
 *   D1: Curiosity → First thought → Trap (Assumptions)
 *   D2: Reflection ("Yesterday you thought…") → Reasoning → Expression (Feynman) → Assumptions
 *   D3: First principles → Real-world Application → Teach a friend → Character/Inner-OS
 */

type Day = 1 | 2 | 3;
type Pick = "correct" | "wrong" | null;

const POS = new Set(["+1.2", "+340", "+8848m"]);
const NEG = new Set(["-0.8", "-50m", "-15C"]);

interface Props {
  episodeTitle: string;
  conceptKey?: string;
  chapterId?: string;
  episodeId?: string;
  initialDay?: Day;
}

export default function CricketArcLive({ conceptKey, chapterId, episodeId, initialDay = 1 }: Props) {
  const { user } = useAuth();
  const [day, setDay] = useState<Day>(initialDay);
  const [day2Unlocked, setDay2Unlocked] = useState(false);
  const [day3Unlocked, setDay3Unlocked] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const goDay = (d: Day) => {
    setDay(d);
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  };

  return (
    <div ref={topRef} className="cricket-arc" style={{ background: "#F8F7F4", minHeight: "100vh" }}>
      <style>{CSS}</style>
      <div className="g">
        {/* ARC TOPBAR */}
        <div className="arc-bar">
          <div className="arc-days">
            <button className="arc-day d1c" onClick={() => goDay(1)}>
              Day 1 {day > 1 ? "✓" : ""}
            </button>
            <button className="arc-day d2c" onClick={() => goDay(2)}>Day 2</button>
            <button className="arc-day d3c" onClick={() => goDay(3)}>Day 3</button>
          </div>
          <div className="arc-interest">🏏 Cricket</div>
        </div>

        {day === 1 && <Day1Flow onDone={() => { setDay2Unlocked(true); goDay(2); }} userId={user?.id} conceptKey={conceptKey} />}
        {day === 2 && <Day2Flow onDone={() => { setDay3Unlocked(true); goDay(3); }} />}
        {day === 3 && <Day3Flow onRestart={() => goDay(1)} chapterId={chapterId} episodeId={episodeId} userId={user?.id} />}
      </div>
    </div>
  );
}

/* ════════════════════════════ DAY 1 · 5-MIN SPARK ════════════════════════════ */

function Day1Flow({ onDone, userId, conceptKey }: { onDone: () => void; userId?: string; conceptKey?: string }) {
  const [step, setStep] = useState(0);
  const [guess, setGuess] = useState("");
  const [shownGuess, setShownGuess] = useState("");

  // Sort
  const [selected, setSelected] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, "pos" | "neg">>({});
  const [sortFeedback, setSortFeedback] = useState<"" | "correct" | "wrong">("");

  // BD
  const [bdChoice, setBdChoice] = useState<"" | "believe" | "doubt">("");

  const STEPS = [
    { label: "Hook", time: "~5 min", pct: 100, color: "#22C55E" },
    { label: "Reveal", time: "~4 min", pct: 80, color: "#22C55E" },
    { label: "Sort it", time: "~3 min", pct: 60, color: "#22C55E" },
    { label: "Detect", time: "~1.5 min", pct: 30, color: "#F59E0B" },
    { label: "Done!", time: "done", pct: 0, color: "#EF4444" },
  ];

  const goNext = (n: number) => {
    if (n === 1) setShownGuess(guess.trim() || "(no guess — that's okay)");
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
      const isPos = POS.has(v);
      const isNeg = NEG.has(v);
      if ((z === "pos" && !isPos) || (z === "neg" && !isNeg)) allCorrect = false;
    }
    setSortFeedback(allCorrect ? "correct" : "wrong");
    setTimeout(() => goNext(3), 800);
  };

  const checkBD = (c: "believe" | "doubt") => setBdChoice(c);

  // persist Day 1 thought on submit
  useEffect(() => {
    if (step === 1 && shownGuess && userId && conceptKey && shownGuess !== "(no guess — that's okay)") {
      supabase.from("curiosity_arc_progress").upsert(
        { user_id: userId, concept_key: conceptKey, day1_first_thought: shownGuess, interest_tag: "cricket" },
        { onConflict: "user_id,concept_key" } as never,
      ).then(() => {});
    }
  }, [step, shownGuess, userId, conceptKey]);

  return (
    <>
      {/* PROGRESS TOPBAR */}
      <div className="topbar">
        <div className="tb-left">
          <div className="tb-badge" style={{ background: "#F0FDF4", color: "#15803D" }}>🏏 Cricket</div>
          <div className="tb-steps">
            {STEPS.map((_, i) => (
              <div key={i} className={"ts" + (i < step ? " done" : i === step ? " active" : "")} />
            ))}
          </div>
        </div>
        <div className="tb-timer">
          <span>{STEPS[step].time}</span>
          <div className="timer-bar">
            <div className="timer-fill" style={{ width: STEPS[step].pct + "%", background: STEPS[step].color }} />
          </div>
        </div>
      </div>

      {/* SC 0 HOOK */}
      {step === 0 && (
        <div className="main">
          <div className="card-top">
            <div className="step-tag" style={{ color: "#F59E0B" }}>The hook · 60 seconds</div>
            <div className="story-h">Can a team win a match and still have a negative NRR?</div>
          </div>
          <div className="card-body">
            <div className="story-b">India beats Sri Lanka by 2 wickets. But their NRR drops from +0.4 to -0.1. How can winning lower a score? And what does "negative" even mean for a rate?</div>
            <div className="time-tag">⏱ 60s</div>
            <textarea className="input-area" value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="Take your best guess — no wrong answer..." rows={2} />
            <div className="voice-row">
              <button className="voice-btn"><span className="rdot" /> Speak instead</button>
              <span style={{ fontSize: 10, color: "#A8A29E" }}>45 sec, your own words</span>
            </div>
            <button className="act-btn" style={{ background: "#1A1A2E", color: "#fff", marginTop: 10 }} onClick={() => goNext(1)}>Lock in my guess →</button>
          </div>
        </div>
      )}

      {/* SC 1 AHA */}
      {step === 1 && (
        <div className="main">
          <div className="card-top">
            <div className="step-tag" style={{ color: "#22C55E" }}>Aha moment · 60 seconds</div>
            <div className="guess-echo">
              <div className="ge-label">You guessed</div>
              <div className="ge-text">{shownGuess}</div>
            </div>
          </div>
          <div className="card-body">
            <div className="visual-frame" style={{ background: "#F0FDF4", border: "0.5px solid #22C55E" }}>
              <span className="vf-emoji">🏏</span>
              <div className="vf-title">NRR is a number line. Zero is the reference.</div>
              <div className="vf-body">NRR = (runs scored per over) − (runs conceded per over). When you concede more than you score across all matches, the subtraction gives a number below zero. That's a negative integer — a number that exists to the left of zero on the number line.</div>
              <div className="vf-formula" style={{ background: "#DCFCE7", color: "#15803D" }}>Runs scored/ov − Runs conceded/ov = can be negative</div>
            </div>
            <div style={{ fontSize: 12, color: "#57534E", lineHeight: 1.65, marginBottom: 10 }}>The number line doesn't stop at zero. It keeps going left — into negative territory. That's exactly what integers are: whole numbers that include the world below zero.</div>
            <div className="time-tag">⏱ next: 90 sec activity</div>
            <button className="act-btn" style={{ background: "#15803D", color: "#fff" }} onClick={() => goNext(2)}>Got it — now try this →</button>
          </div>
        </div>
      )}

      {/* SC 2 SORT */}
      {step === 2 && (
        <div className="main">
          <div className="card-top">
            <div className="step-tag" style={{ color: "#3B82F6" }}>Sort it · 90 seconds</div>
            <div className="story-h">Which of these are below zero?</div>
          </div>
          <div className="card-body">
            <div className="sort-instruction">Tap a number, then tap which side it belongs on. Some are above zero (+), some are below (−). The cricket ones you've already seen — trust your instinct for the rest.</div>
            <div className="time-tag">⏱ 90s</div>
            <div className="sort-items">
              {["NRR: -0.8|-0.8", "NRR: +1.2|+1.2", "-50m sea level|-50m", "+340 runs|+340", "-15°C temp|-15C", "Everest: +8848m|+8848m"].map((s) => {
                const [label, val] = s.split("|");
                const isPlaced = !!placed[val];
                const isSel = selected === val;
                return (
                  <div key={val} className={"sort-item" + (isSel ? " sel" : "") + (isPlaced ? " placed" : "")} onClick={() => selItem(val)}>{label}</div>
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

      {/* SC 3 BD */}
      {step === 3 && (
        <div className="main">
          <div className="card-top">
            <div className="step-tag" style={{ color: "#8B5CF6" }}>Spot the trap · 45 seconds</div>
          </div>
          <div className="card-body">
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6D28D9", marginBottom: 8, padding: "6px 10px", background: "#F5F3FF", borderRadius: 6, display: "inline-block" }}>Detective challenge — most people get this wrong</div>
            <div className="bd-statement">"A cricket team with an NRR of -0.5 has definitely lost more matches than they've won."</div>
            <div className="bd-context">Think about it. NRR depends on run rate, not just wins and losses. Could you lose big and win narrow — and end up with a negative NRR despite equal wins?</div>
            <div className="time-tag">⏱ 45s · commit before thinking too long</div>
            <div className="bd-btns">
              <button className={"bd-btn" + (bdChoice === "believe" ? " wrong" : bdChoice ? " disabled" : "")} onClick={() => !bdChoice && checkBD("believe")}>✓ I believe this</button>
              <button className={"bd-btn" + (bdChoice === "doubt" ? " correct" : bdChoice ? " disabled" : "")} onClick={() => !bdChoice && checkBD("doubt")}>⚡ I doubt this</button>
            </div>
            {bdChoice && (
              <div className="bd-reveal on" style={{ background: "#F5F3FF" }}>
                <div style={{ fontSize: 12, lineHeight: 1.65, color: "#1C1917" }}>
                  <strong>The statement is false.</strong> A team could win 3 matches narrowly and lose 1 by a huge margin — ending with a negative NRR despite more wins. NRR measures how efficiently you scored runs, not whether you won. A big loss "poisons" the average more than a narrow win "helps" it. This is exactly why integers and averages behave differently from simple counting.
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: "#6D28D9", fontWeight: 600 }}>🧠 What you just did: you questioned an assumption. That's the core skill.</div>
              </div>
            )}
            {bdChoice && (
              <button className="act-btn" style={{ background: "#6D28D9", color: "#fff" }} onClick={() => goNext(4)}>See what I learned today →</button>
            )}
          </div>
        </div>
      )}

      {/* SC 4 DONE */}
      {step === 4 && (
        <div className="main">
          <div className="card-body">
            <div className="done-wrap">
              <span className="done-icon">⚡</span>
              <div className="done-h">Day 1 done. Real learning in 5 minutes.</div>
              <div className="done-sub">Here's what just happened in your brain:</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
              <DoneRow n={1} bg="#F0FDF4">
                <strong>You got confused first</strong> — NRR going negative felt strange. That confusion is what made the concept stick. Confusion is the beginning of understanding.
              </DoneRow>
              <DoneRow n={2} bg="#EFF6FF">
                <strong>You sorted real examples</strong> — not textbook numbers. When you placed -50m and -15°C in the "below zero" bin, you built the concept in your own mind.
              </DoneRow>
              <DoneRow n={3} bg="#F5F3FF">
                <strong>You caught a trap</strong> — a statement that sounds true but isn't. That's the hardest skill in mathematics. You used it.
              </DoneRow>
            </div>
            <div className="done-gains">
              <DG n="+1%" l="Clarity" c="#22C55E" />
              <DG n="+1%" l="Thinking" c="#3B82F6" />
              <DG n="Day 1" l="Streak started" c="#F59E0B" />
            </div>
            <div className="done-tease" style={{ background: "#FFFBEB", border: "0.5px solid #F59E0B" }}>
              <div className="dt-label" style={{ color: "#B45309" }}>Tomorrow · Day 2 · Build</div>
              <div className="dt-text" style={{ color: "#92400E" }}>We'll show you exactly what you guessed today — your own words. Then we'll go one layer deeper: why fractions had to be invented, and what cricket stats look like without them. 6 minutes.</div>
            </div>
            <div className="done-fact" style={{ background: "#F0FDF4", color: "#15803D", border: "0.5px solid #22C55E" }}>
              🏏 <strong>One fact to take out of here:</strong> The next time you see a negative NRR on a scorecard, you'll know you're looking at an integer — a number that tells a story of more conceded than scored. That's the entire concept, right there.
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
  return (
    <div className="dg-card">
      <div className="dg-num" style={{ color: c }}>{n}</div>
      <div className="dg-lbl">{l}</div>
    </div>
  );
}

/* ════════════════════════════ DAY 2 · BUILD ════════════════════════════ */

function Day2Flow({ onDone }: { onDone: () => void }) {
  const [screen, setScreen] = useState<"a" | "b" | "c" | "d" | "done">("a");
  const [aPick, setAPick] = useState<Pick>(null);
  const [feynman, setFeynman] = useState("");
  const [mirror, setMirror] = useState(false);
  const [detPick, setDetPick] = useState<Pick>(null);

  const next = (to: typeof screen) => { setScreen(to); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const labels = ["Recall", "Mechanism", "Teach back", "Trap", "Done"];
  const stepN = { a: 0, b: 1, c: 2, d: 3, done: 4 }[screen];

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

      {screen === "a" && (
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
              <div className="recall-text">"Sixes are mostly about strength and bat size"</div>
              <div className="recall-now">Today you'll discover exactly why that's incomplete — and something most cricket fans never realise.</div>
            </div>
            <div className="section-h">Two bowlers. Same 3 wickets. Completely different story.</div>
            <div className="section-b">Here's a puzzle your cricket friends probably can't solve. Think carefully before you answer.</div>
            <div className="compare">
              <div className="cmp-card" style={{ background: "#EFF6FF", border: "1.5px solid #3B82F6" }}>
                <div className="cmp-name" style={{ color: "#1D4ED8" }}>Bumrah</div>
                <div className="cmp-stat" style={{ color: "#1D4ED8" }}>3 wickets</div>
                <div className="cmp-detail" style={{ color: "#3B82F6" }}>in 4 overs</div>
                <div className="cmp-result" style={{ background: "#DBEAFE", color: "#1D4ED8" }}>Economy: 5.2</div>
              </div>
              <div className="cmp-card" style={{ background: "#FEF3C7", border: "1.5px solid #F59E0B" }}>
                <div className="cmp-name" style={{ color: "#B45309" }}>Arshdeep</div>
                <div className="cmp-stat" style={{ color: "#B45309" }}>3 wickets</div>
                <div className="cmp-detail" style={{ color: "#F59E0B" }}>in 6 overs</div>
                <div className="cmp-result" style={{ background: "#FEF3C7", color: "#B45309" }}>Economy: 7.8</div>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1C1917", marginBottom: 8 }}>Same wickets. Who performed better in this spell?</div>
            <div className="choose-row">
              <ChooseBtn label="Bumrah 💪" picked={aPick} mine="correct" onPick={() => !aPick && setAPick("correct")} />
              <ChooseBtn label="Both equal 🤷" picked={aPick} mine="wrong" onPick={() => !aPick && setAPick("wrong")} />
              <ChooseBtn label="Arshdeep 🤔" picked={aPick} mine="wrong" onPick={() => !aPick && setAPick("wrong")} />
            </div>
            {aPick && (
              <div className="reveal on" style={{ background: "#F0FDF4", border: "0.5px solid #22C55E", color: "#14532D" }}>
                <strong>Bumrah</strong> — 3 wickets in 4 overs means fewer balls wasted. Rate = wickets ÷ overs = 3/4. Arshdeep took 3/6. <strong>3/4 is a bigger fraction than 3/6</strong>. Efficiency matters more than totals. This is exactly what fractions measure — performance per unit.
              </div>
            )}
            {aPick && <button className="act act-d2" onClick={() => next("b")}>Next — see the deeper why →</button>}
          </div>
        </div>
      )}

      {screen === "b" && (
        <div className="card">
          <div className="card-top">
            <div className="step-tag" style={{ color: "#0284C7" }}>
              <span className="layer-pill" style={{ background: "#E0F2FE", color: "#0C4A6E" }}>Layer 3 · Reasoning</span>
              Why fractions exist
            </div>
          </div>
          <div className="card-body">
            <div className="section-h">Counting doesn't always tell the truth.</div>
            <div className="section-b">3 wickets sounds the same whether you bowled 4 overs or 10 overs. But you intuitively know they're not the same. Why?<br /><br />Because your brain is secretly computing a ratio — how many wickets <em>per over</em>. That ratio is a fraction. <strong>Fractions exist because totals lie and rates tell the truth.</strong></div>
            <div style={{ borderRadius: 10, padding: 12, background: "#EFF6FF", border: "0.5px solid #3B82F6", marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>The Fraction Formula in Cricket</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={formulaRowStyle}>Bowling average = Runs conceded ÷ Wickets taken</div>
                <div style={formulaRowStyle}>Economy rate = Runs conceded ÷ Overs bowled</div>
                <div style={{ ...formulaRowStyle, fontWeight: 600 }}>Both are fractions — part ÷ whole = rate</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#57534E", lineHeight: 1.7, marginBottom: 10, padding: "8px 12px", background: "#F8F7F4", borderRadius: 8, borderLeft: "2px solid #F59E0B" }}>
              <strong style={{ color: "#1C1917" }}>The connection to Virat Kohli:</strong> Kohli has played 500+ matches, average 54. A new player plays 2 matches, scores a lot, average is 80. Who is more reliable? The average (runs ÷ innings) is a fraction — and a fraction needs enough data to be meaningful. A fraction from 2 innings lies. A fraction from 500 tells the truth.
            </div>
            <button className="act act-d2" onClick={() => next("c")}>Now explain it in your own words →</button>
          </div>
        </div>
      )}

      {screen === "c" && (
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
                <div className="explain-prompt">Your cricket-crazy cousin says: "Rahul has 5 wickets and Jadeja has 3. Rahul is obviously better." How do you correct him?</div>
                <div className="explain-sub">Use what you just learned. Keep it simple — like you're texting a friend. Cricket language is fine.</div>
                <textarea className="explain-input" value={feynman} onChange={(e) => setFeynman(e.target.value)} placeholder="Bro, that's not how it works. Wickets alone don't tell you..." rows={3} />
                <div className="voice-row"><button className="v-btn"><span className="rdot" /> Say it out loud instead</button><span style={{ fontSize: 10, color: "#A8A29E" }}>45 sec · casual language</span></div>
              </div>
              <button className="act act-d2" onClick={() => setMirror(true)}>Submit →</button>
            </div>
          </div>
          {mirror && (
            <>
              <div className="ai-mirror on">
                <div className="ai-head"><div className="ai-av"><div className="ai-av-i" /></div><div className="ai-name">Inner OS</div></div>
                <div className="ai-body">You used rate-thinking correctly — that's the key insight. Comparing wickets without overs is like comparing runs without balls faced.</div>
                <div className="ai-gap">One gap to sharpen: mention that both numbers matter — wickets AND overs. Economy = wickets ÷ overs. You need both parts to get the fraction. Next time, state both numbers when comparing.</div>
              </div>
              <button className="act act-d2" onClick={() => next("d")}>One last detective challenge →</button>
            </>
          )}
        </>
      )}

      {screen === "d" && (
        <div className="card">
          <div className="card-top">
            <div className="step-tag" style={{ color: "#0284C7" }}>
              <span className="layer-pill" style={{ background: "#E0F2FE", color: "#0C4A6E" }}>Layer 4 · Assumptions</span>
              Spot the trap
            </div>
          </div>
          <div className="card-body">
            <div className="det-header"><div className="det-title">Detective challenge — harder than yesterday</div><div className="det-sub">Most fans get this wrong</div></div>
            <div className="stmt">
              <div className="stmt-text">"Virat Kohli's average is 54. He played 2 matches recently and scored 0 and 10. So now his average dropped below 54."</div>
              <div className="choose-row">
                <ChooseBtn label="True — obviously" picked={detPick} mine="wrong" onPick={() => !detPick && setDetPick("wrong")} />
                <ChooseBtn label="Depends on something" picked={detPick} mine="correct" onPick={() => !detPick && setDetPick("correct")} />
              </div>
              {detPick && (
                <div className="reveal on" style={{ background: "#F5F3FF", border: "0.5px solid #8B5CF6", color: "#3C1A78" }}>
                  <strong>Depends on sample size.</strong> Adding 2 low-scoring innings to 500+ innings barely moves the average — the fraction denominator (total innings) is so large that 2 innings barely changes it. This is why Kohli's average from 500 matches is reliable, but a player's average from 2 matches means almost nothing. <strong>Fractions need enough data to be meaningful.</strong>
                </div>
              )}
            </div>
            {detPick && <button className="act act-d2" onClick={() => next("done")}>Day 2 complete →</button>}
          </div>
        </div>
      )}

      {screen === "done" && (
        <div className="card">
          <div className="card-body" style={{ textAlign: "center", padding: "20px 16px" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🏏</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1C1917", marginBottom: 4 }}>Day 2 done.</div>
            <div style={{ fontSize: 12, color: "#57534E", marginBottom: 16 }}>You learned why fractions exist — and used cricket to prove it.</div>
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "#FFFBEB", border: "0.5px solid #F59E0B", textAlign: "left", marginBottom: 14 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#B45309", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Day 3 unlocks · Master</div>
              <div style={{ fontSize: 12, color: "#92400E", lineHeight: 1.65 }}>You'll get a real cricket puzzle your friends can't solve — and the words to explain it perfectly. Plus: why do some small fractions feel bigger than large ones? 🤔</div>
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

function Day3Flow({ onRestart, chapterId, episodeId, userId }: { onRestart: () => void; chapterId?: string; episodeId?: string; userId?: string }) {
  const [screen, setScreen] = useState<"a" | "b" | "c" | "d">("a");
  const [aPick, setAPick] = useState<Pick>(null);
  const [bPick, setBPick] = useState<Pick>(null);
  const [teachIdx, setTeachIdx] = useState<number | null>(null);

  const next = (to: typeof screen) => { setScreen(to); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const labels = ["First principles", "Real case", "Teach friend", "Growth"];
  const stepN = { a: 0, b: 1, c: 2, d: 3 }[screen];

  const teachLines = [
    "\"Did you know 3 wickets in 4 overs beats 3 wickets in 6 overs? It's a fraction — efficiency per over. Most fans miss this.\"",
    "\"Bro, in cricket you can't just compare wickets. Check the overs too — it's about rate, like speed: faster = better bowler.\"",
    "\"Think of it like money: same amount but one took less time. Same wickets but fewer overs = better bowler. It's fractions.\"",
  ];

  // Persist arc completion when reaching the final OS-score screen
  useEffect(() => {
    if (screen !== "d" || !userId || !chapterId || !episodeId) return;
    supabase.from("episode_progress").upsert(
      {
        user_id: userId,
        chapter_id: chapterId,
        episode_id: episodeId,
        completion_pct: 100,
        completed_at: new Date().toISOString(),
        layer_scores: { cricket_arc: "complete" },
      },
      { onConflict: "user_id,chapter_id,episode_id" },
    ).then(() => {});
  }, [screen, userId, chapterId, episodeId]);

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

      {screen === "a" && (
        <div className="card">
          <div className="card-top">
            <div className="step-tag" style={{ color: "#15803D" }}>
              <span className="layer-pill" style={{ background: "#F0FDF4", color: "#14532D" }}>Layer 6 · First Principles</span>
              Day 3 · Master · 8 min
            </div>
          </div>
          <div className="card-body">
            <div className="section-h">Why does maths need fractions at all?</div>
            <div className="section-b">Strip it to the root. Before fractions existed, people could only count whole things — 1 goat, 2 goats. But what if you wanted to split a goat? Or compare speeds? Or share something unequally?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              <div style={{ padding: "8px 12px", borderRadius: 8, background: "#FEF3C7", fontSize: 12, color: "#78350F", lineHeight: 1.55 }}><strong>Problem 1:</strong> Two bowlers took 3 wickets each — but you can't compare them with whole numbers alone. You need wickets <em>per over</em>.</div>
              <div style={{ padding: "8px 12px", borderRadius: 8, background: "#E0F2FE", fontSize: 12, color: "#0C4A6E", lineHeight: 1.55 }}><strong>Problem 2:</strong> Kohli scored 5000 runs in 100 innings. Stating just "5000" means nothing. You need runs <em>per innings</em> = average.</div>
              <div style={{ padding: "8px 12px", borderRadius: 8, background: "#F0FDF4", fontSize: 12, color: "#14532D", lineHeight: 1.55 }}><strong>Solution:</strong> A fraction (a ÷ b) lets you express "a for every b" — performance per unit. <strong>Fractions were invented to compare fairly.</strong></div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1C1917", marginBottom: 8 }}>Quick confirm — which one needs a fraction to compare fairly?</div>
            <div className="choose-row">
              <ChooseBtn label="Total runs scored" picked={aPick} mine="wrong" onPick={() => !aPick && setAPick("wrong")} />
              <ChooseBtn label="Runs per ball faced" picked={aPick} mine="correct" onPick={() => !aPick && setAPick("correct")} />
              <ChooseBtn label="Number of sixes hit" picked={aPick} mine="wrong" onPick={() => !aPick && setAPick("wrong")} />
            </div>
            {aPick && (
              <div className="reveal on" style={{ background: "#F0FDF4", border: "0.5px solid #22C55E", color: "#14532D" }}>
                <strong>Runs per ball faced</strong> — because this is a rate (part ÷ whole = fraction). Total sixes and total runs are whole numbers that don't need division. Rates always need fractions.
              </div>
            )}
            {aPick && <button className="act act-d3" onClick={() => next("b")}>Go deeper →</button>}
          </div>
        </div>
      )}

      {screen === "b" && (
        <div className="card">
          <div className="card-top">
            <div className="step-tag" style={{ color: "#15803D" }}>
              <span className="layer-pill" style={{ background: "#F0FDF4", color: "#14532D" }}>Layer 4 · Real World</span>
              The puzzle most fans get wrong
            </div>
          </div>
          <div className="card-body">
            <div style={{ borderRadius: 10, padding: 12, background: "#1A1A2E", marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Real match scenario</div>
              <div style={{ fontSize: 13, color: "#fff", lineHeight: 1.65, marginBottom: 10 }}>Vaibhav Suryavanshi plays 2 IPL matches. Scores 150 and 120. Average = 135.<br />Virat Kohli plays 250 IPL matches. Average = 54.<br /><br />A newspaper writes: <em>"Vaibhav is currently a better batter than Kohli by average."</em></div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>Is the newspaper right? Wrong? Or is something missing?</div>
            </div>
            <div className="choose-row">
              <ChooseBtn label="Newspaper is right" picked={bPick} mine="wrong" onPick={() => !bPick && setBPick("wrong")} />
              <ChooseBtn label="Something's missing" picked={bPick} mine="correct" onPick={() => !bPick && setBPick("correct")} />
              <ChooseBtn label="Newspaper is wrong" picked={bPick} mine="wrong" onPick={() => !bPick && setBPick("wrong")} />
            </div>
            {bPick && (
              <div className="reveal on" style={{ background: "#FFFBEB", border: "0.5px solid #F59E0B", color: "#78350F" }}>
                <strong>Something's missing — sample size.</strong> Vaibhav's average of 135 from 2 innings is a fraction with a denominator of 2. Kohli's 54 from 250 innings is a fraction with a denominator of 250. <strong>A fraction from 2 data points is unreliable.</strong> The newspaper used the right tool (average = fraction) but ignored how trustworthy the fraction is. Two innings can be lucky. Two-fifty innings tells the real story.
              </div>
            )}
            {bPick && <button className="act act-d3" onClick={() => next("c")}>Now — teach your friend →</button>}
          </div>
        </div>
      )}

      {screen === "c" && (
        <>
          <div className="teach-card">
            <div className="teach-top">
              <div className="teach-icon">🗣️</div>
              <div className="teach-top-text">Teach your friend · The moment that proves you understood</div>
            </div>
            <div className="teach-body">
              <div className="teach-scenario">Your friend says: "Bumrah and Arshdeep both got 3 wickets today. They're equal, right?"</div>
              <div className="teach-context">You know better now. How do you explain it — simply, in cricket language, so they actually get it?</div>
              <div className="teach-choices">
                {teachLines.map((t, i) => (
                  <button key={i} className={"teach-choice" + (teachIdx === i ? " sel-t" : "")} onClick={() => setTeachIdx(i)}>{t}</button>
                ))}
              </div>
              {teachIdx !== null && (
                <div className="teach-reveal on">
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#14532D", marginBottom: 6 }}>All three are correct — you picked your natural way of explaining. That's exactly what understanding means.</div>
                  <div className="teach-share">
                    <div className="teach-share-label">Your cricket fact to share</div>
                    <div className="teach-share-text">{teachLines[teachIdx]}</div>
                    <button className="share-btn">Share with a cricket friend →</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {teachIdx !== null && <button className="act act-d3" onClick={() => next("d")}>See what you've built →</button>}
        </>
      )}

      {screen === "d" && (
        <>
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
              <OP n={1} text={<><strong>Started from reality</strong> — a cricket match, not a textbook definition</>} />
              <OP n={3} text={<><strong>Confusion was safe</strong> — "3 wickets = equal" was a safe first thought</>} />
              <OP n={4} text={<><strong>Productive discomfort</strong> — the Kohli vs Vaibhav puzzle made you work</>} />
              <OP n={5} text={<><strong>Your words reflected back</strong> — your Day 1 guess appeared on Day 2</>} />
              <OP n={7} text={<><strong>Ended with expression</strong> — you taught your friend. That's mastery.</>} />
            </div>
          </div>
          <div className="unlock-card">
            <div className="unlock-top"><div className="unlock-icon">🔓</div><div className="unlock-top-text">Next arc unlocked — slightly harder, same cricket frame</div></div>
            <div className="unlock-body">
              <div className="unlock-h">Ready for the next level?</div>
              <div className="unlock-sub">Same interest. Same cricket. But now the questions have more layers — based on how you responded over 3 days.</div>
              <div className="unlock-grid">
                <UI label="Week 2 hook" text="Why do D/L method results sometimes feel unfair? (Fractions + averages deeper)" />
                <UI label="Week 3 hook" text="How does toss advantage vary by pitch? (Probability + ratios)" />
                <UI label="Month 2" text="Can you predict a team's total from powerplay? (Algebra begins)" />
                <UI label="Month 3" text="Why does Kohli's average drop in SENA countries? (Statistics, data)" />
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

/* ════════════════════════════ STYLES ════════════════════════════ */

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
.cricket-arc .arc-interest{margin-left:auto;font-size:10px;font-weight:700;padding:4px 10px;border-radius:20px;background:#F0FDF4;color:#15803D;border:0.5px solid #22C55E}

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

.cricket-arc .os-score{border-radius:14px;overflow:hidden;margin:0 14px 10px}
.cricket-arc .os-top{background:#1A1A2E;padding:12px 14px}
.cricket-arc .os-top-label{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:8px}
.cricket-arc .os-gains{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}
.cricket-arc .os-g{text-align:center;padding:8px 4px;background:rgba(255,255,255,0.04);border-radius:6px}
.cricket-arc .os-n{font-size:16px;font-weight:800;line-height:1;margin-bottom:2px}
.cricket-arc .os-l{font-size:8px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px}
.cricket-arc .os-body{background:#FAFAFA;padding:12px 14px;border:0.5px solid #F1EFE9;border-top:none;border-radius:0 0 14px 14px}
.cricket-arc .os-principle{display:flex;gap:8px;padding:6px 0;border-bottom:0.5px solid #F1EFE9;align-items:flex-start}
.cricket-arc .os-principle:last-child{border-bottom:none}
.cricket-arc .op-num{width:18px;height:18px;border-radius:50%;background:#F59E0B;color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.cricket-arc .op-text{font-size:11px;color:#1C1917;line-height:1.5}

.cricket-arc .unlock-card{border:1.5px solid #8B5CF6;border-radius:14px;overflow:hidden;margin:0 14px 10px;animation:fadeUp 0.5s ease}
.cricket-arc .unlock-top{background:#6D28D9;padding:10px 14px;display:flex;align-items:center;gap:8px}
.cricket-arc .unlock-icon{font-size:18px}
.cricket-arc .unlock-top-text{font-size:11px;font-weight:700;color:#fff}
.cricket-arc .unlock-body{padding:14px;background:#F5F3FF}
.cricket-arc .unlock-h{font-size:14px;font-weight:800;color:#3C1A78;margin-bottom:6px}
.cricket-arc .unlock-sub{font-size:12px;color:#5B21B6;line-height:1.65;margin-bottom:10px}
.cricket-arc .unlock-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.cricket-arc .unlock-item{border-radius:8px;padding:8px 10px;background:rgba(255,255,255,0.6);border:0.5px solid rgba(139,92,246,0.3)}
.cricket-arc .ui-label{font-size:9px;font-weight:700;color:#6D28D9;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
.cricket-arc .ui-text{font-size:11px;color:#3C1A78;line-height:1.4;font-weight:500}

.cricket-arc .done-wrap{text-align:center;padding:20px 0 8px}
.cricket-arc .done-icon{font-size:40px;margin-bottom:12px;display:block;animation:pop 0.4s ease}
.cricket-arc .done-h{font-size:20px;font-weight:800;color:#1C1917;margin-bottom:4px}
.cricket-arc .done-sub{font-size:13px;color:#57534E;margin-bottom:16px;line-height:1.6}
.cricket-arc .done-gains{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px}
.cricket-arc .dg-card{border-radius:10px;padding:10px 6px;text-align:center;background:#F8F7F4}
.cricket-arc .dg-num{font-size:20px;font-weight:800;line-height:1;margin-bottom:2px}
.cricket-arc .dg-lbl{font-size:9px;color:#57534E;text-transform:uppercase;letter-spacing:1px}
.cricket-arc .done-tease{border-radius:10px;padding:12px 14px;margin-bottom:12px;text-align:left}
.cricket-arc .dt-label{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px}
.cricket-arc .dt-text{font-size:12px;line-height:1.6}
.cricket-arc .done-fact{border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:12px;line-height:1.65;font-weight:500}
`;
