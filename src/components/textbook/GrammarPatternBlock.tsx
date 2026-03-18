import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface GrammarExample {
  sentence: string;
  translation: string;
  highlights: { text: string; role: "subject" | "verb" | "object" | "modifier" }[];
}

export interface GrammarPatternContent {
  patternName?: string;
  rule?: string;
  examples?: GrammarExample[];
  challenge?: { question: string; answer: string };
  [key: string]: any;
}

const ROLE_COLORS: Record<string, string> = {
  subject: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300",
  verb: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300",
  object: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300",
  modifier: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300",
};

const ROLE_LABELS: Record<string, string> = {
  subject: "Who/What (Subject)",
  verb: "Action (Verb)",
  object: "Receiving (Object)",
  modifier: "Describing (Modifier)",
};

const GrammarPatternBlock = ({ content }: { content: GrammarPatternContent }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const examples = content.examples || [];

  return (
    <div className="space-y-5">
      {content.patternName && (
        <div className="flex items-center gap-2">
          <span className="text-lg">🧩</span>
          <h4 className="text-base font-bold text-foreground">
            Pattern: {content.patternName}
          </h4>
        </div>
      )}

      {/* Color legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(ROLE_COLORS).map(([role, cls]) => (
          <span key={role} className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${cls}`}>
            {ROLE_LABELS[role]}
          </span>
        ))}
      </div>

      {/* Examples with colored highlights */}
      <div className="space-y-3">
        {examples.map((ex, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap gap-1 mb-2">
              {ex.highlights.map((h, j) => (
                <span
                  key={j}
                  className={`inline-block px-2 py-1 rounded-md text-sm font-medium border ${ROLE_COLORS[h.role] || ""}`}
                >
                  {h.text}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              → {ex.translation}
            </p>
          </div>
        ))}
      </div>

      {content.rule && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            🔑 <span className="font-bold">Pattern spotted!</span> {content.rule}
          </p>
        </div>
      )}

      {/* Challenge */}
      {content.challenge && (
        <div className="rounded-xl border-2 border-dashed border-primary/30 p-5 bg-primary/5">
          <p className="text-sm font-semibold text-foreground mb-3">
            🎯 Your turn! {content.challenge.question}
          </p>
          {!showAnswer ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnswer(true)}
            >
              I've thought about it — show me! 👀
            </Button>
          ) : (
            <div className="rounded-lg bg-card border border-border p-3 mt-2">
              <p className="text-sm text-foreground">
                💡 {content.challenge.answer}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GrammarPatternBlock;
