import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAssistantProfile } from '@/hooks/useAssistantProfile';

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  actionName: string;
}

interface AssistantReadOnlyContextType {
  isReadOnly: boolean;
  interceptExecution: (actionName: string) => boolean;
  tooltipState: TooltipState;
  showTooltip: (element: HTMLElement | null, actionName: string) => void;
  hideTooltip: () => void;
}

const AssistantReadOnlyContext = createContext<AssistantReadOnlyContextType | undefined>(undefined);

export const AssistantReadOnlyProvider = ({ children }: { children: ReactNode }) => {
  const { isOperator } = useAssistantProfile();
  
  // TEMPORARY: Disable tier restrictions - log but don't block
  // Everyone treated as analyst with basic responses allowed
  const actualTierCheck = !isOperator();
  const isReadOnly = false; // Bypassed - never block
  
  if (actualTierCheck) {
    console.log('[Assistant] Tier check: user would be read-only, but restrictions are temporarily disabled');
  }

  const [tooltipState, setTooltipState] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    actionName: '',
  });

  const showTooltip = useCallback((element: HTMLElement | null, actionName: string) => {
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    setTooltipState({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      actionName,
    });

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setTooltipState(prev => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltipState(prev => ({ ...prev, visible: false }));
  }, []);

  const interceptExecution = useCallback((actionName: string): boolean => {
    // TEMPORARY: Log tier check but never block
    if (actualTierCheck) {
      console.log(`[Assistant] Execution intercepted (logged only): ${actionName}`);
    }
    return false; // Never block - restrictions temporarily disabled
  }, [actualTierCheck]);

  return (
    <AssistantReadOnlyContext.Provider
      value={{
        isReadOnly,
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
      interceptExecution: () => true,
      tooltipState: { visible: false, x: 0, y: 0, actionName: '' },
      showTooltip: () => {},
      hideTooltip: () => {},
    };
  }
  return context;
};
