import { useMemo, useState } from "react";
import { FOOD_MODULES, STEP_META, type InnerStep } from "@/data/foodInnerOS";

const XP_PER_STEP = 10;

type Status = "done" | "active" | "locked";
type Tab = "left" | "center" | "right";

/** Maps our curiosity-arc step kinds onto the prototype's 3 card styles. */
const cardStyleOf = (kind: InnerStep["kind"]) => {
  if (kind === "concept") return "concept";
  if (kind === "guess" || kind === "apply") return "challenge";
  return "story";
};

export default function StudentInnerOS() {
  const [moduleIdx, setModuleIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [completed, setCompleted] = useState<Record<string, number>>({});
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [xp, setXp] = useState(0);
  const [tab, setTab] = useState<Tab>("center");

  const mod = FOOD_MODULES[moduleIdx];
  const step = mod.steps[stepIdx];
  const isQuestion = step.kind === "guess" || step.kind === "apply";
  const correct = isQuestion && picked === step.answer;
  const progress = Math.round(((stepIdx + (checked ? 1 : 0)) / mod.steps.length) * 100);
  const style = cardStyleOf(step.kind);

  const statusOf = (i: number): Status => {
    if ((completed[FOOD_MODULES[i].id] ?? 0) >= FOOD_MODULES[i].steps.length) return "done";
    if (i === moduleIdx) return "active";
    if (i === 0 || (completed[FOOD_MODULES[i - 1].id] ?? 0) >= FOOD_MODULES[i - 1].steps.length) return "active";
    return "locked";
  };

  const doneCount = useMemo(
    () => FOOD_MODULES.filter((m) => (completed[m.id] ?? 0) >= m.steps.length).length,
    [completed],
  );

  const reset = () => {
    setStepIdx(0);
    setPicked(null);
    setChecked(false);
  };

  const advance = () => {
    setXp((x) => x + XP_PER_STEP);
    const next = stepIdx + 1;
    if (next >= mod.steps.length) {
      setCompleted((c) => ({ ...c, [mod.id]: mod.steps.length }));
      setModuleIdx(Math.min(moduleIdx + 1, FOOD_MODULES.length - 1));
      reset();
      return;
    }
    setStepIdx(next);
    setPicked(null);
    setChecked(false);
  };

  const tutorLines = buildTutorLines(step, checked, correct);

  return (
    <div className="ios-shell">
      {/* LEFT PANEL: PATH */}
      <div className={`ios-panel ios-left${tab === "left" ? " mobile-active" : ""}`}>
        <div className="ios-user-stats">
          <div className="ios-user-profile">
            <div className="ios-avatar">👨‍🍳</div>
            <div>
              <h3 style={{ fontSize: 18 }}>Kitchen Manager</h3>
              <p style={{ fontSize: 13, color: "var(--ios-muted)", fontWeight: 600 }}>Food Lens · Number Systems</p>
            </div>
          </div>
          <div className="ios-stat-pills">
            <div className="ios-pill streak">🔥 {doneCount} Days</div>
            <div className="ios-pill xp">⭐ {xp} XP</div>
          </div>
        </div>

        <div className="ios-path">
          {FOOD_MODULES.map((m, i) => {
            const st = statusOf(i);
            const isCurrent = i === moduleIdx;
            const cls = st === "done" ? "completed" : isCurrent ? "active" : "";
            return (
              <button
                key={m.id}
                type="button"
                className={`ios-node ${cls}`}
                disabled={st === "locked"}
                onClick={() => {
                  setModuleIdx(i);
                  reset();
                  setTab("center");
                }}
              >
                <div className="ios-node-icon">{st === "done" ? "✓" : st === "locked" ? "🔒" : m.emoji}</div>
                <div className="ios-node-info">
                  <div className="ios-node-title">{m.title}</div>
                  <div className="ios-node-status">
                    {st === "done" ? "Completed" : isCurrent ? "In progress" : st === "locked" ? "Locked" : "Ready"} ·{" "}
                    {m.minutes} min
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CENTER PANEL: LEARNING */}
      <div className={`ios-panel ios-center${tab === "center" ? " mobile-active" : ""}`}>
        <div className="ios-center-header">
          <h2 style={{ fontSize: 22 }}>
            {mod.emoji} {mod.title}
          </h2>
          <div className="ios-progress-track">
            <div className="ios-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ios-muted)" }}>
            {stepIdx + 1}/{mod.steps.length}
          </div>
        </div>

        <div className="ios-learning-area">
          <div key={`${mod.id}-${stepIdx}`} className={`ios-card ${style}`}>
            <span className={`ios-tag ${style}`}>{step.label ?? STEP_META[step.kind].tag}</span>

            {step.emoji && <div className="ios-emoji-hero">{step.emoji}</div>}

            {step.title && <h2 style={{ fontSize: 26, marginBottom: 16, textAlign: "center" }}>{step.title}</h2>}

            {step.text && <div className="ios-story-text" dangerouslySetInnerHTML={{ __html: step.text }} />}

            {isQuestion && (
              <>
                <div className="ios-question" style={{ marginTop: step.text ? 24 : 0 }}>
                  {step.question}
                </div>
                <div className="ios-options">
                  {step.options?.map((opt, i) => {
                    const isPicked = picked === i;
                    const isAnswer = step.answer === i;
                    const optCls = !checked
                      ? isPicked
                        ? "selected"
                        : ""
                      : isAnswer
                        ? "correct"
                        : isPicked
                          ? "wrong"
                          : "";
                    return (
                      <button
                        key={opt}
                        type="button"
                        className={`ios-option ${optCls}`}
                        disabled={checked}
                        onClick={() => setPicked(i)}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {checked && (
                  <div className={`ios-feedback ${correct ? "success" : "error"}`}>
                    <strong>{correct ? "Correct! 🎉" : "Not quite."}</strong>
                    <br />
                    {step.explanation ?? "Give it another thought."}
                  </div>
                )}
              </>
            )}

            {isQuestion && !checked ? (
              <button type="button" className="ios-btn" disabled={picked === null} onClick={() => setChecked(true)}>
                Check Answer
              </button>
            ) : (
              <button type="button" className="ios-btn success" onClick={advance}>
                {stepIdx + 1 >= mod.steps.length ? "Finish Session →" : "Continue →"}
              </button>
            )}

            {isQuestion && checked && !correct && (
              <button
                type="button"
                className="ios-btn ghost"
                onClick={() => {
                  setPicked(null);
                  setChecked(false);
                }}
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: BUDDY */}
      <div className={`ios-panel ios-right${tab === "right" ? " mobile-active" : ""}`}>
        <div className="ios-tutor-header">
          <div className="ios-tutor-avatar">🤖</div>
          <div>
            <div style={{ fontSize: 16 }}>Buddy</div>
            <div style={{ fontSize: 12, color: "var(--ios-secondary)", fontWeight: 600 }}>● Online</div>
          </div>
        </div>

        <div className="ios-chat-area">
          <div className="ios-msg system">{mod.subtitle}</div>
          {tutorLines.map((line, i) => (
            <div key={`${stepIdx}-${i}`} className="ios-msg ai">
              {line}
            </div>
          ))}
        </div>

        <div className="ios-tutor-actions">
          <button type="button" className="ios-action primary">
            💡 Give Hint
          </button>
          <button type="button" className="ios-action">
            🔄 Explain Again
          </button>
          <button type="button" className="ios-action">
            🤔 Why?
          </button>
          <button type="button" className="ios-action">
            📝 Give Example
          </button>
        </div>
      </div>

      {/* MOBILE NAVIGATION */}
      <div className="ios-bottom-nav">
        <button type="button" className={`ios-nav-item${tab === "left" ? " active" : ""}`} onClick={() => setTab("left")}>
          <span className="ios-nav-icon">🗺️</span>
          <span>Path</span>
        </button>
        <button
          type="button"
          className={`ios-nav-item${tab === "center" ? " active" : ""}`}
          onClick={() => setTab("center")}
        >
          <span className="ios-nav-icon">🎯</span>
          <span>Learn</span>
        </button>
        <button
          type="button"
          className={`ios-nav-item${tab === "right" ? " active" : ""}`}
          onClick={() => setTab("right")}
        >
          <span className="ios-nav-icon">🤖</span>
          <span>Buddy</span>
        </button>
      </div>
    </div>
  );
}

function buildTutorLines(step: InnerStep, checked: boolean, correct: boolean): string[] {
  if (step.kind === "hook") return ["Read the kitchen scene once. Don't solve anything yet — just notice what feels odd."];
  if (step.kind === "reveal") return ["This is the moment the old rule breaks. That's your clue for the next question."];
  if (step.kind === "concept") return ["Say this back in your own words, using pizzas or orders instead of symbols."];
  if (step.kind === "close") return ["Nice loop. You answered the thing you were wondering about at the start."];
  if (!checked) return ["Guess first, even if you're unsure. Guessing makes the answer stick harder."];
  return correct
    ? ["Good — you spotted the pattern, not just the answer."]
    : ["No stress. Re-read the kitchen scene, then pick the option that keeps the food story true."];
}
