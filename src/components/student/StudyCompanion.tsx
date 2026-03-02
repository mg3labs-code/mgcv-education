import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MessageCircle, X, Send, Plus, Sparkles, BookOpen,
  ClipboardList, Lightbulb, Loader2, Volume2, VolumeX, Mic, MicOff,
  RefreshCw, WifiOff, Wifi, Phone, PhoneOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useConversation } from "@elevenlabs/react";
import CompanionVoiceInput from "./CompanionVoiceInput";
import PopQuizModal from "./PopQuizModal";
import { chapters } from "@/data/textbookData";

// ─── Text chat helpers (unchanged) ───

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

const STUDY_COMPANION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-companion`;
const BUDDY_SESSION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-buddy-session`;

interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

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

function getReadablePageContext(pathname: string): string {
  if (pathname === "/student") return "Student Dashboard - home page with subjects and quick actions";
  if (pathname === "/student/assignments") return "Assignments page - viewing homework and tasks";
  if (pathname === "/student/calendar") return "Calendar page - viewing study schedule";
  if (pathname === "/student/exam-room") return "Exam Room - taking tests";
  if (pathname.startsWith("/student/deep-dive")) return "Deep Dive - exploring topics in detail";
  if (pathname === "/student/textbook") return "Textbook - browsing all chapters";
  if (pathname.startsWith("/student/textbook/")) {
    const parts = pathname.split("/");
    const chapterId = parts[3];
    const episodeId = parts[4];
    const chapter = chapters.find(c => c.id === chapterId);
    if (chapter) {
      if (episodeId) {
        const episode = chapter.episodes.find(e => e.id === episodeId);
        if (episode) {
          return `Textbook - Chapter ${chapter.number}: ${chapter.title}, Episode ${episode.number}: ${episode.title} - ${episode.subtitle}`;
        }
      }
      return `Textbook - Chapter ${chapter.number}: ${chapter.title} - ${chapter.subtitle}`;
    }
  }
  return `Page: ${pathname}`;
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

// ─── Navigation routes for client tools ───
const NAV_ROUTES: Record<string, string> = {
  dashboard: "/student",
  textbook: "/student/textbook",
  assignments: "/student/assignments",
  calendar: "/student/calendar",
  "exam room": "/student/exam-room",
  "exam-room": "/student/exam-room",
  "deep dive": "/student/deep-dive",
  "deep-dive": "/student/deep-dive",
  onboarding: "/student/onboarding",
};

const StudyCompanion = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Voice agent state
  const [voiceMode, setVoiceMode] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [voiceTranscripts, setVoiceTranscripts] = useState<Array<{ role: "user" | "agent"; text: string }>>([]);

  // Voice-triggered quiz state
  const [voiceQuizOpen, setVoiceQuizOpen] = useState(false);
  const [voiceQuizSubject, setVoiceQuizSubject] = useState("Mathematics");

  // TTS playback state for voice-in = voice-out
  const [isSpeakingTTS, setIsSpeakingTTS] = useState(false);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Voice persistence refs
  const userStoppedVoiceRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);

  // Input mode tracking: voice transcription vs text typing
  const inputModeRef = useRef<"text" | "voice">("text");
  const { user, fullName } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // ─── ElevenLabs Conversational AI Agent with 6 Client Tools ───
  const conversation = useConversation({
    onConnect: () => {
      console.log("🎙️ Connected to Buddy voice agent");
      setIsConnecting(false);
      toast.success("Voice connected! Start speaking.", { duration: 2000 });
    },
    onDisconnect: () => {
      console.log("🔇 Disconnected from Buddy voice agent");
      setIsConnecting(false);
      
      if (userStoppedVoiceRef.current) {
        // User explicitly stopped — reset everything
        setVoiceMode(false);
        userStoppedVoiceRef.current = false;
        reconnectAttemptsRef.current = 0;
      } else if (reconnectAttemptsRef.current < 2) {
        // Unexpected disconnect — try auto-reconnect
        console.log(`🔄 Unexpected disconnect, attempting reconnect (${reconnectAttemptsRef.current + 1}/2)...`);
        reconnectAttemptsRef.current += 1;
        // Small delay before reconnecting
        setTimeout(() => {
          if (!userStoppedVoiceRef.current) {
            startVoiceAgent();
          }
        }, 1500);
      } else {
        // Exhausted retries
        console.log("❌ Max reconnect attempts reached, giving up");
        setVoiceMode(false);
        reconnectAttemptsRef.current = 0;
        toast.error("Voice connection lost. Tap the phone icon to reconnect.");
      }
    },
    onMessage: (message: any) => {
      if (message.type === "user_transcript") {
        const text = message.user_transcription_event?.user_transcript;
        if (text) {
          setVoiceTranscripts((prev) => [...prev, { role: "user", text }]);
        }
      } else if (message.type === "agent_response") {
        const text = message.agent_response_event?.agent_response;
        if (text) {
          setVoiceTranscripts((prev) => [...prev, { role: "agent", text }]);
          handleNavigation(text);
        }
      } else if (message.type === "agent_response_correction") {
        const corrected = message.agent_response_correction_event?.corrected_agent_response;
        if (corrected) {
          setVoiceTranscripts((prev) => {
            const newTranscripts = [...prev];
            for (let i = newTranscripts.length - 1; i >= 0; i--) {
              if (newTranscripts[i].role === "agent") {
                newTranscripts[i] = { role: "agent", text: corrected };
                break;
              }
            }
            return newTranscripts;
          });
        }
      }
    },
    onError: (error: any) => {
      console.error("Voice agent error:", error);
      toast.error("Voice connection error. Please try again.");
      setIsConnecting(false);
    },
    clientTools: {
      navigateTo: (params: { page: string }) => {
        const route = NAV_ROUTES[params.page.toLowerCase()];
        if (route) {
          navigate(route);
          return `Navigated to ${params.page}`;
        }
        return `Could not find page: ${params.page}`;
      },
      openTextbook: (params: { chapterId: string; episodeId?: string }) => {
        const { chapterId, episodeId } = params;
        const chapter = chapters.find(c => c.id === chapterId);
        if (!chapter) {
          return `Could not find chapter ${chapterId}. Available chapters are: ${chapters.map(c => `${c.id} (${c.title})`).join(", ")}`;
        }
        if (episodeId) {
          const episode = chapter.episodes.find(e => e.id === episodeId);
          if (episode) {
            navigate(`/student/textbook/${chapterId}/${episodeId}`);
            return `Opened ${chapter.title}, Episode ${episode.number}: ${episode.title}`;
          }
          navigate(`/student/textbook/${chapterId}`);
          return `Opened ${chapter.title}. Could not find episode ${episodeId}.`;
        }
        navigate(`/student/textbook/${chapterId}`);
        return `Opened Chapter ${chapter.number}: ${chapter.title}`;
      },
      startQuiz: (params: { subject: string }) => {
        const subject = params.subject;
        setVoiceQuizSubject(subject);
        setVoiceQuizOpen(true);
        return `Starting a ${subject} quiz now! The quiz is on screen.`;
      },
      getCurrentPage: () => {
        return getReadablePageContext(location.pathname);
      },
      getChapterList: () => {
        const list = chapters.map(c => {
          const epCount = c.episodes.length;
          return `Chapter ${c.number}: ${c.title} - ${c.subtitle} (${epCount} episodes${epCount === 0 ? ", coming soon" : ""})`;
        }).join(". ");
        return `Here are all the chapters: ${list}`;
      },
      explainCurrentTopic: () => {
        const parts = location.pathname.split("/");
        const chapterId = parts[3];
        const episodeId = parts[4];
        if (!chapterId) {
          return "The student is not currently viewing a textbook chapter. Ask them which topic they want explained.";
        }
        const chapter = chapters.find(c => c.id === chapterId);
        if (!chapter) {
          return "Could not find the chapter content.";
        }
        if (episodeId) {
          const episode = chapter.episodes.find(e => e.id === episodeId);
          if (episode) {
            // Extract text content from concept blocks
            const conceptTexts = episode.blocks
              .filter(b => b.type === "concept")
              .map(b => {
                const content = b.content as any;
                if (content.sections) {
                  return content.sections.map((s: any) => `${s.heading}: ${s.body}`).join(". ");
                }
                return b.title;
              })
              .join(". ");
            const formulas = episode.blocks
              .filter(b => b.type === "concept")
              .flatMap(b => (b.content as any).keyFormulas || [])
              .join(", ");
            return `Currently on Chapter ${chapter.number}: ${chapter.title}, Episode ${episode.number}: ${episode.title}. ${episode.subtitle}. Content: ${conceptTexts}${formulas ? `. Key formulas: ${formulas}` : ""}`;
          }
        }
        return `Currently on Chapter ${chapter.number}: ${chapter.title} - ${chapter.subtitle}. This chapter has ${chapter.episodes.length} episodes.`;
      },
    },
  });

  // ─── Send contextual update when page changes ───
  useEffect(() => {
    if (conversation.status === "connected") {
      const context = getReadablePageContext(location.pathname);
      try {
        conversation.sendContextualUpdate(`The student just navigated to: ${context}`);
      } catch (e) {
        console.log("Could not send contextual update:", e);
      }
    }
  }, [location.pathname, conversation.status]);

  // Browser TTS fallback: uses built-in speechSynthesis when ElevenLabs fails
  const browserTTSFallback = useCallback((text: string) => {
    if (!window.speechSynthesis) {
      console.warn("speechSynthesis not supported");
      setIsSpeakingTTS(false);
      return;
    }
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Pick best available English voice (prefer Google/Microsoft natural voices)
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.lang.startsWith("en") && (/google|microsoft/i.test(v.name)) && !v.localService
    );
    const englishVoice = preferred || voices.find(v => v.lang.startsWith("en"));
    if (englishVoice) utterance.voice = englishVoice;

    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeakingTTS(false);
    utterance.onerror = () => setIsSpeakingTTS(false);

    setIsSpeakingTTS(true);
    window.speechSynthesis.speak(utterance);
  }, []);

  // TTS helper: speak response aloud when input was voice
  const speakResponse = useCallback(async (text: string) => {
    try {
      // Stop any currently playing TTS before starting new one
      window.speechSynthesis.cancel();
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current.currentTime = 0;
        ttsAudioRef.current = null;
      }

      const cleaned = cleanForSpeech(text);
      if (!cleaned) return;

      setIsSpeakingTTS(true);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts-stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: cleaned }),
        }
      );

      if (!response.ok) {
        console.warn("ElevenLabs TTS failed, falling back to browser speech:", response.status);
        browserTTSFallback(cleaned);
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      ttsAudioRef.current = audio;

      audio.onended = () => {
        setIsSpeakingTTS(false);
        URL.revokeObjectURL(audioUrl);
        ttsAudioRef.current = null;
      };
      audio.onerror = () => {
        setIsSpeakingTTS(false);
        URL.revokeObjectURL(audioUrl);
        ttsAudioRef.current = null;
      };

      await audio.play();
    } catch {
      // Network error — fall back to browser speech
      const cleaned = cleanForSpeech(text);
      if (cleaned) {
        browserTTSFallback(cleaned);
      } else {
        setIsSpeakingTTS(false);
      }
    }
  }, [browserTTSFallback]);

  // Start voice conversation
  const startVoiceAgent = useCallback(async () => {
    setIsConnecting(true);
    userStoppedVoiceRef.current = false;
    reconnectAttemptsRef.current = 0;
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const response = await fetch(BUDDY_SESSION_URL, {
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
      if (!data.token) {
        throw new Error("No conversation token received");
      }

      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });

      setVoiceMode(true);
      setVoiceTranscripts([]);
    } catch (error: any) {
      console.error("Failed to start voice agent:", error);
      toast.error(error.message || "Failed to start voice. Check mic permissions.");
      setIsConnecting(false);
    }
  }, [conversation]);

  // Stop voice conversation
  const stopVoiceAgent = useCallback(async () => {
    userStoppedVoiceRef.current = true;
    // Stop any TTS playback
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
      setIsSpeakingTTS(false);
    }
    try {
      await conversation.endSession();
    } catch (e) {
      console.error("Error ending session:", e);
    }
    setVoiceMode(false);
    setIsConnecting(false);
  }, [conversation]);

  // Online/offline tracking
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // No cleanup on unmount - StudyCompanion now lives at App level and doesn't unmount during navigation

  // Auto-open on first ever visit
  useEffect(() => {
    if (!user) return;
    const hasOpened = localStorage.getItem("buddy_has_opened");
    if (!hasOpened) {
      const t = setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem("buddy_has_opened", "true");
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [user]);

  // Idle nudge
  useEffect(() => {
    if (isOpen) {
      setShowNudge(false);
      return;
    }
    setShowNudge(false);
    idleTimerRef.current = setTimeout(() => {
      setShowNudge(true);
    }, 30000);
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isOpen, location.pathname]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, voiceTranscripts]);

  // Load or create session
  useEffect(() => {
    if (isOpen && user && !sessionId) {
      loadOrCreateSession();
    }
  }, [isOpen, user]);

  // Greeting
  useEffect(() => {
    if (isOpen && !hasGreeted && messages.length === 0 && sessionId && !voiceMode) {
      const greeting = getGreeting(location.pathname, fullName);
      const greetMsg: ChatMessage = { role: "assistant", content: greeting };
      setMessages([greetMsg]);
      setHasGreeted(true);
      persistMessage(greetMsg, sessionId);
    }
  }, [isOpen, hasGreeted, sessionId, messages.length, voiceMode]);

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
    for (const [key, route] of Object.entries(NAV_ROUTES)) {
      if (text.toLowerCase().includes(`navigate to ${key}`) || text.toLowerCase().includes(`go to ${key}`)) {
        setTimeout(() => navigate(route), 500);
        break;
      }
    }
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Stop any currently playing TTS (ElevenLabs + browser) when user sends new input
    window.speechSynthesis.cancel();
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
      setIsSpeakingTTS(false);
    }

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
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: `⚠️ ${err.error || "Something went wrong. Please try again."}`,
          error: true,
        }]);
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

      handleNavigation(assistantContent);

      if (assistantContent) {
        persistMessage({ role: "assistant", content: assistantContent }, sessionId);
        
        // Voice in = voice out: if user spoke, play response aloud
        // Skip TTS when live voice call is active (agent handles audio)
        if (inputModeRef.current === "voice" && conversation.status !== "connected") {
          speakResponse(assistantContent);
        }
      }
    } catch (e) {
      console.error("Stream error:", e);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "⚠️ Failed to get a response. Please check your connection and try again.",
        error: true,
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, sessionId, isLoading, location.pathname, speakResponse, conversation.status]);

  const retryLastMessage = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    if (lastUserMsg) {
      setMessages(prev => prev.filter(m => !m.error));
      sendMessage(lastUserMsg.content);
    }
  }, [messages, sendMessage]);

  const startNewChat = async () => {
    if (!user) return;
    if (voiceMode) {
      await stopVoiceAgent();
    }
    const { data } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, title: "Study Chat" })
      .select("id")
      .single();

    if (data) {
      setSessionId(data.id);
      setMessages([]);
      setHasGreeted(false);
      setVoiceTranscripts([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      inputModeRef.current = "text";
      sendMessage(input);
    }
  };

  const handleClose = () => {
    // Only close the UI panel — do NOT end the voice session
    // Voice stays active in background so student can keep talking
    setIsOpen(false);
  };

  // Handle quiz completion from voice-triggered quiz
  const handleVoiceQuizComplete = (score: number, total: number) => {
    if (conversation.status === "connected") {
      try {
        conversation.sendContextualUpdate(
          `The student just completed a ${voiceQuizSubject} quiz and scored ${score} out of ${total}. ${score >= total * 0.7 ? "They did great! Celebrate with them!" : "Encourage them and suggest reviewing the topic."}`
        );
      } catch (e) {
        console.log("Could not send quiz result:", e);
      }
    }
  };

  if (!user) return null;

  const isVoiceActive = conversation.status === "connected";
  const isBuddySpeaking = conversation.isSpeaking;

  return (
    <>
      {/* Voice-triggered Quiz Modal */}
      <PopQuizModal
        open={voiceQuizOpen}
        onClose={() => setVoiceQuizOpen(false)}
        subject={voiceQuizSubject}
        mode="subject"
        onComplete={handleVoiceQuizComplete}
      />

      {/* Floating Button with nudge */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          {showNudge && (
            <div className="animate-fade-in bg-primary text-primary-foreground text-xs font-medium px-3 py-2 rounded-xl rounded-br-sm shadow-lg max-w-[200px]">
              {getNudgeMessage(location.pathname)}
            </div>
          )}
          <button
            onClick={() => setIsOpen(true)}
            className={`relative h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center ${
              isVoiceActive
                ? "bg-gradient-to-br from-green-500 to-green-600 text-white ring-4 ring-green-400/50 animate-pulse"
                : "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground animate-bounce"
            }`}
            style={isVoiceActive ? undefined : { animationDuration: "2s", animationIterationCount: 3 }}
            aria-label={isVoiceActive ? "Buddy is on a call — tap to open" : "Open Study Companion"}
          >
            {isVoiceActive ? <Phone className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            {isVoiceActive && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white" />
              </span>
            )}
            {showNudge && !isVoiceActive && (
              <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-destructive border-2 border-background" />
            )}
          </button>
        </div>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-4 sm:right-4 z-50 w-full sm:w-[380px] h-[100dvh] sm:h-[560px] bg-background border border-border sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
            <div className="flex items-center gap-2">
              <div className={`relative h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center transition-all ${isBuddySpeaking ? "ring-2 ring-green-400/60" : ""}`}>
                <Sparkles className={`h-4 w-4 text-primary transition-transform ${isBuddySpeaking ? "animate-pulse" : ""}`} />
                {isBuddySpeaking && (
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
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  {!isOnline ? (
                    <><WifiOff className="h-2.5 w-2.5 text-destructive" /> Offline</>
                  ) : isVoiceActive
                    ? isBuddySpeaking
                      ? "🔊 Speaking..."
                      : "🎤 Listening..."
                    : isConnecting
                      ? "⏳ Connecting voice..."
                      : <><Wifi className="h-2.5 w-2.5 text-green-500" /> Your Study Companion</>
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant={isVoiceActive ? "default" : "ghost"}
                className={`h-7 w-7 ${isVoiceActive ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                onClick={isVoiceActive ? stopVoiceAgent : startVoiceAgent}
                disabled={isConnecting}
                title={isVoiceActive ? "End Voice Call" : "Start Voice Call with Buddy"}
              >
                {isConnecting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isVoiceActive ? (
                  <PhoneOff className="h-3.5 w-3.5" />
                ) : (
                  <Phone className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={startNewChat} title="New Chat">
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleClose}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Voice Mode Active - Full Duplex UI */}
          {isVoiceActive ? (
            <div className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 px-3 py-2" ref={scrollRef as any}>
                <div className="space-y-3">
                  {voiceTranscripts.map((t, i) => (
                    <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          t.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        }`}
                      >
                        {t.text}
                      </div>
                    </div>
                  ))}
                  {voiceTranscripts.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center gap-4">
                      <div className="relative">
                        <div className={`h-20 w-20 rounded-full bg-gradient-to-br from-green-400/20 to-green-600/20 flex items-center justify-center ${isBuddySpeaking ? "" : "animate-pulse"}`}>
                          <Mic className={`h-8 w-8 ${isBuddySpeaking ? "text-green-400" : "text-green-500"}`} />
                        </div>
                        <div className="absolute inset-0 rounded-full border-2 border-green-400/30 animate-ping" style={{ animationDuration: "2s" }} />
                        <div className="absolute -inset-2 rounded-full border border-green-400/20 animate-ping" style={{ animationDuration: "3s" }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {isBuddySpeaking ? "Buddy is speaking..." : "Buddy is listening..."}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Just speak naturally!</p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="px-3 py-3 border-t border-border">
                <div className="flex items-center justify-center gap-3">
                  <div className={`flex items-center gap-[3px] px-4 py-2.5 rounded-full ${isBuddySpeaking ? "bg-green-500/10" : "bg-primary/10"} transition-colors`}>
                    {isBuddySpeaking ? (
                      <>
                        <div className="flex items-center gap-[2px]">
                          <span className="w-1 h-2 bg-green-500 rounded-full animate-[waveBar1_0.4s_ease-in-out_infinite]" />
                          <span className="w-1 h-3.5 bg-green-500 rounded-full animate-[waveBar2_0.4s_ease-in-out_infinite_0.1s]" />
                          <span className="w-1 h-2.5 bg-green-500 rounded-full animate-[waveBar3_0.4s_ease-in-out_infinite_0.2s]" />
                          <span className="w-1 h-3 bg-green-500 rounded-full animate-[waveBar1_0.4s_ease-in-out_infinite_0.3s]" />
                          <span className="w-1 h-2 bg-green-500 rounded-full animate-[waveBar2_0.4s_ease-in-out_infinite_0.05s]" />
                        </div>
                        <span className="text-xs text-green-600 font-medium ml-2">Buddy speaking</span>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-[3px]">
                          <span className="w-1 h-3 bg-primary rounded-full animate-[waveBar1_0.6s_ease-in-out_infinite]" />
                          <span className="w-1 h-4 bg-primary rounded-full animate-[waveBar2_0.6s_ease-in-out_infinite_0.15s]" />
                          <span className="w-1 h-3.5 bg-primary rounded-full animate-[waveBar3_0.6s_ease-in-out_infinite_0.3s]" />
                          <span className="w-1 h-3 bg-primary rounded-full animate-[waveBar1_0.6s_ease-in-out_infinite_0.45s]" />
                        </div>
                        <span className="text-xs text-primary font-medium ml-2">Listening...</span>
                      </>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-9 px-4 text-xs rounded-full"
                    onClick={stopVoiceAgent}
                  >
                    <PhoneOff className="h-3.5 w-3.5 mr-1.5" />
                    End Call
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Text Chat Messages */}
              <ScrollArea className="flex-1 px-3 py-2" ref={scrollRef as any}>
                <div className="space-y-3">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          msg.error
                            ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-bl-md"
                            : msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted text-foreground rounded-bl-md"
                        }`}
                      >
                        {renderContent(msg.content)}
                        {msg.error && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                            onClick={retryLastMessage}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" /> Retry
                          </Button>
                        )}
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

              {/* Text Input */}
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
                    onTranscript={(text) => {
                      inputModeRef.current = "voice";
                      sendMessage(text);
                    }}
                    disabled={isLoading}
                    showLabel={!input.trim() && messages.length <= 1}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 shrink-0"
                    onClick={() => {
                      inputModeRef.current = "text";
                      sendMessage(input);
                    }}
                    disabled={!input.trim() || isLoading}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default StudyCompanion;
