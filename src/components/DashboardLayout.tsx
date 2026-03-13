import TopNavbar from "./TopNavbar";
import Breadcrumbs, { type BreadcrumbEntry } from "./Breadcrumbs";
import PageTransition from "./PageTransition";

interface DashboardLayoutProps {
  role: "student" | "teacher" | "admin";
  children: React.ReactNode;
  breadcrumbItems?: BreadcrumbEntry[];
}

const DashboardLayout = ({ role, children, breadcrumbItems }: DashboardLayoutProps) => (
  <div className="gradient-bg min-h-screen" style={{ animation: "gradientShift 10s ease infinite" }}>
    <a href="#main-content" className="skip-to-content">Skip to content</a>
    <TopNavbar role={role} />
    {breadcrumbItems && breadcrumbItems.length > 0 && (
      <div className="px-4 md:px-8 pt-3 md:pt-4 max-w-[1400px] mx-auto">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
    )}
    <div id="main-content">
      <PageTransition>
        {children}
      </PageTransition>
    </div>
  </div>
);

export default DashboardLayout;
