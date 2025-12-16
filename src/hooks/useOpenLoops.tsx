import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMessages } from './useMessages';
import { useTasks } from './useTasks';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';

export interface OpenLoop {
  id: string;
  type: 'email' | 'task' | 'draft';
  source_id: string;
  summary: string;
  action_required: string | null;
  deadline_sensitivity: 'urgent' | 'soon' | 'flexible' | 'none';
  emotional_weight?: 'heavy' | 'neutral' | 'light';
  suggested_action: 'reply' | 'schedule' | 'ignore' | 'archive' | 'create_task';
  effort_estimate: number;
  group: 'quick_closes' | 'decisions_needed' | 'waiting_on_others' | 'noise';
  original_data?: any;
}

export interface LoopResolution {
  loop_id: string;
  outcome: 'done' | 'scheduled' | 'delegated' | 'archived' | 'ignored';
  timestamp: Date;
  time_spent_seconds?: number;
}

export interface LoopInventory {
  loops: OpenLoop[];
  groups: {
    quick_closes: OpenLoop[];
    decisions_needed: OpenLoop[];
    waiting_on_others: OpenLoop[];
    noise: OpenLoop[];
  };
  total_count: number;
  estimated_clear_time_minutes: number;
}

export type UnclutterPhase = 'idle' | 'scanning' | 'compressing' | 'grouping' | 'resolving' | 'complete';

export const useOpenLoops = () => {
  const [phase, setPhase] = useState<UnclutterPhase>('idle');
  const [inventory, setInventory] = useState<LoopInventory | null>(null);
  const [currentLoopIndex, setCurrentLoopIndex] = useState(0);
  const [currentGroup, setCurrentGroup] = useState<keyof LoopInventory['groups']>('quick_closes');
  const [resolutions, setResolutions] = useState<LoopResolution[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState<string | null>(null);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  const { toast } = useToast();
  const { updateMessage } = useMessages();
  const { createTask } = useTasks();
  const { user } = useAuth();

  const currentLoops = inventory?.groups[currentGroup] || [];
  const currentLoop = currentLoops[currentLoopIndex] || null;
  const totalResolved = resolutions.length;
  const totalLoops = inventory?.total_count || 0;

  const startScan = useCallback(async () => {
    setPhase('scanning');
    setSessionStartTime(new Date());
    setIsLoading(true);

    try {
      // Simulate scan phases for UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPhase('compressing');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPhase('grouping');

      const { data, error } = await supabase.functions.invoke('process-open-loops', {
        body: { action: 'scan' }
      });

      if (error) throw error;

      setInventory(data as LoopInventory);
      
      // Auto-select first non-empty group
      const groups = data.groups as LoopInventory['groups'];
      if (groups.quick_closes.length > 0) {
        setCurrentGroup('quick_closes');
      } else if (groups.decisions_needed.length > 0) {
        setCurrentGroup('decisions_needed');
      } else if (groups.waiting_on_others.length > 0) {
        setCurrentGroup('waiting_on_others');
      } else if (groups.noise.length > 0) {
        setCurrentGroup('noise');
      }

      setPhase('resolving');
    } catch (error) {
      console.error('Error scanning loops:', error);
      toast({
        title: "Scan failed",
        description: "Could not scan for open loops. Please try again.",
        variant: "destructive"
      });
      setPhase('idle');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const selectGroup = useCallback((group: keyof LoopInventory['groups']) => {
    setCurrentGroup(group);
    setCurrentLoopIndex(0);
    setAiDraft(null);
  }, []);

  const resolveLoop = useCallback(async (outcome: LoopResolution['outcome']) => {
    if (!currentLoop) return;

    const resolution: LoopResolution = {
      loop_id: currentLoop.id,
      outcome,
      timestamp: new Date()
    };

    setResolutions(prev => [...prev, resolution]);

    // Handle the resolution based on outcome
    try {
      if (outcome === 'archived' && currentLoop.type === 'email') {
        updateMessage({ 
          id: currentLoop.source_id, 
          updates: {
            is_read: true, 
            is_archived: true 
          }
        });
      }

      // Move to next loop or complete
      if (currentLoopIndex < currentLoops.length - 1) {
        setCurrentLoopIndex(prev => prev + 1);
        setAiDraft(null);
      } else {
        // Check if there are loops in other groups
        const remainingGroups = Object.entries(inventory?.groups || {})
          .filter(([key, loops]) => key !== currentGroup && loops.length > 0);

        if (remainingGroups.length > 0) {
          // Move to next group with loops
          const [nextGroup] = remainingGroups[0];
          setCurrentGroup(nextGroup as keyof LoopInventory['groups']);
          setCurrentLoopIndex(0);
          setAiDraft(null);
        } else {
          // All loops resolved
          setPhase('complete');
        }
      }
    } catch (error) {
      console.error('Error resolving loop:', error);
      toast({
        title: "Action failed",
        description: "Could not complete the action. Please try again.",
        variant: "destructive"
      });
    }
  }, [currentLoop, currentLoopIndex, currentLoops.length, currentGroup, inventory, updateMessage, toast]);

  const convertToTask = useCallback(async () => {
    if (!currentLoop || !user) return;

    try {
      createTask({
        title: currentLoop.summary,
        description: currentLoop.action_required || undefined,
        priority: currentLoop.deadline_sensitivity === 'urgent' ? 'high' : 
                  currentLoop.deadline_sensitivity === 'soon' ? 'medium' : 'low',
        user_id: user.id
      });

      toast({
        title: "Task created",
        description: "Loop converted to task successfully."
      });

      await resolveLoop('done');
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Failed to create task",
        variant: "destructive"
      });
    }
  }, [currentLoop, user, createTask, resolveLoop, toast]);

  const generateReplyDraft = useCallback(async () => {
    if (!currentLoop || currentLoop.type !== 'email') return;

    setIsGeneratingDraft(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-blocks', {
        body: {
          action: 'auto_reply',
          data: {
            message_id: currentLoop.source_id,
            subject: currentLoop.original_data?.subject || 'Re: Your message',
            content: currentLoop.original_data?.content || currentLoop.summary,
            sender_name: currentLoop.original_data?.sender_name || 'Sender'
          }
        }
      });

      if (error) throw error;
      setAiDraft(data?.draft || 'Unable to generate draft.');
    } catch (error) {
      console.error('Error generating draft:', error);
      toast({
        title: "Draft generation failed",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingDraft(false);
    }
  }, [currentLoop, toast]);

  const getSessionStats = useCallback(() => {
    const timeSpent = sessionStartTime 
      ? Math.round((new Date().getTime() - sessionStartTime.getTime()) / 60000)
      : 0;

    const loopsCleared = resolutions.length;
    const estimatedTimeSaved = loopsCleared * 3; // 3 mins average per loop

    let mentalLoadMessage = "Slightly lighter";
    if (loopsCleared >= 26) mentalLoadMessage = "Dramatically transformed";
    else if (loopsCleared >= 16) mentalLoadMessage = "Significantly reduced";
    else if (loopsCleared >= 6) mentalLoadMessage = "Noticeably clearer";

    // UCT reward calculation
    const baseReward = loopsCleared * 0.05;
    const speedBonus = timeSpent < 10 ? 0.5 : timeSpent < 20 ? 0.25 : 0;
    const uctEarned = Math.min(baseReward + speedBonus, 2.0);

    return {
      loopsCleared,
      timeSpent,
      estimatedTimeSaved,
      mentalLoadMessage,
      uctEarned
    };
  }, [sessionStartTime, resolutions]);

  const reset = useCallback(() => {
    setPhase('idle');
    setInventory(null);
    setCurrentLoopIndex(0);
    setCurrentGroup('quick_closes');
    setResolutions([]);
    setSessionStartTime(null);
    setAiDraft(null);
  }, []);

  return {
    phase,
    inventory,
    currentLoop,
    currentGroup,
    currentLoopIndex,
    currentLoops,
    totalResolved,
    totalLoops,
    isLoading,
    aiDraft,
    isGeneratingDraft,
    startScan,
    selectGroup,
    resolveLoop,
    convertToTask,
    generateReplyDraft,
    getSessionStats,
    reset
  };
};
