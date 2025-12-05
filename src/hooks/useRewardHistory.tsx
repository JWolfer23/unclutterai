import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RewardHistoryEntry {
  id: string;
  session_id: string;
  user_id: string;
  reward_value: number;
  streak_value: number;
  tier_value: number;
  created_at: string;
}

export const useRewardHistory = (limit: number = 20) => {
  const { data: rewardHistory, isLoading, error } = useQuery({
    queryKey: ['reward_history', limit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('focus_rewards_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as RewardHistoryEntry[];
    },
  });

  // Calculate totals
  const totals = (rewardHistory || []).reduce(
    (acc, entry) => ({
      totalReward: acc.totalReward + Number(entry.reward_value) + Number(entry.streak_value) + Number(entry.tier_value),
      totalBase: acc.totalBase + Number(entry.reward_value),
      totalStreak: acc.totalStreak + Number(entry.streak_value),
      totalTier: acc.totalTier + Number(entry.tier_value),
    }),
    { totalReward: 0, totalBase: 0, totalStreak: 0, totalTier: 0 }
  );

  return {
    rewardHistory: rewardHistory || [],
    totals,
    isLoading,
    error,
  };
};
