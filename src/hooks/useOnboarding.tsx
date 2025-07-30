
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface OnboardingState {
  isFirstTime: boolean;
  completedSteps: string[];
  connectedPlatforms: string[];
  showOnboarding: boolean;
  skipCount: number;
  lastSkipTime: number;
  onboardingCompleted: boolean;
}

const ONBOARDING_KEY = "unclutter-onboarding";
const RE_PROMPT_DELAY = 24 * 60 * 60 * 1000; // 24 hours

export const useOnboarding = () => {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState>(() => {
    const saved = localStorage.getItem(ONBOARDING_KEY);
    if (saved) {
      return { ...JSON.parse(saved), onboardingCompleted: false };
    }
    return {
      isFirstTime: true,
      completedSteps: [],
      connectedPlatforms: [],
      showOnboarding: true,
      skipCount: 0,
      lastSkipTime: 0,
      onboardingCompleted: false
    };
  });

  // Sync with database when user changes
  useEffect(() => {
    const syncWithDatabase = async () => {
      if (!user) {
        // Clear onboarding state when user logs out
        setState(prev => ({
          ...prev,
          isFirstTime: true,
          showOnboarding: true,
          onboardingCompleted: false,
          connectedPlatforms: []
        }));
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          const dbCompleted = profile.onboarding_completed;
          
          // If user has completed onboarding in DB but localStorage shows incomplete,
          // prioritize DB state and update localStorage
          if (dbCompleted && !state.onboardingCompleted) {
            setState(prev => ({
              ...prev,
              onboardingCompleted: true,
              showOnboarding: false,
              isFirstTime: false
            }));
          }
          // If it's a fresh user (no onboarding completed), ensure they see onboarding
          else if (!dbCompleted) {
            setState(prev => ({
              ...prev,
              onboardingCompleted: false,
              showOnboarding: true,
              isFirstTime: true
            }));
          }
        }
      } catch (error) {
        console.error('Error syncing onboarding state:', error);
      }
    };

    syncWithDatabase();
  }, [user?.id]);

  useEffect(() => {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
  }, [state]);

  const completeOnboarding = async () => {
    setState(prev => ({
      ...prev,
      isFirstTime: false,
      showOnboarding: false,
      onboardingCompleted: true
    }));

    // Update database
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error updating onboarding completion:', error);
      }
    }
  };

  const connectPlatform = (platform: string) => {
    setState(prev => ({
      ...prev,
      connectedPlatforms: [...prev.connectedPlatforms, platform]
    }));
  };

  const skipOnboarding = () => {
    setState(prev => ({
      ...prev,
      showOnboarding: false,
      skipCount: prev.skipCount + 1,
      lastSkipTime: Date.now()
    }));
  };

  const shouldShowRePrompt = () => {
    const timeSinceLastSkip = Date.now() - state.lastSkipTime;
    return (
      state.skipCount > 0 && 
      timeSinceLastSkip > RE_PROMPT_DELAY &&
      state.connectedPlatforms.length < 2
    );
  };

  const triggerRePrompt = () => {
    if (shouldShowRePrompt()) {
      setState(prev => ({
        ...prev,
        showOnboarding: true
      }));
    }
  };

  const requiresPlatform = (platform: string): boolean => {
    return !state.connectedPlatforms.includes(platform);
  };

  return {
    state,
    completeOnboarding,
    connectPlatform,
    skipOnboarding,
    shouldShowRePrompt,
    triggerRePrompt,
    requiresPlatform,
    isOnboardingComplete: state.onboardingCompleted || (state.connectedPlatforms.length >= 1 && !state.isFirstTime)
  };
};
