import { useEffect, useState, useCallback } from "react"; // force hmr
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard, BookOpen, Calendar, ClipboardList, BarChart3,
  Users, Bell, Target, GraduationCap, Lightbulb, MessageSquare,
  FlaskConical, Compass, CheckSquare,
} from "lucide-react";

const STUDENT_PAGES = [
  { label: "Dashboard", path: "/student", icon: LayoutDashboard },
  { label: "Textbook", path: "/student/textbook", icon: BookOpen },
  { label: "Calendar", path: "/student/calendar", icon: Calendar },
  { label: "Assignments", path: "/student/assignments", icon: ClipboardList },
  { label: "Deep Dive", path: "/student/deep-dive", icon: Compass },
  { label: "Textbook Lab", path: "/student/textbook-lab", icon: FlaskConical },
];

const TEACHER_PAGES = [
  { label: "Dashboard", path: "/teacher", icon: LayoutDashboard },
  { label: "Annual Schedule", path: "/teacher/schedule", icon: Calendar },
  { label: "Analytics", path: "/teacher/analytics", icon: BarChart3 },
  { label: "Assignments", path: "/teacher/assignments", icon: ClipboardList },
  { label: "Attendance", path: "/teacher/attendance", icon: Users },
  { label: "Performance", path: "/teacher/performance", icon: Target },
  { label: "Daily Plan", path: "/teacher/daily-todo", icon: CheckSquare },
  { label: "Insights", path: "/teacher/insights", icon: Lightbulb },
  { label: "Parent Connect", path: "/teacher/parent-connect", icon: MessageSquare },
  { label: "Exam Room", path: "/teacher/exam-room", icon: GraduationCap },
];

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { role } = useAuth();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback(
    (path: string) => {
      setOpen(false);
      navigate(path);
    },
    [navigate]
  );

  if (!role || role === "admin") return null;

  const pages = role === "student" ? STUDENT_PAGES : TEACHER_PAGES;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages.map((page) => (
            <CommandItem
              key={page.path}
              onSelect={() => handleSelect(page.path)}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <page.icon className="h-4 w-4 text-muted-foreground" />
              <span>{page.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
