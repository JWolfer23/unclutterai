import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Mode multipliers for UCT reward calculation (updated per new spec)
const MODE_MULTIPLIERS: Record<string, number> = {
  deep_work: 1.5,
  catch_up: 1.25,
  learning: 1.3,
  career: 1.2,
  wealth: 1.1,
  health: 1.0,
  focus: 1.0,
};

export interface RewardCalculation {
  baseReward: number;
  modeMultiplier: number;
  interruptionPenalty: number;
  totalReward: number;
}

export interface CompleteSessionParams {
  sessionId: string;
  actualMinutes: number;
  mode: string;
  interruptions: number;
}

// Duration-based tiered base reward (per spec)
function getBaseReward(durationMinutes: number): number {
  if (durationMinutes >= 60) return 2.0;
  if (durationMinutes >= 30) return 1.0;
  if (durationMinutes >= 15) return 0.5;
  if (durationMinutes >= 5) return 0.25;
  return 0; // Under 5 minutes = no reward
}

export const useFocusRewards = () => {
  const queryClient = useQueryClient();

  // Calculate reward based on session parameters (NEW tiered formula)
  const calculateReward = (
    actualMinutes: number,
    mode: string,
    interruptions: number
  ): RewardCalculation => {
    // STEP 2: Tiered base reward
    const baseReward = getBaseReward(actualMinutes);

    // STEP 3: Mode multiplier
    const modeMultiplier = MODE_MULTIPLIERS[mode?.toLowerCase()] || 1.0;

    // STEP 4: Interruption penalty (3+ interruptions = 0.75x)
    const interruptionPenalty = interruptions >= 3 ? 0.75 : 1.0;

    // STEP 5: Final calculation
    const totalReward = Math.round(baseReward * modeMultiplier * interruptionPenalty * 100) / 100;

    return {
      baseReward: Math.round(baseReward * 100) / 100,
      modeMultiplier,
      interruptionPenalty,
      totalReward,
    };
  };

  // Complete session via edge function (server-side handles all logic)
  const completeSessionWithRewards = useMutation({
    mutationFn: async ({ sessionId, actualMinutes, mode, interruptions }: CompleteSessionParams) => {
      const { data, error } = await supabase.functions.invoke('focus-session', {
        body: {
          action: 'complete',
          session_id: sessionId,
          actual_minutes: actualMinutes,
          interruptions,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['focus_sessions'] });
      queryClient.invalidateQueries({ queryKey: ['focus_streaks'] });
      queryClient.invalidateQueries({ queryKey: ['focus_stats'] });
      queryClient.invalidateQueries({ queryKey: ['focus_analytics'] });
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['uct-balance'] });

      // Handle "too_short" status
      if (data.status === 'too_short') {
        toast({
          title: "Session too short",
          description: "Sessions must be at least 5 minutes to earn UCT rewards.",
        });
        return;
      }

      // Success toast with reward info
      const tierMessage = data.tier !== 'none' 
        ? ` (${data.tier} tier)` 
        : '';

      toast({
        title: `🎉 +${data.uct_earned?.toFixed(2) || '0.00'} UCT Earned!`,
        description: `Focus score: ${data.focus_score || 0}%${tierMessage}. Streak: ${data.streak?.current_streak || 1} days.`,
      });

      // Show streak bonus toast if milestone achieved
      if (data.streak_bonus) {
        setTimeout(() => {
          toast({
            title: `🔥 ${data.streak_bonus.milestone_days}-Day Streak Bonus!`,
            description: `+${data.streak_bonus.bonus_uct} UCT bonus for your consistency!`,
          });
        }, 1500); // Slight delay so it appears after main toast
      }
    },
    onError: (error) => {
      console.error('Failed to complete session:', error);
      toast({
        title: "Error completing session",
        description: "Your session was recorded but rewards may not have been calculated.",
        variant: "destructive",
      });
    },
  });

  return {
    calculateReward,
    completeSessionWithRewards: completeSessionWithRewards.mutate,
    completeSessionWithRewardsAsync: completeSessionWithRewards.mutateAsync,
    isCompleting: completeSessionWithRewards.isPending,
  };
};
