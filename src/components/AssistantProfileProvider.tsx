import React, { createContext, useContext, useEffect } from 'react';
import { useAssistantProfile, UseAssistantProfileReturn } from '@/hooks/useAssistantProfile';
import { useAuth } from '@/hooks/useAuth';

const AssistantProfileContext = createContext<UseAssistantProfileReturn | null>(null);

interface AssistantProfileProviderProps {
  children: React.ReactNode;
}

export function AssistantProfileProvider({ children }: AssistantProfileProviderProps) {
  const { user } = useAuth();
  const assistantProfile = useAssistantProfile();

  // Auto-create profile if user exists but profile doesn't
  useEffect(() => {
    if (user && !assistantProfile.isLoading && !assistantProfile.profile) {
      // Profile will be created during onboarding, but create a default if somehow missing
      // This is a safety net - onboarding should handle creation
    }
  }, [user, assistantProfile.isLoading, assistantProfile.profile]);

  return (
    <AssistantProfileContext.Provider value={assistantProfile}>
      {children}
    </AssistantProfileContext.Provider>
  );
}

// Hook to use assistant profile context
export function useAssistant(): UseAssistantProfileReturn {
  const context = useContext(AssistantProfileContext);
  
  if (!context) {
    throw new Error('useAssistant must be used within an AssistantProfileProvider');
  }
  
  return context;
}

// Export types for convenience
export type { 
  AssistantProfile, 
  AssistantRole, 
  DecisionStyle, 
  InterruptionPreference, 
  TonePreference,
  AllowedActions,
  TrustBoundaries,
} from '@/hooks/useAssistantProfile';
