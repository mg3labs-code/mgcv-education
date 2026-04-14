import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X, Bell, ChevronDown } from "lucide-react";
import MessageModal from "./student/MessageModal";

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
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : role[0].toUpperCase();

  const closeModal = () => setActiveModal(null);

  // Main navigation tabs (removed messages, notifications, personalisation)
  const studentTabs = [
    { id: "home", icon: "🏠", label: "Dashboard" },
    { id: "learn", icon: "📖", label: "Learn" },
    { id: "tasks", icon: "📝", label: "Tasks" },
    { id: "calendar", icon: "📅", label: "Calendar" },
    { id: "growth", icon: "📊", label: "My Growth" },
  ];

  const teacherItems = [
    { label: "Dashboard", path: "/teacher", type: "nav" as const },
    { label: "Annual Schedule", path: "/teacher/schedule", type: "nav" as const },
    { label: "Daily Plan", path: "/teacher/daily-todo", type: "nav" as const },
    { label: "Metrics", path: "/teacher/analytics", type: "nav" as const },
    { label: "Message Bar", modal: "message", type: "modal" as const },
  ];

  const isActive = (path?: string) => path && location.pathname === path;

  // ─── Student cream-themed navbar ───
  if (role === "student" && onTabChange) {
    return (
      <>
        <nav role="navigation" aria-label="Main navigation" style={{
          background: "#FFFBF5",
          borderBottom: "1px solid #E7E5E4",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <div style={{
              fontFamily: "'Source Serif 4', serif",
              fontSize: 22,
              fontWeight: 700,
              color: "#1C1917",
            }}>
              EduTech
            </div>
          </a>

          {/* Desktop pill tabs */}
          <div className="hidden lg:flex items-center" style={{
            background: "#F5F5F4",
            borderRadius: 12,
            padding: 4,
            gap: 2,
          }}>
            {studentTabs.map((t) => (
              <button key={t.id} onClick={() => onTabChange(t.id)} style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "6px 10px", borderRadius: 8, border: "none",
                background: activeTab === t.id ? "white" : "transparent",
                boxShadow: activeTab === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                fontSize: 12, fontWeight: activeTab === t.id ? 600 : 400,
                color: activeTab === t.id ? "#0D9488" : "#78716C",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Mobile hamburger */}
            <button
              className="lg:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#1C1917", padding: 4,
              }}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Dynamic streak badge - shows actual count when streakDays >= 1 */}
            {phase >= 1 && (
              <div style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "4px 10px", background: "#FEF3C7",
                borderRadius: 20, fontSize: 13, fontWeight: 600,
                color: "#F59E0B",
              }}>
                🔥 {phase >= 2 ? phase : ""}
              </div>
            )}

            {/* Notification bell */}
            <button
              onClick={() => onTabChange("notifications")}
              style={{
                background: activeTab === "notifications" ? "#F0FDFA" : "transparent",
                border: "1px solid",
                borderColor: activeTab === "notifications" ? "#0D9488" : "#E7E5E4",
                borderRadius: "50%",
                width: 36, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                position: "relative",
                transition: "all 0.15s",
              }}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" style={{ color: activeTab === "notifications" ? "#0D9488" : "#78716C" }} />
              {/* Notification dot */}
              <span style={{
                position: "absolute", top: 6, right: 6,
                width: 7, height: 7, borderRadius: "50%",
                background: "#EF4444", border: "1.5px solid #FFFBF5",
              }} />
            </button>

            {/* Profile dropdown */}
            <div ref={profileRef} style={{ position: "relative" }}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: profileOpen ? "#F5F5F4" : "transparent",
                  border: "none", borderRadius: 12, padding: "4px 8px 4px 4px",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "linear-gradient(135deg, #0D9488, #14B8A6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontWeight: 700, fontSize: 14,
                }}>
                  {initials}
                </div>
                <ChevronDown className="h-3.5 w-3.5 hidden sm:block" style={{
                  color: "#78716C",
                  transform: profileOpen ? "rotate(180deg)" : "rotate(0)",
                  transition: "transform 0.2s",
                }} />
              </button>

              {/* Dropdown menu */}
              {profileOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0,
                  background: "white", borderRadius: 14,
                  border: "1px solid #E7E5E4",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                  minWidth: 200, padding: 6,
                  zIndex: 1100,
                  animation: "fadeIn 0.15s ease",
                }}>
                  {/* User info */}
                  <div style={{
                    padding: "10px 12px", borderBottom: "1px solid #F5F5F4",
                    marginBottom: 4,
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#1C1917" }}>{fullName || "Student"}</div>
                    <div style={{ fontSize: 12, color: "#A8A29E", marginTop: 2 }}>Student</div>
                  </div>

                  {/* Menu items */}
                  {[
                    { icon: "💬", label: "Messages", tab: "messages" },
                    { icon: "⚙️", label: "Settings", tab: "personalisation" },
                  ].map((item) => (
                    <button
                      key={item.tab}
                      onClick={() => { onTabChange(item.tab); setProfileOpen(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        width: "100%", padding: "10px 12px", borderRadius: 10,
                        border: "none", background: activeTab === item.tab ? "#F0FDFA" : "transparent",
                        cursor: "pointer", fontSize: 14,
                        fontFamily: "'DM Sans', sans-serif",
                        color: activeTab === item.tab ? "#0D9488" : "#57534E",
                        fontWeight: activeTab === item.tab ? 600 : 400,
                        transition: "all 0.1s",
                      }}
                    >
                      <span>{item.icon}</span> {item.label}
                    </button>
                  ))}

                  <div style={{ borderTop: "1px solid #F5F5F4", marginTop: 4, paddingTop: 4 }}>
                    <button
                      onClick={() => { setProfileOpen(false); handleSignOut(); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        width: "100%", padding: "10px 12px", borderRadius: 10,
                        border: "none", background: "transparent",
                        cursor: "pointer", fontSize: 14,
                        fontFamily: "'DM Sans', sans-serif",
                        color: "#DC2626", fontWeight: 500,
                        transition: "all 0.1s",
                      }}
                    >
                      🚪 Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div style={{
            background: "#FFFBF5", borderBottom: "1px solid #E7E5E4",
            padding: "8px 16px", display: "flex", flexDirection: "column", gap: 4,
            position: "sticky", top: 65, zIndex: 999,
          }} className="lg:hidden">
            {studentTabs.map((t) => (
              <button key={t.id} onClick={() => { onTabChange(t.id); setMenuOpen(false); }}
                style={{
                  textAlign: "left", padding: "10px 12px", borderRadius: 8,
                  border: "none", cursor: "pointer", fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif",
                  background: activeTab === t.id ? "#F0FDFA" : "transparent",
                  color: activeTab === t.id ? "#0D9488" : "#57534E",
                  fontWeight: activeTab === t.id ? 600 : 400,
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        )}

        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </>
    );
  }

  // ─── Teacher / fallback navbar (keep existing dark style) ───
  const items = role === "teacher" ? teacherItems : [];
  const btnBase = "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none py-2.5 px-5 rounded-lg cursor-pointer font-medium transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(66,153,225,0.4)]";

  return (
    <>
      <nav role="navigation" aria-label="Main navigation" className="bg-[#0f1419]/95 backdrop-blur-[10px] py-4 px-4 lg:px-8 flex justify-between items-center shadow-[0_4px_20px_rgba(0,0,0,0.1)] sticky top-0 z-[1000] animate-slide-down border-b-2 border-blue-500/30">
        <a href="/" className="no-underline">
          <div className="text-2xl font-bold text-white flex items-center gap-2.5">EduTech</div>
        </a>

        <div className="hidden lg:flex gap-5 items-center">
          {items.map((item) =>
            item.type === "nav" ? (
              <button key={item.label} onClick={() => navigate(item.path!)} aria-current={isActive(item.path) ? "page" : undefined}
                className={`${btnBase} ${isActive(item.path) ? "ring-2 ring-white/60" : ""}`}>
                {item.label}
              </button>
            ) : (
              <button key={item.label} onClick={() => setActiveModal(item.modal!)} className={btnBase}>
                {item.label}
              </button>
            )
          )}
        </div>

        <div className="flex items-center gap-3 lg:gap-4">
          <button className="lg:hidden text-white bg-transparent border-none cursor-pointer" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white font-bold text-base">{initials}</div>
          <button onClick={handleSignOut} className="bg-red-400 text-white border-none py-2 px-4 lg:py-2.5 lg:px-5 rounded-lg cursor-pointer font-medium transition-all hover:bg-red-500 hover:-translate-y-0.5 text-sm lg:text-base">Logout</button>
        </div>
      </nav>

      {menuOpen && (
        <div className="lg:hidden bg-[#0f1419]/98 border-b-2 border-blue-500/30 px-4 py-3 flex flex-col gap-2 sticky top-[73px] z-[999] animate-slide-down">
          {items.map((item) =>
            item.type === "nav" ? (
              <button key={item.label} onClick={() => { navigate(item.path!); setMenuOpen(false); }}
                className={`text-left text-white py-3 px-4 rounded-lg transition-all bg-transparent border-none text-base ${isActive(item.path) ? "bg-blue-500/20 font-semibold" : "hover:bg-white/10"}`}>
                {item.label}
              </button>
            ) : (
              <button key={item.label} onClick={() => { setActiveModal(item.modal!); setMenuOpen(false); }}
                className="text-left text-white py-3 px-4 rounded-lg transition-all bg-transparent border-none text-base hover:bg-white/10">
                {item.label}
              </button>
            )
          )}
        </div>
      )}

      {role === "teacher" && (
        <MessageModal open={activeModal === "message"} onOpenChange={(o) => !o && closeModal()} />
      )}
    </>
  );
};

export default TopNavbar;
