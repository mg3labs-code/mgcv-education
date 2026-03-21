import React, { useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BilingualSection {
  native: string;
  english: string;
  transliteration?: string;
}

export interface BilingualConceptContent {
  sections?: BilingualSection[];
  heading?: string;
  // fallback for standard concept content
  [key: string]: any;
}

const BilingualConceptBlock = ({ content, subjectName }: { content: BilingualConceptContent; subjectName: string }) => {
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);

  const sections: BilingualSection[] = content.sections || [];

  // Use Sarvam AI via edge function for Telugu, browser TTS for Hindi
  const speakText = async (text: string, lang: string, idx: number) => {
    setPlayingIdx(idx);
    
    if (lang === "Telugu") {
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
          audio.onended = () => { setPlayingIdx(null); URL.revokeObjectURL(url); };
          audio.onerror = () => { setPlayingIdx(null); URL.revokeObjectURL(url); };
          await audio.play();
          return;
        }
      } catch (e) {
        console.warn("Sarvam TTS failed, falling back to browser:", e);
      }
    }

    // Fallback: browser TTS for Hindi and others
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === "Telugu" ? "te-IN" : lang === "Hindi" ? "hi-IN" : "en-IN";
      utterance.rate = 0.85;
      utterance.onend = () => setPlayingIdx(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingIdx(null);
    }
  };

  if (sections.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        Content coming soon for this section.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {content.heading && (
        <h4 className="text-base font-bold text-foreground mb-2">
          📖 {content.heading}
        </h4>
      )}

      <div className="rounded-xl border border-border overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-2 bg-muted/60 border-b border-border">
          <div className="p-3 text-xs font-bold text-foreground uppercase tracking-wide">
            {subjectName} 🇮🇳
          </div>
          <div className="p-3 text-xs font-bold text-foreground uppercase tracking-wide border-l border-border">
            English 🇬🇧
          </div>
        </div>

        {/* Content rows */}
        {sections.map((section, i) => (
          <div
            key={i}
            className={`grid grid-cols-2 ${i % 2 === 0 ? "bg-card" : "bg-muted/20"} ${i < sections.length - 1 ? "border-b border-border" : ""}`}
          >
            {/* Native language side */}
            <div className="p-4 group relative">
              <p className="text-lg font-medium text-foreground leading-relaxed">
                {section.native}
              </p>
              {section.transliteration && (
                <p className="text-xs text-muted-foreground italic mt-1">
                  ({section.transliteration})
                </p>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => speakText(section.native, subjectName, i)}
              >
                <Volume2 className={`h-4 w-4 ${playingIdx === i ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
              </Button>
            </div>

            {/* English side */}
            <div className="p-4 border-l border-border">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {section.english}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center italic">
        💡 Hover over any line and tap 🔊 to hear the pronunciation!
      </p>
    </div>
  );
};

export default BilingualConceptBlock;
