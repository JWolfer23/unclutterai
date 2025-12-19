import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAssistantProfile, AssistantRole } from '@/hooks/useAssistantProfile';

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  actionName: string;
  explanation: string;
  suggestion: string;
}

interface AssistantReadOnlyContextType {
  isReadOnly: boolean;
  currentRole: AssistantRole;
  interceptExecution: (actionName: string) => boolean;
  tooltipState: TooltipState;
  showTooltip: (element: HTMLElement | null, actionName: string, explanation?: string, suggestion?: string) => void;
  hideTooltip: () => void;
}

// Role-based action permissions
const ANALYST_BLOCKED_ACTIONS = new Set([
  'sendMessage',
  'autoReply',
]);

const ANALYST_REQUIRES_CONFIRMATION = new Set([
  'createTask',
  'updateTask',
  'deleteTask',
  'archiveMessage',
  'scheduleAction',
  'draftReply',
  'startFocusSession',
  'claimUCT',
  'spendUCT',
]);

// Calm explanations for blocked actions
const BLOCKED_EXPLANATIONS: Record<string, { message: string; suggestion: string }> = {
  sendMessage: {
    message: 'I can\'t send messages directly in Analyst mode.',
    suggestion: 'I can draft this for your review, or you can enable Operator mode for autonomous sending.',
  },
  autoReply: {
    message: 'Autonomous replies require Operator mode.',
    suggestion: 'I can suggest a reply for you to send manually, or upgrade to Operator mode.',
  },
  default: {
    message: 'This action requires additional permissions.',
    suggestion: 'Check your assistant settings to enable this capability.',
  },
};

const AssistantReadOnlyContext = createContext<AssistantReadOnlyContextType | undefined>(undefined);

export const AssistantReadOnlyProvider = ({ children }: { children: ReactNode }) => {
  const { isOperator, isLoading, profile } = useAssistantProfile();
  
  const currentRole: AssistantRole = profile?.role || 'analyst';
  const isAnalyst = !isOperator();
  
  // Analyst mode is read-only for certain actions
  const isReadOnly = isAnalyst;

  const [tooltipState, setTooltipState] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    actionName: '',
    explanation: '',
    suggestion: '',
  });

  const showTooltip = useCallback((
    element: HTMLElement | null, 
    actionName: string,
    explanation?: string,
    suggestion?: string
  ) => {
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const explanationData = BLOCKED_EXPLANATIONS[actionName] || BLOCKED_EXPLANATIONS.default;
    
    setTooltipState({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      actionName,
      explanation: explanation || explanationData.message,
      suggestion: suggestion || explanationData.suggestion,
    });

    // Auto-hide after 4 seconds
    setTimeout(() => {
      setTooltipState(prev => ({ ...prev, visible: false }));
    }, 4000);
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltipState(prev => ({ ...prev, visible: false }));
  }, []);

  const interceptExecution = useCallback((actionName: string): boolean => {
    // Skip if still loading - don't block
    if (isLoading) {
      return false;
    }
    
    // Operators have full access
    if (!isAnalyst) {
      return false;
    }
    
    // Analysts are blocked from certain actions
    if (ANALYST_BLOCKED_ACTIONS.has(actionName)) {
      console.log(`[Assistant] Analyst blocked from: ${actionName}`);
      return true;
    }
    
    // Analysts require confirmation for other actions (handled by caller)
    if (ANALYST_REQUIRES_CONFIRMATION.has(actionName)) {
      console.log(`[Assistant] Analyst requires confirmation for: ${actionName}`);
      // Don't block, but log - confirmation handled by useRoleExecution
      return false;
    }
    
    return false;
  }, [isLoading, isAnalyst]);

  return (
    <AssistantReadOnlyContext.Provider
      value={{
        isReadOnly,
        currentRole,
        interceptExecution,
        tooltipState,
        showTooltip,
        hideTooltip,
      }}
    >
      {children}
    </AssistantReadOnlyContext.Provider>
  );
};

export const useAssistantReadOnly = () => {
  const context = useContext(AssistantReadOnlyContext);
  if (!context) {
    // Return safe defaults if used outside provider
    return {
      isReadOnly: true,
      currentRole: 'analyst' as AssistantRole,
      interceptExecution: () => true,
      tooltipState: { visible: false, x: 0, y: 0, actionName: '', explanation: '', suggestion: '' },
      showTooltip: () => {},
      hideTooltip: () => {},
    };
  }
  return context;
};
