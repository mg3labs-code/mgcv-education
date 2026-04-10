import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Volume2, X } from "lucide-react";

const GREETING_KEY = "voice-greeting-shown";

const getGreetingText = (role: string, name: string) => {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  if (role === "teacher") {
    return `${timeGreeting}, ${name}! Welcome back. If you need any help navigating the portal or managing your classes, just tap the Buddy chat icon anytime.`;
  }
  return `${timeGreeting}, ${name}! Ready to learn something amazing today? If you need help with anything, just open the Buddy chatbot and ask away!`;
};

const VoiceGreeting = () => {
  const { user, role } = useAuth();
  const [show, setShow] = useState(false);
  const [greeting, setGreeting] = useState("");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!user || !role) return;

    const todayKey = new Date().toISOString().split("T")[0];
    const stored = localStorage.getItem(GREETING_KEY);
    if (stored === todayKey) return;

    // Fetch user name
    const loadAndGreet = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      const name = data?.full_name || user.email?.split("@")[0] || "there";
      const text = getGreetingText(role, name);
      setGreeting(text);
      setShow(true);
      localStorage.setItem(GREETING_KEY, todayKey);

      // Use browser speech synthesis
      if ("speechSynthesis" in window) {
        // Small delay to let voices load
        setTimeout(() => {
          const utter = new SpeechSynthesisUtterance(text);
          utter.rate = 0.95;
          utter.pitch = 1.05;
          utter.volume = 0.8;
          // Try to pick a good voice
          const voices = speechSynthesis.getVoices();
          const preferred = voices.find(v =>
            v.name.includes("Google") && v.lang.startsWith("en")
          ) || voices.find(v => v.lang.startsWith("en"));
          if (preferred) utter.voice = preferred;
          utter.onend = () => {
            setTimeout(() => setShow(false), 2000);
          };
          utteranceRef.current = utter;
          speechSynthesis.speak(utter);
        }, 500);
      } else {
        setTimeout(() => setShow(false), 5000);
      }
    };

    loadAndGreet();

    return () => {
      if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
      }
    };
  }, [user, role]);

  const dismiss = () => {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    setShow(false);
  };

  if (!show || !greeting) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] animate-fade-in max-w-md w-[90vw]">
      <div className="bg-card border border-primary/20 rounded-2xl shadow-xl px-5 py-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
          <Volume2 className="h-4 w-4 text-primary animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-relaxed">{greeting}</p>
          <p className="text-xs text-muted-foreground mt-1">
            💬 Open <span className="font-semibold text-primary">Buddy</span> chatbot anytime for help
          </p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          aria-label="Dismiss greeting"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default VoiceGreeting;
