import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, RotateCcw, GripVertical, Check, X } from "lucide-react";
import { useSoundFx } from "@/hooks/useSoundFx";
import TrapReveal from "@/components/episode/TrapReveal";

/**
 * "Sort the Rebels" — universal drag-drop activity with 3 visual modes:
 *
 *   1. "buckets"  → drag each item into one of N category bins (Day 1 use-case)
 *   2. "pairs"    → drag a left item onto its matching right item (Day 2 cause→effect)
 *   3. "order"    → drag-reorder a vertical stack into the correct sequence (Day 3 proof steps)
 *
 * All 3 variants share:
 *   - Same visual shell (rebel = tilted pill with GripVertical)
 *   - Same feedback (TrapReveal on wrong, confetti-free success, soft sfx)
 *   - Zero shame: "Try again" always available, no score penalty
 *
 * The "rebel" metaphor: each item is a number/fact/step trying to find where it belongs.
 */

export interface SortBucket {
  id: string;
  label: string;
  emoji?: string;
  tint?: string; // hsl for glow
}

export interface SortItem {
  id: string;
  label: string;
  /** For "buckets" mode: which bucketId it belongs in. */
  bucketId?: string;
  /** For "pairs" mode: id of matching partner. */
  matchId?: string;
}

interface CommonProps {
  title: string;
  subtitle?: string;
  onComplete: () => void;
  explainOnWrong: string;
  explainOnRight: string;
  continueLabel?: string;
  stepLabel?: string;
}

type BucketsProps = CommonProps & {
  variant: "buckets";
  buckets: SortBucket[];
  items: SortItem[];
};

type PairsProps = CommonProps & {
  variant: "pairs";
  leftItems: SortItem[]; // each has matchId pointing into rightItems
  rightItems: SortItem[];
};

type OrderProps = CommonProps & {
  variant: "order";
  /** The items in their CORRECT order — will be shuffled on mount. */
  correctOrder: SortItem[];
};

type Props = BucketsProps | PairsProps | OrderProps;

const SortTheRebels = (props: Props) => {
  const { title, subtitle, onComplete, explainOnWrong, explainOnRight, continueLabel, stepLabel } = props;
  const { play } = useSoundFx();

  // ──────────────── Buckets mode state ────────────────
  const [placements, setPlacements] = useState<Record<string, string | null>>(() => {
    if (props.variant !== "buckets") return {};
    return Object.fromEntries(props.items.map((i) => [i.id, null]));
  });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverBucket, setDragOverBucket] = useState<string | null>(null);

  // ──────────────── Pairs mode state ──────────────────
  const [pairMap, setPairMap] = useState<Record<string, string | null>>(() => {
    if (props.variant !== "pairs") return {};
    return Object.fromEntries(props.leftItems.map((i) => [i.id, null]));
  });
  const [dragOverRight, setDragOverRight] = useState<string | null>(null);

  // ──────────────── Order mode state ──────────────────
  const [ordered, setOrdered] = useState<SortItem[]>(() => {
    if (props.variant !== "order") return [];
    // Fisher-Yates shuffle — never leave them in the correct order on mount
    const shuffled = [...props.correctOrder];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // Guarantee shuffled differs from correct order if possible
    if (
      shuffled.length > 1 &&
      shuffled.every((it, i) => it.id === props.correctOrder[i].id)
    ) {
      [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    }
    return shuffled;
  });

  const [checkedResult, setCheckedResult] = useState<"right" | "wrong" | null>(null);

  // ──────────────── Derived: all placed? ────────────────
  const allPlaced = useMemo(() => {
    if (props.variant === "buckets") {
      return Object.values(placements).every((b) => b !== null);
    }
    if (props.variant === "pairs") {
      return Object.values(pairMap).every((v) => v !== null);
    }
    return true; // order mode is always "ready to check"
  }, [props.variant, placements, pairMap]);

  const handleCheck = () => {
    let correct = false;
    if (props.variant === "buckets") {
      correct = props.items.every((it) => placements[it.id] === it.bucketId);
    } else if (props.variant === "pairs") {
      correct = props.leftItems.every((it) => pairMap[it.id] === it.matchId);
    } else {
      correct = ordered.every((it, i) => it.id === props.correctOrder[i].id);
    }
    setCheckedResult(correct ? "right" : "wrong");
    play(correct ? "correct" : "wrong");
  };

  const handleRetry = () => {
    setCheckedResult(null);
    if (props.variant === "buckets") {
      setPlacements(Object.fromEntries(props.items.map((i) => [i.id, null])));
    } else if (props.variant === "pairs") {
      setPairMap(Object.fromEntries(props.leftItems.map((i) => [i.id, null])));
    } else {
      // Re-shuffle
      const shuffled = [...props.correctOrder];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setOrdered(shuffled);
    }
  };

  // ============ DRAG HANDLERS (native HTML5 DnD) ============
  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragEnd = () => {
    setDraggingId(null);
    setDragOverBucket(null);
    setDragOverRight(null);
  };

  // Buckets mode
  const onBucketDrop = (e: React.DragEvent, bucketId: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    setPlacements((p) => ({ ...p, [id]: bucketId }));
    setDragOverBucket(null);
  };

  // Pairs mode
  const onRightDrop = (e: React.DragEvent, rightId: string) => {
    e.preventDefault();
    const leftId = e.dataTransfer.getData("text/plain");
    if (!leftId) return;
    setPairMap((m) => {
      // If another left was already linked to this right, unlink it
      const next = { ...m };
      for (const [k, v] of Object.entries(next)) {
        if (v === rightId) next[k] = null;
      }
      next[leftId] = rightId;
      return next;
    });
    setDragOverRight(null);
  };

  // Order mode — swap with target index
  const onOrderDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    const srcId = e.dataTransfer.getData("text/plain");
    if (!srcId) return;
    setOrdered((list) => {
      const srcIdx = list.findIndex((i) => i.id === srcId);
      if (srcIdx === -1 || srcIdx === targetIdx) return list;
      const copy = [...list];
      const [moved] = copy.splice(srcIdx, 1);
      copy.splice(targetIdx, 0, moved);
      return copy;
    });
  };

  // ======================================================
  // RENDER
  // ======================================================
  return (
    <div className="min-h-[80vh] flex items-start justify-center px-4 py-6">
      <div className="w-full max-w-2xl space-y-5 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 text-[11px] font-bold uppercase tracking-wide">
            🪄 Sort the Rebels
          </div>
          <h2 className="text-xl font-bold text-foreground leading-tight">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        {/* =================== BUCKETS =================== */}
        {props.variant === "buckets" && (
          <div className="space-y-4">
            {/* Unplaced items tray */}
            <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                Drag these into the right family
              </p>
              <div className="flex flex-wrap gap-2">
                {props.items
                  .filter((it) => placements[it.id] === null)
                  .map((it) => (
                    <Rebel
                      key={it.id}
                      item={it}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                      dragging={draggingId === it.id}
                    />
                  ))}
                {props.items.every((it) => placements[it.id] !== null) && (
                  <p className="text-xs text-muted-foreground italic py-1.5">
                    All sorted! Tap Check below.
                  </p>
                )}
              </div>
            </div>

            {/* Buckets grid */}
            <div className={`grid gap-3 ${props.buckets.length === 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}>
              {props.buckets.map((b) => {
                const itemsHere = props.items.filter((it) => placements[it.id] === b.id);
                const isOver = dragOverBucket === b.id;
                return (
                  <div
                    key={b.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverBucket(b.id);
                    }}
                    onDragLeave={() => setDragOverBucket((curr) => (curr === b.id ? null : curr))}
                    onDrop={(e) => onBucketDrop(e, b.id)}
                    className={`rounded-2xl border-2 p-3 min-h-[140px] transition-all ${
                      isOver
                        ? "border-primary bg-primary/10 scale-[1.02]"
                        : "border-border bg-card"
                    }`}
                    style={
                      isOver && b.tint
                        ? { boxShadow: `0 0 0 3px ${b.tint}40` }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      {b.emoji && <span className="text-lg">{b.emoji}</span>}
                      <p className="text-sm font-bold text-foreground">{b.label}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {itemsHere.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground italic py-2">
                          drop here
                        </p>
                      ) : (
                        itemsHere.map((it) => (
                          <Rebel
                            key={it.id}
                            item={it}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                            dragging={draggingId === it.id}
                            placed
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== PAIRS ==================== */}
        {props.variant === "pairs" && (
          <div className="rounded-2xl border-2 border-border bg-card p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-3 text-center">
              Drag each cause → to its effect
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-muted-foreground uppercase">Causes</p>
                {props.leftItems.map((it) => {
                  const linkedTo = pairMap[it.id];
                  return (
                    <div
                      key={it.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, it.id)}
                      onDragEnd={onDragEnd}
                      className={`rounded-xl border-2 px-3 py-2.5 text-sm flex items-center gap-2 cursor-grab active:cursor-grabbing transition ${
                        linkedTo
                          ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20"
                          : "border-border bg-muted/30 hover:border-primary/60"
                      } ${draggingId === it.id ? "opacity-50" : ""}`}
                    >
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-foreground">{it.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-muted-foreground uppercase">Effects</p>
                {props.rightItems.map((it) => {
                  const linkedFrom = Object.entries(pairMap).find(([_, v]) => v === it.id)?.[0];
                  const isOver = dragOverRight === it.id;
                  return (
                    <div
                      key={it.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverRight(it.id);
                      }}
                      onDragLeave={() => setDragOverRight((c) => (c === it.id ? null : c))}
                      onDrop={(e) => onRightDrop(e, it.id)}
                      className={`rounded-xl border-2 px-3 py-2.5 text-sm transition ${
                        isOver
                          ? "border-primary bg-primary/10 scale-[1.02]"
                          : linkedFrom
                            ? "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20"
                            : "border-dashed border-border bg-card"
                      }`}
                    >
                      <span className="text-foreground">{it.label}</span>
                      {linkedFrom && (
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 font-semibold">
                          ✓ linked
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== ORDER ==================== */}
        {props.variant === "order" && (
          <div className="rounded-2xl border-2 border-border bg-card p-4 space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1 text-center">
              Drag to reorder — what comes first?
            </p>
            <AnimatePresence initial={false}>
              {ordered.map((it, idx) => (
                <motion.div
                  key={it.id}
                  layout
                  draggable
                  onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, it.id)}
                  onDragEnd={onDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onOrderDrop(e as unknown as React.DragEvent, idx)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  className={`rounded-xl border-2 border-border bg-muted/30 px-3 py-3 flex items-center gap-3 cursor-grab active:cursor-grabbing ${
                    draggingId === it.id ? "opacity-50 border-primary" : ""
                  }`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground">{it.label}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Footer: check button or feedback */}
        {checkedResult === null ? (
          <Button
            onClick={handleCheck}
            disabled={!allPlaced}
            size="lg"
            className="w-full gap-1"
          >
            <Check className="h-4 w-4" /> Check my answer
          </Button>
        ) : checkedResult === "right" ? (
          <TrapReveal
            isCorrect
            explain={explainOnRight}
            onContinue={onComplete}
            continueLabel={continueLabel ?? "Continue"}
          />
        ) : (
          <TrapReveal
            isCorrect={false}
            explain={explainOnWrong}
            onRetry={handleRetry}
            onContinue={onComplete}
            continueLabel={continueLabel ?? "Continue anyway"}
          />
        )}

        {!allPlaced && props.variant !== "order" && checkedResult === null && (
          <p className="text-center text-[11px] text-muted-foreground italic">
            Place every item to check your answer.
          </p>
        )}

        {stepLabel && (
          <p className="text-center text-[11px] text-muted-foreground">{stepLabel}</p>
        )}
      </div>
    </div>
  );
};

// ——— Reusable "rebel" pill ———
const Rebel = ({
  item,
  onDragStart,
  onDragEnd,
  dragging,
  placed,
}: {
  item: SortItem;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  dragging: boolean;
  placed?: boolean;
}) => (
  <motion.div
    layout
    draggable
    onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, item.id)}
    onDragEnd={onDragEnd}
    whileHover={{ rotate: [-2, 2, -2], transition: { duration: 0.4 } }}
    className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-semibold cursor-grab active:cursor-grabbing select-none ${
      placed
        ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300"
        : "border-primary/40 bg-background text-foreground hover:border-primary hover:bg-primary/5"
    } ${dragging ? "opacity-40" : ""}`}
    style={{
      boxShadow: placed ? undefined : "0 2px 8px hsl(var(--foreground) / 0.08)",
    }}
  >
    <GripVertical className="h-3 w-3 text-muted-foreground" />
    {item.label}
  </motion.div>
);

export default SortTheRebels;
