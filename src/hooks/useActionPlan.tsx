import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ActionPlanTask {
  id?: string;
  title: string;
  description: string;
  message_ids: string[];
  due_date: string | null;
  priority: number;
  effort: number;
}

interface AutoReplyDraft {
  message_id: string;
  draft: {
    subject: string;
    body: string;
    tone: string;
  };
}

interface BatchRecommendation {
  batch_size: number;
  messages: string[];
  goal: string;
}

export interface ActionPlan {
  urgent_tasks: ActionPlanTask[];
  quick_wins: ActionPlanTask[];
  auto_replies: AutoReplyDraft[];
  batch_recommendations: BatchRecommendation[];
  uct_reward_estimate: number;
  messages_processed: number;
  ledger_id: string;
  action_plan_id: string;
}

export const useActionPlan = () => {
  const queryClient = useQueryClient();
  const [lastActionPlan, setLastActionPlan] = useState<ActionPlan | null>(null);

  // Fetch latest action plan from database
  const { data: savedActionPlan, isLoading: isLoadingPlan } = useQuery({
    queryKey: ['action-plan', 'latest'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('action_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching action plan:', error);
        return null;
      }

      if (data) {
        return {
          urgent_tasks: (data.urgent_tasks as unknown as ActionPlanTask[]) || [],
          quick_wins: (data.quick_wins as unknown as ActionPlanTask[]) || [],
          auto_replies: (data.auto_replies as unknown as AutoReplyDraft[]) || [],
          batch_recommendations: (data.batch_recommendations as unknown as BatchRecommendation[]) || [],
          uct_reward_estimate: data.uct_estimate || 0,
          messages_processed: data.messages_processed || 0,
          ledger_id: data.ledger_id || '',
          action_plan_id: data.id,
        } as ActionPlan;
      }

      return null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Generate new action plan
  const generateMutation = useMutation({
    mutationFn: async (): Promise<ActionPlan> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('instant-catchup', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to generate action plan');

      return data.action_plan;
    },
    onSuccess: (data) => {
      setLastActionPlan(data);
      queryClient.invalidateQueries({ queryKey: ['action-plan'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      
      toast({
        title: 'Action Plan Generated',
        description: `${data.urgent_tasks.length} urgent tasks, ${data.quick_wins.length} quick wins. +${data.uct_reward_estimate.toFixed(1)} UCT earned!`,
      });
    },
    onError: (error) => {
      console.error('Action plan error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate action plan',
        variant: 'destructive',
      });
    },
  });

  // Claim a task (mark as in progress)
  const claimTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'pending' })
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Task Claimed',
        description: 'Task has been added to your to-do list',
      });
    },
  });

  // Complete a task
  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Task Completed',
        description: 'Great work! Task marked as complete.',
      });
    },
  });

  // Schedule a task (update due date)
  const scheduleTask = useMutation({
    mutationFn: async ({ taskId, dueDate }: { taskId: string; dueDate: string }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ due_date: dueDate })
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Task Scheduled',
        description: 'Task due date has been updated',
      });
    },
  });

  const actionPlan = lastActionPlan || savedActionPlan;

  return {
    actionPlan,
    isLoading: isLoadingPlan,
    isGenerating: generateMutation.isPending,
    generateActionPlan: generateMutation.mutate,
    generateActionPlanAsync: generateMutation.mutateAsync,
    claimTask: claimTask.mutate,
    completeTask: completeTask.mutate,
    scheduleTask: scheduleTask.mutate,
    isClaiming: claimTask.isPending,
    isCompleting: completeTask.isPending,
    isScheduling: scheduleTask.isPending,
  };
};
