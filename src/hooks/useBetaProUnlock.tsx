import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAssistantProfile } from './useAssistantProfile';
import { toast } from './use-toast';
import { PRO_UNLOCK_UCT } from '@/lib/onboardingMissions';

/**
 * Beta Pro Unlock System
 * 
 * When user earns 40 UCT:
 * - Unlock Pro for 30 days automatically
 * - Promote assistant role to Operator
 * - Reduce confirmation friction subtly
 * 
 * Do not prompt for payment during beta.
 */

export interface BetaProStatus {
  isUnlocked: boolean;
  unlockedAt: string | null;
  expiresAt: string | null;
  daysRemaining: number;
}

export function useBetaProUnlock() {
  const { user } = useAuth();
  const { profile, updateProfile } = useAssistantProfile();
  const queryClient = useQueryClient();
  const hasUnlockedRef = useRef(false);

  /**
   * Unlock Pro for 30 days and promote to Operator
   */
  const unlockBetaPro = useCallback(async () => {
    if (!user?.id || hasUnlockedRef.current) return false;
    hasUnlockedRef.current = true;

    try {
      // Get current preferences
      const { data: profileData } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();

      const currentPreferences = (profileData?.preferences as Record<string, unknown>) || {};
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      // Update profile with Pro status
      await supabase
        .from('profiles')
        .update({
          preferences: {
            ...currentPreferences,
            subscription_tier: 'operator',
            subscription_started_at: now.toISOString(),
            beta_pro_unlocked_at: now.toISOString(),
            beta_pro_expires_at: expiresAt.toISOString(),
          },
        })
        .eq('id', user.id);

      // Promote assistant to Operator with reduced friction
      await supabase
        .from('assistant_profiles')
        .update({
          role: 'operator',
          authority_level: 1,
          decision_style: 'suggest', // Start conservative
          allowed_actions: {
            draft_replies: true,
            schedule_items: true,
            archive_items: true,
            auto_handle_low_risk: true, // Reduced friction
          },
          trust_boundaries: {
            send_messages: false, // Still require confirmation for sends
            schedule_meetings: true, // Allow without confirmation
            delete_content: true, // Still require confirmation
            archive_content: true, // Allow without confirmation
          },
        })
        .eq('user_id', user.id);

      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-profile'] });

      return true;
    } catch (error) {
      console.error('Failed to unlock Beta Pro:', error);
      hasUnlockedRef.current = false;
      return false;
    }
  }, [user?.id, queryClient]);

  /**
   * Check if user has earned enough UCT to unlock Pro
   */
  const checkAndUnlockPro = useCallback(async (totalUctEarned: number) => {
    if (totalUctEarned >= PRO_UNLOCK_UCT && !hasUnlockedRef.current) {
      const success = await unlockBetaPro();
      
      if (success) {
        toast({
          title: "You've unlocked your first month of Pro.",
          description: "This is how Operator Mode feels.",
          duration: 6000,
        });
      }
      
      return success;
    }
    return false;
  }, [unlockBetaPro]);

  /**
   * Get current beta pro status
   */
  const getBetaProStatus = useCallback(async (): Promise<BetaProStatus> => {
    if (!user?.id) {
      return { isUnlocked: false, unlockedAt: null, expiresAt: null, daysRemaining: 0 };
    }

    const { data } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .single();

    const preferences = data?.preferences as Record<string, unknown> | null;
    const unlockedAt = preferences?.beta_pro_unlocked_at as string | null;
    const expiresAt = preferences?.beta_pro_expires_at as string | null;

    if (!unlockedAt || !expiresAt) {
      return { isUnlocked: false, unlockedAt: null, expiresAt: null, daysRemaining: 0 };
    }

    const now = new Date();
    const expiry = new Date(expiresAt);
    const isUnlocked = expiry > now;
    const daysRemaining = isUnlocked 
      ? Math.ceil((expiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      : 0;

    return {
      isUnlocked,
      unlockedAt,
      expiresAt,
      daysRemaining,
    };
  }, [user?.id]);

  return {
    unlockBetaPro,
    checkAndUnlockPro,
    getBetaProStatus,
    isOperator: profile?.role === 'operator',
  };
}
