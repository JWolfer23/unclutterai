import { useCallback, useRef } from 'react';
import { useAssistantReadOnly } from '@/contexts/AssistantReadOnlyContext';

type ExecutionAction = 
  | 'createTask'
  | 'updateTask'
  | 'deleteTask'
  | 'startFocusSession'
  | 'completeFocusSession'
  | 'claimUCT'
  | 'spendUCT'
  | 'sendMessage'
  | 'archiveMessage'
  | 'scheduleAction'
  | 'autoReply';

interface ExecutionResult {
  blocked: boolean;
  showTooltip: () => void;
  explanation: string;
}

const ACTION_EXPLANATIONS: Record<ExecutionAction, string> = {
  createTask: 'I would create a new task with the specified parameters.',
  updateTask: 'I would update the task status and metadata.',
  deleteTask: 'I would remove this task from your list.',
  startFocusSession: 'I would initiate a focus session with your preferences.',
  completeFocusSession: 'I would mark this session complete and calculate rewards.',
  claimUCT: 'I would transfer your earned UCT to claimable balance.',
  spendUCT: 'I would deduct UCT for this action.',
  sendMessage: 'I would send this message on your behalf.',
  archiveMessage: 'I would archive this message.',
  scheduleAction: 'I would schedule this action for the specified time.',
  autoReply: 'I would draft and queue an automated response.',
};

export const useReadOnlyExecution = () => {
  const { isReadOnly, interceptExecution, showTooltip } = useAssistantReadOnly();
  const tooltipAnchorRef = useRef<HTMLElement | null>(null);

  const canExecute = !isReadOnly;

  const attemptExecution = useCallback((
    action: ExecutionAction,
    anchorElement?: HTMLElement | null
  ): ExecutionResult => {
    const blocked = interceptExecution(action);

    if (blocked && anchorElement) {
      tooltipAnchorRef.current = anchorElement;
    }

    return {
      blocked,
      showTooltip: () => {
        if (blocked) {
          showTooltip(anchorElement || tooltipAnchorRef.current, action);
        }
      },
      explanation: ACTION_EXPLANATIONS[action] || 'I would execute this action.',
    };
  }, [interceptExecution, showTooltip]);

  const getExplanation = useCallback((action: ExecutionAction): string => {
    return ACTION_EXPLANATIONS[action] || 'I would execute this action.';
  }, []);

  return {
    canExecute,
    attemptExecution,
    getExplanation,
    isReadOnly,
  };
};
