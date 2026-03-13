import { useState } from "react";
import { X, Sparkles, TrendingUp, Users } from "lucide-react";

interface WelcomeBannerProps {
  role: "student" | "teacher";
  name: string;
  streak?: number;
  studentCount?: number;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const STORAGE_KEY = "welcome-banner-dismissed";

const WelcomeBanner = ({ role, name, streak, studentCount }: WelcomeBannerProps) => {
  const todayKey = new Date().toISOString().split("T")[0];
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === todayKey
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, todayKey);
    setDismissed(true);
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-info/10 border border-primary/20 px-5 py-4 animate-fade-in">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {getGreeting()}, {name}! ✨
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
              {role === "student" ? (
                <>
                  <TrendingUp className="h-3 w-3 text-primary shrink-0" />
                  <span>{streak ? `You're on a ${streak}-day streak — keep it going!` : "Start your learning journey today!"}</span>
                </>
              ) : (
                <>
                  <Users className="h-3 w-3 text-primary shrink-0" />
                  <span>{studentCount ? `${studentCount} students are counting on you today.` : "Your class is ready for today's session."}</span>
                </>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors bg-transparent border-none cursor-pointer"
          aria-label="Dismiss welcome banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default WelcomeBanner;
