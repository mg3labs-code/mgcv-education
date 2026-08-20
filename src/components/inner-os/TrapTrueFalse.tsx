import { useState } from "react";
import type { TfStatement } from "@/data/foodInnerOS";

interface Props {
  statements: TfStatement[];
  onDone: () => void;
}

/**
 * Layer 4 — Assumptions. Student judges each statement true/false and
 * immediately sees WHY, so traps become visible instead of memorised.
 */
export default function TrapTrueFalse({ statements, onDone }: Props) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null);
  const s = statements[Math.min(i, statements.length - 1)];
  const last = i + 1 >= statements.length;
  const correct = picked === s.isTrue;

  return (
    <div>
      <div className="ios-question" style={{ marginTop: 8 }}>
        “{s.text}”
      </div>
      <div className="ios-tf-meta">
        Statement {i + 1} of {statements.length} · true or trap?
      </div>
      <div className="ios-options" style={{ gridTemplateColumns: "1fr 1fr", display: "grid" }}>
        {[true, false].map((v) => {
          const isPicked = picked === v;
          const cls =
            picked === null
              ? ""
              : v === s.isTrue
                ? "correct"
                : isPicked
                  ? "wrong"
                  : "";
          return (
            <button
              key={String(v)}
              type="button"
              className={`ios-option ${cls}`}
              disabled={picked !== null}
              onClick={() => setPicked(v)}
              style={{ textAlign: "center" }}
            >
              {v ? "✅ Always true" : "🚫 Trap"}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className={`ios-feedback ${correct ? "success" : "error"}`}>
          <strong>{correct ? "Right call." : "That's the trap."}</strong>
          <br />
          {s.why}
        </div>
      )}

      {picked !== null && (
        <button
          type="button"
          className="ios-btn success"
          onClick={() => {
            if (last) {
              onDone();
              return;
            }
            setI(i + 1);
            setPicked(null);
          }}
        >
          {last ? "Continue →" : "Next statement →"}
        </button>
      )}
    </div>
  );
}
