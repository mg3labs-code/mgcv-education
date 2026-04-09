import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// ─── Definition Card ────────────────────────────────────────
export const DefinitionCard = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <div className="rounded-2xl overflow-hidden border-2 border-primary/30 shadow-sm">
    <div className="bg-gradient-to-r from-primary/15 to-accent/10 px-5 py-3 border-b border-primary/20">
      <h4 className="font-bold text-primary text-base flex items-center gap-2">
        📖 {title || "Definition"}
      </h4>
    </div>
    <div className="px-5 py-4 bg-gradient-to-br from-primary/5 to-accent/5">
      {children}
    </div>
  </div>
);

// ─── Formula Card ───────────────────────────────────────────
export const FormulaCard = ({ formulas, title }: { formulas: string[]; title?: string }) => (
  <div className="rounded-2xl overflow-hidden shadow-md">
    <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-5 py-3">
      <h4 className="text-sm font-bold text-white flex items-center gap-2">🎯 {title || "Key Formulas"}</h4>
    </div>
    <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/20 p-5 space-y-3">
      {formulas.map((f, i) => (
        <div key={i} className="text-center">
          <p className="text-lg font-mono font-semibold text-foreground bg-card/80 rounded-xl py-3 px-5 inline-block shadow-sm border border-violet-200 dark:border-violet-800">
            {f}
          </p>
        </div>
      ))}
    </div>
  </div>
);

// ─── Example Card (expandable) ──────────────────────────────
export const ExampleCard = ({ title, children, defaultOpen = false }: { title?: string; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl overflow-hidden border-2 border-emerald-200 dark:border-emerald-800 shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/30 px-5 py-3 border-b border-emerald-200 dark:border-emerald-800 flex items-center justify-between"
      >
        <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          💡 {title || "Example"}
        </h4>
        {open ? <ChevronUp className="h-4 w-4 text-emerald-600" /> : <ChevronDown className="h-4 w-4 text-emerald-600" />}
      </button>
      {open && (
        <div className="p-5 bg-emerald-50/30 dark:bg-emerald-950/10">
          {children}
        </div>
      )}
    </div>
  );
};

// ─── Important Note ─────────────────────────────────────────
export const ImportantNote = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <div className="rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-yellow-50/50 dark:from-amber-950/30 dark:to-yellow-950/20 p-5 shadow-sm">
    <h4 className="font-bold text-amber-700 dark:text-amber-400 text-sm mb-2 flex items-center gap-2">
      ⚠️ {title || "Important"}
    </h4>
    {children}
  </div>
);

// ─── Step Container ─────────────────────────────────────────
export const StepContainer = ({ title, steps }: { title?: string; steps: string[] }) => (
  <div className="rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden shadow-sm">
    <div className="bg-blue-50 dark:bg-blue-950/30 px-5 py-3 border-b border-blue-200 dark:border-blue-800">
      <h4 className="font-bold text-blue-700 dark:text-blue-400 text-sm flex items-center gap-2">
        🔢 {title || "Steps"}
      </h4>
    </div>
    <div className="p-4 space-y-2">
      {steps.map((step, j) => (
        <div key={j} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900">
          <span className="h-7 w-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
            {j + 1}
          </span>
          <p className="text-sm text-foreground leading-relaxed">{step}</p>
        </div>
      ))}
    </div>
  </div>
);

// ─── Insight Card (for deeper insights, reflections) ────────
export const InsightCard = ({ title, children, color = "teal" }: { title?: string; children: React.ReactNode; color?: "teal" | "purple" | "amber" | "sky" }) => {
  const colorMap = {
    teal:   "border-primary/30 from-primary/10 to-accent/10 text-primary",
    purple: "border-violet-300 dark:border-violet-700 from-violet-50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/10 text-violet-700 dark:text-violet-400",
    amber:  "border-amber-300 dark:border-amber-700 from-amber-50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10 text-amber-700 dark:text-amber-400",
    sky:    "border-sky-300 dark:border-sky-700 from-sky-50 to-blue-50/50 dark:from-sky-950/20 dark:to-blue-950/10 text-sky-700 dark:text-sky-400",
  };
  const c = colorMap[color];
  return (
    <div className={`rounded-xl border-2 bg-gradient-to-br ${c} p-5 shadow-sm`}>
      {title && <h4 className="font-bold text-sm mb-2 flex items-center gap-2">{title}</h4>}
      {children}
    </div>
  );
};

// ─── Subject Badge ──────────────────────────────────────────
export const SubjectBadge = ({ label, icon, color }: { label: string; icon?: string; color?: string }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${color || "bg-primary/10 text-primary"}`}>
    {icon && <span>{icon}</span>}
    {label}
  </span>
);
