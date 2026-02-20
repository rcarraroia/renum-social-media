import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePageTracking } from "@/hooks/usePageTracking";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Onboarding from "@/pages/Onboarding";
import Module2 from "@/pages/Module2";
import CalendarPage from "@/pages/Calendar";
import Analytics from "@/pages/Analytics";
import Module1 from "./pages/Module1";
import Module3 from "./pages/Module3";
import PostsFlowsLanding from "./pages/PostsFlowsLanding";
import MyVideos from "./pages/MyVideos";
import TeleprompterRecording from "./pages/TeleprompterRecording";

const queryClient = new QueryClient();

// Component to track page views
function PageTracker() {
  usePageTracking();
  return null;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PageTracker />
          <Routes>
          {/* Public */}
          <Route path="/" element={<PostsFlowsLanding />} />
          <Route path="/posts-flows" element={<PostsFlowsLanding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* ScriptAI (formerly Module 1) */}
          <Route
            path="/module-1/script-ai"
            element={
              <ProtectedRoute>
                <Module1 />
              </ProtectedRoute>
            }
          />

          {/* Teleprompter Recording (fullscreen) */}
          <Route
            path="/module-1/teleprompter"
            element={
              <ProtectedRoute>
                <TeleprompterRecording />
              </ProtectedRoute>
            }
          />

          {/* PostRápido (formerly Module 2) */}
          <Route
            path="/module-2/post-rapido"
            element={
              <ProtectedRoute>
                <Module2 />
              </ProtectedRoute>
            }
          />

          {/* AvatarAI (formerly Module 3) */}
          <Route
            path="/module-3/avatar-ai"
            element={
              <ProtectedRoute>
                <Module3 />
              </ProtectedRoute>
            }
          />

          {/* Backwards compatibility: redirect old module paths to new ones */}
          <Route path="/modules/1" element={<Navigate to="/module-1/script-ai" replace />} />
          <Route path="/modules/2" element={<Navigate to="/module-2/post-rapido" replace />} />
          <Route path="/modules/3" element={<Navigate to="/module-3/avatar-ai" replace />} />

          {/* Calendar */}
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            }
          />

          {/* Analytics */}
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />

          {/* My Videos */}
          <Route
            path="/my-videos"
            element={
              <ProtectedRoute>
                <MyVideos />
              </ProtectedRoute>
            }
          />

          {/* Onboarding (protected) */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;