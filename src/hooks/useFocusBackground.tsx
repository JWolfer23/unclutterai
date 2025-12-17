import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUCTStake } from './useUCTStake';
import { useAssistantProfile } from './useAssistantProfile';
import { useActionLog } from './useActionLog';

export interface AutoAction {
  type: 'archived' | 'snoozed' | 'labeled';
  messageId: string;
  sender: string;
  subject: string;
  reason: string;
}

export interface FocusBackgroundState {
  sessionId: string | null;
  messagesArrived: number;
  messagesAutoHandled: number;
  messagesNeedingReview: Array<{
    id: string;
    sender: string;
    subject: string;
    reason: string;
  }>;
  autoActions: AutoAction[];
  isTracking: boolean;
}

const initialState: FocusBackgroundState = {
  sessionId: null,
  messagesArrived: 0,
  messagesAutoHandled: 0,
  messagesNeedingReview: [],
  autoActions: [],
  isTracking: false,
};

export const useFocusBackground = () => {
  const [state, setState] = useState<FocusBackgroundState>(initialState);
  const sessionStartTime = useRef<Date | null>(null);
  const { capabilities } = useUCTStake();
  const { profile, canAutoHandle, isOperator } = useAssistantProfile();
  const { logAction } = useActionLog();
  
  // Check if user has autonomy capability from staking OR assistant profile
  const hasAutonomyCapability = 
    capabilities?.includes('auto_close_emails') || 
    canAutoHandle('auto_handle_low_risk') ||
    (isOperator() && profile?.allowedActions.archive_items);

  const startTracking = useCallback((sessionId: string) => {
    sessionStartTime.current = new Date();
    setState({
      ...initialState,
      sessionId,
      isTracking: true,
    });
  }, []);

  const stopTracking = useCallback(() => {
    setState(prev => ({ ...prev, isTracking: false }));
  }, []);

  // Simulate processing messages that arrived during session
  // In production, this would query messages received after sessionStartTime
  const processSessionMessages = useCallback(async (): Promise<FocusBackgroundState> => {
    if (!state.sessionId || !sessionStartTime.current) {
      return state;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return state;

      // Fetch messages that arrived during the focus session
      const { data: messages, error } = await supabase
        .from('messages')
        .select('id, sender_name, sender_email, subject, priority_score, is_spam, spam_guard_result')
        .eq('user_id', user.user.id)
        .gte('created_at', sessionStartTime.current.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (error || !messages) {
        console.error('Error fetching session messages:', error);
        return state;
      }

      const autoActions: AutoAction[] = [];
      const needsReview: FocusBackgroundState['messagesNeedingReview'] = [];

      for (const msg of messages) {
        // Determine if message can be auto-handled
        // Low priority (1-2), spam, or newsletters get auto-archived
        const isLowPriority = (msg.priority_score ?? 3) <= 2;
        const isSpam = msg.is_spam === true;
        const isNewsletter = msg.subject?.toLowerCase().includes('newsletter') ||
                            msg.subject?.toLowerCase().includes('unsubscribe') ||
                            msg.sender_email?.includes('noreply');
        
        const canAutoHandle = hasAutonomyCapability && (isLowPriority || isSpam || isNewsletter);
        
        if (canAutoHandle) {
          // Auto-archive low-risk messages
          let reason = 'Low priority';
          if (isSpam) reason = 'Detected as spam';
          if (isNewsletter) reason = 'Newsletter or promotional';
          
          autoActions.push({
            type: 'archived',
            messageId: msg.id,
            sender: msg.sender_name || msg.sender_email || 'Unknown',
            subject: msg.subject || 'No subject',
            reason,
          });

          // Actually archive the message if user has capability
          await supabase
            .from('messages')
            .update({ is_archived: true, auto_archived_at: new Date().toISOString() })
            .eq('id', msg.id);

          // Log the action
          try {
            await logAction({
              actionType: 'archive',
              targetType: 'message',
              targetId: msg.id,
              what: `Archived "${msg.subject || 'No subject'}" from ${msg.sender_name || msg.sender_email || 'Unknown'}`,
              why: reason,
              context: { originalState: { is_archived: false } },
              isUndoable: true,
              source: 'focus_session',
            });
          } catch (err) {
            console.error('Failed to log action:', err);
          }
        } else if (!isSpam) {
          // Queue for review (skip spam)
          needsReview.push({
            id: msg.id,
            sender: msg.sender_name || msg.sender_email || 'Unknown',
            subject: msg.subject || 'No subject',
            reason: 'Needs your attention',
          });
        }
      }

      const newState: FocusBackgroundState = {
        ...state,
        messagesArrived: messages.length,
        messagesAutoHandled: autoActions.length,
        messagesNeedingReview: needsReview.slice(0, 3), // Show max 3
        autoActions,
        isTracking: false,
      };

      setState(newState);
      return newState;
    } catch (err) {
      console.error('Error processing session messages:', err);
      return state;
    }
  }, [state, hasAutonomyCapability]);

  const reset = useCallback(() => {
    sessionStartTime.current = null;
    setState(initialState);
  }, []);

  return {
    state,
    startTracking,
    stopTracking,
    processSessionMessages,
    reset,
    hasAutonomyCapability,
  };
};
