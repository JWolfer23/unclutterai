import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Mode multipliers for UCT reward calculation
const MODE_MULTIPLIERS: Record<string, number> = {
  learning: 1.3,
  career: 1.2,
  wealth: 1.1,
  health: 1.0,
  focus: 1.0,
};

// Tier thresholds and bonuses
const TIER_THRESHOLDS = [
  { name: 'platinum', minSessions: 10, bonus: 0.15 },
  { name: 'gold', minSessions: 7, bonus: 0.10 },
  { name: 'silver', minSessions: 5, bonus: 0.05 },
  { name: 'bronze', minSessions: 3, bonus: 0.02 },
  { name: 'none', minSessions: 0, bonus: 0 },
];

export interface RewardCalculation {
  baseReward: number;
  modeBonus: number;
  streakBonus: number;
  tierBonus: number;
  tierName: string;
  totalReward: number;
}

export interface CompleteSessionParams {
  sessionId: string;
  actualMinutes: number;
  mode: string;
  interruptions: number;
}

export const useFocusRewards = () => {
  const queryClient = useQueryClient();

  // Calculate reward based on session parameters
  const calculateReward = async (
    actualMinutes: number,
    mode: string,
    currentStreak: number,
    sessionsThisWeek: number
  ): Promise<RewardCalculation> => {
    // Base reward: duration * 0.05 UCT per minute
    const baseReward = actualMinutes * 0.05;

    // Mode multiplier bonus
    const modeMultiplier = MODE_MULTIPLIERS[mode?.toLowerCase()] || 1.0;
    const modeBonus = baseReward * (modeMultiplier - 1);

    // Streak bonus: duration * (streak * 0.005)
    const streakBonus = actualMinutes * (currentStreak * 0.005);

    // Tier bonus based on weekly consistency
    const tier = TIER_THRESHOLDS.find(t => sessionsThisWeek >= t.minSessions) || TIER_THRESHOLDS[4];
    const subtotal = baseReward + modeBonus + streakBonus;
    const tierBonus = subtotal * tier.bonus;

    const totalReward = subtotal + tierBonus;

    return {
      baseReward: Math.round(baseReward * 100) / 100,
      modeBonus: Math.round(modeBonus * 100) / 100,
      streakBonus: Math.round(streakBonus * 100) / 100,
      tierBonus: Math.round(tierBonus * 100) / 100,
      tierName: tier.name,
      totalReward: Math.round(totalReward * 100) / 100,
    };
  };

  // Complete session with full reward engine
  const completeSessionWithRewards = useMutation({
    mutationFn: async ({ sessionId, actualMinutes, mode, interruptions }: CompleteSessionParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // 1. Get or create streak record
      const { data: streakData } = await supabase
        .from('focus_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      let currentStreak = 1;
      let longestStreak = 1;

      if (streakData) {
        const lastSession = streakData.last_session;
        if (lastSession === today) {
          // Already focused today, keep current streak
          currentStreak = streakData.current_streak || 1;
        } else if (lastSession === yesterday) {
          // Consecutive day, increment streak
          currentStreak = (streakData.current_streak || 0) + 1;
        }
        // Otherwise reset to 1
        longestStreak = Math.max(streakData.longest_streak || 0, currentStreak);
      }

      // 2. Get sessions this week for tier calculation
      const { data: tierData } = await supabase.rpc('get_weekly_tier', { p_user_id: user.id });
      const sessionsThisWeek = tierData?.[0]?.sessions_count || 0;

      // 3. Calculate reward
      const reward = await calculateReward(actualMinutes, mode, currentStreak, sessionsThisWeek);

      // 4. Calculate focus score (100 - penalty for interruptions)
      const focusScore = Math.max(0, Math.min(100, 100 - (interruptions * 10)));

      // 5. Update focus session
      const { error: sessionError } = await supabase
        .from('focus_sessions')
        .update({
          end_time: new Date().toISOString(),
          actual_minutes: actualMinutes,
          interruptions,
          focus_score: focusScore,
          uct_reward: reward.totalReward,
          is_completed: true,
        })
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      // 6. Update or create streak record
      const { error: streakError } = await supabase
        .from('focus_streaks')
        .upsert({
          user_id: user.id,
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_session: today,
        });

      if (streakError) throw streakError;

      // 7. Record reward history
      const { error: historyError } = await supabase
        .from('focus_rewards_history')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          reward_value: reward.baseReward + reward.modeBonus,
          streak_value: reward.streakBonus,
          tier_value: reward.tierBonus,
        });

      if (historyError) console.error('Failed to record reward history:', historyError);

      // 8. Update user wallet
      const { data: walletData } = await supabase
        .from('tokens')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      const currentBalance = walletData?.balance || 0;
      const newBalance = currentBalance + reward.totalReward;

      const { error: walletError } = await supabase
        .from('tokens')
        .upsert({
          user_id: user.id,
          balance: newBalance,
          updated_at: new Date().toISOString(),
        });

      if (walletError) throw walletError;

      return {
        reward,
        newStreak: currentStreak,
        longestStreak,
        focusScore,
        newBalance,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['focus_sessions'] });
      queryClient.invalidateQueries({ queryKey: ['focus_streaks'] });
      queryClient.invalidateQueries({ queryKey: ['focus_stats'] });
      queryClient.invalidateQueries({ queryKey: ['focus_analytics'] });
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });

      const tierMessage = data.reward.tierName !== 'none' 
        ? ` (${data.reward.tierName} tier bonus!)` 
        : '';

      toast({
        title: `🎉 +${data.reward.totalReward.toFixed(2)} UCT Earned!`,
        description: `Focus score: ${data.focusScore}%${tierMessage}. Streak: ${data.newStreak} days.`,
      });
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
