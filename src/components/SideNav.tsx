import { useNavigate, useLocation } from "react-router-dom";
import { LucideIcon, LayoutDashboard, BookOpen, BarChart3, Users, Settings, LogOut, GraduationCap } from "lucide-react";

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

const studentNav: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/student" },
  { label: "Episodes", icon: BookOpen, path: "/student/episodes" },
  { label: "Progress", icon: BarChart3, path: "/student/progress" },
];

const teacherNav: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/teacher" },
  { label: "Students", icon: Users, path: "/teacher/students" },
  { label: "Analytics", icon: BarChart3, path: "/teacher/analytics" },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Schools", icon: GraduationCap, path: "/admin/schools" },
  { label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
  { label: "Settings", icon: Settings, path: "/admin/settings" },
];

const navMap: Record<string, NavItem[]> = {
  student: studentNav,
  teacher: teacherNav,
  admin: adminNav,
};

const roleLabels: Record<string, string> = {
  student: "Student",
  teacher: "Teacher",
  admin: "Administrator",
};

interface SideNavProps {
  role: "student" | "teacher" | "admin";
}

const SideNav = ({ role }: SideNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const items = navMap[role];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-sidebar flex flex-col z-40">
      <div className="p-5 border-b border-sidebar-border">
        <h1 className="font-serif text-lg font-bold text-sidebar-foreground tracking-tight">
          Elite Thinking
        </h1>
        <p className="text-xs text-sidebar-foreground/60 mt-0.5">{roleLabels[role]} Portal</p>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
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
          onClick={() => navigate("/")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Switch Role
        </button>
      </div>
    </aside>
  );
};

export default SideNav;
