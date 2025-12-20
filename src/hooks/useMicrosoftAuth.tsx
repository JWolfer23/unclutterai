import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useOnboardingMissions } from '@/hooks/useOnboardingMissions';

interface MicrosoftCredential {
  id: string;
  provider: string;
  email_address: string;
  is_active: boolean;
  last_sync_at: string | null;
  sync_error: string | null;
  token_expires_at: string | null;
  created_at: string;
}

interface RefreshResult {
  success: boolean;
  revoked?: boolean;
  error?: string;
  expiresAt?: string;
}

export const useMicrosoftAuth = () => {
  const { user } = useAuth();
  const { checkAndCompleteMission } = useOnboardingMissions();
  const [credentials, setCredentials] = useState<MicrosoftCredential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const missionAwardedRef = useRef(false);

  // Fetch Microsoft credentials
  const fetchCredentials = useCallback(async () => {
    if (!user) {
      setCredentials([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('email_credentials')
        .select('id, provider, email_address, is_active, last_sync_at, sync_error, token_expires_at, created_at')
        .eq('user_id', user.id)
        .eq('provider', 'microsoft');

      if (error) {
        console.error('Error fetching Microsoft credentials:', error);
        return;
      }

      const creds = data || [];
      setCredentials(creds);
      
      // Check if any credential needs reconnection
      const hasInactiveCredential = creds.some(c => !c.is_active && c.sync_error);
      setNeedsReconnect(hasInactiveCredential);
    } catch (err) {
      console.error('Failed to fetch Microsoft credentials:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Check if token is expired or about to expire (within 5 minutes)
  const isTokenExpired = useCallback((credential: MicrosoftCredential): boolean => {
    if (!credential.token_expires_at) return true;
    const expiresAt = new Date(credential.token_expires_at);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    return expiresAt <= fiveMinutesFromNow;
  }, []);

  // Refresh token for a specific credential
  const refreshToken = useCallback(async (credentialId: string): Promise<RefreshResult> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsRefreshing(true);
    try {
      const response = await supabase.functions.invoke('microsoft-token-refresh', {
        body: { credentialId },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to refresh token');
      }

      const result = response.data as RefreshResult;

      if (result.revoked) {
        setNeedsReconnect(true);
        toast({
          title: "Microsoft Account Disconnected",
          description: "Your Microsoft account access has been revoked. Please reconnect.",
          variant: "destructive",
        });
        // Refresh credentials to get updated state
        await fetchCredentials();
        return result;
      }

      if (!result.success) {
        throw new Error(result.error || 'Token refresh failed');
      }

      // Refresh credentials to get updated expiration
      await fetchCredentials();
      return result;
    } catch (err) {
      console.error('Failed to refresh Microsoft token:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Token refresh failed' 
      };
    } finally {
      setIsRefreshing(false);
    }
  }, [user, fetchCredentials]);

  // Auto-refresh tokens that are about to expire
  const ensureValidToken = useCallback(async (credentialId: string): Promise<boolean> => {
    const credential = credentials.find(c => c.id === credentialId);
    if (!credential) return false;

    if (!credential.is_active) {
      setNeedsReconnect(true);
      return false;
    }

    if (isTokenExpired(credential)) {
      console.log('Token expired or expiring soon, refreshing...');
      const result = await refreshToken(credentialId);
      return result.success;
    }

    return true;
  }, [credentials, isTokenExpired, refreshToken]);

  // Handle OAuth redirect results
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const microsoftConnected = urlParams.get('microsoft_connected');
    const microsoftEmail = urlParams.get('microsoft_email');
    const microsoftError = urlParams.get('microsoft_error');
    const microsoftErrorDescription = urlParams.get('microsoft_error_description');

    if (microsoftConnected === 'true' && microsoftEmail) {
      setNeedsReconnect(false);
      
      // Award UCT for first Microsoft connection
      if (!missionAwardedRef.current) {
        missionAwardedRef.current = true;
        checkAndCompleteMission('connect_microsoft');
        toast({
          title: "Microsoft connected",
          description: "Your assistant has more context now.",
        });
      }
      
      // Clean up URL params
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('microsoft_connected');
      newUrl.searchParams.delete('microsoft_email');
      window.history.replaceState({}, '', newUrl.toString());
      
      // Refresh credentials
      fetchCredentials();
    }

    if (microsoftError) {
      toast({
        title: "Microsoft Connection Failed",
        description: microsoftErrorDescription || `Error: ${microsoftError}`,
        variant: "destructive",
      });
      
      // Clean up URL params
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('microsoft_error');
      newUrl.searchParams.delete('microsoft_error_description');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [fetchCredentials]);

  // Initial fetch
  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  // Start Microsoft OAuth flow
  const connectMicrosoft = async () => {
    if (!user) {
      toast({
        title: "Not Authenticated",
        description: "Please sign in to connect Microsoft",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await supabase.functions.invoke('microsoft-oauth-start', {
        body: { redirectUrl: window.location.origin + window.location.pathname },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to start OAuth flow');
      }

      const { authUrl } = response.data;
      if (authUrl) {
        // Redirect to Microsoft OAuth
        window.location.href = authUrl;
      } else {
        throw new Error('No auth URL returned');
      }
    } catch (err) {
      console.error('Failed to connect Microsoft:', err);
      toast({
        title: "Connection Failed",
        description: err instanceof Error ? err.message : "Failed to start Microsoft OAuth",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  // Disconnect Microsoft account
  const disconnectMicrosoft = async (credentialId: string) => {
    try {
      const { error } = await supabase
        .from('email_credentials')
        .delete()
        .eq('id', credentialId)
        .eq('user_id', user?.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Microsoft Disconnected",
        description: "Your Microsoft account has been disconnected",
      });

      setNeedsReconnect(false);
      // Refresh credentials
      fetchCredentials();
    } catch (err) {
      console.error('Failed to disconnect Microsoft:', err);
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect Microsoft account",
        variant: "destructive",
      });
    }
  };

  // Get active credential
  const activeCredential = credentials.find(c => c.is_active);
  const inactiveCredential = credentials.find(c => !c.is_active);

  // Sync emails from Microsoft
  const syncEmails = useCallback(async (): Promise<{ success: boolean; synced?: number; error?: string }> => {
    if (!user || !activeCredential) {
      return { success: false, error: 'No active Microsoft connection' };
    }

    try {
      const response = await supabase.functions.invoke('microsoft-sync');

      if (response.error) {
        throw new Error(response.error.message || 'Sync failed');
      }

      const result = response.data;

      if (result.needsReconnect) {
        setNeedsReconnect(true);
        await fetchCredentials();
        return { success: false, error: result.error };
      }

      return { success: true, synced: result.synced };
    } catch (err) {
      console.error('Microsoft sync failed:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Sync failed' };
    }
  }, [user, activeCredential, fetchCredentials]);

  return {
    credentials,
    activeCredential,
    inactiveCredential,
    isLoading,
    isConnecting,
    isRefreshing,
    isConnected: credentials.some(c => c.is_active),
    needsReconnect,
    connectMicrosoft,
    disconnectMicrosoft,
    refreshToken,
    ensureValidToken,
    syncEmails,
    refetch: fetchCredentials,
  };
};
