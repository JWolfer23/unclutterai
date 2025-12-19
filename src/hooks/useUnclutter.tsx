import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useAssistantProfile } from './useAssistantProfile';
import { useBetaUCT } from './useBetaUCT';
import { useActionLog } from './useActionLog';
import { UCT_REWARDS } from '@/lib/uctBetaRules';

export interface Loop {
  id: string;
  messageId: string;
  subject: string;
  sender: string;
  senderEmail: string;
  summary: string;
  receivedAt: string;
}

export type UnclutterPhase = 'idle' | 'scanning' | 'resolving' | 'complete';
export type LoopAction = 'done' | 'schedule' | 'delegate' | 'archive' | 'ignore';

export interface UnclutterState {
  phase: UnclutterPhase;
  loops: Loop[];
  currentIndex: number;
  loopsResolved: number;
}

export const useUnclutter = () => {
  const [phase, setPhase] = useState<UnclutterPhase>('idle');
  const [loops, setLoops] = useState<Loop[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loopsResolved, setLoopsResolved] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState<string | null>(null);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  const { toast } = useToast();
  const { canAutoHandle, requiresConfirmation } = useAssistantProfile();
  const { addUCT, data: uctData } = useBetaUCT();
  const { logAction } = useActionLog();

  const currentLoop = loops[currentIndex] || null;
  const totalLoops = loops.length;

  // Start scan - fetch unread emails
  const startScan = useCallback(async () => {
    setPhase('scanning');
    setIsLoading(true);
    setLoopsResolved(0);
    setCurrentIndex(0);

    try {
      const { data, error } = await supabase.functions.invoke('unclutter-scan');

      if (error) throw error;

      const fetchedLoops = data?.loops || [];
      setLoops(fetchedLoops);

      if (fetchedLoops.length === 0) {
        setPhase('complete');
      } else {
        setPhase('resolving');
      }
    } catch (error) {
      console.error('Error scanning:', error);
      toast({
        title: "Scan failed",
        description: "Could not scan for messages. Please try again.",
        variant: "destructive"
      });
      setPhase('idle');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Advance to next loop or complete
  const advance = useCallback(() => {
    setAiDraft(null);
    if (currentIndex < loops.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setPhase('complete');
    }
  }, [currentIndex, loops.length]);

  // Resolve current loop with an action and award UCT - persists outcome to database
  const resolve = useCallback(async (action: LoopAction) => {
    if (!currentLoop) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let uctReward = UCT_REWARDS.loop_resolved; // Base reward

      // Persist the outcome to database by updating message metadata
      const updatePayload: Record<string, unknown> = {
        is_read: true,
        metadata: {
          unclutter_outcome: action,
          resolved_at: new Date().toISOString()
        }
      };

      // Handle specific actions
      if (action === 'done') {
        // Mark as done/completed - no further action needed
        await supabase
          .from('messages')
          .update(updatePayload)
          .eq('id', currentLoop.messageId);
        
        await logAction({
          actionType: 'mark_done',
          targetType: 'message',
          targetId: currentLoop.messageId,
          what: `Marked "${currentLoop.subject}" as done`,
          why: 'User completed the item',
          isUndoable: false,
          source: 'unclutter',
        });
        uctReward += UCT_REWARDS.loop_reply_sent;

      } else if (action === 'schedule') {
        await supabase
          .from('messages')
          .update(updatePayload)
          .eq('id', currentLoop.messageId);
        
        uctReward += UCT_REWARDS.loop_task_created;
        // Note: task creation handled via createTaskFromLoop

      } else if (action === 'delegate') {
        await supabase
          .from('messages')
          .update({
            ...updatePayload,
            metadata: {
              unclutter_outcome: 'delegate',
              resolved_at: new Date().toISOString(),
              delegated: true
            }
          })
          .eq('id', currentLoop.messageId);
        
        // Create a task for delegation tracking
        await supabase.from('tasks').insert({
          user_id: user.id,
          title: `Delegate: ${currentLoop.subject}`,
          description: `Delegated from ${currentLoop.sender}: ${currentLoop.summary}`,
          priority: 'medium',
          status: 'pending',
          metadata: { delegated: true, messageId: currentLoop.messageId }
        });
        
        await logAction({
          actionType: 'delegate',
          targetType: 'message',
          targetId: currentLoop.messageId,
          what: `Delegated "${currentLoop.subject}" to someone else`,
          why: 'User chose to delegate this item',
          isUndoable: true,
          source: 'unclutter',
        });
        uctReward += UCT_REWARDS.loop_task_created;

      } else if (action === 'archive') {
        await supabase
          .from('messages')
          .update({ ...updatePayload, is_archived: true })
          .eq('id', currentLoop.messageId);
        
        await logAction({
          actionType: 'archive',
          targetType: 'message',
          targetId: currentLoop.messageId,
          what: `Archived "${currentLoop.subject}" from ${currentLoop.sender}`,
          why: 'User-directed action during Unclutter',
          context: { originalState: { is_archived: false } },
          isUndoable: true,
          source: 'unclutter',
        });
        uctReward += UCT_REWARDS.loop_archive;

      } else if (action === 'ignore') {
        await supabase
          .from('messages')
          .update(updatePayload)
          .eq('id', currentLoop.messageId);
        
        await logAction({
          actionType: 'ignore',
          targetType: 'message',
          targetId: currentLoop.messageId,
          what: `Marked "${currentLoop.subject}" as ignored`,
          why: 'User decided no action needed',
          isUndoable: false,
          source: 'unclutter',
        });
      }

      setLoopsResolved(prev => prev + 1);

      // Award UCT
      if (uctReward > 0) {
        try {
          await addUCT(uctReward, `unclutter_${action}`);
        } catch (e) {
          console.error('Failed to award UCT:', e);
        }
      }

      advance();
    } catch (error) {
      console.error('Error resolving loop:', error);
      toast({
        title: "Action failed",
        description: "Could not complete the action.",
        variant: "destructive"
      });
    }
  }, [currentLoop, advance, toast, addUCT, logAction]);

  // Skip is removed - users must resolve each item to proceed

  // Generate AI draft for reply
  const generateDraft = useCallback(async () => {
    if (!currentLoop) return null;

    setIsGeneratingDraft(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-blocks', {
        body: {
          action: 'auto_reply',
          data: {
            message_id: currentLoop.messageId,
            subject: currentLoop.subject,
            content: currentLoop.summary,
            sender_name: currentLoop.sender
          }
        }
      });

      if (error) throw error;
      const draft = data?.draft || 'Unable to generate draft.';
      setAiDraft(draft);
      return draft;
    } catch (error) {
      console.error('Error generating draft:', error);
      toast({
        title: "Draft generation failed",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGeneratingDraft(false);
    }
  }, [currentLoop, toast]);

  // Create task from loop
  const createTaskFromLoop = useCallback(async (dueDate?: Date) => {
    if (!currentLoop) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: taskData, error: taskError } = await supabase.from('tasks').insert({
        user_id: user.id,
        title: currentLoop.subject,
        description: currentLoop.summary,
        due_date: dueDate?.toISOString() || null,
        priority: 'medium',
        status: 'pending'
      }).select('id').single();

      if (taskError) throw taskError;

      // Log task creation
      await logAction({
        actionType: 'task_created',
        targetType: 'task',
        targetId: taskData?.id || null,
        what: `Created task "${currentLoop.subject}"`,
        why: 'Scheduled for later action',
        context: { dueDate: dueDate?.toISOString() },
        isUndoable: true,
        source: 'unclutter',
      });

      toast({
        title: "Task created",
        description: "Loop converted to task."
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Failed to create task",
        variant: "destructive"
      });
    }
  }, [currentLoop, toast, logAction]);

  // Check if action requires confirmation - UCT level can reduce confirmations
  const needsConfirmation = useCallback((action: LoopAction): boolean => {
    // UCT level overrides for schedule
    if (action === 'schedule' && uctData?.skipScheduleConfirm) {
      return false;
    }
    
    // Fall back to profile settings
    if (action === 'schedule') {
      return requiresConfirmation('schedule_meetings');
    }
    if (action === 'delegate') {
      return requiresConfirmation('schedule_meetings');
    }
    return false;
  }, [requiresConfirmation, uctData]);

  // Reset state
  const reset = useCallback(() => {
    setPhase('idle');
    setLoops([]);
    setCurrentIndex(0);
    setLoopsResolved(0);
    setAiDraft(null);
  }, []);

  return {
    phase,
    currentLoop,
    currentIndex,
    totalLoops,
    loopsResolved,
    isLoading,
    aiDraft,
    isGeneratingDraft,
    uctData,
    startScan,
    resolve,
    generateDraft,
    createTaskFromLoop,
    needsConfirmation,
    reset
  };
};
