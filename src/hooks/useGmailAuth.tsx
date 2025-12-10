import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface EmailCredential {
  id: string;
  provider: string;
  email_address: string;
  is_active: boolean;
  last_sync_at: string | null;
  sync_error: string | null;
}

export function useGmailAuth() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<EmailCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Fetch connected Gmail accounts
  const fetchCredentials = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('email_credentials')
      .select('id, provider, email_address, is_active, last_sync_at, sync_error')
      .eq('user_id', user.id)
      .eq('provider', 'gmail');

    if (!error && data) {
      setCredentials(data);
    }
  }, [user]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  // Poll localStorage for OAuth result (COOP workaround for popup communication)
  useEffect(() => {
    const checkOAuthResult = () => {
      const result = localStorage.getItem('gmail-oauth-result');
      if (result) {
        try {
          const data = JSON.parse(result);
          // Only process recent results (within 30 seconds)
          if (Date.now() - data.timestamp < 30000) {
            if (data.type === 'success') {
              toast.success(`Gmail connected: ${data.email}`);
              fetchCredentials();
              // Trigger initial sync
              syncNow();
            } else if (data.type === 'error') {
              toast.error(`Gmail connection failed: ${data.error}`);
            }
          }
        } catch (e) {
          console.error('Error parsing OAuth result:', e);
        }
        localStorage.removeItem('gmail-oauth-result');
      }
    };

    // Poll every 500ms for OAuth result
    const pollInterval = setInterval(checkOAuthResult, 500);
    
    return () => clearInterval(pollInterval);
  }, [fetchCredentials]);

  // Start OAuth flow
  const connectGmail = async () => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired, please sign in again');
        return;
      }

      const response = await supabase.functions.invoke('gmail-oauth-start', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { authUrl } = response.data;
      
      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        authUrl,
        'Gmail OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (error) {
      console.error('Gmail connect error:', error);
      toast.error('Failed to start Gmail connection');
    } finally {
      setLoading(false);
    }
  };

  // Disconnect Gmail
  const disconnectGmail = async (credentialId: string) => {
    if (!user) return;

    try {
      // We mark as inactive rather than delete to preserve any synced messages
      const { error } = await supabase
        .from('email_credentials')
        .delete()
        .eq('id', credentialId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Gmail disconnected');
      fetchCredentials();
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect Gmail');
    }
  };

  // Sync emails
  const syncNow = async () => {
    if (!user) return;

    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired');
        return;
      }

      const response = await supabase.functions.invoke('gmail-sync', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { synced } = response.data;
      toast.success(`Synced ${synced} new emails`);
      fetchCredentials();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync emails');
    } finally {
      setSyncing(false);
    }
  };

  // Re-analyze messages
  const reAnalyze = async (messageIds: string[]) => {
    if (!user || messageIds.length === 0) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired');
        return;
      }

      const response = await supabase.functions.invoke('score-message', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { message_ids: messageIds },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success(`Re-analyzed ${messageIds.length} message(s)`);
      return response.data.results;
    } catch (error) {
      console.error('Re-analyze error:', error);
      toast.error('Failed to re-analyze messages');
    }
  };

  const isConnected = credentials.some(c => c.is_active);
  const activeCredential = credentials.find(c => c.is_active);

  return {
    credentials,
    isConnected,
    activeCredential,
    loading,
    syncing,
    connectGmail,
    disconnectGmail,
    syncNow,
    reAnalyze,
    refetch: fetchCredentials,
  };
}
