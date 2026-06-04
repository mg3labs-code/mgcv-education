import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SortItem } from "@/data/curiosityConcepts/realNumbers";

interface Props {
  prompt: string;
  items: SortItem[];
  onDone: (allCorrect: boolean) => void;
}

type Bin = "terminating" | "non_terminating";

export default function SortActivity({ prompt, items, onDone }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, Bin>>({});
  const [checked, setChecked] = useState(false);

  const allPlaced = items.every((it) => placed[it.id]);
  const correct =
    checked && items.every((it) => placed[it.id] === it.bin);

  const pick = (id: string) => {
    if (checked) return;
    if (placed[id]) return;
    setSelectedId((cur) => (cur === id ? null : id));
  };
  const place = (bin: Bin) => {
    if (checked || !selectedId) return;
    setPlaced((p) => ({ ...p, [selectedId]: bin }));
    setSelectedId(null);
  };

  const itemsInBin = (bin: Bin) => items.filter((it) => placed[it.id] === bin);
  const binStateClass = (bin: Bin) => {
    if (!checked) return "";
    const all = itemsInBin(bin).every((it) => it.bin === bin);
    return all ? "is-correct" : "is-wrong";
  };

  return (
    <div className="arc-shell max-w-[480px] mx-auto space-y-3">
      <div className="text-[10px] uppercase tracking-[2px] font-bold text-sky-700 flex items-center gap-2">
        <span>Sort it · 90s</span>
        <span aria-hidden="true" className="flex-1 h-px bg-border" />
      </div>
      <Card className="p-4 sm:p-5">
        <h3 className="arc-display text-[15px] font-extrabold mb-2 leading-snug">
          Which decimals end, which go on forever?
        </h3>
        <p className="text-[12px] text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg mb-3 leading-relaxed">
          {prompt}
        </p>

        <div className="flex flex-wrap gap-2 mb-4 min-h-[36px]">
          {items.map((it) => {
            const isSel = selectedId === it.id;
            const isPlaced = !!placed[it.id];
            return (
              <button
                key={it.id}
                type="button"
                disabled={isPlaced || checked}
                onClick={() => pick(it.id)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border-[1.5px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isSel
                    ? "border-sky-500 bg-sky-50 text-sky-700"
                    : isPlaced
                    ? "border-border bg-muted opacity-40"
                    : "border-border bg-card text-foreground hover:bg-accent"
                }`}
              >
                {it.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            type="button"
            onClick={() => place("terminating")}
            disabled={!selectedId || checked}
            className={`arc-bin text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${binStateClass(
              "terminating",
            )} ${selectedId && !checked ? "hover:bg-accent/40" : ""}`}
          >
            <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 mb-1">
              Ends cleanly
            </div>
            <div className="flex flex-wrap gap-1">
              {itemsInBin("terminating").map((it) => (
                <span
                  key={it.id}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800"
                >
                  {it.label}
                </span>
              ))}
            </div>
          </button>
          <button
            type="button"
            onClick={() => place("non_terminating")}
            disabled={!selectedId || checked}
            className={`arc-bin text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${binStateClass(
              "non_terminating",
            )} ${selectedId && !checked ? "hover:bg-accent/40" : ""}`}
          >
            <div className="text-[10px] uppercase tracking-wider font-bold text-rose-700 mb-1">
              Goes on forever
            </div>
            <div className="flex flex-wrap gap-1">
              {itemsInBin("non_terminating").map((it) => (
                <span
                  key={it.id}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800"
                >
                  {it.label}
                </span>
              ))}
            </div>
          </button>
        </div>

        {!checked ? (
          <Button
            className="w-full"
            disabled={!allPlaced}
            onClick={() => setChecked(true)}
          >
            {allPlaced ? "Check my sort →" : "Place every item to check"}
          </Button>
        ) : (
          <div className="space-y-3">
            <div
              className={`rounded-lg px-3 py-2 text-[12px] font-semibold ${
                correct
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                  : "bg-amber-50 text-amber-800 border border-amber-300"
              }`}
              aria-live="polite"
            >
              {correct
                ? "Every one in its right place. The pattern is real."
                : "A couple landed on the wrong side — look at the colours. The split isn't about 'looks long', it's about whether the digits ever fall into a loop."}
            </div>
            <Button className="w-full" onClick={() => onDone(!!correct)}>
              Spot the trap →
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
