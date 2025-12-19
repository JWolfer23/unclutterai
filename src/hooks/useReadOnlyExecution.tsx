import { useCallback, useRef } from 'react';
import { useAssistantReadOnly } from '@/contexts/AssistantReadOnlyContext';
import { useRoleExecution, ActionType } from '@/hooks/useRoleExecution';

// Re-export ActionType for consumers
export type ExecutionAction = ActionType;

interface ExecutionResult {
  blocked: boolean;
  showTooltip: () => void;
  explanation: string;
  suggestion?: string;
  requiresConfirmation: boolean;
}

const ACTION_EXPLANATIONS: Record<ActionType, string> = {
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
  draftReply: 'I would prepare a reply draft for your review.',
  suggest: 'I would provide a suggestion for your consideration.',
  analyze: 'I would analyze this and provide insights.',
};

export const useReadOnlyExecution = () => {
  const { isReadOnly, currentRole, interceptExecution, showTooltip } = useAssistantReadOnly();
  const { checkAction, isOperator, isAnalyst } = useRoleExecution();
  const tooltipAnchorRef = useRef<HTMLElement | null>(null);

  // Operators can execute, analysts are limited
  const canExecute = !isReadOnly || isOperator;

  const attemptExecution = useCallback((
    action: ExecutionAction,
    anchorElement?: HTMLElement | null
  ): ExecutionResult => {
    // Check role-based permissions
    const roleCheck = checkAction(action);
    const blocked = !roleCheck.allowed || interceptExecution(action);

    if (blocked && anchorElement) {
      tooltipAnchorRef.current = anchorElement;
    }

    const explanation = roleCheck.blockedReason || ACTION_EXPLANATIONS[action] || 'I would execute this action.';
    const suggestion = roleCheck.suggestion || undefined;

    return {
      blocked,
      showTooltip: () => {
        if (blocked) {
          showTooltip(anchorElement || tooltipAnchorRef.current, action, explanation, suggestion);
        }
      },
      explanation,
      suggestion,
      requiresConfirmation: roleCheck.requiresConfirmation,
    };
  }, [checkAction, interceptExecution, showTooltip]);

  const getExplanation = useCallback((action: ExecutionAction): string => {
    const roleCheck = checkAction(action);
    if (roleCheck.blockedReason) {
      return roleCheck.blockedReason;
    }
    return ACTION_EXPLANATIONS[action] || 'I would execute this action.';
  }, [checkAction]);

  return {
    canExecute,
    attemptExecution,
    getExplanation,
    isReadOnly,
    currentRole,
    isOperator,
    isAnalyst,
  };
};
