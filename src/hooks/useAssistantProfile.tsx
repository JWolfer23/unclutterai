import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from "@/components/ui/sonner";
import { useState, useEffect, useCallback } from 'react';

// Safety timeout - never block Assistant UI
const PROFILE_TIMEOUT_MS = 2000;

// Analyst mode is locked - cannot self-escalate
const ANALYST_MODE_LOCKED = true;

// Type definitions
export type AssistantRole = 'analyst' | 'operator';
export type DecisionStyle = 'decide_for_me' | 'suggest' | 'ask';
export type InterruptionPreference = 'minimal' | 'time_sensitive' | 'balanced';
export type TonePreference = 'minimal' | 'calm' | 'analytical';

export interface AllowedActions {
  draft_replies: boolean;
  schedule_items: boolean;
  archive_items: boolean;
  auto_handle_low_risk: boolean;
}

export interface TrustBoundaries {
  send_messages: boolean;
  schedule_meetings: boolean;
  delete_content: boolean;
}

export interface AssistantProfile {
  userId: string;
  role: AssistantRole;
  authorityLevel: number;
  allowedActions: AllowedActions;
  trustBoundaries: TrustBoundaries;
  decisionStyle: DecisionStyle;
  interruptionPreference: InterruptionPreference;
  tonePreference: TonePreference;
  createdAt: string;
  updatedAt: string;
}

export interface AssistantProfileUpdate {
  role?: AssistantRole;
  authority_level?: number;
  allowed_actions?: Partial<AllowedActions>;
  trust_boundaries?: Partial<TrustBoundaries>;
  decision_style?: DecisionStyle;
  interruption_preference?: InterruptionPreference;
  tone_preference?: TonePreference;
}

// Default profile values
const DEFAULT_ALLOWED_ACTIONS: AllowedActions = {
  draft_replies: false,
  schedule_items: false,
  archive_items: false,
  auto_handle_low_risk: false,
};

const DEFAULT_TRUST_BOUNDARIES: TrustBoundaries = {
  send_messages: true,
  schedule_meetings: true,
  delete_content: true,
};

// Helper to convert DB row to AssistantProfile
const mapDbToProfile = (row: any): AssistantProfile => ({
  userId: row.user_id,
  role: row.role as AssistantRole,
  authorityLevel: row.authority_level,
  allowedActions: row.allowed_actions as AllowedActions,
  trustBoundaries: row.trust_boundaries as TrustBoundaries,
  decisionStyle: row.decision_style as DecisionStyle,
  interruptionPreference: row.interruption_preference as InterruptionPreference,
  tonePreference: row.tone_preference as TonePreference,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export interface UseAssistantProfileReturn {
  profile: AssistantProfile | null;
  isLoading: boolean;
  error: Error | null;

  // Permission checks
  canAutoHandle: (actionType: keyof AllowedActions) => boolean;
  requiresConfirmation: (actionType: keyof TrustBoundaries) => boolean;
  shouldInterrupt: (urgencyLevel: 'critical' | 'time_sensitive' | 'informational') => boolean;
  isOperator: () => boolean;

  // Mutations
  updateProfile: (updates: AssistantProfileUpdate) => Promise<void>;
  promoteToOperator: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
  createProfile: (initialData?: Partial<AssistantProfileUpdate>) => Promise<void>;
}

export function useAssistantProfile(): UseAssistantProfileReturn {
  const { user } = useAuth();
  const { authorityLevel: subscriptionAuthority } = useSubscription();
  const queryClient = useQueryClient();
  const [timedOut, setTimedOut] = useState(false);

  // Safety timeout - after 2 seconds, stop blocking and use defaults
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, PROFILE_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, []);

  // Fetch profile
  const { data: profile, isLoading: queryLoading, error } = useQuery({
    queryKey: ['assistant-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('assistant_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found - return null, will be created during onboarding
          return null;
        }
        throw error;
      }

      return mapDbToProfile(data);
    },
    enabled: !!user?.id,
  });

  // After timeout, treat loading as resolved with defaults
  const isLoading = queryLoading && !timedOut;

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: AssistantProfileUpdate) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get current profile to merge allowed_actions and trust_boundaries
      const currentProfile = profile || {
        allowedActions: DEFAULT_ALLOWED_ACTIONS,
        trustBoundaries: DEFAULT_TRUST_BOUNDARIES,
      };

      const updateData: Record<string, any> = {};
      
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.authority_level !== undefined) updateData.authority_level = updates.authority_level;
      if (updates.decision_style !== undefined) updateData.decision_style = updates.decision_style;
      if (updates.interruption_preference !== undefined) updateData.interruption_preference = updates.interruption_preference;
      if (updates.tone_preference !== undefined) updateData.tone_preference = updates.tone_preference;

      if (updates.allowed_actions) {
        updateData.allowed_actions = {
          ...currentProfile.allowedActions,
          ...updates.allowed_actions,
        };
      }

      if (updates.trust_boundaries) {
        updateData.trust_boundaries = {
          ...currentProfile.trustBoundaries,
          ...updates.trust_boundaries,
        };
      }

      const { error } = await supabase
        .from('assistant_profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistant-profile', user?.id] });
    },
    onError: (error) => {
      console.error('Failed to update assistant profile:', error);
      toast.error('Failed to update assistant settings');
    },
  });

  // Create profile mutation
  const createMutation = useMutation({
    mutationFn: async (initialData?: Partial<AssistantProfileUpdate>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const profileData = {
        user_id: user.id,
        role: initialData?.role || 'analyst',
        authority_level: initialData?.authority_level || 0,
        allowed_actions: {
          ...DEFAULT_ALLOWED_ACTIONS,
          ...initialData?.allowed_actions,
        },
        trust_boundaries: {
          ...DEFAULT_TRUST_BOUNDARIES,
          ...initialData?.trust_boundaries,
        },
        decision_style: initialData?.decision_style || 'ask',
        interruption_preference: initialData?.interruption_preference || 'balanced',
        tone_preference: initialData?.tone_preference || 'calm',
      };

      const { error } = await supabase
        .from('assistant_profiles')
        .upsert(profileData, { onConflict: 'user_id' });

      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['assistant-profile', user?.id] });
      // Trigger assistant setup mission completion
      if (user?.id) {
        try {
          await supabase.rpc('complete_onboarding_mission', {
            p_user_id: user.id,
            p_mission_id: 'assistant_setup',
            p_uct_reward: 10,
          });
          queryClient.invalidateQueries({ queryKey: ['onboarding-missions'] });
          queryClient.invalidateQueries({ queryKey: ['uct-balance'] });
        } catch (e) {
          console.error('Failed to complete assistant_setup mission:', e);
        }
      }
    },
    onError: (error) => {
      console.error('Failed to create assistant profile:', error);
    },
  });

  // Permission checks
  const canAutoHandle = (actionType: keyof AllowedActions): boolean => {
    if (!profile) return false;
    return profile.allowedActions[actionType] === true;
  };

  const requiresConfirmation = (actionType: keyof TrustBoundaries): boolean => {
    if (!profile) return true; // Default to requiring confirmation
    return profile.trustBoundaries[actionType] === true;
  };

  const shouldInterrupt = (urgencyLevel: 'critical' | 'time_sensitive' | 'informational'): boolean => {
    if (!profile) return urgencyLevel === 'critical'; // Default: only critical

    switch (profile.interruptionPreference) {
      case 'minimal':
        return urgencyLevel === 'critical';
      case 'time_sensitive':
        return urgencyLevel === 'critical' || urgencyLevel === 'time_sensitive';
      case 'balanced':
      default:
        return true;
    }
  };

  const isOperator = (): boolean => {
    if (!profile) return false;
    return profile.role === 'operator';
  };

  // Promote to operator with reduced confirmations
  // BLOCKED: Analyst mode cannot self-escalate
  const promoteToOperator = async (): Promise<void> => {
    // Analyst mode is locked - cannot self-promote
    if (ANALYST_MODE_LOCKED) {
      console.log('[Assistant] Analyst mode cannot self-escalate to Operator');
      toast.error('Analyst mode cannot escalate itself. Promotion requires external action.');
      return;
    }
    
    await updateMutation.mutateAsync({
      role: 'operator',
      authority_level: Math.max(profile?.authorityLevel || 0, 2),
      // Enable all auto-handling
      allowed_actions: {
        draft_replies: true,
        schedule_items: true,
        archive_items: true,
        auto_handle_low_risk: true,
      },
      // Reduce confirmations - auto-send/schedule without confirmation
      trust_boundaries: {
        send_messages: false,      // Auto-send drafts without confirmation
        schedule_meetings: false,  // Auto-schedule without confirmation
        delete_content: true,      // Still require confirmation for deletion
      },
      // Update decision style
      decision_style: 'decide_for_me',
    });
  };

  // Reset to defaults
  const resetToDefaults = async (): Promise<void> => {
    await updateMutation.mutateAsync({
      role: 'analyst',
      authority_level: 0,
      allowed_actions: DEFAULT_ALLOWED_ACTIONS,
      trust_boundaries: DEFAULT_TRUST_BOUNDARIES,
      decision_style: 'ask',
      interruption_preference: 'balanced',
      tone_preference: 'calm',
    });
    toast.success('Assistant settings reset to defaults');
  };

  return {
    profile,
    isLoading,
    error: error as Error | null,

    // Permission checks
    canAutoHandle,
    requiresConfirmation,
    shouldInterrupt,
    isOperator,

    // Mutations
    updateProfile: updateMutation.mutateAsync,
    promoteToOperator,
    resetToDefaults,
    createProfile: createMutation.mutateAsync,
  };
}
