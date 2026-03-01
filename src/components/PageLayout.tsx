import SideNav from "./SideNav";

interface PageLayoutProps {
  role: "student" | "teacher" | "admin";
  children: React.ReactNode;
}

const PageLayout = ({ role, children }: PageLayoutProps) => (
  <div className="min-h-screen bg-background">
    <SideNav role={role} />
    {/* pt-14 on mobile for the fixed top bar; md:ml-60 for desktop sidebar */}
    <main className="pt-14 md:pt-0 md:ml-60 p-4 md:p-8">{children}</main>
  </div>
);

export default PageLayout;
