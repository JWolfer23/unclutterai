import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useEffect } from 'react';

export const usePrivyWallet = () => {
  const queryClient = useQueryClient();
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();

  // Get the embedded wallet (created by Privy)
  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
  const walletAddress = embeddedWallet?.address || user?.wallet?.address;

  // Fetch wallet info from database
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['wallet-profile'],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_address, wallet_provider')
        .eq('id', authUser.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Save wallet to database
  const saveWallet = useMutation({
    mutationFn: async ({ address, provider }: { address: string; provider: string }) => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          wallet_address: address,
          wallet_provider: provider 
        })
        .eq('id', authUser.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-profile'] });
      toast({
        title: "🔗 Wallet Connected",
        description: "Your wallet has been linked to your account",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save wallet: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Disconnect wallet (clears local session but keeps DB wallet address for future claims)
  const disconnectWallet = useMutation({
    mutationFn: async () => {
      // Only logout from Privy - DO NOT clear wallet_address from profiles
      // The wallet address is kept for future UCT claims and re-connections
      await logout();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-profile'] });
      toast({
        title: "🔌 Session Disconnected",
        description: "Wallet session ended. Your wallet address is saved for future use.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to disconnect: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Auto-save wallet when Privy connects
  useEffect(() => {
    if (authenticated && walletAddress && !profile?.wallet_address) {
      saveWallet.mutate({ 
        address: walletAddress, 
        provider: 'privy' 
      });
    }
  }, [authenticated, walletAddress, profile?.wallet_address]);

  const connectWallet = async () => {
    try {
      login();
    } catch (error) {
      console.error('Privy login error:', error);
      toast({
        title: "Connection Failed",
        description: "Unable to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    // State
    walletAddress: profile?.wallet_address || walletAddress,
    walletProvider: profile?.wallet_provider || 'privy',
    isConnected: !!profile?.wallet_address || (authenticated && !!walletAddress),
    isLoading: !ready || profileLoading,
    
    // Actions
    connectWallet,
    disconnectWallet: disconnectWallet.mutate,
    
    // Loading states
    isConnecting: !ready,
    isDisconnecting: disconnectWallet.isPending,
    isSaving: saveWallet.isPending,
  };
};
