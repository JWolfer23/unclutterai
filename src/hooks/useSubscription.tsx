import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TierId, PRICING_TIERS, getAuthorityLevel } from '@/lib/pricingTiers';
import { toast } from "@/components/ui/sonner";
import { useState, useEffect } from 'react';

export interface SubscriptionState {
  tier: TierId;
  isLoading: boolean;
  capabilities: string[];
  authorityLevel: number;
  subscriptionStartedAt: string | null;
}

const SUBSCRIPTION_TIMEOUT_MS = 1000;

export function useSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [timedOut, setTimedOut] = useState(false);

  // Timeout fallback - if data hasn't loaded in 1 second, stop blocking
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, SUBSCRIPTION_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, []);

  const { data: subscriptionData, isLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Get tier from preferences JSON
      const preferences = data?.preferences as Record<string, unknown> | null;
      const tier = (preferences?.subscription_tier as TierId) || 'analyst';
      const subscriptionStartedAt = (preferences?.subscription_started_at as string) || null;

      return {
        tier,
        subscriptionStartedAt,
      };
    },
    enabled: !!user?.id,
  });

  const updateTier = useMutation({
    mutationFn: async (newTier: TierId) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get current preferences
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();

      const currentPreferences = (profile?.preferences as Record<string, unknown>) || {};

      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: {
            ...currentPreferences,
            subscription_tier: newTier,
            subscription_started_at: new Date().toISOString(),
          },
        })
        .eq('id', user.id);

      if (error) throw error;

      // Sync authority level to assistant_profiles
      const authorityLevel = getAuthorityLevel(newTier);
      await supabase
        .from('assistant_profiles')
        .update({ authority_level: authorityLevel })
        .eq('user_id', user.id);

      return newTier;
    },
    onSuccess: (tier) => {
      queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['assistant-profile', user?.id] });
      toast.success(`Upgraded to ${PRICING_TIERS[tier].name}`);
    },
    onError: (error) => {
      toast.error('Failed to update subscription');
      console.error('Subscription error:', error);
    },
  });

  // After timeout, treat as resolved with defaults
  const effectivelyLoading = isLoading && !timedOut;
  
  const tier = subscriptionData?.tier || 'analyst';
  const tierConfig = PRICING_TIERS[tier];

  return {
    tier,
    isLoading: effectivelyLoading,
    capabilities: tierConfig.capabilities,
    authorityLevel: getAuthorityLevel(tier),
    subscriptionStartedAt: subscriptionData?.subscriptionStartedAt || null,
    tierConfig,
    updateTier: updateTier.mutate,
    isUpdating: updateTier.isPending,
    canUpgrade: tier !== 'chief_of_staff',
  };
}
