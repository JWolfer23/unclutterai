import { useState, useEffect, useCallback } from 'react';
import { useMessages } from './useMessages';
import { useTasks } from './useTasks';
import { useDecisionHeuristics, getActNowItems, getCriticalItems } from './useDecisionHeuristics';
import { useAssistantProfile } from './useAssistantProfile';
import type { ItemToScore, FinalClassification } from '@/lib/aiDecisionHeuristics';

export interface ContextCard {
  id: string;
  type: 'message' | 'task' | 'meeting' | 'reminder' | 'notification';
  text: string;
  subtext?: string;
  urgency: 'critical' | 'time-sensitive' | 'informational';
  action?: string;
  classification?: FinalClassification;
  breaksSomething?: boolean;
}

interface UseDriverModeReturn {
  contextCard: ContextCard | null;
  isActive: boolean;
  queuedItems: number;
  actNowCount: number;
  dismissCard: () => void;
  activate: () => void;
  deactivate: () => void;
}

export const useDriverMode = (): UseDriverModeReturn => {
  const [isActive, setIsActive] = useState(false);
  const [contextCard, setContextCard] = useState<ContextCard | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [scoredItems, setScoredItems] = useState<Map<string, any>>(new Map());
  
  const { messages } = useMessages();
  const { tasks } = useTasks();
  const { scoreBatch, isScoring } = useDecisionHeuristics();
  const { profile, shouldInterrupt, canAutoHandle, isOperator } = useAssistantProfile();

  // Convert messages/tasks to scoreable items
  const getItemsToScore = useCallback((): ItemToScore[] => {
    const items: ItemToScore[] = [];

    // Add unread messages
    messages?.filter(m => !m.is_read && !dismissedIds.has(m.id)).forEach(m => {
      items.push({
        id: m.id,
        type: 'message',
        title: m.subject,
        content: m.content,
        sender: m.sender_name,
        senderEmail: m.sender_email || undefined,
        priority: m.priority || undefined,
        labels: Array.isArray(m.labels) ? m.labels as string[] : undefined,
      });
    });

    // Add pending tasks
    tasks?.filter(t => t.status === 'pending' && !dismissedIds.has(t.id)).forEach(t => {
      items.push({
        id: t.id,
        type: 'task',
        title: t.title,
        content: t.description || undefined,
        priority: t.priority || undefined,
        dueDate: t.due_date || undefined,
      });
    });

    return items;
  }, [messages, tasks, dismissedIds]);

  // Score items when driver mode activates
  useEffect(() => {
    if (!isActive) return;

    const scoreItems = async () => {
      const items = getItemsToScore();
      if (items.length === 0) return;

      const results = await scoreBatch(items);
      setScoredItems(results);
    };

    scoreItems();
  }, [isActive, getItemsToScore, scoreBatch]);

  // Generate context card from scored items
  const getContextCard = useCallback((): ContextCard | null => {
    const items = getItemsToScore();
    
    // First: Get items that would break something
    const criticalItems = getCriticalItems(items, scoredItems);
    if (criticalItems.length > 0) {
      const item = criticalItems[0];
      const result = scoredItems.get(item.id);
      return {
        id: item.id,
        type: item.type,
        text: result?.reasoning || `One ${item.type} requires attention.`,
        subtext: item.type === 'message' ? `From ${item.sender}` : item.title,
        urgency: 'critical',
        action: item.type === 'message' ? 'read_priority' : 'show_task',
        classification: result?.classification,
        breaksSomething: true,
      };
    }

    // Second: Get "Act Now" items
    const actNowItems = getActNowItems(items, scoredItems);
    if (actNowItems.length > 0) {
      const item = actNowItems[0];
      const result = scoredItems.get(item.id);
      return {
        id: item.id,
        type: item.type,
        text: result?.reasoning || 'One item requires action.',
        subtext: item.type === 'message' ? `From ${item.sender}` : item.title,
        urgency: 'time-sensitive',
        action: item.type === 'message' ? 'read_priority' : 'show_task',
        classification: result?.classification,
        breaksSomething: result?.breaksSomething,
      };
    }

    // Third: Show queue count if items exist but nothing urgent
    const unreadCount = messages?.filter(m => !m.is_read).length || 0;
    const pendingCount = tasks?.filter(t => t.status === 'pending').length || 0;
    const totalQueued = unreadCount + pendingCount;

    if (totalQueued > 3) {
      return {
        id: 'queued-batch',
        type: 'notification',
        text: `${totalQueued} items queued.`,
        subtext: 'Nothing requires immediate action.',
        urgency: 'informational',
      };
    }

    // Nothing urgent = no card (silence = success)
    return null;
  }, [messages, tasks, scoredItems, getItemsToScore]);

  // Update context card when scored items change
  useEffect(() => {
    if (!isActive) {
      setContextCard(null);
      return;
    }

    const card = getContextCard();
    
    // Gate card display by assistant profile interruption preference
    if (card) {
      const shouldShow = shouldInterrupt(
        card.urgency === 'critical' ? 'critical' :
        card.urgency === 'time-sensitive' ? 'time_sensitive' : 'informational'
      );
      
      if (!shouldShow) {
        // User's preference is to not be interrupted at this level
        setContextCard(null);
        return;
      }
    }
    
    setContextCard(card);

    // Auto-dismiss informational cards after 5 seconds
    if (card && card.urgency === 'informational') {
      const timer = setTimeout(() => {
        setDismissedIds(prev => new Set(prev).add(card.id));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isActive, getContextCard, scoredItems, shouldInterrupt]);

  const dismissCard = useCallback(() => {
    if (contextCard) {
      setDismissedIds(prev => new Set(prev).add(contextCard.id));
      setContextCard(null);
    }
  }, [contextCard]);

  const activate = useCallback(() => {
    setIsActive(true);
    setDismissedIds(new Set());
    setScoredItems(new Map());
  }, []);

  const deactivate = useCallback(() => {
    setIsActive(false);
    setContextCard(null);
  }, []);

  const queuedItems = (messages?.filter(m => !m.is_read).length || 0) +
    (tasks?.filter(t => t.status === 'pending').length || 0);

  const actNowCount = getActNowItems(getItemsToScore(), scoredItems).length;

  return {
    contextCard,
    isActive,
    queuedItems,
    actNowCount,
    dismissCard,
    activate,
    deactivate,
  };
};
