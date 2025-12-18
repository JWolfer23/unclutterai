import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import AuthPage from "@/components/auth/AuthPage";
import { useEffect } from "react";

// =============================================================================
// TEMPORARY DEBUG MODE: All post-auth hooks disabled to isolate crash
// =============================================================================
// Once login works with this minimal version, re-enable hooks ONE AT A TIME:
// 1. useOnboarding
// 2. useAssistantPromotion (chains to useAssistantProfile → useSubscription)
// 3. toast calls
// 4. AssistantPromotionFlow component
// =============================================================================

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const onboarding = useOnboarding();

  useEffect(() => {
    if (user) {
      console.log("onboarding", onboarding);
    }
  }, [user, onboarding]);

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
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
          <p className="text-gray-300">Initializing...</p>
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
  // MINIMAL PLACEHOLDER - Login confirmed working if you see this screen
  // =============================================================================
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-green-400">✓ Login Successful</h1>
        <p className="text-gray-300">Logged in as: <span className="text-white font-mono">{user.email}</span></p>
        <p className="text-gray-500 text-sm mt-8">
          All post-auth hooks disabled. If you see this, auth works.
        </p>
        <p className="text-gray-600 text-xs">
          Next: Re-enable hooks one at a time in Index.tsx
        </p>
      </div>
    </div>
  );
};

export default Index;
