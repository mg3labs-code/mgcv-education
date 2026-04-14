import { useState, useEffect, useRef, useCallback } from "react";
import { AudioLines, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SectionVoiceGuideProps {
  sectionTitle: string;
  sectionType: string;
  sectionContent?: string;
  onWrongAnswer?: boolean;
  episodeTitle?: string;
}

const SectionVoiceGuide = ({ sectionTitle, sectionType, sectionContent, onWrongAnswer, episodeTitle }: SectionVoiceGuideProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showIdlePrompt, setShowIdlePrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInteractionRef = useRef(Date.now());

  // Reset idle timer on any interaction
  useEffect(() => {
    const handleInteraction = () => {
      lastInteractionRef.current = Date.now();
      setShowIdlePrompt(false);
    };
    window.addEventListener("scroll", handleInteraction, true);
    window.addEventListener("click", handleInteraction);
    window.addEventListener("keydown", handleInteraction);
    return () => {
      window.removeEventListener("scroll", handleInteraction, true);
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, []);

  // Idle detection — 60s of no interaction
  useEffect(() => {
    if (dismissed) return;
    idleTimerRef.current = setInterval(() => {
      if (Date.now() - lastInteractionRef.current > 60000) {
        setShowIdlePrompt(true);
      }
    }, 10000);
    return () => { if (idleTimerRef.current) clearInterval(idleTimerRef.current); };
  }, [dismissed]);

  // Show wrong answer suggestion
  useEffect(() => {
    if (onWrongAnswer && !dismissed) {
      setShowIdlePrompt(true);
    }
  }, [onWrongAnswer, dismissed]);

  // Reset on section change
  useEffect(() => {
    setDismissed(false);
    setShowIdlePrompt(false);
    setIsPlaying(false);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
  }, [sectionTitle]);

  const playGuidance = useCallback(async (customText?: string) => {
    if (isLoading || isPlaying) return;
    setIsLoading(true);
    setShowIdlePrompt(false);

    const text = customText || `This section is about ${sectionTitle}. Let me help you understand the key idea.`;

    try {
      const { data, error } = await supabase.functions.invoke("elevenlabs-tts-stream", {
        body: { text, language: "en" },
      });
      if (error) throw error;
      if (data?.audioContent) {
        const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => { setIsPlaying(false); audioRef.current = null; };
        audio.onerror = () => { setIsPlaying(false); audioRef.current = null; };
        setIsPlaying(true);
        await audio.play();
      }
    } catch {
      // Silently fail — voice is supplementary
    } finally {
      setIsLoading(false);
    }
  }, [sectionTitle, isLoading, isPlaying]);

  const stopPlaying = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsPlaying(false);
  }, []);

  if (dismissed && !isPlaying) return null;

  return (
    <>
      {/* Idle/wrong answer prompt */}
      {showIdlePrompt && !isPlaying && !isLoading && (
        <div
          style={{
            position: "fixed", bottom: 72, left: "50%", transform: "translateX(-50%)",
            zIndex: 55, maxWidth: 320, width: "90%",
          }}
        >
          <div style={{
            background: "white", borderRadius: 16, padding: "12px 16px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.12)", border: "1px solid #E7E5E4",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <button
              onClick={() => playGuidance(onWrongAnswer ? "Think about it differently. What if you consider the concept from another angle?" : undefined)}
              style={{
                width: 40, height: 40, borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #0D9488, #14B8A6)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              <AudioLines className="h-5 w-5" style={{ color: "white" }} />
            </button>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#1C1917", margin: 0 }}>
                {onWrongAnswer ? "Need a hint? 💡" : "Need help? 🤔"}
              </p>
              <p style={{ fontSize: 11, color: "#78716C", margin: 0 }}>
                {onWrongAnswer ? "Tap to hear a different approach" : "Tap to hear an explanation"}
              </p>
            </div>
            <button
              onClick={() => { setDismissed(true); setShowIdlePrompt(false); }}
              style={{
                width: 24, height: 24, borderRadius: 6, border: "none",
                background: "#F5F5F4", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <X className="h-3 w-3" style={{ color: "#A8A29E" }} />
            </button>
          </div>
        </div>
      )}

      {/* Floating voice pill */}
      {(isPlaying || isLoading) && (
        <div style={{
          position: "fixed", bottom: 72, right: 76, zIndex: 55,
        }}>
          <button
            onClick={isPlaying ? stopPlaying : undefined}
            style={{
              width: 44, height: 44, borderRadius: 14, border: "none",
              background: isPlaying ? "linear-gradient(135deg, #EF4444, #DC2626)" : "linear-gradient(135deg, #0D9488, #14B8A6)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            }}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: "white" }} />
            ) : (
              <AudioLines className="h-5 w-5 animate-pulse" style={{ color: "white" }} />
            )}
          </button>
        </div>
      )}
    </>
  );
};

export default SectionVoiceGuide;
