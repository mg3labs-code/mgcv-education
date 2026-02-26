import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MessageCircle, X, Send, Plus, Sparkles, BookOpen,
  ClipboardList, Lightbulb, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CompanionVoiceInput from "./CompanionVoiceInput";

interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

const STUDY_COMPANION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-companion`;

// Simple markdown-like rendering
function renderContent(text: string) {
  // Remove NAV tags from display
  const cleaned = text.replace(/\[NAV:[^\]]+\]/g, "").trim();
  return cleaned.split("\n").map((line, i) => {
    // Bold
    let html = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // Italic
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    // Inline code
    html = html.replace(/`(.+?)`/g, '<code class="bg-muted px-1 rounded text-xs">$1</code>');
    // Bullet points
    if (html.startsWith("- ") || html.startsWith("• ")) {
      html = `<span class="ml-2">• ${html.slice(2)}</span>`;
    }
    // Numbered list
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user, fullName } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
      // Persist greeting
      persistMessage(greetMsg, sessionId);
    }
  }, [isOpen, hasGreeted, sessionId, messages.length]);

  const loadOrCreateSession = async () => {
    if (!user) return;
    try {
      // Load most recent session
      const { data: sessions } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (sessions && sessions.length > 0) {
        const sid = sessions[0].id;
        setSessionId(sid);
        // Load messages
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
        // Create new session
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
      // Update session timestamp
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

    // Persist user message
    persistMessage(userMsg, sessionId);

    // Build message history for API (last 20 messages for context window)
    const history = [...messages, userMsg].slice(-20).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let assistantContent = "";

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
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Final flush
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
            }
          } catch { /* ignore */ }
        }
      }

      // Handle navigation
      handleNavigation(assistantContent);

      // Persist assistant message
      if (assistantContent) {
        persistMessage({ role: "assistant", content: assistantContent }, sessionId);
      }
    } catch (e) {
      console.error("Stream error:", e);
      toast.error("Failed to get a response. Please try again.");
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
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center animate-pulse"
          aria-label="Open Study Companion"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[380px] h-[560px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Buddy</h3>
                <p className="text-[10px] text-muted-foreground">Your Study Companion</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={startNewChat} title="New Chat">
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsOpen(false)}>
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

          {/* Quick Actions - show only when no messages or just greeting */}
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

          {/* Input */}
          <div className="px-3 pb-3 pt-1 border-t border-border">
            <div className="flex items-end gap-1.5 bg-muted/50 rounded-xl px-2 py-1.5">
              <CompanionVoiceInput
                onTranscript={(text) => sendMessage(text)}
                disabled={isLoading}
              />
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
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
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
