import { useState, useEffect, useCallback } from 'react';
import { useMessages } from './useMessages';
import { useTasks } from './useTasks';

export interface ContextCard {
  id: string;
  type: 'message' | 'task' | 'meeting' | 'reminder';
  text: string;
  subtext?: string;
  urgency: 'critical' | 'time-sensitive' | 'informational';
  action?: string;
}

interface UseDriverModeReturn {
  contextCard: ContextCard | null;
  isActive: boolean;
  queuedItems: number;
  dismissCard: () => void;
  activate: () => void;
  deactivate: () => void;
}

export const useDriverMode = (): UseDriverModeReturn => {
  const [isActive, setIsActive] = useState(false);
  const [contextCard, setContextCard] = useState<ContextCard | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  
  const { messages } = useMessages();
  const { tasks } = useTasks();

  // Check for items that should surface
  const getContextCard = useCallback((): ContextCard | null => {
    // Priority 1: Critical unread messages
    const criticalMessage = messages?.find(
      m => m.priority === 'high' && !m.is_read && !dismissedIds.has(m.id)
    );
    if (criticalMessage) {
      return {
        id: criticalMessage.id,
        type: 'message',
        text: 'One time-sensitive message.',
        subtext: `From ${criticalMessage.sender_name}`,
        urgency: 'time-sensitive',
        action: 'read_priority',
      };
    }

    // Priority 2: Urgent pending tasks
    const urgentTask = tasks?.find(
      t => t.status === 'pending' && t.priority === 'high' && !dismissedIds.has(t.id)
    );
    if (urgentTask) {
      return {
        id: urgentTask.id,
        type: 'task',
        text: 'One task requires attention.',
        subtext: urgentTask.title,
        urgency: 'time-sensitive',
        action: 'show_task',
      };
    }

    // Priority 3: Multiple unread messages
    const unreadCount = messages?.filter(m => !m.is_read).length || 0;
    if (unreadCount > 3) {
      return {
        id: 'unread-batch',
        type: 'message',
        text: `${unreadCount} items queued.`,
        urgency: 'informational',
      };
    }

    // Nothing urgent = no card (silence = success)
    return null;
  }, [messages, tasks, dismissedIds]);

  // Update context card when active
  useEffect(() => {
    if (!isActive) {
      setContextCard(null);
      return;
    }

    const card = getContextCard();
    setContextCard(card);

    // Auto-dismiss informational cards after 5 seconds
    if (card && card.urgency === 'informational') {
      const timer = setTimeout(() => {
        setDismissedIds(prev => new Set(prev).add(card.id));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isActive, getContextCard]);

  const dismissCard = useCallback(() => {
    if (contextCard) {
      setDismissedIds(prev => new Set(prev).add(contextCard.id));
      setContextCard(null);
    }
  }, [contextCard]);

  const activate = useCallback(() => {
    setIsActive(true);
    setDismissedIds(new Set());
  }, []);

  const deactivate = useCallback(() => {
    setIsActive(false);
    setContextCard(null);
  }, []);

  const queuedItems = (messages?.filter(m => !m.is_read).length || 0) +
    (tasks?.filter(t => t.status === 'pending').length || 0);

  return {
    contextCard,
    isActive,
    queuedItems,
    dismissCard,
    activate,
    deactivate,
  };
};
