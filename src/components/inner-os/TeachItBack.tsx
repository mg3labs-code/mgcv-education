import { useState } from "react";

interface Props {
  prompts?: string[];
  minWords?: number;
  onDone: () => void;
}

/**
 * Layer 7 — Implications. Student explains it in their own words before the
 * loop closes. Retrieval + generation effect: writing it beats re-reading it.
 */
export default function TeachItBack({ prompts = [], minWords = 12, onDone }: Props) {
  const [text, setText] = useState("");
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const ready = words >= minWords;

  return (
    <div>
      {prompts.length > 0 && (
        <ul className="ios-prompt-list">
          {prompts.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      <textarea
        className="ios-textarea"
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Explain it to a junior chef in your own words…"
      />
      <div className="ios-tf-meta">
        {words}/{minWords} words
      </div>
      <button type="button" className="ios-btn success" disabled={!ready} onClick={onDone}>
        {ready ? "Lock it in →" : "Write a little more"}
      </button>
    </div>
  );
}
