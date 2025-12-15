import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useEffect, useRef } from 'react';

// Chain IDs for Base networks
const BASE_SEPOLIA_CHAIN_ID = 84532;
const BASE_MAINNET_CHAIN_ID = 8453;

// Helper to detect wallet type
const getWalletType = (wallet: { walletClientType?: string; connectorType?: string }): string => {
  const clientType = wallet.walletClientType?.toLowerCase() || '';
  const connectorType = wallet.connectorType?.toLowerCase() || '';
  
  if (clientType === 'privy' || connectorType === 'embedded') return 'embedded';
  if (clientType.includes('smart') || connectorType.includes('smart')) return 'smart';
  return 'external';
};

// Helper to get chain name from chain ID
const getChainName = (chainId?: number): string => {
  if (chainId === BASE_SEPOLIA_CHAIN_ID) return 'base-sepolia';
  if (chainId === BASE_MAINNET_CHAIN_ID) return 'base';
  return 'ethereum';
};

export const usePrivyWallet = () => {
  const queryClient = useQueryClient();
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const hasAttemptedCapture = useRef(false);

  // Get the embedded wallet (created by Privy)
  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
  const walletAddress = embeddedWallet?.address || user?.wallet?.address;

  // Fetch wallet info from database (user_wallets table)
  const { data: userWallets, isLoading: walletsLoading } = useQuery({
    queryKey: ['user-wallets'],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return [];

      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', authUser.id);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch wallet profile from profiles table (backward compatibility)
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

  // Fetch UCT balance from uct_balances table
  const { data: uctBalance } = useQuery({
    queryKey: ['uct-balance'],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return null;

      const { data, error } = await supabase
        .from('uct_balances')
        .select('balance, pending')
        .eq('user_id', authUser.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Get primary wallet from user_wallets
  const primaryWallet = userWallets?.find(w => w.is_primary) || userWallets?.[0];

  // Capture smart wallet on login
  const captureWallet = useMutation({
    mutationFn: async ({ 
      address, 
      chain, 
      walletType, 
      provider 
    }: { 
      address: string; 
      chain: string; 
      walletType: string; 
      provider: string;
    }) => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Not authenticated');

      // Validate EVM address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        throw new Error('Invalid wallet address format');
      }

      // Upsert into user_wallets (idempotent)
      const { error: walletError } = await supabase
        .from('user_wallets')
        .upsert({
          user_id: authUser.id,
          wallet_address: address,
          chain,
          wallet_type: walletType,
          wallet_provider: provider,
          is_primary: true,
        }, {
          onConflict: 'user_id,wallet_address',
          ignoreDuplicates: false,
        });
      
      if (walletError) throw walletError;

      // Initialize UCT balance if doesn't exist
      const { error: balanceError } = await supabase
        .from('uct_balances')
        .upsert({
          user_id: authUser.id,
          balance: 0,
          pending: 0,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: true,
        });
      
      if (balanceError) console.warn('Failed to initialize UCT balance:', balanceError);

      // Also update profiles.wallet_address for backward compatibility
      await supabase
        .from('profiles')
        .update({ 
          wallet_address: address,
          wallet_provider: provider,
        })
        .eq('id', authUser.id);

      return { address, chain, walletType };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-wallets'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-profile'] });
      queryClient.invalidateQueries({ queryKey: ['uct-balance'] });
      toast({
        title: "Wallet Connected",
        description: "Your smart wallet has been linked to your account",
      });
    },
    onError: (error) => {
      // Don't block login - just log the error
      console.error('Failed to capture wallet:', error);
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
      hasAttemptedCapture.current = false;
      queryClient.invalidateQueries({ queryKey: ['wallet-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-wallets'] });
      toast({
        title: "Session Disconnected",
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

  // Auto-capture smart wallet when Privy connects
  useEffect(() => {
    // Only run if authenticated, wallet exists, and we haven't already attempted capture
    if (!authenticated || !walletAddress || hasAttemptedCapture.current) return;
    
    // Check if wallet already exists in user_wallets
    const walletAlreadyCaptured = userWallets?.some(
      w => w.wallet_address?.toLowerCase() === walletAddress?.toLowerCase()
    );
    
    if (walletAlreadyCaptured) {
      hasAttemptedCapture.current = true;
      return;
    }

    // Find the best wallet to capture (prefer smart/embedded on Base chain)
    const targetWallet = embeddedWallet || wallets[0];
    if (!targetWallet) return;

    hasAttemptedCapture.current = true;

    // Determine chain - prefer Base Sepolia for testnet
    // Privy chainId can be string or number, normalize to number
    const rawChainId = (targetWallet as unknown as { chainId?: string | number })?.chainId;
    const chainId = typeof rawChainId === 'string' ? parseInt(rawChainId, 10) : rawChainId;
    const chain = getChainName(chainId);
    const walletType = getWalletType(targetWallet);

    captureWallet.mutate({
      address: walletAddress,
      chain,
      walletType,
      provider: 'privy',
    });
  }, [authenticated, walletAddress, userWallets, embeddedWallet, wallets]);

  const connectWallet = async () => {
    try {
      hasAttemptedCapture.current = false;
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

  // Derive wallet address from multiple sources (prefer user_wallets, then profile, then Privy)
  const derivedWalletAddress = primaryWallet?.wallet_address || profile?.wallet_address || walletAddress;

  return {
    // State
    walletAddress: derivedWalletAddress,
    walletProvider: primaryWallet?.wallet_provider || profile?.wallet_provider || 'privy',
    walletChain: primaryWallet?.chain || 'base-sepolia',
    walletType: primaryWallet?.wallet_type || 'embedded',
    isConnected: !!derivedWalletAddress || (authenticated && !!walletAddress),
    isLoading: !ready || profileLoading || walletsLoading,
    
    // Multi-wallet support
    userWallets: userWallets || [],
    primaryWallet,
    
    // UCT Balance
    uctBalance: uctBalance?.balance || 0,
    uctPending: uctBalance?.pending || 0,
    
    // Actions
    connectWallet,
    disconnectWallet: disconnectWallet.mutate,
    
    // Loading states
    isConnecting: !ready,
    isDisconnecting: disconnectWallet.isPending,
    isSaving: captureWallet.isPending,
  };
};
