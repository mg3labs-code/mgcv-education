import SideNav from "./SideNav";

interface PageLayoutProps {
  role: "student" | "teacher" | "admin";
  children: React.ReactNode;
}

const PageLayout = ({ role, children }: PageLayoutProps) => (
  <div className="min-h-screen bg-background">
    <SideNav role={role} />
    <main className="ml-60 p-8">{children}</main>
  </div>
);

export default PageLayout;
