import { useMemo, useState } from "react";
import type { ChallengeItem } from "@/data/foodInnerOS";

/** Day 3 finale: rapid-fire squares typed against the clock. */
export default function CounterChallenge({
  items,
  onDone,
}: {
  items: ChallengeItem[];
  onDone: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState("");
  const [state, setState] = useState<"typing" | "right" | "wrong">("typing");
  const [hits, setHits] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const item = items[idx];
  const finished = idx >= items.length;
  const clean = useMemo(() => value.replace(/[\s,]/g, ""), [value]);

  if (finished) {
    return (
      <div className="ios-challenge">
        <div className="ios-emoji-hero">{hits === items.length ? "🏆" : "💪"}</div>
        <div className="ios-question" style={{ textAlign: "center" }}>
          {hits}/{items.length} beaten at the counter
        </div>
        <button type="button" className="ios-btn success" onClick={onDone}>
          Continue →
        </button>
      </div>
    );
  }

  const check = () => {
    const ok = clean === item.answer;
    setState(ok ? "right" : "wrong");
    if (ok) setHits((h) => h + 1);
  };

  const next = () => {
    setIdx((i) => i + 1);
    setValue("");
    setState("typing");
    setShowHint(false);
  };

  return (
    <div className="ios-challenge">
      <div className="ios-challenge-meta">
        <span>
          Order {idx + 1} of {items.length}
        </span>
        <span>⚡ {hits} beaten</span>
      </div>

      <div className="ios-challenge-prompt">{item.prompt}</div>

      <input
        className="ios-challenge-input"
        value={value}
        inputMode="numeric"
        placeholder="Type the answer"
        disabled={state !== "typing"}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && clean.length > 0 && state === "typing") check();
        }}
      />

      {showHint && state === "typing" && item.hint && (
        <div className="ios-feedback success">Hint: {item.hint}</div>
      )}

      {state !== "typing" && (
        <div className={`ios-feedback ${state === "right" ? "success" : "error"}`}>
          <strong>{state === "right" ? "Beaten it! 🎉" : `Answer: ${item.answer}`}</strong>
          {item.hint && (
            <>
              <br />
              {item.hint}
            </>
          )}
        </div>
      )}

      {state === "typing" ? (
        <>
          <button type="button" className="ios-btn" disabled={clean.length === 0} onClick={check}>
            Serve it
          </button>
          {item.hint && !showHint && (
            <button type="button" className="ios-btn ghost" onClick={() => setShowHint(true)}>
              Need a hint
            </button>
          )}
        </>
      ) : (
        <button type="button" className="ios-btn success" onClick={next}>
          {idx + 1 >= items.length ? "See my score →" : "Next order →"}
        </button>
      )}
    </div>
  );
}
