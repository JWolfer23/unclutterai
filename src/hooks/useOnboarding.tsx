
import { useState, useEffect } from "react";

interface OnboardingState {
  isFirstTime: boolean;
  completedSteps: string[];
  connectedPlatforms: string[];
  showOnboarding: boolean;
  skipCount: number;
  lastSkipTime: number;
}

const ONBOARDING_KEY = "unclutter-onboarding";
const RE_PROMPT_DELAY = 24 * 60 * 60 * 1000; // 24 hours

export const useOnboarding = () => {
  const [state, setState] = useState<OnboardingState>(() => {
    const saved = localStorage.getItem(ONBOARDING_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      isFirstTime: true,
      completedSteps: [],
      connectedPlatforms: [],
      showOnboarding: true,
      skipCount: 0,
      lastSkipTime: 0
    };
  });

  useEffect(() => {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
  }, [state]);

  const completeOnboarding = () => {
    setState(prev => ({
      ...prev,
      isFirstTime: false,
      showOnboarding: false
    }));
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
    isOnboardingComplete: state.connectedPlatforms.length >= 1 && !state.isFirstTime
  };
};
