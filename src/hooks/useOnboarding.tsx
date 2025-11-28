
import { useState, useEffect, useRef } from "react";
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
const ONBOARDING_SHOWN_KEY = "onboarding-shown-this-session";
const RE_PROMPT_DELAY = 24 * 60 * 60 * 1000; // 24 hours

export const useOnboarding = () => {
  const { user } = useAuth();
  const hasProcessedRef = useRef(false);
  
  const [state, setState] = useState<OnboardingState>(() => {
    const saved = localStorage.getItem(ONBOARDING_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // If onboarding was completed, ensure showOnboarding is false
      if (parsed.onboardingCompleted) {
        return { ...parsed, showOnboarding: false };
      }
      return parsed;
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
        // Clear onboarding state and session flag when user logs out
        hasProcessedRef.current = false;
        sessionStorage.removeItem(ONBOARDING_SHOWN_KEY);
        setState(prev => ({
          ...prev,
          isFirstTime: true,
          showOnboarding: false,
          onboardingCompleted: false,
          connectedPlatforms: []
        }));
        return;
      }

      // Only process once per user session
      if (hasProcessedRef.current) return;
      hasProcessedRef.current = true;

      // Check both session flag and localStorage state
      const hasShownOnboarding = sessionStorage.getItem(ONBOARDING_SHOWN_KEY);
      const savedState = localStorage.getItem(ONBOARDING_KEY);
      const parsedState = savedState ? JSON.parse(savedState) : null;

      // Only show onboarding if:
      // 1. Session flag is missing AND
      // 2. Onboarding was never completed (according to localStorage)
      if (!hasShownOnboarding && !parsedState?.onboardingCompleted) {
        setState(prev => ({
          ...prev,
          onboardingCompleted: false,
          showOnboarding: true,
          isFirstTime: true
        }));
      } else if (hasShownOnboarding || parsedState?.onboardingCompleted) {
        // Ensure showOnboarding is false if onboarding was completed
        setState(prev => ({
          ...prev,
          showOnboarding: false
        }));
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

    // Mark onboarding as shown for this session
    sessionStorage.setItem(ONBOARDING_SHOWN_KEY, 'true');
    
    // Clear the session storage flag
    sessionStorage.removeItem('hasSeenModes');

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
