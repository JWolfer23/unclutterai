import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Token = Database['public']['Tables']['tokens']['Row'];

export const useTokens = () => {
  const queryClient = useQueryClient();

  // Fetch user's token balance
  const { data: tokenData, isLoading, error } = useQuery({
    queryKey: ['tokens'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Award tokens for focus sessions (25 tokens per hour)
  const awardFocusTokens = useMutation({
    mutationFn: async (minutes: number) => {
      const tokensEarned = Math.floor((minutes / 60) * 25);
      const currentBalance = tokenData?.balance || 0;
      
      const { data, error } = await supabase
        .from('tokens')
        .update({ 
          balance: currentBalance + tokensEarned,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, tokensEarned };
    },
    onSuccess: ({ tokensEarned }) => {
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      toast({
        title: "🎉 Tokens Earned!",
        description: `You earned ${tokensEarned} UCT tokens for your focus session`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to award tokens: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Award tokens for message summaries (5 tokens per summary)
  const awardSummaryTokens = useMutation({
    mutationFn: async (summaryCount: number) => {
      const tokensEarned = summaryCount * 5;
      const currentBalance = tokenData?.balance || 0;
      
      const { data, error } = await supabase
        .from('tokens')
        .update({ 
          balance: currentBalance + tokensEarned,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, tokensEarned };
    },
    onSuccess: ({ tokensEarned }) => {
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      toast({
        title: "📋 Summary Bonus!",
        description: `You earned ${tokensEarned} UCT tokens for message summaries`,
      });
    },
  });

  // Award tokens directly to wallet (used by focus sessions)
  const awardTokensToWallet = useMutation({
    mutationFn: async (uctReward: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Get current balance
      const { data: existingToken, error: fetchError } = await supabase
        .from('tokens')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      
      // If no wallet exists, create one
      if (!existingToken) {
        const { data, error } = await supabase
          .from('tokens')
          .insert({
            user_id: user.id,
            balance: uctReward,
          })
          .select()
          .single();
        if (error) throw error;
        return { newBalance: uctReward, data };
      }
      
      // Update existing balance
      const newBalance = (existingToken.balance || 0) + uctReward;
      const { data, error } = await supabase
        .from('tokens')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return { newBalance, data };
    },
    onSuccess: ({ newBalance }) => {
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
    },
    onError: (error) => {
      console.error('Error awarding tokens to wallet:', error);
    },
  });

  return {
    tokenData,
    balance: tokenData?.balance || 0,
    isLoading,
    error,
    awardFocusTokens: awardFocusTokens.mutate,
    awardSummaryTokens: awardSummaryTokens.mutate,
    awardTokensToWallet: awardTokensToWallet.mutate,
    isAwarding: awardFocusTokens.isPending || awardSummaryTokens.isPending || awardTokensToWallet.isPending,
  };
};
