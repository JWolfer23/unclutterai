import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ClaimResult {
  success: boolean;
  amount_claimed: number;
  tx_hash: string;
  wallet_address: string;
  network: string;
  explorer_url: string;
  new_balance: number;
  new_pending: number;
  new_claimed: number;
  message: string;
}

interface ClaimHistoryItem {
  id: string;
  amount: number;
  wallet_address: string;
  tx_hash: string | null;
  status: string;
  network: string;
  created_at: string;
}

interface TokenBalances {
  balance: number;
  tokens_pending: number;
  tokens_claimed: number;
}

export const useClaimUCT = () => {
  const queryClient = useQueryClient();

  // Fetch current token balances
  const { data: tokenBalances, isLoading: balancesLoading } = useQuery({
    queryKey: ['token-balances'],
    queryFn: async (): Promise<TokenBalances> => {
      const { data, error } = await supabase
        .from('tokens')
        .select('balance, tokens_pending, tokens_claimed')
        .maybeSingle();
      
      if (error) throw error;
      return {
        balance: data?.balance ?? 0,
        tokens_pending: data?.tokens_pending ?? 0,
        tokens_claimed: data?.tokens_claimed ?? 0
      };
    },
  });

  // Fetch claim history
  const { data: claimHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['uct-claim-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('uct_claim_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as ClaimHistoryItem[];
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
      await queryClient.cancelQueries({ queryKey: ['token-balances'] });
      await queryClient.cancelQueries({ queryKey: ['tokens'] });
      
      // Snapshot current value
      const previousBalances = queryClient.getQueryData<TokenBalances>(['token-balances']);
      
      // Optimistic update: move balance to pending
      if (previousBalances && previousBalances.balance > 0) {
        queryClient.setQueryData<TokenBalances>(['token-balances'], {
          balance: 0,
          tokens_pending: (previousBalances.tokens_pending || 0) + previousBalances.balance,
          tokens_claimed: previousBalances.tokens_claimed || 0
        });
      }
      
      return { previousBalances };
    },
    onSuccess: (data) => {
      // Update with actual server response
      queryClient.setQueryData<TokenBalances>(['token-balances'], {
        balance: data.new_balance,
        tokens_pending: data.new_pending,
        tokens_claimed: data.new_claimed
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      queryClient.invalidateQueries({ queryKey: ['uct-claim-history'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-profile'] });
      
      toast({
        title: "🎉 Transaction Sent!",
        description: `${data.amount_claimed} UCT sent to your wallet`,
      });
    },
    onError: (error: Error, _, context) => {
      // Rollback optimistic update
      if (context?.previousBalances) {
        queryClient.setQueryData<TokenBalances>(['token-balances'], context.previousBalances);
      }
      
      toast({
        title: "Claim Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const canClaim = (tokenBalances?.balance ?? 0) > 0 && 
                   (tokenBalances?.tokens_pending ?? 0) === 0 &&
                   !claimMutation.isPending;

  return {
    // Balances
    balance: tokenBalances?.balance ?? 0,
    tokensPending: tokenBalances?.tokens_pending ?? 0,
    tokensClaimed: tokenBalances?.tokens_claimed ?? 0,
    balancesLoading,
    
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
