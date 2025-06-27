
import { useState, useEffect } from 'react';
import { toast } from "@/hooks/use-toast";

interface SpamAnalysis {
  isSpam: boolean;
  confidence: number;
  reasons: string[];
  category: 'spam' | 'phishing' | 'low-value' | 'suspicious' | 'safe';
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

export const useSpamGuard = () => {
  const [blockedSenders, setBlockedSenders] = useState<string[]>([]);
  const [unsubscribedSenders, setUnsubscribedSenders] = useState<string[]>([]);
  const [senderStats, setSenderStats] = useState<Map<string, SenderStats>>(new Map());
  const [quarantinedMessages, setQuarantinedMessages] = useState<any[]>([]);

  // Simulate spam detection algorithm
  const analyzeMessage = (message: any): SpamAnalysis => {
    const reasons: string[] = [];
    let spamScore = 0;

    // Check for common spam indicators
    const subject = message.subject.toLowerCase();
    const preview = message.preview.toLowerCase();
    const sender = message.from.toLowerCase();

    // Suspicious keywords
    const spamKeywords = ['congratulations', 'winner', 'prize', 'urgent', 'act now', 'limited time', 'click here', 'free money', 'nigerian prince'];
    const phishingKeywords = ['verify account', 'suspended', 'click to confirm', 'update payment', 'security alert'];
    
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

    // Determine category and final verdict
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
  };

  const blockSender = (sender: string) => {
    setBlockedSenders(prev => [...prev, sender]);
    toast({
      title: "🛡️ Sender Blocked",
      description: `Future messages from ${sender} will be automatically blocked.`,
    });
  };

  const unsubscribeSender = (sender: string) => {
    setUnsubscribedSenders(prev => [...prev, sender]);
    toast({
      title: "📧 Unsubscribed",
      description: `Unsubscribed from ${sender}. Messages will be filtered.`,
    });
  };

  const markAsSafe = (sender: string) => {
    setBlockedSenders(prev => prev.filter(s => s !== sender));
    setUnsubscribedSenders(prev => prev.filter(s => s !== sender));
    toast({
      title: "✅ Marked as Safe",
      description: `${sender} has been marked as safe and won't be filtered.`,
    });
  };

  const quarantineMessage = (message: any) => {
    setQuarantinedMessages(prev => [...prev, { ...message, quarantinedAt: new Date() }]);
  };

  const updateSenderStats = (sender: string, action: 'received' | 'opened' | 'replied') => {
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
  };

  return {
    analyzeMessage,
    blockSender,
    unsubscribeSender,
    markAsSafe,
    quarantineMessage,
    updateSenderStats,
    blockedSenders,
    unsubscribedSenders,
    quarantinedMessages,
    senderStats
  };
};
