import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface SpamGuardResult {
  is_spam: boolean;
  reason: 'guilt_invoke' | 'pyramid' | 'promo' | 'low_value' | 'phishing' | 'manipulation' | 'safe';
  confidence: number;
  details: string;
  recommended_action: 'archive' | 'quarantine' | 'block' | 'allow';
}

export interface SpamAnalysis {
  isSpam: boolean;
  confidence: number;
  reasons: string[];
  category: 'spam' | 'phishing' | 'low-value' | 'suspicious' | 'safe' | 'guilt_invoke' | 'pyramid' | 'promo' | 'manipulation' | 'low_value';
  aiResult?: SpamGuardResult;
}

interface SenderStats {
  email: string;
  totalReceived: number;
  opened: number;
  replied: number;
  lastEngagement: Date | null;
  isBlocked: boolean;
  isUnsubscribed: boolean;
}

// UCT credit for auto-archiving spam
const SPAM_ARCHIVE_UCT_CREDIT = 0.02;

export const useSpamGuard = () => {
  const queryClient = useQueryClient();
  const [blockedSenders, setBlockedSenders] = useState<string[]>([]);
  const [unsubscribedSenders, setUnsubscribedSenders] = useState<string[]>([]);
  const [senderStats, setSenderStats] = useState<Map<string, SenderStats>>(new Map());
  const [quarantinedMessages, setQuarantinedMessages] = useState<any[]>([]);
  const [archivedForYou, setArchivedForYou] = useState<{ message: any; uctCredit: number }[]>([]);

  // AI-powered spam analysis mutation
  const analyzeWithAIMutation = useMutation({
    mutationFn: async (message: { 
      id?: string;
      body: string; 
      ai_summary?: string; 
      sender_email?: string; 
      sender_name?: string;
    }): Promise<SpamGuardResult> => {
      const senderDomain = message.sender_email?.split('@')[1] || 'unknown';
      
      const { data, error } = await supabase.functions.invoke('ai-blocks', {
        body: {
          action: 'spam_guard',
          data: {
            body: message.body,
            ai_summary: message.ai_summary || '',
            sender_domain: senderDomain,
            sender_name: message.sender_name || 'Unknown',
          },
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'SpamGuard analysis failed');
      
      return data.result as SpamGuardResult;
    },
    onError: (error: Error) => {
      console.error('SpamGuard AI error:', error);
    },
  });

  // Analyze message with AI
  const analyzeMessageWithAI = useCallback(async (message: any): Promise<SpamAnalysis> => {
    try {
      const aiResult = await analyzeWithAIMutation.mutateAsync({
        id: message.id,
        body: message.content || message.body || message.preview || '',
        ai_summary: message.ai_summary,
        sender_email: message.sender_email,
        sender_name: message.sender_name || message.from,
      });

      return {
        isSpam: aiResult.is_spam,
        confidence: aiResult.confidence * 100,
        reasons: [aiResult.details],
        category: aiResult.reason,
        aiResult,
      };
    } catch (error) {
      // Fallback to local analysis
      return analyzeMessage(message);
    }
  }, [analyzeWithAIMutation]);

  // Local/fallback spam detection algorithm
  const analyzeMessage = useCallback((message: any): SpamAnalysis => {
    const reasons: string[] = [];
    let spamScore = 0;

    const subject = (message.subject || '').toLowerCase();
    const preview = (message.preview || message.content || '').toLowerCase();
    const sender = (message.from || message.sender_email || '').toLowerCase();

    // Spam keywords
    const spamKeywords = ['congratulations', 'winner', 'prize', 'urgent', 'act now', 'limited time', 'click here', 'free money', 'nigerian prince'];
    const phishingKeywords = ['verify account', 'suspended', 'click to confirm', 'update payment', 'security alert'];
    const guiltKeywords = ['disappointed', 'after everything', 'i expected', 'you should', 'you must'];
    const pyramidKeywords = ['passive income', 'be your own boss', 'opportunity', 'financial freedom', 'mlm'];
    
    spamKeywords.forEach(keyword => {
      if (subject.includes(keyword) || preview.includes(keyword)) {
        spamScore += 30;
        reasons.push(`Contains spam keyword: "${keyword}"`);
      }
    });

    phishingKeywords.forEach(keyword => {
      if (subject.includes(keyword) || preview.includes(keyword)) {
        spamScore += 40;
        reasons.push(`Potential phishing: "${keyword}"`);
      }
    });

    guiltKeywords.forEach(keyword => {
      if (preview.includes(keyword)) {
        spamScore += 35;
        reasons.push(`Guilt manipulation: "${keyword}"`);
      }
    });

    pyramidKeywords.forEach(keyword => {
      if (preview.includes(keyword)) {
        spamScore += 35;
        reasons.push(`Pyramid/MLM indicator: "${keyword}"`);
      }
    });

    // Check sender engagement
    const stats = senderStats.get(sender);
    if (stats && stats.totalReceived > 5) {
      const engagementRate = (stats.opened + stats.replied * 2) / stats.totalReceived;
      
      if (engagementRate < 0.1) {
        spamScore += 25;
        reasons.push('Low engagement with this sender');
      }

      if (stats.lastEngagement && Date.now() - stats.lastEngagement.getTime() > 90 * 24 * 60 * 60 * 1000) {
        spamScore += 15;
        reasons.push('No recent engagement (90+ days)');
      }
    }

    // Check for blocked/unsubscribed senders
    if (blockedSenders.includes(sender)) {
      spamScore = 100;
      reasons.push('Sender is blocked');
    }

    if (unsubscribedSenders.includes(sender)) {
      spamScore += 50;
      reasons.push('Previously unsubscribed');
    }

    // Determine category
    let category: SpamAnalysis['category'] = 'safe';
    if (spamScore >= 70) category = 'spam';
    else if (spamScore >= 50) category = 'phishing';
    else if (spamScore >= 30) category = 'suspicious';
    else if (spamScore >= 15) category = 'low-value';

    return {
      isSpam: spamScore >= 50,
      confidence: Math.min(spamScore, 100),
      reasons,
      category
    };
  }, [blockedSenders, unsubscribedSenders, senderStats]);

  const blockSender = useCallback((sender: string) => {
    setBlockedSenders(prev => [...prev, sender]);
    toast({
      title: "Sender Blocked",
      description: `Future messages from ${sender} will be automatically blocked.`,
    });
  }, []);

  const unsubscribeSender = useCallback((sender: string) => {
    setUnsubscribedSenders(prev => [...prev, sender]);
    toast({
      title: "Unsubscribed",
      description: `Unsubscribed from ${sender}. Messages will be filtered.`,
    });
  }, []);

  const markAsSafe = useCallback((sender: string) => {
    setBlockedSenders(prev => prev.filter(s => s !== sender));
    setUnsubscribedSenders(prev => prev.filter(s => s !== sender));
    toast({
      title: "Marked as Safe",
      description: `${sender} has been marked as safe and won't be filtered.`,
    });
  }, []);

  const quarantineMessage = useCallback((message: any) => {
    setQuarantinedMessages(prev => [...prev, { ...message, quarantinedAt: new Date() }]);
  }, []);

  // Auto-archive spam and credit UCT
  const autoArchiveSpam = useCallback(async (message: any, spamResult: SpamGuardResult) => {
    if (!spamResult.is_spam) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Update message with spam result and archive it
      await supabase
        .from('messages')
        .update({
          spam_guard_result: JSON.parse(JSON.stringify(spamResult)),
          is_spam: true,
          is_archived: true,
          auto_archived_at: new Date().toISOString(),
        })
        .eq('id', message.id);

      // Credit UCT
      const { data: tokenData } = await supabase
        .from('tokens')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      const currentBalance = tokenData?.balance || 0;
      await supabase
        .from('tokens')
        .update({ 
          balance: currentBalance + SPAM_ARCHIVE_UCT_CREDIT,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      // Track archived message
      setArchivedForYou(prev => [...prev, { message, uctCredit: SPAM_ARCHIVE_UCT_CREDIT }]);
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });

      toast({
        title: "Archived For You",
        description: `Spam detected and archived. +${SPAM_ARCHIVE_UCT_CREDIT} UCT credited!`,
      });
    } catch (error) {
      console.error('Failed to auto-archive spam:', error);
    }
  }, [queryClient]);

  const updateSenderStats = useCallback((sender: string, action: 'received' | 'opened' | 'replied') => {
    setSenderStats(prev => {
      const current = prev.get(sender) || {
        email: sender,
        totalReceived: 0,
        opened: 0,
        replied: 0,
        lastEngagement: null,
        isBlocked: false,
        isUnsubscribed: false
      };

      const updated = { ...current };
      
      switch (action) {
        case 'received':
          updated.totalReceived++;
          break;
        case 'opened':
          updated.opened++;
          updated.lastEngagement = new Date();
          break;
        case 'replied':
          updated.replied++;
          updated.lastEngagement = new Date();
          break;
      }

      const newMap = new Map(prev);
      newMap.set(sender, updated);
      return newMap;
    });
  }, []);

  // Calculate total UCT earned from spam archiving
  const totalUctFromArchiving = archivedForYou.reduce((sum, item) => sum + item.uctCredit, 0);

  return {
    // Analysis
    analyzeMessage,
    analyzeMessageWithAI,
    isAnalyzing: analyzeWithAIMutation.isPending,

    // Sender management
    blockSender,
    unsubscribeSender,
    markAsSafe,
    quarantineMessage,
    autoArchiveSpam,
    updateSenderStats,

    // State
    blockedSenders,
    unsubscribedSenders,
    quarantinedMessages,
    senderStats,
    archivedForYou,
    totalUctFromArchiving,
  };
};
