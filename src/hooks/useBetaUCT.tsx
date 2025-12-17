import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  UCTLevel, 
  getUCTLevel, 
  getUCTEffects, 
  getNextLevelInfo,
  UCT_LEVEL_NAMES,
  UCT_LEVEL_COLORS,
} from '@/lib/uctBetaRules';

export interface BetaUCTData {
  balance: number;
  level: UCTLevel;
  levelName: string;
  levelColor: string;
  confirmationReduction: number;
  resolutionSpeedBoost: number;
  skipScheduleConfirm: boolean;
  skipSendConfirm: boolean;
  nextLevel: UCTLevel | null;
  tokensToNextLevel: number;
}

export interface UseBetaUCTReturn {
  data: BetaUCTData | null;
  isLoading: boolean;
  error: Error | null;
  addUCT: (amount: number, source: string) => Promise<void>;
  refetch: () => void;
}

export function useBetaUCT(): UseBetaUCTReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch balance from tokens table
  const { data: balance, isLoading, error, refetch } = useQuery({
    queryKey: ['beta-uct-balance', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { data, error } = await supabase
        .from('tokens')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return 0; // No row found
        throw error;
      }

      return data?.balance || 0;
    },
    enabled: !!user?.id,
  });

  // Add UCT mutation
  const addUCTMutation = useMutation({
    mutationFn: async ({ amount, source }: { amount: number; source: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get current balance
      const { data: current } = await supabase
        .from('tokens')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      const currentBalance = current?.balance || 0;
      const newBalance = currentBalance + amount;

      // Upsert to handle case where no row exists
      const { error } = await supabase
        .from('tokens')
        .upsert({
          user_id: user.id,
          balance: newBalance,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;

      // Log to focus_ledger for tracking
      await supabase.from('focus_ledger').insert({
        user_id: user.id,
        event_type: 'uct_earned',
        uct_reward: amount,
        payload: { source },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beta-uct-balance', user?.id] });
    },
  });

  const addUCT = useCallback(async (amount: number, source: string) => {
    await addUCTMutation.mutateAsync({ amount, source });
  }, [addUCTMutation]);

  // Compute derived data
  const computedData: BetaUCTData | null = balance !== undefined ? (() => {
    const currentBalance = balance || 0;
    const level = getUCTLevel(currentBalance);
    const effects = getUCTEffects(level);
    const nextInfo = getNextLevelInfo(currentBalance);

    return {
      balance: currentBalance,
      level,
      levelName: UCT_LEVEL_NAMES[level],
      levelColor: UCT_LEVEL_COLORS[level],
      confirmationReduction: effects.confirmationReduction,
      resolutionSpeedBoost: effects.resolutionSpeedBoost,
      skipScheduleConfirm: effects.skipScheduleConfirm,
      skipSendConfirm: effects.skipSendConfirm,
      nextLevel: nextInfo.nextLevel,
      tokensToNextLevel: nextInfo.remaining,
    };
  })() : null;

  return {
    data: computedData,
    isLoading,
    error: error as Error | null,
    addUCT,
    refetch,
  };
}
