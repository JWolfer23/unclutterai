import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface MicrosoftCredential {
  id: string;
  provider: string;
  email_address: string;
  is_active: boolean;
  last_sync_at: string | null;
  sync_error: string | null;
  created_at: string;
}

export const useMicrosoftAuth = () => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<MicrosoftCredential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

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
        .select('id, provider, email_address, is_active, last_sync_at, sync_error, created_at')
        .eq('user_id', user.id)
        .eq('provider', 'microsoft');

      if (error) {
        console.error('Error fetching Microsoft credentials:', error);
        return;
      }

      setCredentials(data || []);
    } catch (err) {
      console.error('Failed to fetch Microsoft credentials:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Handle OAuth redirect results
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const microsoftConnected = urlParams.get('microsoft_connected');
    const microsoftEmail = urlParams.get('microsoft_email');
    const microsoftError = urlParams.get('microsoft_error');
    const microsoftErrorDescription = urlParams.get('microsoft_error_description');

    if (microsoftConnected === 'true' && microsoftEmail) {
      toast({
        title: "Microsoft Connected",
        description: `Successfully connected ${microsoftEmail}`,
      });
      
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

  return {
    credentials,
    isLoading,
    isConnecting,
    isConnected: credentials.length > 0,
    connectMicrosoft,
    disconnectMicrosoft,
    refetch: fetchCredentials,
  };
};
