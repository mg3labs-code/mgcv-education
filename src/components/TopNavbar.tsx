import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X, Sun, Moon } from "lucide-react";
import AssignmentsModal from "./student/AssignmentsModal";
import ProgressModal from "./student/ProgressModal";
import MessageModal from "./student/MessageModal";
import NotificationsModal from "./student/NotificationsModal";
import PersonalisationModal from "./student/PersonalisationModal";

interface TopNavbarProps {
  role: "student" | "teacher" | "admin";
  phase?: number;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const TopNavbar = ({ role, phase = 4, activeTab, onTabChange }: TopNavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, fullName } = useAuth();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark" || document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : role[0].toUpperCase();

  const openModal = (modal: string) => {
    setActiveModal(modal);
    setMenuOpen(false);
  };
  const closeModal = () => setActiveModal(null);

  const navAction = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  const teacherItems = [
    { label: "Dashboard", path: "/teacher", type: "nav" as const },
    { label: "Annual Schedule", path: "/teacher/schedule", type: "nav" as const },
    { label: "Daily Plan", path: "/teacher/daily-todo", type: "nav" as const },
    { label: "Metrics", path: "/teacher/analytics", type: "nav" as const },
    { label: "Message Bar", modal: "message", type: "modal" as const },
  ];

  const studentTabs = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "learn", icon: "📖", label: "Learn" },
    { id: "tasks", icon: "📝", label: "Tasks" },
    { id: "calendar", icon: "📅", label: "Calendar" },
    ...(phase >= 2 ? [{ id: "growth", icon: "📊", label: "My Growth" }] : []),
  ];

  const studentItems = [
    { label: "Dashboard", path: "/student", type: "nav" as const },
    { label: "Assignments", modal: "assignments", type: "modal" as const },
    { label: "Calendar", path: "/student/calendar", type: "nav" as const },
    ...(phase >= 2 ? [{ label: "My Growth", modal: "progress", type: "modal" as const }] : []),
    { label: "Message Bar", modal: "message", type: "modal" as const },
    { label: "Notifications", modal: "notifications", type: "modal" as const },
    { label: "Personalisation", modal: "personalisation", type: "modal" as const },
  ];

  const items = role === "teacher" ? teacherItems : role === "student" && !onTabChange ? studentItems : role === "teacher" ? teacherItems : [];

  const isActive = (path?: string) => path && location.pathname === path;

  const btnBase = role === "teacher"
    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none py-2.5 px-5 rounded-lg cursor-pointer font-medium transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(66,153,225,0.4)]"
    : "text-white cursor-pointer text-base font-medium transition-all py-2.5 px-[18px] rounded-full bg-transparent border-2 border-transparent hover:bg-blue-500/20 hover:border-blue-500/50 hover:-translate-y-0.5";

  return (
    <>
      <nav role="navigation" aria-label="Main navigation" className="bg-[#0f1419]/95 backdrop-blur-[10px] py-4 px-4 lg:px-8 flex justify-between items-center shadow-[0_4px_20px_rgba(0,0,0,0.1)] sticky top-0 z-[1000] animate-slide-down border-b-2 border-blue-500/30">
        <a href="/" className="no-underline">
          <div className="text-2xl font-bold text-white flex items-center gap-2.5">
            EduTech
          </div>
        </a>

        {/* Desktop nav */}
        <div className="hidden lg:flex gap-5 items-center">
          {items.map((item) =>
            item.type === "nav" ? (
              <button key={item.label} onClick={() => navigate(item.path!)} aria-current={isActive(item.path) ? "page" : undefined} className={`${btnBase} ${isActive(item.path) ? "ring-2 ring-white/60" : ""}`}>
                {item.label}
              </button>
            ) : (
              <button key={item.label} onClick={() => openModal(item.modal!)} className={btnBase}>
                {item.label}
              </button>
            )
          )}
        </div>

        <div className="flex items-center gap-3 lg:gap-4">
          {/* Hamburger for mobile/tablet */}
          <button
            className="lg:hidden text-white bg-transparent border-none cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <button
            onClick={() => setDark(!dark)}
            className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 border-none cursor-pointer text-white transition-all"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <kbd className="hidden md:inline-flex items-center gap-0.5 rounded-md border border-white/20 bg-white/10 px-2 py-1 text-[11px] font-mono text-white/60">
            ⌘K
          </kbd>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white font-bold text-base">
            {initials}
          </div>
          <button
            onClick={handleSignOut}
            className="bg-red-400 text-white border-none py-2 px-4 lg:py-2.5 lg:px-5 rounded-lg cursor-pointer font-medium transition-all hover:bg-red-500 hover:-translate-y-0.5 text-sm lg:text-base"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Mobile/tablet dropdown */}
      {menuOpen && (
        <div className="lg:hidden bg-[#0f1419]/98 border-b-2 border-blue-500/30 px-4 py-3 flex flex-col gap-2 sticky top-[73px] z-[999] animate-slide-down">
          {items.map((item) =>
            item.type === "nav" ? (
              <button
                key={item.label}
                onClick={() => navAction(item.path!)}
                className={`text-left text-white py-3 px-4 rounded-lg transition-all bg-transparent border-none text-base ${isActive(item.path) ? "bg-blue-500/20 font-semibold" : "hover:bg-white/10"}`}
              >
                {item.label}
              </button>
            ) : (
              <button
                key={item.label}
                onClick={() => openModal(item.modal!)}
                className="text-left text-white py-3 px-4 rounded-lg transition-all bg-transparent border-none text-base hover:bg-white/10"
              >
                {item.label}
              </button>
            )
          )}
        </div>
      )}

      {/* Student Modals */}
      {role === "student" && (
        <>
          <AssignmentsModal open={activeModal === "assignments"} onOpenChange={(o) => !o && closeModal()} />
          <ProgressModal open={activeModal === "progress"} onOpenChange={(o) => !o && closeModal()} />
          <MessageModal open={activeModal === "message"} onOpenChange={(o) => !o && closeModal()} />
          <NotificationsModal open={activeModal === "notifications"} onOpenChange={(o) => !o && closeModal()} />
          <PersonalisationModal open={activeModal === "personalisation"} onOpenChange={(o) => !o && closeModal()} />
        </>
      )}
      {/* Teacher Modals */}
      {role === "teacher" && (
        <MessageModal open={activeModal === "message"} onOpenChange={(o) => !o && closeModal()} />
      )}
    </>
  );
};

export default TopNavbar;
