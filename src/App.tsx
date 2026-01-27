
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import EmailSetup from "./pages/EmailSetup";
import CryptoIntegration from "./pages/CryptoIntegration";
import NotFound from "./pages/NotFound";
import AuthPage from "./components/auth/AuthPage";
import PasswordReset from "./pages/PasswordReset";
import NewsMode from "./pages/NewsMode";
import LearningMode from "./pages/LearningMode";
import HealthMode from "./pages/HealthMode";
import CareerMode from "./pages/CareerMode";
import WealthMode from "./pages/WealthMode";
import CommunicationMode from "./pages/CommunicationMode";
import UCTTokens from "./pages/UCTTokens";
import CommunityRanking from "./pages/CommunityRanking";
import CustomizeAI from "./pages/CustomizeAI";
import FocusMode from "./pages/FocusMode";
import MorningBrief from "./pages/MorningBrief";
import VoiceCommand from "./pages/VoiceCommand";
import UnclutterMode from "./pages/UnclutterMode";
import IntelligenceFeed from "./pages/IntelligenceFeed";
import StrategyWealth from "./pages/StrategyWealth";
import PerformanceReport from "./pages/PerformanceReport";
import Pricing from "./pages/Pricing";
import WhatIHandled from "./pages/WhatIHandled";
import Demo from "./pages/Demo";
import { useAuth } from "@/hooks/useAuth";
import { SecurityProvider } from "@/components/SecurityProvider";
import { AssistantProfileProvider } from "@/components/AssistantProfileProvider";
import { FocusProtectionProvider } from "@/contexts/FocusProtectionContext";
import { AssistantMemoryProvider, useAssistantMemory } from "@/contexts/AssistantMemoryContext";
import { GlobalPriorityProvider } from "@/contexts/GlobalPriorityContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { UCTMilestoneProvider } from "@/components/UCTMilestoneProvider";

const queryClient = new QueryClient();

// Component to track navigation for assistant memory continuity
const NavigationTracker = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { setLastVisitedScreen } = useAssistantMemory();
  
  useEffect(() => {
    setLastVisitedScreen(location.pathname);
  }, [location.pathname, setLastVisitedScreen]);
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <NavigationTracker>
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
        <Route path="/reset" element={<PasswordReset />} />
        <Route path="/" element={user ? <Index /> : <Navigate to="/auth" replace />} />
        <Route path="/email-setup" element={user ? <EmailSetup /> : <Navigate to="/auth" replace />} />
        <Route path="/crypto-integration" element={user ? <CryptoIntegration /> : <Navigate to="/auth" replace />} />
        
        {/* Executive Mode Routes */}
        <Route path="/morning-brief" element={user ? <MorningBrief /> : <Navigate to="/auth" replace />} />
        <Route path="/voice" element={user ? <VoiceCommand /> : <Navigate to="/auth" replace />} />
        <Route path="/open-loops" element={user ? <UnclutterMode /> : <Navigate to="/auth" replace />} />
        <Route path="/focus" element={user ? <FocusMode /> : <Navigate to="/auth" replace />} />
        
        {/* Life OS Routes */}
        <Route path="/communication" element={user ? <CommunicationMode /> : <Navigate to="/auth" replace />} />
        <Route path="/intelligence" element={user ? <IntelligenceFeed /> : <Navigate to="/auth" replace />} />
        <Route path="/health" element={user ? <HealthMode /> : <Navigate to="/auth" replace />} />
        <Route path="/strategy" element={user ? <StrategyWealth /> : <Navigate to="/auth" replace />} />
        
        {/* System Routes */}
        <Route path="/uct-tokens" element={user ? <UCTTokens /> : <Navigate to="/auth" replace />} />
        <Route path="/customize" element={user ? <CustomizeAI /> : <Navigate to="/auth" replace />} />
        <Route path="/pricing" element={user ? <Pricing /> : <Navigate to="/auth" replace />} />
        <Route path="/community" element={user ? <CommunityRanking /> : <Navigate to="/auth" replace />} />
        <Route path="/performance" element={user ? <PerformanceReport /> : <Navigate to="/auth" replace />} />
        <Route path="/what-handled" element={user ? <WhatIHandled /> : <Navigate to="/auth" replace />} />
        <Route path="/demo" element={<Demo />} />
        {/* Legacy routes for backward compatibility */}
        <Route path="/news" element={user ? <NewsMode /> : <Navigate to="/auth" replace />} />
        <Route path="/learning" element={user ? <LearningMode /> : <Navigate to="/auth" replace />} />
        <Route path="/career" element={user ? <CareerMode /> : <Navigate to="/auth" replace />} />
        <Route path="/wealth" element={user ? <WealthMode /> : <Navigate to="/auth" replace />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </NavigationTracker>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <SecurityProvider>
          <AssistantProfileProvider>
            <FocusProtectionProvider>
              <AssistantMemoryProvider>
                <GlobalPriorityProvider>
                  <UCTMilestoneProvider>
                    <TooltipProvider>
                      <Toaster />
                      <Sonner />
                      <BrowserRouter>
                        <AppRoutes />
                      </BrowserRouter>
                    </TooltipProvider>
                  </UCTMilestoneProvider>
                </GlobalPriorityProvider>
              </AssistantMemoryProvider>
            </FocusProtectionProvider>
          </AssistantProfileProvider>
        </SecurityProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;
