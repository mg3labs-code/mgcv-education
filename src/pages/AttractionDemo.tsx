import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Send, RotateCcw, Sparkles, Zap, BookOpen, GitBranch, Lightbulb, Trophy, Volume2, VolumeX, AudioLines, Phone, PhoneOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useConversation } from "@elevenlabs/react";
import CompanionVoiceInput from "@/components/student/CompanionVoiceInput";
import TopicVisualPanel from "@/components/student/TopicVisualPanel";
import { findMatchingVisuals, type TopicVisual } from "@/data/topicVisuals";

type Msg = { role: "user" | "assistant"; content: string };

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts-stream`;
const ATTRACTION_VOICE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/attraction-voice-session`;

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

  // Compute matching visuals from latest assistant message
  const currentVisuals = useMemo<TopicVisual[]>(() => {
    const lastAssistant = [...messages].reverse().find(m => m.role === "assistant");
    if (!lastAssistant) return [];
    return findMatchingVisuals(lastAssistant.content).slice(0, 5);
  }, [messages]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgIndex, setSpeakingMsgIndex] = useState<number | null>(null);
  
  // Live voice call state
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCallConnecting, setIsCallConnecting] = useState(false);
  const [callTranscripts, setCallTranscripts] = useState<Array<{ role: "user" | "agent"; text: string }>>([]);
  const userStoppedCallRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ElevenLabs Conversational AI for live voice call
  const conversation = useConversation({
    onConnect: () => {
      console.log("🎙️ Connected to voice agent");
      setIsCallConnecting(false);
      toast.success("Voice call connected! Start speaking.", { duration: 2000 });
    },
    onDisconnect: () => {
      console.log("🔇 Disconnected from voice agent");
      setIsCallConnecting(false);
      if (userStoppedCallRef.current) {
        setIsCallActive(false);
        userStoppedCallRef.current = false;
        reconnectAttemptsRef.current = 0;
      } else if (reconnectAttemptsRef.current < 2) {
        reconnectAttemptsRef.current += 1;
        setTimeout(() => {
          if (!userStoppedCallRef.current) startVoiceCall();
        }, 1500);
      } else {
        setIsCallActive(false);
        reconnectAttemptsRef.current = 0;
        toast.error("Voice call lost. Tap the phone icon to reconnect.");
      }
    },
    onMessage: (message: any) => {
      if (message.type === "user_transcript") {
        const text = message.user_transcription_event?.user_transcript;
        if (text) setCallTranscripts(prev => [...prev, { role: "user", text }]);
      } else if (message.type === "agent_response") {
        const text = message.agent_response_event?.agent_response;
        if (text) setCallTranscripts(prev => [...prev, { role: "agent", text }]);
      }
    },
    onError: (error: any) => {
      console.error("Voice call error:", error);
      toast.error("Voice call error. Please try again.");
      setIsCallConnecting(false);
    },
  });

  const isVoiceActive = conversation.status === "connected";
  const isBuddySpeaking = isVoiceActive && conversation.isSpeaking;

  const startVoiceCall = useCallback(async () => {
    setIsCallConnecting(true);
    userStoppedCallRef.current = false;
    reconnectAttemptsRef.current = 0;
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const response = await fetch(ATTRACTION_VOICE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Failed to start voice session" }));
        throw new Error(err.error || "Failed to start voice session");
      }
      const data = await response.json();
      if (!data.token) throw new Error("No conversation token received");
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });
      setIsCallActive(true);
      setCallTranscripts([]);
    } catch (error: any) {
      console.error("Failed to start voice call:", error);
      toast.error(error.message || "Failed to start call. Check mic permissions.");
      setIsCallConnecting(false);
    }
  }, [conversation]);

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
    setSpeakingMsgIndex(null);
  }, []);

  const stopVoiceCall = useCallback(async () => {
    userStoppedCallRef.current = true;
    stopAudio();
    try {
      await conversation.endSession();
    } catch (e) {
      console.error("Error ending call:", e);
    }
    setIsCallActive(false);
    setIsCallConnecting(false);
  }, [conversation, stopAudio]);

  // Speak text via ElevenLabs TTS streaming
  const speakText = useCallback(async (text: string, msgIndex?: number) => {
    stopAudio();
    
    const cleaned = cleanForSpeech(text);
    if (!cleaned || cleaned.length < 5) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setIsSpeaking(true);
      if (msgIndex !== undefined) setSpeakingMsgIndex(msgIndex);
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
        setSpeakingMsgIndex(null);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        setSpeakingMsgIndex(null);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      
      await audio.play();
    } catch (e: any) {
      if (e.name !== "AbortError") console.error("TTS playback error:", e);
      setIsSpeaking(false);
      setSpeakingMsgIndex(null);
    }
  }, [stopAudio]);

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
      // Auto-speak the completed response if voice is enabled
      if (finalText && voiceEnabled) {
        const newMsgIndex = messages.length + 1; // user msg + assistant msg
        speakText(finalText, newMsgIndex);
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
            {/* Live Voice Call Button */}
            <Button
              variant={isVoiceActive ? "default" : "ghost"}
              size="sm"
              onClick={isVoiceActive ? stopVoiceCall : startVoiceCall}
              disabled={isCallConnecting}
              className={`${
                isVoiceActive
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
              title={isVoiceActive ? "End Voice Call" : "Start Live Voice Call"}
            >
              {isCallConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isVoiceActive ? (
                <PhoneOff className="h-4 w-4" />
              ) : (
                <Phone className="h-4 w-4" />
              )}
              <span className="ml-1.5 hidden sm:inline">
                {isCallConnecting ? "Connecting..." : isVoiceActive ? "End Call" : "Call"}
              </span>
            </Button>
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

      {/* Live Call Transcript Overlay with Waveform */}
      {isVoiceActive && (
        <div className="shrink-0 px-4 py-4 border-b border-green-500/20 bg-green-500/5">
          <div className="max-w-3xl mx-auto">
            {/* Waveform + Status */}
            <div className="flex items-center gap-3 mb-3">
              <div className="relative flex items-center gap-1.5">
                <span className="flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
              </div>

              {/* Audio Waveform Bars */}
              <div className="flex items-center gap-[3px] h-8">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-[3px] rounded-full transition-all duration-150 ${
                      isBuddySpeaking
                        ? "bg-green-400"
                        : "bg-white/20"
                    }`}
                    style={{
                      height: isBuddySpeaking
                        ? `${Math.max(4, Math.sin((Date.now() / (120 + i * 15)) + i * 0.7) * 14 + 16)}px`
                        : `${Math.max(3, Math.sin(i * 0.9) * 3 + 5)}px`,
                      animation: isBuddySpeaking
                        ? `waveform-bar ${0.4 + (i % 5) * 0.12}s ease-in-out infinite alternate`
                        : "none",
                      animationDelay: `${i * 40}ms`,
                    }}
                  />
                ))}
              </div>

              <span className="text-xs font-medium text-green-400 ml-1">
                {isBuddySpeaking ? "Speaking..." : "Listening..."}
              </span>
            </div>

            {/* Transcripts */}
            {callTranscripts.length > 0 && (
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {callTranscripts.slice(-4).map((t, i) => (
                  <p key={i} className={`text-xs ${t.role === "user" ? "text-blue-400" : "text-white/70"}`}>
                    <span className="font-medium">{t.role === "user" ? "You" : "AI"}:</span> {t.text}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages + Visual Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main chat area */}
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

            {/* Mobile visual strip */}
            {currentVisuals.length > 0 && (
              <div className="lg:hidden">
                <TopicVisualPanel visuals={currentVisuals} />
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap relative group
                    ${msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-white/8 text-white/90 border border-white/10 rounded-bl-md"
                    }`}
                >
                  {msg.content}
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => {
                        if (speakingMsgIndex === i) {
                          stopAudio();
                        } else {
                          speakText(msg.content, i);
                        }
                      }}
                      className={`absolute -bottom-3 right-2 p-1 rounded-full border transition-all
                        ${speakingMsgIndex === i
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                          : "bg-white/5 border-white/10 text-white/30 opacity-0 group-hover:opacity-100 hover:text-white/70 hover:bg-white/10"
                        }`}
                      title={speakingMsgIndex === i ? "Stop speaking" : "Read aloud"}
                    >
                      <AudioLines className={`h-3.5 w-3.5 ${speakingMsgIndex === i ? "animate-pulse" : ""}`} />
                    </button>
                  )}
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

        {/* Desktop visual side panel */}
        {currentVisuals.length > 0 && (
          <div className="hidden lg:block w-72 shrink-0 border-l border-white/10 p-4 overflow-y-auto">
            <TopicVisualPanel visuals={currentVisuals} />
          </div>
        )}
      </div>

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
