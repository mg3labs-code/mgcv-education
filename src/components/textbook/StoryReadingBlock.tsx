import React, { useState } from "react";
import { Eye, EyeOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StorySentence {
  native: string;
  english: string;
}

interface ComprehensionQuestion {
  question: string;
  answer: string;
}

export interface StoryReadingContent {
  title?: string;
  sentences?: StorySentence[];
  questions?: ComprehensionQuestion[];
  [key: string]: any;
}

const StoryReadingBlock = ({ content, subjectName }: { content: StoryReadingContent; subjectName: string }) => {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [showAllTranslations, setShowAllTranslations] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());

  const sentences = content.sentences || [];
  const questions = content.questions || [];

  const toggleReveal = (i: number) => {
    setRevealed(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const toggleAllTranslations = () => {
    if (showAllTranslations) {
      setRevealed(new Set());
    } else {
      setRevealed(new Set(sentences.map((_, i) => i)));
    }
    setShowAllTranslations(!showAllTranslations);
  };

  const speakSentence = async (text: string) => {
    if (subjectName === "Telugu") {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts-stream`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ text, language: "telugu" }),
          }
        );
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.onended = () => URL.revokeObjectURL(url);
          await audio.play();
          return;
        }
      } catch (e) {
        console.warn("Sarvam TTS failed, falling back to browser:", e);
      }
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = subjectName === "Telugu" ? "te-IN" : "hi-IN";
      u.rate = 0.8;
      window.speechSynthesis.speak(u);
    }
  };

  if (sentences.length === 0) {
    return <div className="text-sm text-muted-foreground italic">Story coming soon!</div>;
  }

  return (
    <div className="space-y-5">
      {content.title && (
        <h4 className="text-base font-bold text-foreground">📖 {content.title}</h4>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Tap any sentence to see the English meaning</p>
        <Button variant="ghost" size="sm" onClick={toggleAllTranslations} className="text-xs gap-1">
          {showAllTranslations ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          {showAllTranslations ? "Hide all" : "Show all"}
        </Button>
      </div>

      {/* Story passage */}
      <div className="rounded-xl bg-[#faf9f7] dark:bg-card border border-border p-5 space-y-3">
        {sentences.map((s, i) => (
          <div key={i} className="group">
            <div
              onClick={() => toggleReveal(i)}
              className="cursor-pointer hover:bg-primary/5 rounded-lg px-3 py-2 transition-colors flex items-start gap-2"
            >
              <span className="text-xs text-muted-foreground mt-1 shrink-0">{i + 1}.</span>
              <div className="flex-1">
                <p className="text-base font-medium text-foreground leading-relaxed">
                  {s.native}
                </p>
                {revealed.has(i) && (
                  <p className="text-sm text-primary/80 mt-1 italic animate-fade-in">
                    → {s.english}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); speakSentence(s.native); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity mt-1"
              >
                <Volume2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Comprehension questions */}
      {questions.length > 0 && (
        <div className="space-y-3 mt-4">
          <h4 className="text-sm font-bold text-foreground">🤔 Check your understanding</h4>
          {questions.map((q, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-medium text-foreground mb-2">
                {i + 1}. {q.question}
              </p>
              {revealedAnswers.has(i) ? (
                <p className="text-sm text-primary/80 italic">💡 {q.answer}</p>
              ) : (
                <button
                  onClick={() => setRevealedAnswers(prev => new Set(prev).add(i))}
                  className="text-xs text-primary hover:underline"
                >
                  Think first, then tap to check →
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoryReadingBlock;
