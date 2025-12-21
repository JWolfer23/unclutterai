import { useMemo } from "react";
import { useMessages } from "./useMessages";
import { useGmailAuth } from "./useGmailAuth";
import { useMicrosoftAuth } from "./useMicrosoftAuth";

export type InboxSource = "gmail" | "outlook" | "all";

export interface ExecutiveInboxStats {
  totalUnread: number;
  gmailUnread: number;
  outlookUnread: number;
  urgentCount: number;
  importantCount: number;
  lowPriorityCount: number;
  clarityScore: number;
  hasAnyConnection: boolean;
}

export interface InboxMessage {
  id: string;
  source: "gmail" | "outlook";
  sender_name: string;
  sender_email: string | null;
  subject: string;
  preview: string | null;
  content: string;
  priority_score: number | null;
  priority: "high" | "medium" | "low" | null;
  received_at: string | null;
  is_read: boolean | null;
  is_archived: boolean | null;
  account_id: string | null;
}

/**
 * Hook for unified Executive Inbox that merges Gmail and Outlook messages.
 * Messages are sorted by AI priority, NOT by received time.
 * Source-agnostic: Gmail and Outlook treated identically after ingestion.
 */
export function useExecutiveInbox() {
  const { messages, isLoading: messagesLoading } = useMessages();
  const { 
    isConnected: gmailConnected, 
    syncing: gmailSyncing,
    syncNow: syncGmail 
  } = useGmailAuth();
  const { 
    isConnected: outlookConnected,
    isRefreshing: outlookSyncing,
    syncEmails: syncOutlook 
  } = useMicrosoftAuth();

  // Filter email messages (Gmail + Outlook) and normalize
  const inboxMessages = useMemo<InboxMessage[]>(() => {
    if (!messages) return [];
    
    return messages
      .filter(m => m.type === "email" && !m.is_archived && !m.is_spam)
      .map(m => ({
        id: m.id,
        source: (m.platform === "gmail" ? "gmail" : "outlook") as "gmail" | "outlook",
        sender_name: m.sender_name,
        sender_email: m.sender_email,
        subject: m.subject,
        preview: m.preview,
        content: m.content,
        priority_score: m.priority_score,
        priority: m.priority,
        received_at: m.received_at,
        is_read: m.is_read,
        is_archived: m.is_archived,
        account_id: m.account_id || null,
      }))
      // Sort by priority (highest first), then by time (newest first)
      .sort((a, b) => {
        const priorityDiff = (b.priority_score ?? 0) - (a.priority_score ?? 0);
        if (priorityDiff !== 0) return priorityDiff;
        
        const aTime = a.received_at ? new Date(a.received_at).getTime() : 0;
        const bTime = b.received_at ? new Date(b.received_at).getTime() : 0;
        return bTime - aTime;
      });
  }, [messages]);

  // Calculate stats
  const stats = useMemo<ExecutiveInboxStats>(() => {
    const unread = inboxMessages.filter(m => !m.is_read);
    const gmailMessages = inboxMessages.filter(m => m.source === "gmail");
    const outlookMessages = inboxMessages.filter(m => m.source === "outlook");
    
    const urgent = inboxMessages.filter(m => m.priority_score && m.priority_score >= 4);
    const important = inboxMessages.filter(m => m.priority_score === 3);
    const lowPriority = inboxMessages.filter(m => !m.priority_score || m.priority_score <= 2);
    
    const readCount = inboxMessages.filter(m => m.is_read).length;
    const totalCount = inboxMessages.length;
    const clarityScore = totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 100;

    return {
      totalUnread: unread.length,
      gmailUnread: gmailMessages.filter(m => !m.is_read).length,
      outlookUnread: outlookMessages.filter(m => !m.is_read).length,
      urgentCount: urgent.length,
      importantCount: important.length,
      lowPriorityCount: lowPriority.length,
      clarityScore,
      hasAnyConnection: gmailConnected || outlookConnected,
    };
  }, [inboxMessages, gmailConnected, outlookConnected]);

  // Sync all connected inboxes
  const syncAll = async () => {
    const promises: Promise<unknown>[] = [];
    if (gmailConnected) promises.push(syncGmail());
    if (outlookConnected) promises.push(syncOutlook());
    await Promise.all(promises);
  };

  // Get unread messages for various modes
  const unreadMessages = useMemo(() => 
    inboxMessages.filter(m => !m.is_read),
  [inboxMessages]);

  // Get focus mode summary (post-focus)
  const getFocusSummary = () => {
    const gmailCount = inboxMessages.filter(m => m.source === "gmail" && !m.is_read).length;
    const outlookCount = inboxMessages.filter(m => m.source === "outlook" && !m.is_read).length;
    const totalCount = gmailCount + outlookCount;
    
    if (totalCount === 0) {
      return { 
        message: "Nothing required your attention while you were focused.",
        gmailCount: 0,
        outlookCount: 0,
        hasUrgent: false
      };
    }

    const urgentCount = inboxMessages.filter(
      m => !m.is_read && m.priority_score && m.priority_score >= 4
    ).length;

    return {
      message: urgentCount > 0 
        ? `${totalCount} new messages, ${urgentCount} may need attention`
        : `${totalCount} new messages arrived, none urgent`,
      gmailCount,
      outlookCount,
      hasUrgent: urgentCount > 0
    };
  };

  // Get top priorities for Morning Brief (max 3, across all inboxes)
  const getTopPriorities = (limit = 3) => {
    return inboxMessages
      .filter(m => !m.is_read && m.priority_score && m.priority_score >= 3)
      .slice(0, limit);
  };

  return {
    // Data
    messages: inboxMessages,
    unreadMessages,
    stats,
    
    // Connection status
    gmailConnected,
    outlookConnected,
    isConnected: gmailConnected || outlookConnected,
    
    // Loading states
    isLoading: messagesLoading,
    isSyncing: gmailSyncing || outlookSyncing,
    
    // Actions
    syncAll,
    
    // Helpers
    getFocusSummary,
    getTopPriorities,
  };
}
