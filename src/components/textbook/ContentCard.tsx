/**
 * ContentCard — Design C (Hybrid) reusable card wrapper
 * Collapsible card with semantic content boxes + "See original textbook text" toggle
 */
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// ─── Collapsible Card Wrapper ───────────────────────────────
export const ContentCard = ({
  icon,
  iconBg,
  title,
  children,
  defaultOpen = true,
}: {
  icon: string;
  iconBg?: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <span
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0"
          style={{ background: iconBg || "hsl(var(--primary))", color: "#fff" }}
        >
          {icon}
        </span>
        <span className="font-bold text-[15px] text-foreground flex-1">{title}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2.5">
          {children}
        </div>
      )}
    </div>
  );
};

// ─── Definition Box (blue gradient) ─────────────────────────
export const DefinitionBox = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg border border-indigo-300 dark:border-indigo-700 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/20 px-4 py-3">
    <p className="text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed">
      📖 {children}
    </p>
  </div>
);

// ─── Formula Box (mint green mono) ──────────────────────────
export const FormulaBox = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5 font-mono text-sm text-emerald-700 dark:text-emerald-400 font-semibold">
    {children}
  </div>
);

// ─── Example Box (teal) ─────────────────────────────────────
export const ExampleBox = ({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-lg border border-teal-300 dark:border-teal-700 bg-gradient-to-br from-teal-50 to-green-50/50 dark:from-teal-950/20 dark:to-green-950/10 px-4 py-3">
    {title && (
      <h4 className="text-xs font-bold text-teal-700 dark:text-teal-400 mb-1.5">
        💡 {title}
      </h4>
    )}
    <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
  </div>
);

// ─── Note/Warning Box (amber) ───────────────────────────────
export const NoteBox = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
    ⚠️ {children}
  </div>
);

// ─── Step Box (blue numbered steps) ─────────────────────────
export const StepBox = ({ steps }: { steps: string[] }) => (
  <div className="rounded-lg border border-blue-200 dark:border-blue-800 overflow-hidden">
    <div className="bg-blue-50 dark:bg-blue-950/30 px-4 py-2 border-b border-blue-200 dark:border-blue-800">
      <span className="text-xs font-bold text-blue-700 dark:text-blue-400">🔢 Steps</span>
    </div>
    <div className="p-3 space-y-1.5">
      {steps.map((step, j) => (
        <div key={j} className="flex items-start gap-2.5 p-2 rounded-md bg-blue-50/30 dark:bg-blue-950/10">
          <span className="h-5 w-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
            {j + 1}
          </span>
          <p className="text-sm text-foreground leading-relaxed">{step}</p>
        </div>
      ))}
    </div>
  </div>
);

// ─── Containment Chain Visual ───────────────────────────────
export const ContainmentChain = ({
  items,
  description,
}: {
  items: { label: string; color: string }[];
  description?: string;
}) => (
  <div className="rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 p-5 text-center">
    <h4 className="text-sm font-bold text-teal-700 dark:text-teal-400 mb-3">
      🔗 The Containment Chain
    </h4>
    <div className="flex justify-center items-center gap-2 flex-wrap">
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && (
            <span className="text-base font-bold text-muted-foreground mx-1">⊂</span>
          )}
          <span
            className="inline-flex items-center justify-center w-10 h-9 rounded-lg text-white font-bold text-sm"
            style={{ background: item.color }}
          >
            {item.label}
          </span>
        </span>
      ))}
    </div>
    {description && (
      <p className="text-xs text-muted-foreground mt-3">{description}</p>
    )}
  </div>
);

// ─── Key Relationship Banner ────────────────────────────────
export const KeyRelationshipBanner = ({ text }: { text: string }) => (
  <div className="rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 text-white px-5 py-4 text-center font-semibold text-sm shadow-md">
    {text}
  </div>
);
