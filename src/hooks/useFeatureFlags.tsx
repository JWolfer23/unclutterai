import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FeatureFlag {
  id: string;
  flag_name: string;
  is_enabled: boolean;
  rollout_percentage: number;
  allowed_user_ids: string[];
  description: string | null;
}

// Simple hash function for user ID to percentage
function hashUserToPercentage(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 100);
}

export function useFeatureFlags() {
  const { data: flags, isLoading, refetch } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async (): Promise<FeatureFlag[]> => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*');
      
      if (error) {
        console.error('Error fetching feature flags:', error);
        return [];
      }
      return (data || []) as unknown as FeatureFlag[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const checkFlag = (flagName: string, userId?: string): boolean => {
    const flag = flags?.find(f => f.flag_name === flagName);
    if (!flag) return false;
    if (!flag.is_enabled) return false;
    
    // Check allowed users list first
    if (userId && flag.allowed_user_ids?.includes(userId)) {
      return true;
    }
    
    // Check rollout percentage
    if (flag.rollout_percentage === 100) return true;
    if (flag.rollout_percentage === 0) return false;
    
    if (userId) {
      const userPercentage = hashUserToPercentage(userId);
      return userPercentage < flag.rollout_percentage;
    }
    
    return flag.rollout_percentage > 50; // Default for anonymous
  };

  const getFlag = (flagName: string): FeatureFlag | undefined => {
    return flags?.find(f => f.flag_name === flagName);
  };

  return {
    flags,
    isLoading,
    checkFlag,
    getFlag,
    refetch,
    // Convenience methods for common flags
    isUctEnabled: (userId?: string) => checkFlag('uct_tokenization', userId),
    isAutoSendEnabled: (userId?: string) => checkFlag('auto_send', userId),
    isAutoMintingEnabled: (userId?: string) => checkFlag('auto_minting', userId),
    isAgentMarketplaceEnabled: (userId?: string) => checkFlag('agent_marketplace', userId),
    isInstantCatchupEnabled: (userId?: string) => checkFlag('instant_catchup', userId),
    isSmartStreamEnabled: (userId?: string) => checkFlag('smart_stream', userId),
    isGmailSyncEnabled: (userId?: string) => checkFlag('gmail_sync', userId),
    isNewsModeEnabled: (userId?: string) => checkFlag('news_mode', userId),
  };
}
