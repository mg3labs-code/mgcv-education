import { useState, useRef, useEffect, useCallback } from "react";
import { Send, RotateCcw, Sparkles, Zap, BookOpen, GitBranch, Lightbulb, Trophy, Volume2, VolumeX, AudioLines } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import CompanionVoiceInput from "@/components/student/CompanionVoiceInput";

type Msg = { role: "user" | "assistant"; content: string };

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts-stream`;

function cleanForSpeech(text: string) {
  return text
    .replace(/\[PHASE:\d\]\s*/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^[•\-]\s*/gm, "")
    .replace(/^\d+\.\s*/gm, "")
    .replace(/#{1,6}\s*/g, "")
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, "")
    .trim();
}

const PHASES = [
  { id: 1, label: "Hook", icon: Sparkles, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  { id: 2, label: "Bridge", icon: Zap, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  { id: 3, label: "Ground", icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  { id: 4, label: "Branch", icon: GitBranch, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  { id: 5, label: "Apply", icon: Lightbulb, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  { id: 6, label: "Advance", icon: Trophy, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/30" },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/attraction-flow`;

function stripPhaseTag(text: string): { cleanText: string; phase: number | null } {
  const match = text.match(/^\[PHASE:(\d)\]\s*/);
  if (match) {
    return { cleanText: text.replace(match[0], ""), phase: parseInt(match[1]) };
  }
  return { cleanText: text, phase: null };
}

const AttractionDemo = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [interests, setInterests] = useState<string[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Stop any playing audio
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  // Speak text via ElevenLabs TTS streaming
  const speakText = useCallback(async (text: string) => {
    if (!voiceEnabled) return;
    stopAudio();
    
    const cleaned = cleanForSpeech(text);
    if (!cleaned || cleaned.length < 5) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setIsSpeaking(true);
      const resp = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: cleaned, voiceId: "EXAVITQu4vr4xnSDxMaL" }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        console.error("TTS error:", resp.status);
        setIsSpeaking(false);
        return;
      }

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      
      await audio.play();
    } catch (e: any) {
      if (e.name !== "AbortError") console.error("TTS playback error:", e);
      setIsSpeaking(false);
    }
  }, [voiceEnabled, stopAudio]);

  const streamChat = useCallback(async (allMessages: Msg[]): Promise<string> => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: allMessages }),
    });

    if (!resp.ok || !resp.body) {
      if (resp.status === 429) { toast.error("Rate limited. Wait a moment."); return ""; }
      if (resp.status === 402) { toast.error("AI usage limit reached."); return ""; }
      toast.error("Something went wrong. Try again.");
      return "";
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let assistantText = "";
    let phaseDetected = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") break;
        try {
          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantText += content;
            if (!phaseDetected) {
              const { cleanText, phase } = stripPhaseTag(assistantText);
              if (phase) {
                setCurrentPhase(phase);
                assistantText = cleanText;
                phaseDetected = true;
              }
            }
            const displayText = phaseDetected ? assistantText : stripPhaseTag(assistantText).cleanText;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: displayText } : m);
              }
              return [...prev, { role: "assistant", content: displayText }];
            });
          }
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }
    
    return phaseDetected ? assistantText : stripPhaseTag(assistantText).cleanText;
  }, []);

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;

    // Stop any currently playing audio when user sends new message
    stopAudio();

    const userMsg: Msg = { role: "user", content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    // Extract potential interests from user message
    const interestKeywords = ["cricket", "football", "basketball", "tennis", "gaming", "cooking", "music", "dance", "drawing", "chess", "badminton", "swimming", "volleyball", "kabaddi"];
    interestKeywords.forEach(k => {
      if (msg.toLowerCase().includes(k) && !interests.includes(k)) {
        setInterests(prev => [...prev, k]);
      }
    });

    try {
      const finalText = await streamChat(newMessages);
      // Speak the completed response
      if (finalText) {
        speakText(finalText);
      }
    } catch (e) {
      console.error(e);
      toast.error("Connection failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    stopAudio();
    setMessages([]);
    setCurrentPhase(1);
    setInterests([]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const currentPhaseData = PHASES.find(p => p.id === currentPhase) || PHASES[0];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="shrink-0 border-b border-white/10 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">🏏 Sport → Syllabus</h1>
            <p className="text-xs text-white/50">Attraction System Demo — 6-Phase Flow</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { if (isSpeaking) stopAudio(); setVoiceEnabled(v => !v); }}
              className={`text-white/60 hover:text-white hover:bg-white/10 ${isSpeaking ? "text-amber-400" : ""}`}
            >
              {voiceEnabled ? <Volume2 className={`h-4 w-4 ${isSpeaking ? "animate-pulse" : ""}`} /> : <VolumeX className="h-4 w-4" />}
              <span className="ml-1.5 hidden sm:inline">{voiceEnabled ? "Voice On" : "Muted"}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={reset} className="text-white/60 hover:text-white hover:bg-white/10">
              <RotateCcw className="h-4 w-4 mr-1.5" /> Reset
            </Button>
          </div>
        </div>
      </header>

      {/* Phase Indicator */}
      <div className="shrink-0 px-4 py-3 border-b border-white/5">
        <div className="max-w-3xl mx-auto flex gap-1">
          {PHASES.map((phase) => {
            const Icon = phase.icon;
            const isActive = phase.id === currentPhase;
            const isPast = phase.id < currentPhase;
            return (
              <div
                key={phase.id}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-500
                  ${isActive ? `${phase.bg} ${phase.color} border ${phase.border} shadow-lg` : ""}
                  ${isPast ? "text-white/40" : ""}
                  ${!isActive && !isPast ? "text-white/20" : ""}
                `}
              >
                <Icon className={`h-3.5 w-3.5 ${isPast ? "text-green-500/60" : ""}`} />
                <span className="hidden sm:inline">{phase.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interest Tags */}
      {interests.length > 0 && (
        <div className="shrink-0 px-4 py-2 border-b border-white/5">
          <div className="max-w-3xl mx-auto flex gap-1.5 flex-wrap">
            <span className="text-[10px] text-white/30 uppercase tracking-wider mr-1 self-center">Interests:</span>
            {interests.map(i => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 capitalize">
                {i}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-4">
        <div className="max-w-3xl mx-auto py-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-20 space-y-4">
              <div className="text-6xl">🏏</div>
              <h2 className="text-xl font-semibold text-white/80">Welcome to the Attraction System!</h2>
              <p className="text-sm text-white/40 max-w-md mx-auto">
                Tell me about your favorite sport, game, or hobby — and I'll show you how it connects to your school syllabus in ways you never imagined.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {["I love cricket! 🏏", "Football is my thing ⚽", "I'm into gaming 🎮", "I like cooking 🍳"].map(q => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/30 hover:bg-white/5 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
                  ${msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-white/8 text-white/90 border border-white/10 rounded-bl-md"
                  }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-white/8 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="shrink-0 border-t border-white/10 px-4 py-3">
        <div className="max-w-3xl mx-auto flex gap-2 items-end">
          <CompanionVoiceInput onTranscript={(t) => send(t)} disabled={isLoading} />
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me about your favorite sport or hobby..."
            rows={1}
            className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 focus:ring-1 focus:ring-white/10"
          />
          <Button
            size="icon"
            onClick={() => send()}
            disabled={!input.trim() || isLoading}
            className="h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-500 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="max-w-3xl mx-auto text-[10px] text-white/20 mt-2 text-center">
          Phase {currentPhase}/6 — {currentPhaseData.label} • Standalone test environment
        </p>
      </div>
    </div>
  );
};

export default AttractionDemo;
