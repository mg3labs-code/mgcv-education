import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LucideIcon, LayoutDashboard, BookOpen, BarChart3, Users, Settings, LogOut, GraduationCap, CalendarDays, ClipboardList, School, Brain, ListTodo, FlaskConical, Menu, Sparkles, Globe2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

const studentNav: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/student" },
  { label: "Textbook", icon: BookOpen, path: "/student/textbook" },
  { label: "Episodes", icon: GraduationCap, path: "/student/episodes" },
  { label: "Assignments", icon: ClipboardList, path: "/student/assignments" },
  { label: "Progress", icon: BarChart3, path: "/student/progress" },
  { label: "Textbook Lab", icon: FlaskConical, path: "/student/textbook-lab" },
  { label: "Board vs JEE", icon: Sparkles, path: "/board-vs-jee" },
];

const teacherNav: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/teacher" },
  { label: "Daily Plan", icon: ListTodo, path: "/teacher/daily-todo" },
  { label: "Know Your World", icon: Globe2, path: "/teacher/know-your-world" },
  { label: "Annual Schedule", icon: CalendarDays, path: "/teacher/schedule" },
  { label: "Assignments", icon: ClipboardList, path: "/teacher/assignments" },
  { label: "Class Insights", icon: Brain, path: "/teacher/insights" },
  { label: "Exam Room", icon: School, path: "/teacher/exam-room" },
  { label: "Students", icon: Users, path: "/teacher/students" },
  { label: "Analytics", icon: BarChart3, path: "/teacher/analytics" },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Schools", icon: GraduationCap, path: "/admin/schools" },
  { label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
  { label: "Settings", icon: Settings, path: "/admin/settings" },
];

const navMap: Record<string, NavItem[]> = { student: studentNav, teacher: teacherNav, admin: adminNav };
const roleLabels: Record<string, string> = { student: "Student", teacher: "Teacher", admin: "Administrator" };

interface SideNavProps {
  role: "student" | "teacher" | "admin";
}

const NavContent = ({ role, onNavigate }: { role: string; onNavigate: (path: string) => void }) => {
  const location = useLocation();
  const { signOut, fullName } = useAuth();
  const navigate = useNavigate();
  const items = navMap[role];

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <>
      <div className="p-5 border-b border-sidebar-border">
        <h1 className="font-serif text-lg font-bold text-sidebar-foreground tracking-tight">
          EduTech
        </h1>
        <p className="text-xs text-sidebar-foreground/60 mt-0.5">
          {fullName || roleLabels[role]} · {roleLabels[role]}
        </p>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </>
  );
};

const SideNav = ({ role }: SideNavProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  if (isMobile) {
    return (
      <>
        {/* Mobile top bar with hamburger */}
        <div className="fixed top-0 left-0 right-0 h-14 bg-sidebar flex items-center px-4 z-40 border-b border-sidebar-border">
          <Button size="icon" variant="ghost" onClick={() => setMobileOpen(true)} className="text-sidebar-foreground">
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-serif text-base font-bold text-sidebar-foreground ml-3 tracking-tight">EduTech</h1>
        </div>

        {/* Mobile drawer */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex flex-col h-full">
              <NavContent role={role} onNavigate={handleNavigate} />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-sidebar flex flex-col z-40">
      <NavContent role={role} onNavigate={handleNavigate} />
    </aside>
  );
};

export default SideNav;
