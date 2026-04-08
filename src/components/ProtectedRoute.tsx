import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  const { data: onboardingCompleted, isLoading: onboardingLoading } = useQuery({
    queryKey: ["onboarding-status", user?.id],
    queryFn: async () => {
      if (!user) return true;
      const { data } = await supabase
        .from("student_preferences")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();
      return data?.onboarding_completed ?? false;
    },
    enabled: !!user && role === "student",
    staleTime: 5 * 60 * 1000,
  });

  if (loading || (role === "student" && onboardingLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <h2 className="text-lg font-serif font-semibold text-foreground">Loading...</h2>
          <p className="text-sm text-muted-foreground mt-1">Preparing your workspace</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  const isOnboardingRoute = location.pathname === '/student/onboarding';
  if (role === 'student' && !isOnboardingRoute && !onboardingCompleted) {
    return <Navigate to="/student/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
