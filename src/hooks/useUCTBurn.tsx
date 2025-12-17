import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BURN_RATES, type BurnRateId, calculateBurnCost } from '@/lib/uctTokenomics';

export interface BurnLogEntry {
  id: string;
  user_id: string;
  amount: number;
  burn_type: string;
  action_context: Record<string, unknown>;
  created_at: string;
}

export interface BurnEstimate {
  burn_type: string;
  estimated_cost: number;
  available_balance: number;
  can_afford: boolean;
  context?: Record<string, unknown>;
}

export function useUCTBurn() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch burn history
  const { data: burnData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['uct-burn-history'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { history: [], total_burned: 0 };

      const { data, error } = await supabase.functions.invoke('uct-burn', {
        body: { action: 'get_history' },
      });

      if (error) throw error;
      return data as { history: BurnLogEntry[]; total_burned: number };
    },
  });

  // Estimate burn cost
  const estimateMutation = useMutation({
    mutationFn: async ({ 
      burnType, 
      context 
    }: { 
      burnType: BurnRateId; 
      context?: { itemCount?: number; hours?: number; baseCost?: number } 
    }): Promise<BurnEstimate> => {
      const { data, error } = await supabase.functions.invoke('uct-burn', {
        body: { action: 'estimate', burn_type: burnType, context },
      });
      if (error) throw error;
      return data as BurnEstimate;
    },
  });

  // Execute burn
  const burnMutation = useMutation({
    mutationFn: async ({ 
      burnType, 
      context 
    }: { 
      burnType: BurnRateId; 
      context?: Record<string, unknown> 
    }) => {
      const { data, error } = await supabase.functions.invoke('uct-burn', {
        body: { action: 'burn', burn_type: burnType, context },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['uct-burn-history'] });
      queryClient.invalidateQueries({ queryKey: ['uct-balance'] });
      toast({
        title: 'Accelerated',
        description: `${data.burned.toFixed(2)} UCT burned for ${data.burn_type.replace(/_/g, ' ')}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Burn Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Local estimate (no network call)
  const getLocalEstimate = (
    burnType: BurnRateId,
    context?: { itemCount?: number; hours?: number }
  ): number => {
    return calculateBurnCost(burnType, context);
  };

  // Get burn rate info
  const getBurnRateInfo = (burnType: BurnRateId) => BURN_RATES[burnType];

  return {
    // History
    burnHistory: burnData?.history || [],
    totalBurned: burnData?.total_burned || 0,
    isLoadingHistory,

    // Estimate
    estimate: estimateMutation.mutateAsync,
    isEstimating: estimateMutation.isPending,
    lastEstimate: estimateMutation.data,

    // Burn
    burn: burnMutation.mutateAsync,
    isBurning: burnMutation.isPending,

    // Helpers
    getLocalEstimate,
    getBurnRateInfo,
  };
}
