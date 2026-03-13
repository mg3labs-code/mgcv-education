import SideNav from "./SideNav";
import Breadcrumbs, { type BreadcrumbEntry } from "./Breadcrumbs";

interface PageLayoutProps {
  role: "student" | "teacher" | "admin";
  children: React.ReactNode;
  breadcrumbItems?: BreadcrumbEntry[];
}

const PageLayout = ({ role, children, breadcrumbItems }: PageLayoutProps) => (
  <div className="min-h-screen bg-background">
    <SideNav role={role} />
    {/* pt-14 on mobile for the fixed top bar; md:ml-60 for desktop sidebar */}
    <main className="pt-14 md:pt-0 md:ml-60 p-4 md:p-8">
      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <div className="mb-4">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      )}
      {children}
    </main>
  </div>
);

export default PageLayout;
