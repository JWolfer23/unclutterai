import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useAssistantProfile } from "@/hooks/useAssistantProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useNextBestAction, type NextBestAction } from "@/hooks/useNextBestAction";
import { useMorningMode } from "@/hooks/useMorningMode";
import AuthPage from "@/components/auth/AuthPage";
import { OnboardingInterview } from "@/components/onboarding/interview/OnboardingInterview";
import { MorningModeOverlay, type MorningModeExitAction } from "@/components/morning-mode";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const onboarding = useOnboarding();
  const { profile: assistantProfile, isLoading: profileLoading } = useAssistantProfile();
  const { tier, isLoading: subscriptionLoading } = useSubscription();
  const { nextBestAction } = useNextBestAction();
  
  // Morning Mode - auto-triggers on first app open per day
  const morningMode = useMorningMode();

  // Handle Morning Mode exit with navigation
  const handleMorningModeComplete = useCallback((action: MorningModeExitAction) => {
    morningMode.completeMorningMode();
    
    switch (action) {
      case 'focus':
        navigate('/focus');
        break;
      case 'unclutter':
        navigate('/unclutter');
        break;
      case 'defer':
        // Stay on dashboard - user chose "later today"
        break;
    }
  }, [morningMode, navigate]);

  // Subscription is non-blocking - default to analyst tier if unavailable
  const subscriptionTier = (!subscriptionLoading && tier) ? tier : "analyst";

  // Safe primitive for display - never throws
  const assistantName = assistantProfile?.role ?? "Assistant";

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Loading user…</p>
        </div>
      </div>
    );
  }

  // Show loading spinner while onboarding state initializes
  if (onboarding.state.status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Loading onboarding…</p>
        </div>
      </div>
    );
  }

  // Handle onboarding error state gracefully
  if (onboarding.state.status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-yellow-400 mb-2">Unable to load preferences</p>
          <p className="text-gray-400 text-sm">Continuing with defaults...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!user) {
    return <AuthPage />;
  }

  // =============================================================================
  // CONDITIONAL RENDERING BASED ON ONBOARDING STATE
  // =============================================================================
  
  // If onboarding is complete, check for Morning Mode
  if (onboarding.state.onboardingCompleted) {
    // Show loading only while profile data loads (subscription is non-blocking)
    if (profileLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400 text-sm">Loading stats…</p>
          </div>
        </div>
      );
    }

    // Morning Mode overlay - auto-triggers on first app open per calendar day
    if (morningMode.isActive) {
      return (
        <MorningModeOverlay
          focusStreak={morningMode.focusStreak}
          priorities={morningMode.priorities}
          isLoading={morningMode.isLoading}
          onComplete={handleMorningModeComplete}
        />
      );
    }

    return (
      <Dashboard 
        assistantName={assistantName} 
        subscriptionTier={subscriptionTier}
        nextBestAction={nextBestAction}
      />
    );
  }

  // Onboarding not complete - show OnboardingInterview with defensive guard
  // Only render if onboarding state is fully ready (status === "ready")
  if (onboarding.state.status === "ready") {
    return (
      <OnboardingInterview 
        onComplete={() => {
          onboarding.completeOnboarding();
        }} 
      />
    );
  }

  // Fallback placeholder if somehow we get here (should not happen)
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-green-400">✓ Login Successful</h1>
        <p className="text-gray-300">Logged in as: <span className="text-white font-mono">{user.email}</span></p>
        <p className="text-gray-500 text-sm mt-8">
          Preparing onboarding...
        </p>
      </div>
    </div>
  );
};

export default Index;
