import { useState } from "react";
import type { PrincipleRung } from "@/data/foodInnerOS";

interface Props {
  rungs: PrincipleRung[];
  onDone: () => void;
}

/**
 * Layer 3 — Reasoning. The identity is rebuilt from scratch, one "because"
 * at a time. Nothing is asserted; every rung must be unlocked by the student.
 */
export default function FirstPrinciples({ rungs, onDone }: Props) {
  const [open, setOpen] = useState(0);
  const allOpen = open >= rungs.length;

  return (
    <div>
      <div className="ios-fp-list">
        {rungs.map((r, i) => {
          const revealed = i < open;
          return (
            <div key={r.claim} className={`ios-fp-rung${revealed ? " open" : ""}`}>
              <div className="ios-fp-index">{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div className="ios-fp-claim">{r.claim}</div>
                {revealed ? (
                  <div className="ios-fp-because">because {r.because}</div>
                ) : (
                  i === open && (
                    <button type="button" className="ios-fp-ask" onClick={() => setOpen(open + 1)}>
                      🤔 Why is this true?
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button type="button" className="ios-btn success" disabled={!allOpen} onClick={onDone}>
        {allOpen ? "I built it myself →" : "Unlock every step first"}
      </button>
    </div>
  );
}
