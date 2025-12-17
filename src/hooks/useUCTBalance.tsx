import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UCTBalance {
  available: number;
  pending: number;
  staked: number;
  total_burned: number;
  on_chain: number;
  lifetime_earned: number;
  wallet_address: string | null;
}

export interface OnchainBatch {
  id: string;
  amount: number;
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
  tx_hash: string | null;
  wallet_address: string;
  network: string;
  created_at: string;
  confirmed_at: string | null;
}

export function useUCTBalance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current UCT balance from uct_balances table
  const { data: balance, isLoading: isLoadingBalance, refetch: refetchBalance } = useQuery({
    queryKey: ['uct-balance'],
    queryFn: async (): Promise<UCTBalance | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Query the uct_balances table directly
      const { data: uctBalance, error } = await supabase
        .from('uct_balances')
        .select('balance, pending, staked, total_burned')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching UCT balance:', error);
        return {
          available: 0,
          pending: 0,
          staked: 0,
          total_burned: 0,
          on_chain: 0,
          lifetime_earned: 0,
          wallet_address: null,
        };
      }

      // Get lifetime earned from focus_sessions
      const { data: lifetimeData } = await supabase
        .rpc('get_lifetime_uct', { p_user_id: user.id });

      // Get wallet address from user_wallets
      const { data: walletData } = await supabase
        .from('user_wallets')
        .select('wallet_address')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .maybeSingle();

      return {
        available: uctBalance?.balance || 0,
        pending: uctBalance?.pending || 0,
        staked: (uctBalance as { staked?: number })?.staked || 0,
        total_burned: (uctBalance as { total_burned?: number })?.total_burned || 0,
        on_chain: 0, // Will be tracked via settlement history
        lifetime_earned: lifetimeData || 0,
        wallet_address: walletData?.wallet_address || null,
      };
    },
  });

  // Fetch settlement history using RPC or direct query
  const { data: settlements, isLoading: isLoadingSettlements } = useQuery({
    queryKey: ['uct-settlements'],
    queryFn: async (): Promise<OnchainBatch[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Query via raw SQL since table might not be in types yet
      const { data, error } = await supabase
        .rpc('get_onchain_batches' as never, { p_user_id: user.id } as never);

      if (error) {
        // Fallback: table might not have RPC, return empty
        console.log('Settlements query not available yet');
        return [];
      }
      return (data || []) as OnchainBatch[];
    },
    retry: false,
  });

  // Confirm pending balance (move to available)
  const confirmPendingMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('settle-uct', {
        body: { action: 'confirm_pending' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uct-balance'] });
      toast({
        title: 'Balance confirmed',
        description: 'Your pending UCT has been moved to available balance',
      });
    },
    onError: (error) => {
      toast({
        title: 'Confirmation failed',
        description: error instanceof Error ? error.message : 'Could not confirm balance',
        variant: 'destructive',
      });
    },
  });

  // Request on-chain settlement
  const requestSettlementMutation = useMutation({
    mutationFn: async ({ amount, wallet_address }: { amount?: number; wallet_address?: string }) => {
      const { data, error } = await supabase.functions.invoke('settle-uct', {
        body: { action: 'request_settlement', amount, wallet_address },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['uct-balance'] });
      queryClient.invalidateQueries({ queryKey: ['uct-settlements'] });
      toast({
        title: 'Settlement complete',
        description: `${data.amount} UCT sent to your wallet`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Settlement failed',
        description: error instanceof Error ? error.message : 'Could not process settlement',
        variant: 'destructive',
      });
    },
  });

  // Compute rewards for an event
  const computeRewardsMutation = useMutation({
    mutationFn: async ({ event, ledger_id }: { event: { event_type: string; payload: Record<string, unknown> }; ledger_id?: string }) => {
      const { data, error } = await supabase.functions.invoke('compute-uct-rewards', {
        body: { event, ledger_id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['uct-balance'] });
      if (data.reward?.total_reward > 0) {
        toast({
          title: `+${data.reward.total_reward.toFixed(2)} UCT`,
          description: data.reward.breakdown[0] || 'Reward earned!',
        });
      }
    },
    onError: (error) => {
      console.error('Reward computation failed:', error);
    },
  });

  // Total balance (available + pending)
  const totalBalance = (balance?.available || 0) + (balance?.pending || 0);

  return {
    // Balance data
    balance,
    totalBalance,
    availableBalance: balance?.available || 0,
    pendingBalance: balance?.pending || 0,
    stakedBalance: balance?.staked || 0,
    totalBurned: balance?.total_burned || 0,
    onChainBalance: balance?.on_chain || 0,
    lifetimeEarned: balance?.lifetime_earned || 0,
    
    // Settlement history
    settlements,
    
    // Loading states
    isLoadingBalance,
    isLoadingSettlements,
    
    // Actions
    confirmPending: confirmPendingMutation.mutate,
    isConfirmingPending: confirmPendingMutation.isPending,
    
    requestSettlement: requestSettlementMutation.mutateAsync,
    isSettling: requestSettlementMutation.isPending,
    
    computeRewards: computeRewardsMutation.mutateAsync,
    isComputingRewards: computeRewardsMutation.isPending,
    
    // Refresh
    refetchBalance,
  };
}
