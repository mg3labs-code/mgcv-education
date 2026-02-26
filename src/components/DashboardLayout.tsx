import TopNavbar from "./TopNavbar";
import StudyCompanion from "./student/StudyCompanion";

interface DashboardLayoutProps {
  role: "student" | "teacher" | "admin";
  children: React.ReactNode;
}

const DashboardLayout = ({ role, children }: DashboardLayoutProps) => (
  <div className="gradient-bg min-h-screen" style={{ animation: "gradientShift 10s ease infinite" }}>
    <TopNavbar role={role} />
    {children}
    {role === "student" && <StudyCompanion />}
  </div>
);

export default DashboardLayout;
