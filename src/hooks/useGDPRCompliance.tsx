import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExportData {
  export_date: string;
  user_id: string;
  email: string;
  profile: Record<string, unknown>;
  messages: unknown[];
  focus_sessions: unknown[];
  [key: string]: unknown;
}

export function useGDPRCompliance() {
  const { toast } = useToast();

  // Export all user data
  const exportMutation = useMutation({
    mutationFn: async (): Promise<ExportData> => {
      const { data, error } = await supabase.functions.invoke('gdpr-compliance', {
        body: { action: 'export' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `unclutter-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Data exported',
        description: 'Your data has been downloaded as a JSON file.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Could not export data',
        variant: 'destructive',
      });
    },
  });

  // Delete account and all data
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('gdpr-compliance', {
        body: { action: 'delete', confirmation: 'DELETE_MY_ACCOUNT' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      toast({
        title: 'Account deleted',
        description: 'Your account and all data have been permanently deleted.',
      });
      // Sign out after deletion
      await supabase.auth.signOut();
      window.location.href = '/auth';
    },
    onError: (error) => {
      toast({
        title: 'Deletion failed',
        description: error instanceof Error ? error.message : 'Could not delete account',
        variant: 'destructive',
      });
    },
  });

  // Anonymize data but keep account
  const anonymizeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('gdpr-compliance', {
        body: { action: 'anonymize' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Data anonymized',
        description: 'Your personal information has been removed from historical data.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Anonymization failed',
        description: error instanceof Error ? error.message : 'Could not anonymize data',
        variant: 'destructive',
      });
    },
  });

  return {
    exportData: exportMutation.mutate,
    isExporting: exportMutation.isPending,
    
    deleteAccount: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    
    anonymizeData: anonymizeMutation.mutate,
    isAnonymizing: anonymizeMutation.isPending,
  };
}
