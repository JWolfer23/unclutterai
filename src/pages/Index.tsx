
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import AuthPage from "@/components/auth/AuthPage";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "@/pages/Dashboard";
import { useOnboarding } from "@/hooks/useOnboarding";
import { toast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeView, setActiveView] = useState<'overview' | 'inbox' | 'tasks' | 'focus' | 'tokens'>('overview');
  
  const { 
    state: onboardingState, 
    completeOnboarding, 
    connectPlatform,
    isOnboardingComplete 
  } = useOnboarding();

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!user) {
    return <AuthPage />;
  }

  const handleConnect = (platform: string) => {
    connectPlatform(platform);
    toast({
      title: "🎉 Connected!",
      description: `${platform} is now connected and ready to use.`,
    });
  };

  // Show onboarding for first-time users
  if (onboardingState.showOnboarding && !isOnboardingComplete) {
    return (
      <OnboardingFlow 
        onComplete={completeOnboarding}
        onConnect={handleConnect}
      />
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1">
          {/* Header with sidebar trigger */}
          <header className="h-16 border-b border-border flex items-center px-6">
            <SidebarTrigger />
            <h1 className="ml-4 text-xl font-semibold">UnclutterAI</h1>
          </header>
          
          <Dashboard activeView={activeView} />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
