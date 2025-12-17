import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { STAKE_TIERS, type StakeTierId } from '@/lib/uctTokenomics';

export interface UCTStake {
  id: string;
  user_id: string;
  amount: number;
  stake_tier: string;
  capability: string;
  status: 'active' | 'unstaking' | 'unstaked' | 'revoked';
  created_at: string;
  revoked_at: string | null;
  revoked_reason: string | null;
  unlocks_at: string | null;
}

export interface StakeState {
  stakes: UCTStake[];
  activeStakes: UCTStake[];
  capabilities: string[];
  totalStaked: number;
  autonomyLevel: number;
}

export function useUCTStake() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch stakes
  const { data: stakeState, isLoading, refetch } = useQuery({
    queryKey: ['uct-stakes'],
    queryFn: async (): Promise<StakeState> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { stakes: [], activeStakes: [], capabilities: [], totalStaked: 0, autonomyLevel: 0 };
      }

      const { data, error } = await supabase.functions.invoke('uct-stake', {
        body: { action: 'get_stakes' },
      });

      if (error) throw error;
      return data as StakeState;
    },
  });

  // Stake UCT
  const stakeMutation = useMutation({
    mutationFn: async (tierId: StakeTierId) => {
      const { data, error } = await supabase.functions.invoke('uct-stake', {
        body: { action: 'stake', tier_id: tierId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['uct-stakes'] });
      queryClient.invalidateQueries({ queryKey: ['uct-balance'] });
      toast({
        title: 'Trust Delegated',
        description: `You've unlocked: ${data.capability.replace(/_/g, ' ')}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Stake Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Request unstake
  const unstakeRequestMutation = useMutation({
    mutationFn: async (stakeId: string) => {
      const { data, error } = await supabase.functions.invoke('uct-stake', {
        body: { action: 'unstake_request', stake_id: stakeId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['uct-stakes'] });
      toast({
        title: 'Unstake Requested',
        description: `UCT will be available on ${new Date(data.unlocks_at).toLocaleDateString()}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Request Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Complete unstake
  const unstakeCompleteMutation = useMutation({
    mutationFn: async (stakeId: string) => {
      const { data, error } = await supabase.functions.invoke('uct-stake', {
        body: { action: 'unstake_complete', stake_id: stakeId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['uct-stakes'] });
      queryClient.invalidateQueries({ queryKey: ['uct-balance'] });
      toast({
        title: 'UCT Returned',
        description: `${data.returned} UCT returned to your balance`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Unstake Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Check if user has a capability
  const hasCapability = (capability: string): boolean => {
    return stakeState?.capabilities.includes(capability) || false;
  };

  // Check if user can auto-execute an action
  const canAutoExecute = (requiredCapability: string): boolean => {
    return hasCapability(requiredCapability) || hasCapability('full_autonomy');
  };

  // Get tier info
  const getTierInfo = (tierId: StakeTierId) => STAKE_TIERS[tierId];

  return {
    // State
    stakes: stakeState?.stakes || [],
    activeStakes: stakeState?.activeStakes || [],
    capabilities: stakeState?.capabilities || [],
    totalStaked: stakeState?.totalStaked || 0,
    autonomyLevel: stakeState?.autonomyLevel || 0,
    isLoading,

    // Actions
    stake: stakeMutation.mutate,
    isStaking: stakeMutation.isPending,

    requestUnstake: unstakeRequestMutation.mutate,
    isRequestingUnstake: unstakeRequestMutation.isPending,

    completeUnstake: unstakeCompleteMutation.mutate,
    isCompletingUnstake: unstakeCompleteMutation.isPending,

    // Helpers
    hasCapability,
    canAutoExecute,
    getTierInfo,
    refetch,
  };
}
