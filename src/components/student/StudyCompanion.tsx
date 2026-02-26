import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MessageCircle, X, Send, Plus, Sparkles, BookOpen,
  ClipboardList, Lightbulb, Loader2, Volume2, VolumeX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CompanionVoiceInput from "./CompanionVoiceInput";

function cleanForSpeech(text: string) {
  return text
    .replace(/\[NAV:[^\]]+\]/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^[•\-]\s*/gm, "")
    .replace(/^\d+\.\s*/gm, "")
    .replace(/#{1,6}\s*/g, "")
    .trim();
}

function getPreferredVoice() {
  const voices = window.speechSynthesis.getVoices();
  return voices.find(
    (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Natural"))
  ) || voices.find((v) => v.lang.startsWith("en")) || null;
}

/** Continuous streaming TTS: queues sentences and speaks them as they arrive */
class StreamingSpeaker {
  private queue: string[] = [];
  private speaking = false;
  private aborted = false;
  private buffer = "";
  private onSpeakingChange: (v: boolean) => void;
  // Split on sentence-ending punctuation followed by space/newline, or double newline
  private sentenceRe = /(?<=[.!?…])\s+|(?:\n\n)/;

  constructor(onSpeakingChange: (v: boolean) => void) {
    this.onSpeakingChange = onSpeakingChange;
  }

  /** Feed new text delta from the stream */
  feed(delta: string) {
    if (this.aborted) return;
    this.buffer += delta;
    // Extract complete sentences
    let parts = this.buffer.split(this.sentenceRe);
    if (parts.length > 1) {
      // Keep the last (potentially incomplete) part in buffer
      this.buffer = parts.pop()!;
      for (const sentence of parts) {
        const clean = cleanForSpeech(sentence);
        if (clean) this.queue.push(clean);
      }
      this.processQueue();
    }
  }

  /** Call when the stream is done to flush remaining text */
  flush() {
    if (this.aborted) return;
    const remaining = cleanForSpeech(this.buffer);
    this.buffer = "";
    if (remaining) {
      this.queue.push(remaining);
      this.processQueue();
    }
  }

  abort() {
    this.aborted = true;
    this.queue = [];
    this.buffer = "";
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    this.speaking = false;
    this.onSpeakingChange(false);
  }

  private processQueue() {
    if (this.speaking || this.aborted || this.queue.length === 0) return;
    this.speaking = true;
    this.onSpeakingChange(true);
    this.speakNext();
  }

  private speakNext() {
    if (this.aborted || this.queue.length === 0) {
      this.speaking = false;
      this.onSpeakingChange(false);
      return;
    }
    const text = this.queue.shift()!;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.1;
    const voice = getPreferredVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => this.speakNext();
    utterance.onerror = () => this.speakNext();
    window.speechSynthesis.speak(utterance);
  }
}

function stopSpeaking() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

const STUDY_COMPANION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-companion`;

function renderContent(text: string) {
  const cleaned = text.replace(/\[NAV:[^\]]+\]/g, "").trim();
  return cleaned.split("\n").map((line, i) => {
    let html = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    html = html.replace(/`(.+?)`/g, '<code class="bg-muted px-1 rounded text-xs">$1</code>');
    if (html.startsWith("- ") || html.startsWith("• ")) {
      html = `<span class="ml-2">• ${html.slice(2)}</span>`;
    }
    const numMatch = html.match(/^(\d+)\.\s/);
    if (numMatch) {
      html = `<span class="ml-2">${html}</span>`;
    }
    return (
      <span key={i} dangerouslySetInnerHTML={{ __html: html || "&nbsp;" }} className="block" />
    );
  });
}

function getPageContext(pathname: string) {
  if (pathname === "/student") return { page: "dashboard" };
  if (pathname.startsWith("/student/textbook/")) {
    const parts = pathname.split("/");
    return { page: "textbook", chapter: parts[3] || "", episode: parts[4] || "" };
  }
  if (pathname === "/student/textbook") return { page: "textbook" };
  if (pathname === "/student/assignments") return { page: "assignments" };
  if (pathname === "/student/calendar") return { page: "calendar" };
  if (pathname === "/student/exam-room") return { page: "exam-room" };
  if (pathname.startsWith("/student/deep-dive")) return { page: "deep-dive" };
  return { page: pathname };
}

function getGreeting(pathname: string, name: string) {
  const first = name.split(" ")[0] || "there";
  if (pathname.startsWith("/student/textbook/")) return `Hey ${first}! 📚 I see you're reading the textbook. Need help understanding something?`;
  if (pathname === "/student/assignments") return `Hi ${first}! 📝 Working on assignments? I can help you break down the problems.`;
  if (pathname === "/student") return `Hey ${first}! 👋 How's your study day going? What can I help with?`;
  return `Hi ${first}! 😊 I'm Buddy, your study companion. Ask me anything!`;
}

function getNudgeMessage(pathname: string) {
  if (pathname.startsWith("/student/textbook/")) return "Need help with this chapter? 📖";
  if (pathname === "/student/assignments") return "Stuck on an assignment? 📝";
  if (pathname === "/student") return "Hey! Need help? 👋";
  return "I'm here if you need help! 💡";
}

const QUICK_ACTIONS = [
  { label: "Explain this topic", icon: Lightbulb, prompt: "Can you explain what I'm currently studying in simple terms?" },
  { label: "Quiz me", icon: Sparkles, prompt: "Give me a quick quiz on what I'm studying right now." },
  { label: "Go to Textbook", icon: BookOpen, prompt: "Take me to my textbook." },
  { label: "My Assignments", icon: ClipboardList, prompt: "Take me to my assignments." },
];

const StudyCompanion = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    const saved = localStorage.getItem("buddy_tts");
    return saved !== "false"; // default ON
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, fullName } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Preload voices
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
    return () => stopSpeaking();
  }, []);

  const toggleTts = () => {
    const next = !ttsEnabled;
    setTtsEnabled(next);
    localStorage.setItem("buddy_tts", String(next));
    if (!next) { stopSpeaking(); setIsSpeaking(false); }
  };

  // Auto-open on first ever visit
  useEffect(() => {
    if (!user) return;
    const hasOpened = localStorage.getItem("buddy_has_opened");
    if (!hasOpened) {
      // Small delay so page renders first
      const t = setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem("buddy_has_opened", "true");
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [user]);

  // Idle nudge: show badge after 30s on a page with no interaction
  useEffect(() => {
    if (isOpen) {
      setShowNudge(false);
      return;
    }
    // Reset idle timer on route change
    setShowNudge(false);
    idleTimerRef.current = setTimeout(() => {
      setShowNudge(true);
    }, 30000);
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isOpen, location.pathname]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load or create session when opened
  useEffect(() => {
    if (isOpen && user && !sessionId) {
      loadOrCreateSession();
    }
  }, [isOpen, user]);

  // Greeting on first open
  useEffect(() => {
    if (isOpen && !hasGreeted && messages.length === 0 && sessionId) {
      const greeting = getGreeting(location.pathname, fullName);
      const greetMsg: ChatMessage = { role: "assistant", content: greeting };
      setMessages([greetMsg]);
      setHasGreeted(true);
      persistMessage(greetMsg, sessionId);
    }
  }, [isOpen, hasGreeted, sessionId, messages.length]);

  const loadOrCreateSession = async () => {
    if (!user) return;
    try {
      const { data: sessions } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (sessions && sessions.length > 0) {
        const sid = sessions[0].id;
        setSessionId(sid);
        const { data: msgs } = await supabase
          .from("chat_messages")
          .select("id, role, content")
          .eq("session_id", sid)
          .order("created_at", { ascending: true })
          .limit(50);

        if (msgs && msgs.length > 0) {
          setMessages(msgs.map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content })));
          setHasGreeted(true);
        }
      } else {
        const { data } = await supabase
          .from("chat_sessions")
          .insert({ user_id: user.id, title: "Study Chat" })
          .select("id")
          .single();

        if (data) setSessionId(data.id);
      }
    } catch (e) {
      console.error("Failed to load session:", e);
    }
  };

  const persistMessage = async (msg: ChatMessage, sid: string | null) => {
    if (!user || !sid) return;
    try {
      await supabase.from("chat_messages").insert({
        session_id: sid,
        user_id: user.id,
        role: msg.role,
        content: msg.content,
        context: getPageContext(location.pathname),
      });
      await supabase.from("chat_sessions").update({ updated_at: new Date().toISOString() }).eq("id", sid);
    } catch (e) {
      console.error("Failed to persist message:", e);
    }
  };

  const handleNavigation = (text: string) => {
    const navMatch = text.match(/\[NAV:([^\]]+)\]/);
    if (navMatch) {
      const path = navMatch[1];
      setTimeout(() => navigate(path), 500);
    }
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    persistMessage(userMsg, sessionId);

    const history = [...messages, userMsg].slice(-20).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let assistantContent = "";
    // Create a streaming speaker if TTS enabled
    const speaker = ttsEnabled && "speechSynthesis" in window
      ? new StreamingSpeaker(setIsSpeaking)
      : null;

    try {
      const resp = await fetch(STUDY_COMPANION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: history,
          context: getPageContext(location.pathname),
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Failed" }));
        toast.error(err.error || "Something went wrong");
        setIsLoading(false);
        speaker?.abort();
        return;
      }

      if (!resp.body) throw new Error("No stream body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const updateAssistant = (content: string) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && !last.id) {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
          }
          return [...prev, { role: "assistant", content }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              updateAssistant(assistantContent);
              speaker?.feed(delta);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              updateAssistant(assistantContent);
              speaker?.feed(delta);
            }
          } catch { /* ignore */ }
        }
      }

      // Flush remaining buffered text to TTS
      speaker?.flush();

      handleNavigation(assistantContent);

      if (assistantContent) {
        persistMessage({ role: "assistant", content: assistantContent }, sessionId);
      }
    } catch (e) {
      console.error("Stream error:", e);
      toast.error("Failed to get a response. Please try again.");
      speaker?.abort();
    } finally {
      setIsLoading(false);
    }
  }, [messages, sessionId, isLoading, location.pathname]);

  const startNewChat = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, title: "Study Chat" })
      .select("id")
      .single();

    if (data) {
      setSessionId(data.id);
      setMessages([]);
      setHasGreeted(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button with nudge */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          {/* Nudge tooltip */}
          {showNudge && (
            <div className="animate-fade-in bg-primary text-primary-foreground text-xs font-medium px-3 py-2 rounded-xl rounded-br-sm shadow-lg max-w-[200px]">
              {getNudgeMessage(location.pathname)}
            </div>
          )}
          <button
            onClick={() => setIsOpen(true)}
            className="relative h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center animate-bounce"
            style={{ animationDuration: "2s", animationIterationCount: 3 }}
            aria-label="Open Study Companion"
          >
            <MessageCircle className="h-6 w-6" />
            {showNudge && (
              <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-destructive border-2 border-background" />
            )}
          </button>
        </div>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[380px] h-[560px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
            <div className="flex items-center gap-2">
              <div className={`relative h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center transition-all ${isSpeaking ? "ring-2 ring-primary/40" : ""}`}>
                <Sparkles className={`h-4 w-4 text-primary transition-transform ${isSpeaking ? "animate-pulse" : ""}`} />
                {isSpeaking && (
                  <div className="absolute inset-0 flex items-center justify-center gap-[2px]">
                    <span className="w-[2px] h-2 bg-primary rounded-full animate-[waveBar1_0.6s_ease-in-out_infinite]" />
                    <span className="w-[2px] h-3 bg-primary rounded-full animate-[waveBar2_0.6s_ease-in-out_infinite_0.15s]" />
                    <span className="w-[2px] h-2.5 bg-primary rounded-full animate-[waveBar3_0.6s_ease-in-out_infinite_0.3s]" />
                    <span className="w-[2px] h-2 bg-primary rounded-full animate-[waveBar1_0.6s_ease-in-out_infinite_0.45s]" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Buddy</h3>
                <p className="text-[10px] text-muted-foreground">Your Study Companion</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className={`h-7 w-7 ${isSpeaking ? "text-primary animate-pulse" : ""}`}
                onClick={toggleTts}
                title={ttsEnabled ? "Mute Buddy" : "Unmute Buddy"}
              >
                {ttsEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={startNewChat} title="New Chat">
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { stopSpeaking(); setIsOpen(false); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-3 py-2" ref={scrollRef as any}>
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    {renderContent(msg.content)}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.prompt)}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
                >
                  <action.icon className="h-3 w-3" />
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Input - voice button is now larger and next to send */}
          <div className="px-3 pb-3 pt-1 border-t border-border">
            <div className="flex items-end gap-1.5 bg-muted/50 rounded-xl px-2 py-1.5">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                rows={1}
                className="flex-1 bg-transparent border-none outline-none resize-none text-sm py-1.5 text-foreground placeholder:text-muted-foreground max-h-20"
                disabled={isLoading}
              />
              <CompanionVoiceInput
                onTranscript={(text) => sendMessage(text)}
                disabled={isLoading}
                showLabel={!input.trim() && messages.length <= 1}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 shrink-0"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudyCompanion;
