import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <h2 className="text-lg font-serif font-semibold text-foreground">Loading...</h2>
          <p className="text-sm text-muted-foreground mt-1">Preparing your workspace</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Redirect students to onboarding if they haven't completed it
  const isOnboardingRoute = location.pathname === '/student/onboarding';
  if (role === 'student' && !isOnboardingRoute) {
    const completed = localStorage.getItem(`onboarding_complete_${user.id}`);
    if (!completed) {
      return <Navigate to="/student/onboarding" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
