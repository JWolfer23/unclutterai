import { useFocusProtectionContext, QueuedItem, FocusSummary } from '@/contexts/FocusProtectionContext';

export type { QueuedItem, FocusSummary };

export const useFocusProtection = () => {
  const {
    state,
    enterFocus,
    exitFocus,
    queueItem,
    markItemHandled,
    shouldAllowInterruption,
    getQueuedItems,
  } = useFocusProtectionContext();

  return {
    // State
    isInFocus: state.isInFocus,
    sessionId: state.sessionId,
    startTime: state.startTime,
    suppressNotifications: state.suppressNotifications,
    queuedItemsCount: state.queuedItems.length,

    // Actions
    enterFocus,
    exitFocus,
    queueItem,
    markItemHandled,
    shouldAllowInterruption,
    getQueuedItems,
  };
};
