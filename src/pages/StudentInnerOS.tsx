import { useEffect, useMemo, useRef, useState } from "react";
import { STEP_META, KIND_LAYER, type InnerStep } from "@/data/foodInnerOS";
import { JOURNEYS, DEFAULT_JOURNEY_ID, DAY_META } from "@/data/innerOSJourneys";
import { LAYERS } from "@/lib/sevenLayers";
import AreaGrid from "@/components/inner-os/AreaGrid";
import CounterChallenge from "@/components/inner-os/CounterChallenge";
import TrapTrueFalse from "@/components/inner-os/TrapTrueFalse";
import FirstPrinciples from "@/components/inner-os/FirstPrinciples";
import TeachItBack from "@/components/inner-os/TeachItBack";
import DayCompleteModal from "@/components/inner-os/DayCompleteModal";
import { useInnerOSProgress } from "@/hooks/useInnerOSProgress";
import { toast } from "@/hooks/use-toast";


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
  const [localDone, setLocalDone] = useState<Record<string, true>>({});
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [sessionXp, setSessionXp] = useState(0);
  const [tab, setTab] = useState<Tab>("center");
  const [dayModal, setDayModal] = useState<number | null>(null);
  const hydrated = useRef<string | null>(null);

  const {
    isLoading: progressLoading,
    isSignedIn,
    doneIdsFor,
    savedXp,
    completeModule,
    resetJourney,
    resetModule,
  } = useInnerOSProgress();

  const journey = JOURNEYS.find((j) => j.id === journeyId) ?? JOURNEYS[0];
  const modules = journey.modules;
  const mod = modules[Math.min(moduleIdx, modules.length - 1)];
  const step = mod.steps[Math.min(stepIdx, mod.steps.length - 1)];
  const isQuestion = step.kind === "guess" || step.kind === "apply" || step.kind === "assumption";
  const isChallenge =
    step.kind === "challenge" ||
    step.kind === "truefalse" ||
    step.kind === "firstprinciples" ||
    step.kind === "reflect";
  const correct = isQuestion && picked === step.answer;
  const progress = Math.round(((stepIdx + (checked ? 1 : 0)) / mod.steps.length) * 100);
  const style = cardStyleOf(step.kind);
  const isLastStep = stepIdx + 1 >= mod.steps.length;

  const savedDone = doneIdsFor(journeyId);
  const doneIds = useMemo(() => {
    const s = new Set(savedDone);
    Object.keys(localDone).forEach((id) => s.add(id));
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedDone, localDone]);

  const xp = savedXp + sessionXp;

  const isModuleDone = (i: number) => doneIds.has(modules[i].id);
  const journeyDone = (jid: string) => {
    const j = JOURNEYS.find((x) => x.id === jid);
    if (!j) return false;
    const set = jid === journeyId ? doneIds : doneIdsFor(jid);
    return j.modules.length > 0 && j.modules.every((m) => set.has(m.id));
  };

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

  const doneCount = useMemo(() => modules.filter((m) => doneIds.has(m.id)).length, [doneIds, modules]);

  const nextUnlock = useMemo(() => {
    const pending = modules.find((m) => !doneIds.has(m.id));
    if (!pending) return "Journey complete";
    return `Next: ${pending.title}`;
  }, [doneIds, modules]);

  const reset = () => {
    setStepIdx(0);
    setPicked(null);
    setChecked(false);
  };

  /** Once saved progress lands, jump to the first module that isn't finished. */
  useEffect(() => {
    if (progressLoading) return;
    if (hydrated.current === journeyId) return;
    hydrated.current = journeyId;
    const firstPending = modules.findIndex((m) => !savedDone.has(m.id));
    setModuleIdx(firstPending === -1 ? 0 : firstPending);
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressLoading, journeyId, modules]);

  const selectJourney = (id: string) => {
    setJourneyId(id);
    hydrated.current = null;
    setModuleIdx(0);
    reset();
  };

  const handleReattemptJourney = async (jid: string) => {
    const j = JOURNEYS.find((x) => x.id === jid);
    if (!window.confirm(`Restart "${j?.title}" from Day 1? Your saved progress for it will be cleared.`))
      return;
    try {
      await resetJourney.mutateAsync(jid);
      setLocalDone({});
      setSessionXp(0);
      setJourneyId(jid);
      hydrated.current = jid;
      setModuleIdx(0);
      reset();
      setTab("center");
      toast({ title: "Journey restarted", description: `${j?.title} is ready from Day 1.` });
    } catch (e: any) {
      toast({ title: "Could not restart", description: e.message, variant: "destructive" });
    }
  };

  const handleReattemptModule = async (i: number) => {
    const m = modules[i];
    try {
      await resetModule.mutateAsync({ journeyId, moduleId: m.id });
      setLocalDone((d) => {
        const next = { ...d };
        delete next[m.id];
        return next;
      });
      setModuleIdx(i);
      reset();
      setTab("center");
    } catch (e: any) {
      toast({ title: "Could not reattempt", description: e.message, variant: "destructive" });
    }
  };

  const advance = () => {
    const next = stepIdx + 1;
    if (next >= mod.steps.length) {
      const earned = mod.steps.length * XP_PER_STEP;
      setSessionXp((x) => x + XP_PER_STEP);
      setLocalDone((d) => ({ ...d, [mod.id]: true as const }));

      if (isSignedIn) {
        completeModule
          .mutateAsync({
            journeyId,
            moduleId: mod.id,
            steps: mod.steps.length,
            day: mod.day,
            xp: earned,
          })
          .catch((e: any) =>
            toast({ title: "Progress not saved", description: e.message, variant: "destructive" }),
          );
      }

      // Day complete? (every module of this module's day is now finished)
      const day = mod.day ?? 0;
      const dayFinished =
        day > 0 && modules.every((m) => (m.day ?? 0) !== day || m.id === mod.id || doneIds.has(m.id));
      if (dayFinished) setDayModal(day);

      setModuleIdx(Math.min(moduleIdx + 1, modules.length - 1));
      reset();
      return;
    }
    setSessionXp((x) => x + XP_PER_STEP);
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
              <div key={j.id} className="ios-chip-wrap">
                <button
                  type="button"
                  className={`ios-action${j.id === journeyId ? " primary" : ""}`}
                  onClick={() => selectJourney(j.id)}
                >
                  {journeyDone(j.id) ? "✅ " : ""}
                  {j.title}
                </button>
                {journeyDone(j.id) && (
                  <button
                    type="button"
                    className="ios-reattempt"
                    onClick={() => handleReattemptJourney(j.id)}
                  >
                    Reattempt
                  </button>
                )}
              </div>
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
            <span className="ios-layer-chip">{layerOf(step)}</span>

            {step.emoji && <div className="ios-emoji-hero">{step.emoji}</div>}

            {step.title && (
              <h2 style={{ fontSize: 26, marginBottom: 16, textAlign: "center" }}>{step.title}</h2>
            )}

            {step.text && <div className="ios-story-text" dangerouslySetInnerHTML={{ __html: step.text }} />}

            {step.visual && <AreaGrid visual={step.visual} />}

            {step.kind === "challenge" && step.items && (
              <CounterChallenge items={step.items} onDone={advance} />
            )}

            {step.kind === "truefalse" && step.statements && (
              <TrapTrueFalse statements={step.statements} onDone={advance} />
            )}

            {step.kind === "firstprinciples" && step.rungs && (
              <FirstPrinciples rungs={step.rungs} onDone={advance} />
            )}

            {step.kind === "reflect" && (
              <TeachItBack prompts={step.prompts} minWords={step.minWords} onDone={advance} />
            )}


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
  if (step.kind === "firstprinciples")
    return ["Don't skip a rung. Ask 'why' on each line until it feels obvious, then move on."];
  if (step.kind === "truefalse")
    return ["Decide before you read the reason. Being wrong here is cheaper than being wrong in an exam."];
  if (step.kind === "assumption")
    return ["Every rule hides a condition. Find the one this trick quietly needs."];
  if (step.kind === "connect")
    return ["If it shows up in four different places, it isn't a maths rule — it's how area works."];
  if (step.kind === "reflect")
    return ["Write it messy. Explaining it in your own words is what makes it yours."];
  if (step.kind === "close") return ["Nice loop. Now go perform it on someone before you forget it."];
  if (!checked) return ["Guess first, even if you're unsure. Guessing makes the answer stick harder."];
  return correct
    ? ["Good — you spotted the pattern, not just the answer."]
    : ["No stress. Most people miss the same piece. Re-read the picture, then pick again."];
}
