import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useAssistantProfile } from './useAssistantProfile';

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
export type LoopAction = 'reply' | 'schedule' | 'archive' | 'ignore' | 'skip';

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

  // Resolve current loop with an action
  const resolve = useCallback(async (action: LoopAction) => {
    if (!currentLoop) return;

    try {
      // Handle action
      if (action === 'archive') {
        await supabase
          .from('messages')
          .update({ is_read: true, is_archived: true })
          .eq('id', currentLoop.messageId);
        setLoopsResolved(prev => prev + 1);
      } else if (action === 'ignore') {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('id', currentLoop.messageId);
        setLoopsResolved(prev => prev + 1);
      } else if (action === 'reply' || action === 'schedule') {
        // These are handled separately with modals
        setLoopsResolved(prev => prev + 1);
      }
      // 'skip' doesn't count as resolved

      advance();
    } catch (error) {
      console.error('Error resolving loop:', error);
      toast({
        title: "Action failed",
        description: "Could not complete the action.",
        variant: "destructive"
      });
    }
  }, [currentLoop, advance, toast]);

  // Skip without action
  const skip = useCallback(() => {
    advance();
  }, [advance]);

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

      await supabase.from('tasks').insert({
        user_id: user.id,
        title: currentLoop.subject,
        description: currentLoop.summary,
        due_date: dueDate?.toISOString() || null,
        priority: 'medium',
        status: 'pending'
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
  }, [currentLoop, toast]);

  // Check if action requires confirmation
  const needsConfirmation = useCallback((action: LoopAction): boolean => {
    if (action === 'reply') {
      return requiresConfirmation('send_messages');
    }
    if (action === 'schedule') {
      return requiresConfirmation('schedule_meetings');
    }
    return false;
  }, [requiresConfirmation]);

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
    startScan,
    resolve,
    skip,
    generateDraft,
    createTaskFromLoop,
    needsConfirmation,
    reset
  };
};
