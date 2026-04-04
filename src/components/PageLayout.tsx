import SideNav from "./SideNav";
import TopNavbar from "./TopNavbar";
import Breadcrumbs, { type BreadcrumbEntry } from "./Breadcrumbs";
import PageTransition from "./PageTransition";

interface PageLayoutProps {
  role: "student" | "teacher" | "admin";
  children: React.ReactNode;
  breadcrumbItems?: BreadcrumbEntry[];
}

const PageLayout = ({ role, children, breadcrumbItems }: PageLayoutProps) => {
  // Student pages use top navbar (no sidebar), matching the dashboard layout
  if (role === "student") {
    return (
      <div className="min-h-screen bg-white">
        <a href="#main-content" className="skip-to-content">Skip to content</a>
        <TopNavbar role={role} />
        {breadcrumbItems && breadcrumbItems.length > 0 && (
          <div className="px-4 md:px-8 pt-3 md:pt-4 max-w-[1400px] mx-auto">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        )}
        <main id="main-content" className="p-4 md:p-8 max-w-[1400px] mx-auto">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
    );
  }

  // Teacher/admin pages keep the sidebar
  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="skip-to-content">Skip to content</a>
      <SideNav role={role} />
      <main id="main-content" className="pt-14 md:pt-0 md:ml-60 p-4 md:p-8">
        {breadcrumbItems && breadcrumbItems.length > 0 && (
          <div className="mb-4">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        )}
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
};

export default PageLayout;
