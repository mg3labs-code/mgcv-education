import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

export interface BreadcrumbEntry {
  label: string;
  href?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  student: "Dashboard",
  teacher: "Dashboard",
  admin: "Dashboard",
  textbook: "Textbook",
  calendar: "Calendar",
  assignments: "Assignments",
  "deep-dive": "Deep Dive",
  "exam-room": "Exam Room",
  onboarding: "Onboarding",
  schedule: "Schedule",
  analytics: "Analytics",
  insights: "Insights",
  performance: "Performance",
  attendance: "Attendance",
  "daily-todo": "Daily Plan",
  "parent-connect": "Parent Connect",
};

interface BreadcrumbsProps {
  items?: BreadcrumbEntry[];
  className?: string;
}

const Breadcrumbs = ({ items, className }: BreadcrumbsProps) => {
  const location = useLocation();

  const crumbs: BreadcrumbEntry[] = items || (() => {
    const segments = location.pathname.split("/").filter(Boolean);
    if (segments.length <= 1) return [];
    
    return segments.slice(0, -1).map((seg, i) => ({
      label: ROUTE_LABELS[seg] || seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      href: "/" + segments.slice(0, i + 1).join("/"),
    })).concat({
      label: ROUTE_LABELS[segments[segments.length - 1]] || segments[segments.length - 1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    });
  })();

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList className="text-xs">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={`/${location.pathname.split("/")[1]}`} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <Home className="h-3 w-3" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {crumbs.map((crumb, i) => (
          <span key={i} className="contents">
            <BreadcrumbSeparator className="[&>svg]:h-3 [&>svg]:w-3" />
            <BreadcrumbItem>
              {i === crumbs.length - 1 || !crumb.href ? (
                <BreadcrumbPage className="font-semibold text-foreground text-xs">
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors text-xs">
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default Breadcrumbs;
