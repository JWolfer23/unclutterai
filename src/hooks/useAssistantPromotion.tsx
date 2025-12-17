import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAssistantProfile } from '@/hooks/useAssistantProfile';

const PROMOTION_SHOWN_KEY = 'assistant_promotion_shown';

interface PromotionCriteria {
  unclutterCycles: { current: number; required: number; met: boolean };
  morningBriefUses: { current: number; required: number; met: boolean };
  decisionPredictability: { percentage: number; required: number; met: boolean };
  trustThreshold: { hasUCT: boolean; isPro: boolean; met: boolean };
}

interface PromotionEligibility {
  isEligible: boolean;
  criteria: PromotionCriteria;
  assistantMode: 'analyst' | 'operator';
  promotionShown: boolean;
  isLoading: boolean;
}

export function useAssistantPromotion() {
  const { user } = useAuth();
  const { profile, promoteToOperator, isOperator } = useAssistantProfile();
  const [eligibility, setEligibility] = useState<PromotionEligibility>({
    isEligible: false,
    criteria: {
      unclutterCycles: { current: 0, required: 3, met: false },
      morningBriefUses: { current: 0, required: 5, met: false },
      decisionPredictability: { percentage: 0, required: 70, met: false },
      trustThreshold: { hasUCT: false, isPro: false, met: false },
    },
    assistantMode: 'analyst',
    promotionShown: false,
    isLoading: true,
  });

  const checkEligibility = useCallback(async () => {
    if (!user?.id) {
      setEligibility(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // Check if promotion was already shown
      const promotionShown = localStorage.getItem(`${PROMOTION_SHOWN_KEY}_${user.id}`) === 'true';

      // Get assistant mode from profile
      const assistantMode = profile?.role || 'analyst';

      // Count unclutter cycles from focus_ledger
      const { count: unclutterCount } = await supabase
        .from('focus_ledger')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('event_type', 'unclutter_complete');

      // Count morning brief uses
      const { count: morningBriefCount } = await supabase
        .from('focus_ledger')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('event_type', 'morning_brief_complete');

      // Get lifetime UCT from focus sessions
      const { data: uctData } = await supabase.rpc('get_lifetime_uct', { p_user_id: user.id });
      const lifetimeUCT = uctData || 0;

      // Calculate decision predictability from AI feedback
      const { data: feedbackData } = await supabase
        .from('ai_feedback')
        .select('thumbs_up')
        .eq('user_id', user.id)
        .not('thumbs_up', 'is', null);

      let predictability = 0;
      if (feedbackData && feedbackData.length >= 10) {
        const positiveCount = feedbackData.filter(f => f.thumbs_up === true).length;
        predictability = Math.round((positiveCount / feedbackData.length) * 100);
      } else if (feedbackData && feedbackData.length > 0) {
        // Not enough data yet, give partial credit
        predictability = 50;
      }

      // Check for repeated approvals of same action types (≥5 triggers eligibility)
      const { data: approvalPatterns } = await supabase
        .from('ai_feedback')
        .select('ai_block_type')
        .eq('user_id', user.id)
        .eq('thumbs_up', true)
        .in('ai_block_type', [
          'action_approved_archive',
          'action_approved_schedule',
          'action_approved_reply'
        ]);

      // Count approvals by type
      const approvalCounts: Record<string, number> = {};
      approvalPatterns?.forEach(p => {
        approvalCounts[p.ai_block_type] = (approvalCounts[p.ai_block_type] || 0) + 1;
      });
      const hasRepeatedApprovals = Object.values(approvalCounts).some(count => count >= 5);

      const criteria: PromotionCriteria = {
        unclutterCycles: {
          current: unclutterCount || 0,
          required: 3,
          met: (unclutterCount || 0) >= 3,
        },
        morningBriefUses: {
          current: morningBriefCount || 0,
          required: 5,
          met: (morningBriefCount || 0) >= 5,
        },
        decisionPredictability: {
          percentage: predictability,
          required: 70,
          met: predictability >= 70,
        },
        trustThreshold: {
          hasUCT: lifetimeUCT >= 10,
          isPro: false, // Would check subscription status
          met: lifetimeUCT >= 10,
        },
      };

      // Eligible if all criteria met OR has repeated approvals pattern
      const allCriteriaMet = 
        criteria.unclutterCycles.met &&
        criteria.morningBriefUses.met &&
        criteria.decisionPredictability.met &&
        criteria.trustThreshold.met;

      const isEligible = 
        (allCriteriaMet || hasRepeatedApprovals) &&
        !promotionShown &&
        assistantMode === 'analyst';

      setEligibility({
        isEligible,
        criteria,
        assistantMode,
        promotionShown,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error checking promotion eligibility:', error);
      setEligibility(prev => ({ ...prev, isLoading: false }));
    }
  }, [user?.id, profile?.role]);

  useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  const markPromotionShown = useCallback(() => {
    if (user?.id) {
      localStorage.setItem(`${PROMOTION_SHOWN_KEY}_${user.id}`, 'true');
      setEligibility(prev => ({ ...prev, promotionShown: true, isEligible: false }));
    }
  }, [user?.id]);

  const acceptPromotion = useCallback(async () => {
    if (!user?.id) return false;

    try {
      // Use centralized profile promotion
      await promoteToOperator();

      // Log promotion event
      await supabase.from('focus_ledger').insert({
        user_id: user.id,
        event_type: 'assistant_promotion_accepted',
        payload: { previous_mode: 'analyst', new_mode: 'operator' },
      });

      markPromotionShown();
      setEligibility(prev => ({ ...prev, assistantMode: 'operator' }));
      return true;
    } catch (error) {
      console.error('Error accepting promotion:', error);
      return false;
    }
  }, [user?.id, markPromotionShown, promoteToOperator]);

  const declinePromotion = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Log decline event
      await supabase.from('focus_ledger').insert({
        user_id: user.id,
        event_type: 'assistant_promotion_declined',
        payload: { kept_mode: 'analyst' },
      });

      markPromotionShown();
    } catch (error) {
      console.error('Error logging promotion decline:', error);
    }
  }, [user?.id, markPromotionShown]);

  return {
    ...eligibility,
    checkEligibility,
    acceptPromotion,
    declinePromotion,
    markPromotionShown,
  };
}
