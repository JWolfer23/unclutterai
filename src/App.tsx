
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import EmailSetup from "./pages/EmailSetup";
import CryptoIntegration from "./pages/CryptoIntegration";
import NotFound from "./pages/NotFound";
import AuthPage from "./components/auth/AuthPage";
import PasswordReset from "./pages/PasswordReset";
import { useAuth } from "@/hooks/useAuth";
import { SecurityProvider } from "@/components/SecurityProvider";

const queryClient = new QueryClient();

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SecurityProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
              <Route path="/reset" element={<PasswordReset />} />
              <Route path="/" element={user ? <Index /> : <Navigate to="/auth" replace />} />
              <Route path="/email-setup" element={user ? <EmailSetup /> : <Navigate to="/auth" replace />} />
              <Route path="/crypto-integration" element={user ? <CryptoIntegration /> : <Navigate to="/auth" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SecurityProvider>
    </QueryClientProvider>
  );
};

export default App;
