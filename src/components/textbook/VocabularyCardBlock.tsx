import React, { useState } from "react";
import { Volume2, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VocabWord {
  word: string;
  transliteration: string;
  meaning: string;
  example: string;
  exampleTranslation?: string;
  memoryTrick?: string;
}

export interface VocabularyContent {
  words?: VocabWord[];
  heading?: string;
  [key: string]: any;
}

const VocabularyCardBlock = ({ content, subjectName }: { content: VocabularyContent; subjectName: string }) => {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [mastered, setMastered] = useState<Set<number>>(new Set());

  const words: VocabWord[] = content.words || [];

  const toggleFlip = (i: number) => {
    setFlipped(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const toggleMastered = (i: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setMastered(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const speakWord = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = subjectName === "Telugu" ? "te-IN" : "hi-IN";
      u.rate = 0.8;
      window.speechSynthesis.speak(u);
    }
  };

  if (words.length === 0) {
    return <div className="text-sm text-muted-foreground italic">Vocabulary cards loading soon!</div>;
  }

  return (
    <div className="space-y-4">
      {content.heading && (
        <h4 className="text-base font-bold text-foreground">🃏 {content.heading}</h4>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Tap a card to flip it · {mastered.size}/{words.length} mastered
        </span>
        {mastered.size > 0 && (
          <button onClick={() => setMastered(new Set())} className="text-xs text-primary flex items-center gap-1">
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {words.map((w, i) => (
          <div
            key={i}
            onClick={() => toggleFlip(i)}
            className={`relative rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-md min-h-[140px] ${
              mastered.has(i)
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            {mastered.has(i) && (
              <div className="absolute top-2 right-2">
                <Check className="h-4 w-4 text-primary" />
              </div>
            )}

            {!flipped.has(i) ? (
              /* Front — native word */
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-2xl font-bold text-foreground mb-1">{w.word}</p>
                <p className="text-xs text-muted-foreground italic">({w.transliteration})</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-2 h-7 w-7"
                  onClick={(e) => speakWord(w.word, e)}
                >
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                </Button>
                <p className="text-[10px] text-muted-foreground mt-2">tap to reveal meaning</p>
              </div>
            ) : (
              /* Back — meaning + example */
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary uppercase">Meaning</span>
                  <button onClick={(e) => toggleMastered(i, e)} className="text-xs text-muted-foreground hover:text-primary">
                    {mastered.has(i) ? "Unmark" : "✅ I know this!"}
                  </button>
                </div>
                <p className="text-base font-semibold text-foreground">{w.meaning}</p>
                <div className="rounded-lg bg-muted/40 p-3 mt-2">
                  <p className="text-sm text-foreground">{w.example}</p>
                  {w.exampleTranslation && (
                    <p className="text-xs text-muted-foreground mt-1 italic">→ {w.exampleTranslation}</p>
                  )}
                </div>
                {w.memoryTrick && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    💡 Memory trick: {w.memoryTrick}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VocabularyCardBlock;
