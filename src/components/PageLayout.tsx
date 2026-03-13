import SideNav from "./SideNav";
import Breadcrumbs, { type BreadcrumbEntry } from "./Breadcrumbs";
import PageTransition from "./PageTransition";

interface PageLayoutProps {
  role: "student" | "teacher" | "admin";
  children: React.ReactNode;
  breadcrumbItems?: BreadcrumbEntry[];
}

const PageLayout = ({ role, children, breadcrumbItems }: PageLayoutProps) => (
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

export default PageLayout;
