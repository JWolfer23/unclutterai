import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type OnboardingStatus = "loading" | "ready" | "error";

interface OnboardingState {
  isFirstTime: boolean;
  completedSteps: string[];
  connectedPlatforms: string[];
  showOnboarding: boolean;
  skipCount: number;
  lastSkipTime: number;
  onboardingCompleted: boolean;
  status: OnboardingStatus;
}

const ONBOARDING_KEY = "unclutter-onboarding";
const ONBOARDING_SHOWN_KEY = "onboarding-shown-this-session";
const RE_PROMPT_DELAY = 24 * 60 * 60 * 1000; // 24 hours

const DEFAULT_STATE: OnboardingState = {
  isFirstTime: true,
  completedSteps: [],
  connectedPlatforms: [],
  showOnboarding: true,
  skipCount: 0,
  lastSkipTime: 0,
  onboardingCompleted: false,
  status: "loading"  // Start as loading until sync completes
};

// Safe JSON parse helper - never throws
const safeParseJSON = <T,>(json: string | null, fallback: T): T => {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.warn("Failed to parse onboarding state from localStorage:", error);
    return fallback;
  }
};

export const useOnboarding = () => {
  const { user } = useAuth();
  const hasProcessedRef = useRef(false);
  const wasUserLoadedRef = useRef(false);
  
  const [state, setState] = useState<OnboardingState>(() => {
    try {
      const saved = localStorage.getItem(ONBOARDING_KEY);
      const parsed = safeParseJSON<Partial<OnboardingState>>(saved, {});
      
      // Merge with defaults, keep status as loading until sync completes
      const result: OnboardingState = { ...DEFAULT_STATE, ...parsed, status: "loading" };
      
      // If onboarding was completed, ensure showOnboarding is false
      if (result.onboardingCompleted) {
        return { ...result, showOnboarding: false };
      }
      return result;
    } catch (error) {
      console.warn("Error initializing onboarding state:", error);
      // Clear corrupted localStorage and return defaults
      try {
        localStorage.removeItem(ONBOARDING_KEY);
      } catch {}
      return DEFAULT_STATE;
    }
  });

  // Sync with database when user changes
  useEffect(() => {
    const syncWithDatabase = async () => {
      try {
        if (!user) {
          // Check saved onboarding state to avoid resetting on brief null user during navigation
          const parsedState = safeParseJSON<Partial<OnboardingState>>(
            localStorage.getItem(ONBOARDING_KEY),
            {}
          );

          // Only treat this as a real logout if we've previously had a user loaded
          // and onboarding hasn't already been completed
          if (wasUserLoadedRef.current && !parsedState?.onboardingCompleted) {
            hasProcessedRef.current = false;
            try {
              sessionStorage.removeItem(ONBOARDING_SHOWN_KEY);
            } catch {}
            setState(prev => ({
              ...prev,
              isFirstTime: true,
              showOnboarding: false,
              onboardingCompleted: false,
              connectedPlatforms: [],
              status: "ready"
            }));
          } else {
            // Mark as ready even without user (logged out state or completed onboarding)
            setState(prev => ({ ...prev, status: "ready" }));
          }
          return;
        }

        // Mark that we've seen a valid user in this session
        wasUserLoadedRef.current = true;
        // Only process once per user session
        if (hasProcessedRef.current) {
          // Already processed, just mark as ready
          setState(prev => ({ ...prev, status: "ready" }));
          return;
        }
        hasProcessedRef.current = true;

        // Check both session flag and localStorage state
        let hasShownOnboarding = false;
        try {
          hasShownOnboarding = !!sessionStorage.getItem(ONBOARDING_SHOWN_KEY);
        } catch {}
        
        const parsedState = safeParseJSON<Partial<OnboardingState>>(
          localStorage.getItem(ONBOARDING_KEY),
          {}
        );

        // Only show onboarding if:
        // 1. Session flag is missing AND
        // 2. Onboarding was never completed (according to localStorage)
        if (!hasShownOnboarding && !parsedState?.onboardingCompleted) {
          setState(prev => ({
            ...prev,
            onboardingCompleted: false,
            showOnboarding: true,
            isFirstTime: true,
            status: "ready"
          }));
        } else if (hasShownOnboarding || parsedState?.onboardingCompleted) {
          // Ensure showOnboarding is false if onboarding was completed
          setState(prev => ({
            ...prev,
            showOnboarding: false,
            status: "ready"
          }));
        } else {
          // Fallback - just mark as ready
          setState(prev => ({ ...prev, status: "ready" }));
        }
      } catch (error) {
        console.warn("Error syncing onboarding with database:", error);
        // On error, mark as ready with safe defaults so UI can proceed
        setState(prev => ({ ...prev, status: "ready" }));
      }
    };

    syncWithDatabase();
  }, [user?.id]);

  useEffect(() => {
    try {
      // Don't save status to localStorage
      const { status, ...stateWithoutStatus } = state;
      localStorage.setItem(ONBOARDING_KEY, JSON.stringify(stateWithoutStatus));
    } catch (error) {
      console.warn("Error saving onboarding state to localStorage:", error);
    }
  }, [state]);

  const completeOnboarding = async () => {
    setState(prev => ({
      ...prev,
      isFirstTime: false,
      showOnboarding: false,
      onboardingCompleted: true
    }));

    // Mark onboarding as shown for this session
    try {
      sessionStorage.setItem(ONBOARDING_SHOWN_KEY, 'true');
      sessionStorage.removeItem('hasSeenModes');
    } catch {}

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
