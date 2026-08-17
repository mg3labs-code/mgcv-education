import type { StepVisual } from "@/data/foodInnerOS";

/**
 * Labelled area diagram for the identity concept cards.
 * Pure CSS grid — the partition IS the proof.
 */
export default function AreaGrid({ visual }: { visual: StepVisual }) {
  const { a, b, c, kind, caption } = visual;

  if (kind === "trinomial") {
    const bands = [a, b, c ?? "c"];
    return (
      <figure className="ios-area">
        <div className="ios-area-grid three">
          {bands.map((row) =>
            bands.map((col) => (
              <div
                key={`${row}-${col}`}
                className={`ios-area-cell ${row === col ? "sq" : "rect"}`}
              >
                {row === col ? `${row}²` : `${row}${col}`}
              </div>
            )),
          )}
        </div>
        {caption && <figcaption className="ios-area-caption">{caption}</figcaption>}
      </figure>
    );
  }

  const minus = kind === "diff2";
  return (
    <figure className="ios-area">
      <div className="ios-area-grid two">
        <div className="ios-area-cell sq">{`${a}²`}</div>
        <div className={`ios-area-cell rect${minus ? " cut" : ""}`}>{`${a}${b}`}</div>
        <div className={`ios-area-cell rect${minus ? " cut" : ""}`}>{`${a}${b}`}</div>
        <div className={`ios-area-cell corner${minus ? " repaid" : ""}`}>{`${b}²`}</div>
      </div>
      <figcaption className="ios-area-caption">
        {caption}
        {minus ? " · striped strips are cut away, the corner is repaid" : ""}
      </figcaption>
    </figure>
  );
}
