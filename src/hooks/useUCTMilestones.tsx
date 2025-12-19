import { useEffect, useRef, useCallback } from 'react';
import { useBetaUCT } from '@/hooks/useBetaUCT';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useQueryClient } from '@tanstack/react-query';

const PRO_UNLOCK_THRESHOLD = 40;
const PRO_UNLOCK_DAYS = 30;

export function useUCTMilestones() {
  const { user } = useAuth();
  const { data: uctData } = useBetaUCT();
  const { tier } = useSubscription();
  const queryClient = useQueryClient();
  const hasCheckedRef = useRef(false);
  const previousBalanceRef = useRef<number | null>(null);

  const unlockPro = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Get current preferences
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();

      const currentPreferences = (profile?.preferences as Record<string, unknown>) || {};
      
      // Check if already unlocked via UCT milestone
      if (currentPreferences.uct_pro_unlocked) return;

      const unlockDate = new Date();
      const expiresAt = new Date(unlockDate.getTime() + PRO_UNLOCK_DAYS * 24 * 60 * 60 * 1000);

      // Update subscription to operator tier with UCT unlock flag
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          preferences: {
            ...currentPreferences,
            subscription_tier: 'operator',
            subscription_started_at: unlockDate.toISOString(),
            uct_pro_unlocked: true,
            uct_pro_unlocked_at: unlockDate.toISOString(),
            uct_pro_expires_at: expiresAt.toISOString(),
          },
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Promote assistant: role → operator, authority_level → 1, reduced confirmations
      const { error: assistantError } = await supabase
        .from('assistant_profiles')
        .update({ 
          role: 'operator',
          authority_level: 1,
          decision_style: 'suggest', // More decisive - suggest instead of ask
          allowed_actions: {
            draft_replies: true,
            schedule_items: true,
            archive_items: true,
            auto_handle_low_risk: false, // Still cautious on full auto
          },
          trust_boundaries: {
            send_messages: false,      // No confirmation needed
            schedule_meetings: false,  // No confirmation needed
            delete_content: true,      // Still confirm deletions
          },
        })
        .eq('user_id', user.id);

      if (assistantError) {
        console.error('Failed to promote assistant:', assistantError);
      }

      // Log to focus_ledger
      await supabase.from('focus_ledger').insert({
        user_id: user.id,
        event_type: 'pro_unlocked',
        payload: {
          milestone: 'first_40_uct',
          expires_at: expiresAt.toISOString(),
          assistant_promoted: true,
        },
      });

      // Invalidate queries so UI updates
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-profile'] });

      // Show earned message - feels achieved, not promotional
      toast.success(
        "You've unlocked your first month of Pro. This is how Operator Mode feels.",
        {
          duration: 8000,
        }
      );
    } catch (error) {
      console.error('Failed to unlock Pro:', error);
    }
  }, [user?.id]);

  // Check milestone when balance changes
  useEffect(() => {
    if (!uctData?.balance || !user?.id) return;

    const currentBalance = uctData.balance;
    const previousBalance = previousBalanceRef.current;

    // Only check if balance actually increased
    if (previousBalance !== null && currentBalance <= previousBalance) {
      previousBalanceRef.current = currentBalance;
      return;
    }

    previousBalanceRef.current = currentBalance;

    // Check if user just crossed the threshold
    const justCrossedThreshold = 
      currentBalance >= PRO_UNLOCK_THRESHOLD && 
      (previousBalance === null || previousBalance < PRO_UNLOCK_THRESHOLD);

    if (justCrossedThreshold && tier === 'analyst' && !hasCheckedRef.current) {
      hasCheckedRef.current = true;
      unlockPro();
    }
  }, [uctData?.balance, tier, user?.id, unlockPro]);

  // Check on initial load if user qualifies but hasn't been unlocked
  useEffect(() => {
    if (!uctData?.balance || !user?.id || hasCheckedRef.current) return;

    const checkInitialUnlock = async () => {
      if (uctData.balance >= PRO_UNLOCK_THRESHOLD && tier === 'analyst') {
        // Check if already unlocked
        const { data } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', user.id)
          .single();

        const prefs = data?.preferences as Record<string, unknown> | null;
        if (!prefs?.uct_pro_unlocked) {
          hasCheckedRef.current = true;
          unlockPro();
        }
      }
    };

    checkInitialUnlock();
  }, [uctData?.balance, tier, user?.id, unlockPro]);

  return {
    threshold: PRO_UNLOCK_THRESHOLD,
    currentBalance: uctData?.balance || 0,
    progressToUnlock: Math.min((uctData?.balance || 0) / PRO_UNLOCK_THRESHOLD * 100, 100),
    hasUnlocked: tier !== 'analyst',
  };
}
