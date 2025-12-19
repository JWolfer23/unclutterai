import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAssistantProfile, UseAssistantProfileReturn } from '@/hooks/useAssistantProfile';
import { useAuth } from '@/hooks/useAuth';

const AssistantProfileContext = createContext<UseAssistantProfileReturn | null>(null);

interface AssistantProfileProviderProps {
  children: React.ReactNode;
}

export function AssistantProfileProvider({ children }: AssistantProfileProviderProps) {
  const { user } = useAuth();
  const assistantProfile = useAssistantProfile();
  const hasCreatedProfile = useRef(false);

  // Auto-create profile on first login if none exists
  useEffect(() => {
    const shouldCreateProfile = 
      user && 
      !assistantProfile.isLoading && 
      !assistantProfile.profile && 
      !hasCreatedProfile.current;

    if (shouldCreateProfile) {
      hasCreatedProfile.current = true;
      
      // Create default analyst profile with safe defaults
      assistantProfile.createProfile({
        role: 'analyst',
        authority_level: 0,
        tone_preference: 'calm',
        decision_style: 'ask',
        interruption_preference: 'balanced',
      }).catch((error) => {
        console.error('[AssistantProfile] Failed to auto-create profile:', error);
        hasCreatedProfile.current = false; // Allow retry on error
      });
    }
  }, [user, assistantProfile.isLoading, assistantProfile.profile, assistantProfile.createProfile]);

  // Reset flag when user logs out
  useEffect(() => {
    if (!user) {
      hasCreatedProfile.current = false;
    }
  }, [user]);

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
