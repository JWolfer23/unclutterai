import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ActionType = 'archive' | 'draft_created' | 'schedule' | 'ignore' | 'auto_reply' | 'task_created';
export type TargetType = 'message' | 'task' | 'draft';

export interface ActionLogEntry {
  id: string;
  actionType: ActionType;
  targetType: TargetType;
  targetId: string | null;
  what: string;
  why: string | null;
  context: Record<string, any>;
  isUndoable: boolean;
  undoneAt: string | null;
  source: string;
  createdAt: string;
}

interface LogActionInput {
  actionType: ActionType;
  targetType: TargetType;
  targetId?: string | null;
  what: string;
  why?: string | null;
  context?: Record<string, any>;
  isUndoable?: boolean;
  source: string;
}

export const useActionLog = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch action logs
  const { data: actions = [], isLoading } = useQuery({
    queryKey: ['action-log', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('assistant_action_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching action log:', error);
        return [];
      }

      return (data || []).map(row => ({
        id: row.id,
        actionType: row.action_type as ActionType,
        targetType: row.target_type as TargetType,
        targetId: row.target_id,
        what: row.what,
        why: row.why,
        context: row.context as Record<string, any>,
        isUndoable: row.is_undoable,
        undoneAt: row.undone_at,
        source: row.source,
        createdAt: row.created_at,
      })) as ActionLogEntry[];
    },
    enabled: !!user?.id,
  });

  // Log a new action
  const logMutation = useMutation({
    mutationFn: async (input: LogActionInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('assistant_action_log')
        .insert({
          user_id: user.id,
          action_type: input.actionType,
          target_type: input.targetType,
          target_id: input.targetId || null,
          what: input.what,
          why: input.why || null,
          context: input.context || {},
          is_undoable: input.isUndoable ?? false,
          source: input.source,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-log'] });
    },
  });

  // Undo an action
  const undoMutation = useMutation({
    mutationFn: async (actionId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Find the action
      const action = actions.find(a => a.id === actionId);
      if (!action || !action.isUndoable || action.undoneAt) {
        throw new Error('Action cannot be undone');
      }

      // Perform undo based on action type
      switch (action.actionType) {
        case 'archive':
          if (action.targetId) {
            await supabase
              .from('messages')
              .update({ is_archived: false, auto_archived_at: null })
              .eq('id', action.targetId);
          }
          break;

        case 'draft_created':
          // Drafts stored in context can be cleared
          break;

        case 'task_created':
          if (action.targetId) {
            await supabase
              .from('tasks')
              .delete()
              .eq('id', action.targetId);
          }
          break;

        default:
          throw new Error('This action type cannot be undone');
      }

      // Mark action as undone
      const { error } = await supabase
        .from('assistant_action_log')
        .update({ undone_at: new Date().toISOString() })
        .eq('id', actionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-log'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const logAction = useCallback(async (input: LogActionInput) => {
    return logMutation.mutateAsync(input);
  }, [logMutation]);

  const undoAction = useCallback(async (actionId: string): Promise<boolean> => {
    try {
      await undoMutation.mutateAsync(actionId);
      return true;
    } catch {
      return false;
    }
  }, [undoMutation]);

  // Get recent actions (within specified hours)
  const getRecentActions = useCallback((hours: number = 24): ActionLogEntry[] => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return actions.filter(a => new Date(a.createdAt) > cutoff);
  }, [actions]);

  // Group actions by source
  const getActionsBySource = useCallback((): Record<string, ActionLogEntry[]> => {
    return actions.reduce((acc, action) => {
      const source = action.source || 'unknown';
      if (!acc[source]) acc[source] = [];
      acc[source].push(action);
      return acc;
    }, {} as Record<string, ActionLogEntry[]>);
  }, [actions]);

  // Group actions by day
  const getActionsByDay = useCallback((): Record<string, ActionLogEntry[]> => {
    return actions.reduce((acc, action) => {
      const day = new Date(action.createdAt).toDateString();
      if (!acc[day]) acc[day] = [];
      acc[day].push(action);
      return acc;
    }, {} as Record<string, ActionLogEntry[]>);
  }, [actions]);

  return {
    actions,
    isLoading,
    logAction,
    undoAction,
    getRecentActions,
    getActionsBySource,
    getActionsByDay,
    isLogging: logMutation.isPending,
    isUndoing: undoMutation.isPending,
  };
};
