import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useWallet = () => {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['wallet-profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_address')
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const connectWallet = useMutation({
    mutationFn: async () => {
      // Mock wallet connection - generate a random wallet address
      const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ wallet_address: mockAddress })
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-profile'] });
      toast({
        title: "🔗 Wallet Connected",
        description: "Mock wallet address generated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to connect wallet: " + error.message,
        variant: "destructive",
      });
    },
  });

  const disconnectWallet = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ wallet_address: null })
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-profile'] });
      toast({
        title: "🔌 Wallet Disconnected",
        description: "Wallet address removed",
      });
    },
  });

  return {
    walletAddress: profile?.wallet_address,
    isConnected: !!profile?.wallet_address,
    isLoading,
    connectWallet: connectWallet.mutate,
    disconnectWallet: disconnectWallet.mutate,
    isConnecting: connectWallet.isPending,
    isDisconnecting: disconnectWallet.isPending,
  };
};