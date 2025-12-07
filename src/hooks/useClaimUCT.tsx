import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ClaimResult {
  success: boolean;
  amount_claimed: number;
  new_offchain_balance: number;
  onchain_tx_hash: string;
  wallet_address: string;
  network: string;
  explorer_url: string;
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

export const useClaimUCT = () => {
  const queryClient = useQueryClient();

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

  // Claim UCT mutation
  const claimMutation = useMutation({
    mutationFn: async (amount: number): Promise<ClaimResult> => {
      const { data, error } = await supabase.functions.invoke('claim-uct', {
        body: { amount }
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data as ClaimResult;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      queryClient.invalidateQueries({ queryKey: ['uct-claim-history'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-profile'] });
      
      toast({
        title: "🎉 UCT Claimed Successfully!",
        description: `${data.amount_claimed} UCT sent to your wallet`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Claim Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    claimUCT: claimMutation.mutate,
    claimUCTAsync: claimMutation.mutateAsync,
    isClaiming: claimMutation.isPending,
    claimResult: claimMutation.data,
    claimError: claimMutation.error,
    claimHistory,
    historyLoading,
  };
};
