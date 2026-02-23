import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface TopNavbarProps {
  role: "student" | "teacher" | "admin";
}

const TopNavbar = ({ role }: TopNavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, fullName } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : role[0].toUpperCase();

  return (
    <nav className="bg-[#0f1419]/95 backdrop-blur-[10px] py-4 px-8 flex justify-between items-center shadow-[0_4px_20px_rgba(0,0,0,0.1)] sticky top-0 z-[1000] animate-slide-down border-b-2 border-blue-500/30">
      <a href="/" className="no-underline">
        <div className="text-2xl font-bold text-white flex items-center gap-2.5">
          EduTech
        </div>
      </a>

      <div className="flex gap-5 items-center">
        {role === "teacher" && (
          <>
            <button className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none py-2.5 px-5 rounded-lg cursor-pointer font-medium transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(66,153,225,0.4)]">
              Annual Schedule
            </button>
            <button className="bg-gradient-to-br from-blue-500 to-black text-white border-none py-2.5 px-5 rounded-lg cursor-pointer font-medium transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(72,187,120,0.4)]">
              To-Do List
            </button>
            <button className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none py-2.5 px-5 rounded-lg cursor-pointer font-medium transition-all hover:-translate-y-0.5">
              Metrics
            </button>
            <button className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none py-2.5 px-5 rounded-lg cursor-pointer font-medium transition-all hover:-translate-y-0.5">
              Message Bar
            </button>
          </>
        )}
        {role === "student" && (
          <>
            <button className="text-white cursor-pointer text-base font-medium transition-all py-2.5 px-[18px] rounded-full bg-transparent border-2 border-transparent hover:bg-blue-500/20 hover:border-blue-500/50 hover:-translate-y-0.5">
              Today's Schedule
            </button>
            <button className="text-white cursor-pointer text-base font-medium transition-all py-2.5 px-[18px] rounded-full bg-transparent border-2 border-transparent hover:bg-blue-500/20 hover:border-blue-500/50 hover:-translate-y-0.5">
              Assignments
            </button>
            <button className="text-white cursor-pointer text-base font-medium transition-all py-2.5 px-[18px] rounded-full bg-transparent border-2 border-transparent hover:bg-blue-500/20 hover:border-blue-500/50 hover:-translate-y-0.5">
              Calendar
            </button>
            <button className="text-white cursor-pointer text-base font-medium transition-all py-2.5 px-[18px] rounded-full bg-transparent border-2 border-transparent hover:bg-blue-500/20 hover:border-blue-500/50 hover:-translate-y-0.5">
              Progress
            </button>
            <button className="bg-gradient-to-br from-blue-500 to-black text-white border-none py-2.5 px-5 rounded-lg cursor-pointer font-medium transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(66,153,225,0.4)]">
              Message Bar
            </button>
            <button className="bg-gradient-to-br from-blue-500 to-black text-white border-none py-2.5 px-5 rounded-lg cursor-pointer font-medium transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(66,153,225,0.4)]">
              Notifications
            </button>
            <button className="text-white cursor-pointer text-base font-medium transition-all py-2.5 px-[18px] rounded-full bg-transparent border-2 border-transparent hover:bg-blue-500/20 hover:border-blue-500/50 hover:-translate-y-0.5">
              Personalisation
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white font-bold text-base">
          {initials}
        </div>
        <button
          onClick={handleSignOut}
          className="bg-red-400 text-white border-none py-2.5 px-5 rounded-lg cursor-pointer font-medium transition-all hover:bg-red-500 hover:-translate-y-0.5"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default TopNavbar;
