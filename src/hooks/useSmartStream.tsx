import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useActionPlan } from "./useActionPlan";

export type StreamFilter = 'today' | 'quick_wins' | 'deep_work' | 'people';

export interface StreamItem {
  id: string;
  type: 'task' | 'message' | 'auto_reply';
  title: string;
  subtitle: string;
  due_tag: string | null;
  uct_reward: number;
  priority: 'high' | 'medium' | 'low';
  effort: number;
  sender?: string;
  action_buttons: Array<'claim' | 'complete' | 'schedule' | 'delegate' | 'send'>;
  source_message_ids: string[];
}

export interface BatchGroup {
  id: string;
  purpose: string;
  size: number;
  priority: 'high' | 'medium' | 'low';
  items: StreamItem[];
}

interface BatchBrainInput {
  messages: Array<{
    id: string;
    subject: string;
    summary: string;
    sender: string;
    urgency: number;
    effort: number;
    tags: string[];
  }>;
}

interface BatchBrainOutput {
  batches: Array<{
    size: number;
    messages: string[];
    purpose: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

function getDueTag(dueDate: string | null): string | null {
  if (!dueDate) return null;
  
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays <= 7) return `Due in ${diffDays} days`;
  return null;
}

function mapTaskToStreamItem(task: any): StreamItem {
  const priority = task.priority || (task.score >= 7 ? 'high' : task.score >= 4 ? 'medium' : 'low');
  const effort = task.metadata?.effort || 5;
  
  return {
    id: task.id,
    type: 'task',
    title: task.title,
    subtitle: task.description || 'No description',
    due_tag: getDueTag(task.due_date),
    uct_reward: (effort * 0.1),
    priority,
    effort,
    sender: task.metadata?.sender,
    action_buttons: task.status === 'pending' ? ['complete', 'schedule', 'delegate'] : ['claim'],
    source_message_ids: task.message_id ? [task.message_id] : [],
  };
}

function mapMessageToStreamItem(message: any): StreamItem {
  const urgency = message.priority_score || 5;
  const priority = urgency >= 7 ? 'high' : urgency >= 4 ? 'medium' : 'low';
  
  return {
    id: message.id,
    type: 'message',
    title: message.subject,
    subtitle: message.ai_summary || message.preview || 'No preview',
    due_tag: null,
    uct_reward: 0.1,
    priority,
    effort: 3,
    sender: message.sender_name,
    action_buttons: ['claim', 'schedule'],
    source_message_ids: [message.id],
  };
}

export function useSmartStream(filter: StreamFilter = 'today') {
  const queryClient = useQueryClient();
  const { actionPlan, claimTask, completeTask } = useActionPlan();
  const [batches, setBatches] = useState<BatchGroup[]>([]);

  // Fetch tasks based on filter
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['stream-tasks', filter],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('score', { ascending: false })
        .limit(50);

      // Apply filter-specific conditions
      if (filter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        query = query.or(`due_date.eq.${today},score.gte.7`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch messages based on filter
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['stream-messages', filter],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('priority_score', { ascending: false })
        .limit(30);

      if (filter === 'today') {
        query = query.gte('priority_score', 6);
      } else if (filter === 'quick_wins') {
        query = query.lte('priority_score', 4);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Generate batches using AI
  const batchMutation = useMutation({
    mutationFn: async (items: StreamItem[]) => {
      const messagesForAI = items
        .filter(i => i.type === 'message' || i.type === 'task')
        .map(i => ({
          id: i.id,
          subject: i.title,
          summary: i.subtitle,
          sender: i.sender || 'Unknown',
          urgency: i.priority === 'high' ? 9 : i.priority === 'medium' ? 5 : 2,
          effort: i.effort,
          tags: [],
        }));

      const { data, error } = await supabase.functions.invoke('ai-blocks', {
        body: { 
          action: 'batch_brain', 
          data: { messages: messagesForAI } 
        }
      });

      if (error) throw error;
      return data.result as BatchBrainOutput;
    },
    onSuccess: (data, items) => {
      const itemMap = new Map(items.map(i => [i.id, i]));
      
      const newBatches: BatchGroup[] = data.batches.map((batch, idx) => ({
        id: `batch-${idx}`,
        purpose: batch.purpose,
        size: batch.size,
        priority: batch.priority,
        items: batch.messages
          .map(id => itemMap.get(id))
          .filter(Boolean) as StreamItem[],
      }));

      setBatches(newBatches);
      toast.success(`Created ${newBatches.length} cognitive batches`);
    },
    onError: (error: Error) => {
      toast.error(`Batch creation failed: ${error.message}`);
    },
  });

  // Process items based on filter and action plan
  const items = useMemo<StreamItem[]>(() => {
    let result: StreamItem[] = [];

    // Add tasks from action plan if available
    if (actionPlan) {
      actionPlan.urgent_tasks.forEach(t => {
        result.push({
          id: t.id || `urgent-${result.length}`,
          type: 'task',
          title: t.title,
          subtitle: t.description || '',
          due_tag: 'Due today',
          uct_reward: 0.5,
          priority: 'high',
          effort: t.effort || 5,
          sender: undefined,
          action_buttons: ['claim', 'complete'],
          source_message_ids: t.message_ids || [],
        });
      });

      actionPlan.quick_wins.forEach(t => {
        result.push({
          id: t.id || `quick-${result.length}`,
          type: 'task',
          title: t.title,
          subtitle: t.description || '',
          due_tag: null,
          uct_reward: 0.2,
          priority: 'medium',
          effort: t.effort || 2,
          sender: undefined,
          action_buttons: ['complete'],
          source_message_ids: t.message_ids || [],
        });
      });

      actionPlan.auto_replies.forEach(r => {
        result.push({
          id: r.message_id || `reply-${result.length}`,
          type: 'auto_reply',
          title: `Reply: ${r.draft.subject}`,
          subtitle: r.draft.body.substring(0, 100) + '...',
          due_tag: null,
          uct_reward: 0.1,
          priority: 'medium',
          effort: 1,
          sender: undefined,
          action_buttons: ['send'],
          source_message_ids: r.message_id ? [r.message_id] : [],
        });
      });
    }

    // Add regular tasks and messages
    tasks.forEach(t => result.push(mapTaskToStreamItem(t)));
    messages.forEach(m => result.push(mapMessageToStreamItem(m)));

    // Apply filter
    switch (filter) {
      case 'quick_wins':
        result = result.filter(i => i.effort <= 3);
        break;
      case 'deep_work':
        result = result.filter(i => i.effort >= 6);
        break;
      case 'people':
        // Group by sender - already included, just sort
        result.sort((a, b) => (a.sender || '').localeCompare(b.sender || ''));
        break;
      case 'today':
      default:
        result = result.filter(i => i.priority === 'high' || i.due_tag === 'Due today');
        break;
    }

    // Sort by priority then effort
    result.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.effort - b.effort;
    });

    return result;
  }, [actionPlan, tasks, messages, filter]);

  const generateBatches = useCallback(() => {
    batchMutation.mutate(items);
  }, [items, batchMutation]);

  const handleAction = useCallback(async (itemId: string, action: string) => {
    switch (action) {
      case 'claim':
        await claimTask(itemId);
        break;
      case 'complete':
        await completeTask(itemId);
        break;
      case 'schedule':
        // Open scheduler - handled by UI
        break;
      case 'send':
        toast.info('Reply sending coming soon');
        break;
      case 'delegate':
        toast.info('Delegation coming soon');
        break;
    }
    queryClient.invalidateQueries({ queryKey: ['stream-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['stream-messages'] });
  }, [claimTask, completeTask, queryClient]);

  return {
    items,
    batches,
    filter,
    isLoading: isLoadingTasks || isLoadingMessages,
    isGeneratingBatches: batchMutation.isPending,
    generateBatches,
    handleAction,
  };
}
