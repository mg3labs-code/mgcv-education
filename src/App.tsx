import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import StudyCompanion from "./components/student/StudyCompanion";
import CommandPalette from "./components/CommandPalette";
import VoiceGreeting from "./components/VoiceGreeting";
import VibeCheckModal from "./components/student/VibeCheckModal";
import Index from "./pages/Index";

const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const LearningEpisode = lazy(() => import("./pages/LearningEpisode"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const StudentOnboarding = lazy(() => import("./pages/StudentOnboarding"));
const TeacherSchedule = lazy(() => import("./pages/TeacherSchedule"));
const TeacherAnalytics = lazy(() => import("./pages/TeacherAnalytics"));
const StudentCalendar = lazy(() => import("./pages/StudentCalendar"));
const StudentAssignments = lazy(() => import("./pages/StudentAssignments"));
const TeacherAssignments = lazy(() => import("./pages/TeacherAssignments"));
const TeacherAttendance = lazy(() => import("./pages/TeacherAttendance"));
const TeacherPerformance = lazy(() => import("./pages/TeacherPerformance"));
const TeacherDailyTodo = lazy(() => import("./pages/TeacherDailyTodo"));
const TeacherInsights = lazy(() => import("./pages/TeacherInsights"));
const StudentExamRoom = lazy(() => import("./pages/StudentExamRoom"));
const StudentTextbook = lazy(() => import("./pages/StudentTextbook"));
const TextbookChapter = lazy(() => import("./pages/TextbookChapter"));
const TextbookEpisode = lazy(() => import("./pages/TextbookEpisode"));
const TextbookLab = lazy(() => import("./pages/TextbookLab"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AttractionDemo = lazy(() => import("./pages/AttractionDemo"));
const TextbookReference = lazy(() => import("./pages/TextbookReference"));
const AdaptiveComparison = lazy(() => import("./pages/AdaptiveComparison"));
const ReasoningVisualDemo = lazy(() => import("./pages/ReasoningVisualDemo"));
const DemoDesignA = lazy(() => import("./pages/DemoDesignA"));
const DemoDesignB = lazy(() => import("./pages/DemoDesignB"));
const DemoDesignC = lazy(() => import("./pages/DemoDesignC"));
const VisualReasoningDemo = lazy(() => import("./pages/VisualReasoningDemo"));
const StudentDeepDive = lazy(() => import("./pages/StudentDeepDive"));
const ExplorerModeDemo = lazy(() => import("./pages/ExplorerModeDemo"));
const FallbackStrategiesDemo = lazy(() => import("./pages/FallbackStrategiesDemo"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center animate-fade-in">
      <h2 className="text-lg font-serif font-semibold text-foreground">Loading...</h2>
      <p className="text-sm text-muted-foreground mt-1">Preparing your workspace</p>
    </div>
  </div>
);

const CompanionWrapper = () => {
  const { role } = useAuth();
  if (role !== "student" && role !== "teacher") return null;
  return <StudyCompanion role={role} />;
};

const VibeCheckWrapper = () => {
  const { role } = useAuth();
  if (role !== "student") return null;
  return <VibeCheckModal />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <CommandPalette />
            <CompanionWrapper />
            <VibeCheckWrapper />
            <VoiceGreeting />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/attraction-demo" element={<AttractionDemo />} />
                <Route path="/textbook-reference/:chapterId/:episodeId" element={<TextbookReference />} />
                <Route path="/board-vs-jee" element={<AdaptiveComparison />} />
                <Route path="/reasoning-visual" element={<ReasoningVisualDemo />} />
                <Route path="/demo/design-a" element={<DemoDesignA />} />
                <Route path="/demo/design-b" element={<DemoDesignB />} />
                <Route path="/demo/design-c" element={<DemoDesignC />} />
                <Route path="/demo/visual-reasoning" element={<VisualReasoningDemo />} />
                <Route path="/demo/explorer-mode" element={<ExplorerModeDemo />} />
                <Route path="/demo/fallback-strategies" element={<FallbackStrategiesDemo />} />
                <Route path="/student" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
                <Route path="/student/episode/:id" element={<ProtectedRoute><LearningEpisode /></ProtectedRoute>} />
                <Route path="/student/onboarding" element={<ProtectedRoute><StudentOnboarding /></ProtectedRoute>} />
                <Route path="/student/episodes" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
                <Route path="/student/progress" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
                <Route path="/student/calendar" element={<ProtectedRoute><StudentCalendar /></ProtectedRoute>} />
                <Route path="/student/assignments" element={<ProtectedRoute><StudentAssignments /></ProtectedRoute>} />
                <Route path="/student/textbook" element={<ProtectedRoute><StudentTextbook /></ProtectedRoute>} />
                <Route path="/student/textbook/:chapterId" element={<ProtectedRoute><TextbookChapter /></ProtectedRoute>} />
                <Route path="/student/textbook/:chapterId/:episodeId" element={<ProtectedRoute><TextbookEpisode /></ProtectedRoute>} />
                <Route path="/student/textbook-lab" element={<ProtectedRoute><TextbookLab /></ProtectedRoute>} />
                <Route path="/student/deep-dive" element={<ProtectedRoute><StudentDeepDive /></ProtectedRoute>} />
                <Route path="/teacher" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
                <Route path="/teacher/students" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
                <Route path="/teacher/daily-todo" element={<ProtectedRoute><TeacherDailyTodo /></ProtectedRoute>} />
                <Route path="/teacher/schedule" element={<ProtectedRoute><TeacherSchedule /></ProtectedRoute>} />
                <Route path="/teacher/analytics" element={<ProtectedRoute><TeacherAnalytics /></ProtectedRoute>} />
                <Route path="/teacher/assignments" element={<ProtectedRoute><TeacherAssignments /></ProtectedRoute>} />
                <Route path="/teacher/attendance" element={<ProtectedRoute><TeacherAttendance /></ProtectedRoute>} />
                <Route path="/teacher/performance" element={<ProtectedRoute><TeacherPerformance /></ProtectedRoute>} />
                <Route path="/teacher/quiz" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
                <Route path="/teacher/insights" element={<ProtectedRoute><TeacherInsights /></ProtectedRoute>} />
                <Route path="/teacher/exam-room" element={<ProtectedRoute><StudentExamRoom /></ProtectedRoute>} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/schools" element={<AdminDashboard />} />
                <Route path="/admin/analytics" element={<AdminDashboard />} />
                <Route path="/admin/settings" element={<AdminDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
