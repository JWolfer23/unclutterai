import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useAssistantProfile } from './useAssistantProfile';
import { useBetaUCT } from './useBetaUCT';
import { useActionLog } from './useActionLog';
import { useOnboardingMissions } from './useOnboardingMissions';
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

// Background batch intelligence - not exposed to UI
interface LoopAnalysis {
  messageId: string;
  suggestedAction: LoopAction;
  confidence: number;
  reasoning: string;
  draftReply?: string;
  relatedLoopIds?: string[];
  pattern?: string;
  research?: string;
}

interface BatchIntelligence {
  analyses: Map<string, LoopAnalysis>;
  patterns: Array<{ id: string; type: string; description: string; messageIds: string[] }>;
  groups: Array<{ id: string; reason: string; messageIds: string[]; suggestedBatchAction?: LoopAction }>;
  isReady: boolean;
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

  // Batch intelligence - runs in background, never exposed to UI
  const batchIntelRef = useRef<BatchIntelligence>({
    analyses: new Map(),
    patterns: [],
    groups: [],
    isReady: false
  });
  const batchAnalysisPromiseRef = useRef<Promise<void> | null>(null);

  const { toast } = useToast();
  const { canAutoHandle, requiresConfirmation } = useAssistantProfile();
  const { addUCT, data: uctData } = useBetaUCT();
  const { logAction } = useActionLog();
  const { checkAndCompleteMission } = useOnboardingMissions();

  const currentLoop = loops[currentIndex] || null;
  const totalLoops = loops.length;

  // Background batch analysis - runs silently after scan
  const runBatchAnalysis = useCallback(async (messageIds: string[]) => {
    if (messageIds.length === 0) return;

    try {
      console.log('[Batch Intel] Starting background analysis...');
      const { data, error } = await supabase.functions.invoke('unclutter-batch-analyze', {
        body: { messageIds }
      });

      if (error) {
        console.error('[Batch Intel] Analysis failed:', error);
        return;
      }

      // Store analyses in map for quick lookup
      const analysesMap = new Map<string, LoopAnalysis>();
      (data?.analyses || []).forEach((analysis: LoopAnalysis) => {
        analysesMap.set(analysis.messageId, analysis);
      });

      batchIntelRef.current = {
        analyses: analysesMap,
        patterns: data?.patterns || [],
        groups: data?.groups || [],
        isReady: true
      };

      console.log(`[Batch Intel] Ready: ${analysesMap.size} analyses, ${data?.patterns?.length || 0} patterns`);
    } catch (error) {
      console.error('[Batch Intel] Background analysis error:', error);
    }
  }, []);

  // Start scan - fetch unread emails
  const startScan = useCallback(async () => {
    setPhase('scanning');
    setIsLoading(true);
    setLoopsResolved(0);
    setCurrentIndex(0);
    
    // Reset batch intelligence
    batchIntelRef.current = { analyses: new Map(), patterns: [], groups: [], isReady: false };

    try {
      const { data, error } = await supabase.functions.invoke('unclutter-scan');

      if (error) throw error;

      const fetchedLoops = data?.loops || [];
      setLoops(fetchedLoops);

      if (fetchedLoops.length === 0) {
        setPhase('complete');
      } else {
        setPhase('resolving');
        
        // Start batch analysis in background - user sees first loop immediately
        const messageIds = fetchedLoops.map((l: Loop) => l.messageId);
        batchAnalysisPromiseRef.current = runBatchAnalysis(messageIds);
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
  }, [toast, runBatchAnalysis]);

  // Advance to next loop or complete
  const advance = useCallback(() => {
    setAiDraft(null);
    if (currentIndex < loops.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setPhase('complete');
      // Trigger first unclutter mission on session complete
      checkAndCompleteMission('first_unclutter');
    }
  }, [currentIndex, loops.length, checkAndCompleteMission]);

  // Get AI suggestion for current loop (from batch intel, not exposed to UI)
  const getAISuggestion = useCallback((): LoopAnalysis | null => {
    if (!currentLoop || !batchIntelRef.current.isReady) return null;
    return batchIntelRef.current.analyses.get(currentLoop.messageId) || null;
  }, [currentLoop]);

  // Resolve current loop with an action and award UCT - persists outcome to database
  const resolve = useCallback(async (action: LoopAction) => {
    if (!currentLoop) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let uctReward = UCT_REWARDS.loop_resolved; // Base reward
      
      // Bonus if user followed AI suggestion (hidden mechanic)
      const suggestion = getAISuggestion();
      if (suggestion && suggestion.suggestedAction === action && suggestion.confidence > 0.7) {
        uctReward += 0.5; // Small bonus for alignment
      }

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
        // Conscious ignore still earns clarity reward
        uctReward += UCT_REWARDS.loop_ignore || 0;
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
  }, [currentLoop, advance, toast, addUCT, logAction, getAISuggestion]);

  // Generate AI draft for reply - uses batch intel if available
  const generateDraft = useCallback(async () => {
    if (!currentLoop) return null;

    // Check if we have a pre-generated draft from batch analysis
    const suggestion = getAISuggestion();
    if (suggestion?.draftReply) {
      setAiDraft(suggestion.draftReply);
      return suggestion.draftReply;
    }

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
  }, [currentLoop, toast, getAISuggestion]);

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
    if (action === 'schedule' && uctData?.skipScheduleConfirm) {
      return false;
    }
    
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
    batchIntelRef.current = { analyses: new Map(), patterns: [], groups: [], isReady: false };
    batchAnalysisPromiseRef.current = null;
  }, []);

  return {
    // Public API - simple, sequential UX
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
    // Note: Batch intelligence is intentionally NOT exposed
    // The UI remains simple: one loop at a time, five outcomes
  };
};
