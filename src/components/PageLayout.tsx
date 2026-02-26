import SideNav from "./SideNav";
import StudyCompanion from "./student/StudyCompanion";

interface PageLayoutProps {
  role: "student" | "teacher" | "admin";
  children: React.ReactNode;
}

const PageLayout = ({ role, children }: PageLayoutProps) => (
  <div className="min-h-screen bg-background">
    <SideNav role={role} />
    <main className="ml-60 p-8">{children}</main>
    {role === "student" && <StudyCompanion />}
  </div>
);

export default PageLayout;
