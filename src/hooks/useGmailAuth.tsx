import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from "@/components/ui/sonner";
import { useQueryClient } from '@tanstack/react-query';
import { useOnboardingMissions } from './useOnboardingMissions';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [credentials, setCredentials] = useState<EmailCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { checkAndCompleteMission } = useOnboardingMissions();

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

  // Sync emails function (defined before useEffect that uses it)
  const syncNow = useCallback(async () => {
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

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      const { synced } = response.data;
      toast.success(`Synced ${synced} new emails`);
      fetchCredentials();
      // Invalidate messages query to refresh the inbox
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    } catch (error: any) {
      console.error('Sync error:', error);
      const message = error?.message || 'Failed to sync emails';
      if (message.includes('Gmail API has not been used') || message.includes('accessNotConfigured')) {
        toast.error('Gmail API not enabled. Please enable it in Google Cloud Console.');
      } else {
        toast.error(message);
      }
    } finally {
      setSyncing(false);
    }
  }, [user, fetchCredentials, queryClient]);

  // Handle OAuth redirect result from URL parameters
  useEffect(() => {
    const oauthStatus = searchParams.get('gmail_oauth');
    
    if (oauthStatus) {
      if (oauthStatus === 'success') {
        const email = searchParams.get('email');
        toast.success(`Gmail connected: ${email || 'successfully'}`);
        fetchCredentials();
        // Trigger connect messaging mission (unified for Gmail/Microsoft)
        checkAndCompleteMission('connect_messaging');
        // Auto-trigger initial sync after connection
        setTimeout(() => syncNow(), 1000);
      } else if (oauthStatus === 'error') {
        const error = searchParams.get('error') || 'Unknown error';
        toast.error(`Gmail connection failed: ${error}`);
      }
      
      // Clear OAuth params from URL
      searchParams.delete('gmail_oauth');
      searchParams.delete('email');
      searchParams.delete('error');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, fetchCredentials, syncNow]);

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
      
      // Redirect directly to OAuth (will redirect back to app after completion)
      window.location.href = authUrl;
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
      const { error } = await supabase
        .from('email_credentials')
        .delete()
        .eq('id', credentialId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchCredentials();
      toast.success('Gmail disconnected');
    } catch (error: any) {
      console.error('Disconnect error:', error);
      toast.error(error?.message || 'Failed to disconnect Gmail');
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
      // Invalidate messages to refresh with new scores
      queryClient.invalidateQueries({ queryKey: ['messages'] });
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
