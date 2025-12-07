import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ClaimResult {
  success: boolean;
  claim_id: string;
  amount_claimed: number;
  tx_hash: string;
  wallet_address: string;
  network: string;
  explorer_url: string;
  new_balance: number;
  total_claimed: number;
  message: string;
}

interface ClaimRecord {
  id: string;
  amount: number;
  wallet_address: string;
  tx_hash: string | null;
  status: 'pending' | 'completed' | 'failed';
  network: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export const useClaimUCT = () => {
  const queryClient = useQueryClient();

  // Fetch current token balance
  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['token-balance'],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from('tokens')
        .select('balance')
        .maybeSingle();
      
      if (error) throw error;
      return data?.balance ?? 0;
    },
  });

  // Fetch pending claims count
  const { data: pendingClaims } = useQuery({
    queryKey: ['pending-claims'],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from('tokens_claims')
        .select('id')
        .eq('status', 'pending');
      
      if (error) throw error;
      return data?.length ?? 0;
    },
  });

  // Fetch total claimed
  const { data: totalClaimed } = useQuery({
    queryKey: ['total-claimed'],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from('tokens_claims')
        .select('amount')
        .eq('status', 'completed');
      
      if (error) throw error;
      return data?.reduce((sum, c) => sum + c.amount, 0) ?? 0;
    },
  });

  // Fetch claim history
  const { data: claimHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['claim-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tokens_claims')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as ClaimRecord[];
    },
  });

  // Claim UCT mutation with optimistic updates
  const claimMutation = useMutation({
    mutationFn: async (): Promise<ClaimResult> => {
      const { data, error } = await supabase.functions.invoke('claim-uct', {
        body: {}
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data as ClaimResult;
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['token-balance'] });
      await queryClient.cancelQueries({ queryKey: ['pending-claims'] });
      
      // Snapshot current values
      const previousBalance = queryClient.getQueryData<number>(['token-balance']);
      const previousPending = queryClient.getQueryData<number>(['pending-claims']);
      
      // Optimistic update
      if (previousBalance && previousBalance > 0) {
        queryClient.setQueryData(['token-balance'], 0);
        queryClient.setQueryData(['pending-claims'], (previousPending || 0) + 1);
      }
      
      return { previousBalance, previousPending };
    },
    onSuccess: (data) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['token-balance'] });
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      queryClient.invalidateQueries({ queryKey: ['pending-claims'] });
      queryClient.invalidateQueries({ queryKey: ['total-claimed'] });
      queryClient.invalidateQueries({ queryKey: ['claim-history'] });
      
      toast({
        title: "🎉 Transaction Sent!",
        description: `${data.amount_claimed} UCT sent to your wallet`,
      });
    },
    onError: (error: Error, _, context) => {
      // Rollback optimistic update
      if (context?.previousBalance !== undefined) {
        queryClient.setQueryData(['token-balance'], context.previousBalance);
      }
      if (context?.previousPending !== undefined) {
        queryClient.setQueryData(['pending-claims'], context.previousPending);
      }
      
      toast({
        title: "Claim Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const hasPendingClaim = (pendingClaims ?? 0) > 0;
  const canClaim = (balance ?? 0) > 0 && !hasPendingClaim && !claimMutation.isPending;

  return {
    // Balances
    balance: balance ?? 0,
    totalClaimed: totalClaimed ?? 0,
    hasPendingClaim,
    balancesLoading: balanceLoading,
    
    // Claim functionality
    claimUCT: claimMutation.mutate,
    claimUCTAsync: claimMutation.mutateAsync,
    isClaiming: claimMutation.isPending,
    claimResult: claimMutation.data,
    claimError: claimMutation.error,
    canClaim,
    
    // History
    claimHistory,
    historyLoading,
  };
};
