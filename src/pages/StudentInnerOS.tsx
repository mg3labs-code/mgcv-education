import { useMemo, useState } from "react";
import { STEP_META, KIND_LAYER, type InnerStep } from "@/data/foodInnerOS";
import { JOURNEYS, DEFAULT_JOURNEY_ID, DAY_META } from "@/data/innerOSJourneys";
import { LAYERS } from "@/lib/sevenLayers";
import AreaGrid from "@/components/inner-os/AreaGrid";
import CounterChallenge from "@/components/inner-os/CounterChallenge";
import TrapTrueFalse from "@/components/inner-os/TrapTrueFalse";
import FirstPrinciples from "@/components/inner-os/FirstPrinciples";
import TeachItBack from "@/components/inner-os/TeachItBack";

const XP_PER_STEP = 10;

type Status = "done" | "active" | "locked";
type Tab = "left" | "center" | "right";

/** Maps our curiosity-arc step kinds onto the prototype's 3 card styles. */
const cardStyleOf = (kind: InnerStep["kind"]) => {
  if (kind === "concept" || kind === "firstprinciples") return "concept";
  if (
    kind === "guess" ||
    kind === "apply" ||
    kind === "challenge" ||
    kind === "truefalse" ||
    kind === "assumption"
  )
    return "challenge";
  return "story";
};

/** The 7-layer badge shown on every card. */
const layerOf = (step: InnerStep) => {
  const key = step.layer ?? KIND_LAYER[step.kind];
  const layer = LAYERS.find((l) => l.key === key) ?? LAYERS[0];
  return `L${layer.index} · ${layer.name}`;
};


export default function StudentInnerOS() {
  const [journeyId, setJourneyId] = useState(DEFAULT_JOURNEY_ID);
  const [moduleIdx, setModuleIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [completed, setCompleted] = useState<Record<string, number>>({});
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [xp, setXp] = useState(0);
  const [tab, setTab] = useState<Tab>("center");

  const journey = JOURNEYS.find((j) => j.id === journeyId) ?? JOURNEYS[0];
  const modules = journey.modules;
  const mod = modules[Math.min(moduleIdx, modules.length - 1)];
  const step = mod.steps[Math.min(stepIdx, mod.steps.length - 1)];
  const isQuestion = step.kind === "guess" || step.kind === "apply";
  const isChallenge = step.kind === "challenge";
  const correct = isQuestion && picked === step.answer;
  const progress = Math.round(((stepIdx + (checked ? 1 : 0)) / mod.steps.length) * 100);
  const style = cardStyleOf(step.kind);
  const isLastStep = stepIdx + 1 >= mod.steps.length;

  const isModuleDone = (i: number) => (completed[modules[i].id] ?? 0) >= modules[i].steps.length;

  /** A day unlocks once every module of the previous day is complete. */
  const dayUnlocked = (day: number) =>
    modules.every((m, i) => (m.day ?? 1) >= day || isModuleDone(i));

  const statusOf = (i: number): Status => {
    if (isModuleDone(i)) return "done";
    if (!dayUnlocked(modules[i].day ?? 1)) return "locked";
    if (i === moduleIdx) return "active";
    if (i === 0 || isModuleDone(i - 1)) return "active";
    return "locked";
  };

  const doneCount = useMemo(
    () => modules.filter((m) => (completed[m.id] ?? 0) >= m.steps.length).length,
    [completed, modules],
  );

  const nextUnlock = useMemo(() => {
    const pending = modules.find((_, i) => !isModuleDone(i));
    if (!pending) return "Journey complete";
    return `Next: ${pending.title}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed, modules]);

  const reset = () => {
    setStepIdx(0);
    setPicked(null);
    setChecked(false);
  };

  const selectJourney = (id: string) => {
    setJourneyId(id);
    setModuleIdx(0);
    reset();
  };

  const advance = () => {
    setXp((x) => x + XP_PER_STEP);
    const next = stepIdx + 1;
    if (next >= mod.steps.length) {
      setCompleted((c) => ({ ...c, [mod.id]: mod.steps.length }));
      setModuleIdx(Math.min(moduleIdx + 1, modules.length - 1));
      reset();
      return;
    }
    setStepIdx(next);
    setPicked(null);
    setChecked(false);
  };

  const tutorLines = buildTutorLines(step, checked, correct);
  let lastDay = 0;

  return (
    <div className="ios-shell">
      {/* LEFT PANEL: PATH */}
      <div className={`ios-panel ios-left${tab === "left" ? " mobile-active" : ""}`}>
        <div className="ios-user-stats">
          <div className="ios-user-profile">
            <div className="ios-avatar">{journey.personaEmoji}</div>
            <div>
              <h3 style={{ fontSize: 18 }}>{journey.persona}</h3>
              <p style={{ fontSize: 13, color: "var(--ios-muted)", fontWeight: 600 }}>
                {journey.lens} · {journey.title}
              </p>
            </div>
          </div>
          <div className="ios-stat-pills">
            <div className="ios-pill streak">🔥 {doneCount} Done</div>
            <div className="ios-pill xp">⭐ {xp} XP</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ios-muted)" }}>{nextUnlock}</div>
          <div className="ios-stat-pills">
            {JOURNEYS.map((j) => (
              <button
                key={j.id}
                type="button"
                className={`ios-action${j.id === journeyId ? " primary" : ""}`}
                onClick={() => selectJourney(j.id)}
              >
                {j.title}
              </button>
            ))}
          </div>
        </div>

        <div className="ios-path">
          {modules.map((m, i) => {
            const st = statusOf(i);
            const isCurrent = i === moduleIdx;
            const cls = st === "done" ? "completed" : isCurrent ? "active" : "";
            const day = m.day ?? 0;
            const showDay = day > 0 && day !== lastDay;
            if (showDay) lastDay = day;
            return (
              <div key={m.id}>
                {showDay && DAY_META[day] && (
                  <div className="ios-day-head">
                    <span className={`ios-day-name${dayUnlocked(day) ? "" : " locked"}`}>
                      {DAY_META[day].name}
                      {dayUnlocked(day) ? "" : " · locked"}
                    </span>
                    <span className="ios-day-blurb">{DAY_META[day].blurb}</span>
                  </div>
                )}
                <button
                  type="button"
                  className={`ios-node ${cls}`}
                  disabled={st === "locked"}
                  onClick={() => {
                    setModuleIdx(i);
                    reset();
                    setTab("center");
                  }}
                >
                  <div className="ios-node-icon">
                    {st === "done" ? "✓" : st === "locked" ? "🔒" : m.emoji}
                  </div>
                  <div className="ios-node-info">
                    <div className="ios-node-title">{m.title}</div>
                    <div className="ios-node-status">
                      {st === "done"
                        ? "Completed"
                        : isCurrent
                          ? "In progress"
                          : st === "locked"
                            ? "Locked"
                            : "Ready"}{" "}
                      · {m.minutes} min
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* CENTER PANEL: LEARNING */}
      <div className={`ios-panel ios-center${tab === "center" ? " mobile-active" : ""}`}>
        <div className="ios-center-header">
          <div>
            <h2 style={{ fontSize: 22 }}>
              {mod.emoji} {mod.title}
            </h2>
            {mod.chapterRef && <div className="ios-ref">{mod.chapterRef}</div>}
          </div>
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

            {step.title && (
              <h2 style={{ fontSize: 26, marginBottom: 16, textAlign: "center" }}>{step.title}</h2>
            )}

            {step.text && <div className="ios-story-text" dangerouslySetInnerHTML={{ __html: step.text }} />}

            {step.visual && <AreaGrid visual={step.visual} />}

            {isChallenge && step.items && <CounterChallenge items={step.items} onDone={advance} />}

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
                    <strong>{correct ? "Correct! 🎉" : "Good — most chefs say that too."}</strong>
                    <br />
                    {step.explanation ?? "Give it another thought."}
                  </div>
                )}
              </>
            )}

            {step.kind === "close" && mod.showOff && (
              <div className="ios-showoff">🎤 Show this to someone: {mod.showOff}</div>
            )}
            {step.kind === "close" && mod.cliffhanger && (
              <div className="ios-cliff">🔓 {mod.cliffhanger}</div>
            )}

            {!isChallenge &&
              (isQuestion && !checked ? (
                <button
                  type="button"
                  className="ios-btn"
                  disabled={picked === null}
                  onClick={() => setChecked(true)}
                >
                  Check Answer
                </button>
              ) : (
                <button type="button" className="ios-btn success" onClick={advance}>
                  {isLastStep ? "Finish Session →" : "Continue →"}
                </button>
              ))}

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
          {mod.showOff && <div className="ios-msg ai">🎤 Today's flex: {mod.showOff}</div>}
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
  if (step.kind === "hook")
    return ["Read the kitchen scene once. Don't solve anything yet — just notice what feels odd."];
  if (step.kind === "reveal") return ["This is the moment the trick stops being magic. Watch the pieces."];
  if (step.kind === "concept")
    return ["Point at each block in the picture and say what it costs. That's the whole identity."];
  if (step.kind === "challenge") return ["Use the trick, not long multiplication. Speed is the point."];
  if (step.kind === "close") return ["Nice loop. Now go perform it on someone before you forget it."];
  if (!checked) return ["Guess first, even if you're unsure. Guessing makes the answer stick harder."];
  return correct
    ? ["Good — you spotted the pattern, not just the answer."]
    : ["No stress. Most people miss the same piece. Re-read the picture, then pick again."];
}
