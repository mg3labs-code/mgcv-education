import React, { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import type { JeeExtensionContent } from "@/data/textbookData";

interface Props {
  content: JeeExtensionContent;
  onComplete?: () => void;
}

const JeeExtensionBlock = ({ content, onComplete }: Props) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="space-y-4">
      <button
        onClick={() => { setExpanded(e => !e); onComplete?.(); }}
        className="w-full flex items-center justify-between rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 px-5 py-3"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-600" />
          <span className="font-bold text-amber-700 dark:text-amber-400 text-sm">Beyond Board — JEE Extension</span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-amber-600" /> : <ChevronDown className="h-4 w-4 text-amber-600" />}
      </button>

      {expanded && (
        <div className="space-y-4 pl-1">
          {content.sections.map((s, i) => (
            <div key={i} className="rounded-xl border border-amber-200 dark:border-amber-800 bg-card p-4 space-y-2">
              <h4 className="font-semibold text-foreground text-base flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-amber-500 inline-block" />
                {s.heading}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{s.body}</p>
              {s.formula && (
                <p className="text-center text-base font-mono font-semibold text-foreground bg-amber-50/80 dark:bg-amber-950/20 rounded-lg py-2 px-4 border border-amber-200 dark:border-amber-800">
                  {s.formula}
                </p>
              )}
            </div>
          ))}

          {content.advancedFormulas && content.advancedFormulas.length > 0 && (
            <div className="rounded-xl overflow-hidden border-2 border-amber-300 dark:border-amber-700">
              <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2">
                <h4 className="text-xs font-bold text-white">🎯 Advanced Formulas (JEE Level)</h4>
              </div>
              <div className="p-4 space-y-2 bg-amber-50/50 dark:bg-amber-950/10">
                {content.advancedFormulas.map((f, i) => (
                  <p key={i} className="text-center text-base font-mono font-semibold text-foreground bg-white/80 dark:bg-card/80 rounded-lg py-2 px-4 border border-amber-200 dark:border-amber-800">{f}</p>
                ))}
              </div>
            </div>
          )}

          {content.proofSketch && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10 p-4">
              <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">📐 Proof Sketch</h4>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{content.proofSketch}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JeeExtensionBlock;
