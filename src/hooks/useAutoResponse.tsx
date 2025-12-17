import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

export interface AutoReplyDraft {
  subject: string;
  body: string;
  tone: 'polite' | 'firm' | 'casual' | 'professional';
  confidence: number;
}

export interface AutoSendResult {
  eligible: boolean;
  reason: string;
  sent: boolean;
}

export interface AutoResponseResult {
  success: boolean;
  draft: AutoReplyDraft;
  word_count: number;
  uct_fee: number;
  auto_send: AutoSendResult;
}

export interface SenderTrust {
  id: string;
  sender_email: string;
  trust_level: number;
  interaction_count: number;
  open_count: number;
  reply_count: number;
  is_vip: boolean;
  auto_send_allowed: boolean;
  last_interaction: string | null;
}

interface DraftReplyInput {
  message_id: string;
  desired_action: 'request_more_time' | 'decline' | 'confirm' | 'clarify' | 'short_ack';
  auto_send?: boolean;
  constraints?: {
    max_words?: number;
    tone?: 'polite' | 'firm' | 'casual' | 'professional';
  };
}

export function useAutoResponse() {
  const queryClient = useQueryClient();

  // Fetch sender trust levels
  const { data: senderTrusts, isLoading: isLoadingTrusts } = useQuery({
    queryKey: ['sender-trusts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('sender_trust')
        .select('*')
        .eq('user_id', user.id)
        .order('trust_level', { ascending: false });

      if (error) throw error;
      return data as SenderTrust[];
    },
  });

  // Fetch auto-send logs
  const { data: autoSendLogs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['auto-send-logs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('auto_send_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  // Draft reply mutation
  const draftReplyMutation = useMutation({
    mutationFn: async (input: DraftReplyInput): Promise<AutoResponseResult> => {
      const { data, error } = await supabase.functions.invoke('auto-response', {
        body: input,
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to generate reply');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-usage'] });
      if (data.auto_send?.sent) {
        toast.success(`Reply auto-sent! (${data.uct_fee} UCT)`);
        queryClient.invalidateQueries({ queryKey: ['tokens'] });
        queryClient.invalidateQueries({ queryKey: ['auto-send-logs'] });
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate reply: ${error.message}`);
    },
  });

  // Update sender trust
  const updateTrustMutation = useMutation({
    mutationFn: async ({ 
      sender_email, 
      updates 
    }: { 
      sender_email: string; 
      updates: Partial<Pick<SenderTrust, 'trust_level' | 'is_vip' | 'auto_send_allowed'>> 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upsert sender trust
      const { error } = await supabase
        .from('sender_trust')
        .upsert({
          user_id: user.id,
          sender_email,
          ...updates,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,sender_email',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sender-trusts'] });
      toast.success('Sender trust updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update trust: ${error.message}`);
    },
  });

  // Get trust level for a specific sender
  const getSenderTrust = (email: string): SenderTrust | undefined => {
    return senderTrusts?.find(t => t.sender_email === email);
  };

  // Calculate trust level from interaction stats
  const calculateTrustLevel = (stats: {
    interaction_count: number;
    open_count: number;
    reply_count: number;
    is_vip: boolean;
  }): number => {
    if (stats.interaction_count === 0) return 0.5;

    const openRate = stats.open_count / stats.interaction_count;
    const replyRate = stats.reply_count / stats.interaction_count;
    const vipBonus = stats.is_vip ? 0.3 : 0;

    // Trust formula
    const trust = (replyRate * 0.3) + (openRate * 0.2) + vipBonus + 0.2;
    return Math.min(1, Math.max(0, trust));
  };

  // Record interaction (message received/opened/replied)
  const recordInteraction = async (
    senderEmail: string, 
    type: 'received' | 'opened' | 'replied'
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get current stats
    const { data: current } = await supabase
      .from('sender_trust')
      .select('*')
      .eq('user_id', user.id)
      .eq('sender_email', senderEmail)
      .single();

    const stats = {
      interaction_count: (current?.interaction_count || 0) + (type === 'received' ? 1 : 0),
      open_count: (current?.open_count || 0) + (type === 'opened' ? 1 : 0),
      reply_count: (current?.reply_count || 0) + (type === 'replied' ? 1 : 0),
      is_vip: current?.is_vip || false,
    };

    const newTrust = calculateTrustLevel(stats);

    await supabase
      .from('sender_trust')
      .upsert({
        user_id: user.id,
        sender_email: senderEmail,
        ...stats,
        trust_level: newTrust,
        last_interaction: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,sender_email',
      });

    queryClient.invalidateQueries({ queryKey: ['sender-trusts'] });
  };

  return {
    // Draft and send
    draftReply: draftReplyMutation.mutateAsync,
    isDrafting: draftReplyMutation.isPending,
    draftResult: draftReplyMutation.data,

    // Sender trust management
    senderTrusts,
    isLoadingTrusts,
    getSenderTrust,
    updateSenderTrust: updateTrustMutation.mutate,
    toggleVip: (email: string, isVip: boolean) => 
      updateTrustMutation.mutate({ sender_email: email, updates: { is_vip: isVip } }),
    toggleAutoSend: (email: string, allowed: boolean) =>
      updateTrustMutation.mutate({ sender_email: email, updates: { auto_send_allowed: allowed } }),
    setTrustLevel: (email: string, level: number) =>
      updateTrustMutation.mutate({ sender_email: email, updates: { trust_level: level } }),

    // Interaction tracking
    recordInteraction,

    // Logs
    autoSendLogs,
    isLoadingLogs,
  };
}
