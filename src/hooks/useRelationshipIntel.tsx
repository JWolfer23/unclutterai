import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type RelationshipType = 'family' | 'client' | 'vendor' | 'newsletter' | 'acquaintance' | 'drainer' | 'unknown';

export interface RelationshipIntelResult {
  relationship: RelationshipType;
  importance: number;
  notes: string[];
  confidence: number;
  signals: {
    is_vip_match: boolean;
    domain_match: string;
    frequency: string;
    money_keywords: boolean;
    sentiment_history: string;
  };
}

export interface SenderRelationship {
  sender_email: string;
  relationship_type: RelationshipType;
  relationship_importance: number;
  relationship_notes: string[];
  trust_level: number;
  is_vip: boolean;
  last_analyzed_at: string | null;
}

export function useRelationshipIntel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch all sender relationships for current user
  const { data: relationships, isLoading: isLoadingRelationships } = useQuery({
    queryKey: ['sender-relationships'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('sender_trust')
        .select('sender_email, relationship_type, relationship_importance, relationship_notes, trust_level, is_vip, last_analyzed_at')
        .eq('user_id', user.id);

      if (error) throw error;
      return (data || []) as SenderRelationship[];
    },
  });

  // Analyze a single sender's relationship
  const analyzeRelationshipMutation = useMutation({
    mutationFn: async (senderEmail: string): Promise<RelationshipIntelResult> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Fetch conversation history for this sender (last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data: messages } = await supabase
        .from('messages')
        .select('subject, received_at, sender_email')
        .eq('sender_email', senderEmail)
        .gte('received_at', ninetyDaysAgo.toISOString())
        .order('received_at', { ascending: false })
        .limit(50);

      // Fetch VIP contacts
      const { data: vipContacts } = await supabase
        .from('sender_trust')
        .select('sender_email')
        .eq('is_vip', true);

      const domain = senderEmail.split('@')[1] || '';

      const conversationHistory = messages?.map(m => ({
        subject: m.subject,
        direction: 'received' as const,
        timestamp: m.received_at || '',
      })) || [];

      const { data, error } = await supabase.functions.invoke('ai-blocks', {
        body: {
          action: 'relationship_intel',
          data: {
            sender_email: senderEmail,
            sender_name: senderEmail.split('@')[0],
            conversation_history: conversationHistory,
            vip_contacts: vipContacts?.map(v => v.sender_email) || [],
            domain,
          },
        },
      });

      if (error) throw error;
      return data.result as RelationshipIntelResult;
    },
    onSuccess: async (result, senderEmail) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update sender_trust with relationship data
      await supabase
        .from('sender_trust')
        .upsert({
          user_id: user.id,
          sender_email: senderEmail,
          relationship_type: result.relationship,
          relationship_importance: result.importance,
          relationship_notes: result.notes,
          last_analyzed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,sender_email' });

      queryClient.invalidateQueries({ queryKey: ['sender-relationships'] });
    },
    onError: (error) => {
      console.error('Error analyzing relationship:', error);
      toast({
        title: 'Analysis failed.',
        description: error instanceof Error ? error.message : '',
        variant: 'destructive',
      });
    },
  });

  // Analyze all senders without recent analysis
  const analyzeAllSenders = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get unique senders from messages
      const { data: messages } = await supabase
        .from('messages')
        .select('sender_email')
        .eq('user_id', user.id)
        .not('sender_email', 'is', null);

      const uniqueSenders = [...new Set(messages?.map(m => m.sender_email).filter(Boolean) || [])];

      // Get already analyzed senders (within last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentlyAnalyzed } = await supabase
        .from('sender_trust')
        .select('sender_email')
        .eq('user_id', user.id)
        .gte('last_analyzed_at', sevenDaysAgo.toISOString());

      const analyzedEmails = new Set(recentlyAnalyzed?.map(r => r.sender_email) || []);
      const sendersToAnalyze = uniqueSenders.filter(email => email && !analyzedEmails.has(email)).slice(0, 20);

      // Analyze in batches
      for (const email of sendersToAnalyze) {
        await analyzeRelationshipMutation.mutateAsync(email);
      }

      toast({
        title: 'Analysis complete.',
        description: `${sendersToAnalyze.length} relationships processed.`,
      });
    } catch (error) {
      console.error('Error analyzing all senders:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzeRelationshipMutation, toast]);

  // Get relationship for a specific sender
  const getRelationship = useCallback((email: string): SenderRelationship | null => {
    return relationships?.find(r => r.sender_email === email) || null;
  }, [relationships]);

  // Manually set relationship type
  const setRelationshipTypeMutation = useMutation({
    mutationFn: async ({ email, type, importance }: { email: string; type: RelationshipType; importance?: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('sender_trust')
        .upsert({
          user_id: user.id,
          sender_email: email,
          relationship_type: type,
          relationship_importance: importance ?? 5,
          relationship_notes: ['Manually set by user'],
          last_analyzed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,sender_email' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sender-relationships'] });
      toast({
        title: 'Updated.',
        description: '',
      });
    },
  });

  return {
    // Data
    relationships,
    isLoadingRelationships,
    
    // Single analysis
    analyzeRelationship: analyzeRelationshipMutation.mutateAsync,
    isAnalyzingRelationship: analyzeRelationshipMutation.isPending,
    
    // Batch analysis
    analyzeAllSenders,
    isAnalyzingAll: isAnalyzing,
    
    // Lookup
    getRelationship,
    
    // Manual override
    setRelationshipType: setRelationshipTypeMutation.mutate,
    isSettingType: setRelationshipTypeMutation.isPending,
  };
}

// Relationship type config for UI
export const RELATIONSHIP_CONFIG: Record<RelationshipType, { icon: string; color: string; label: string }> = {
  family: { icon: '👨‍👩‍👧', color: 'text-pink-400', label: 'Family' },
  client: { icon: '💼', color: 'text-blue-400', label: 'Client' },
  vendor: { icon: '🏢', color: 'text-slate-400', label: 'Vendor' },
  newsletter: { icon: '📰', color: 'text-slate-500', label: 'Newsletter' },
  acquaintance: { icon: '👋', color: 'text-teal-400', label: 'Acquaintance' },
  drainer: { icon: '🔋', color: 'text-red-400', label: 'Drainer' },
  unknown: { icon: '❓', color: 'text-slate-500', label: 'Unknown' },
};
