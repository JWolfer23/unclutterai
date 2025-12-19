import { useFocusProtectionContext, QueuedItem, FocusSummary } from '@/contexts/FocusProtectionContext';

export type { QueuedItem, FocusSummary };

/**
 * Hook for accessing focus protection state and actions.
 * 
 * Global interruption rules:
 * - Default: No interruptions during focus
 * - May interrupt ONLY if user explicitly allows OR urgency is critical
 * - Otherwise: Defer and log for post-focus summary
 */
export const useFocusProtection = () => {
  const {
    state,
    enterFocus,
    exitFocus,
    queueItem,
    markItemHandled,
    shouldAllowInterruption,
    getQueuedItems,
    logInterruption,
    getInterruptionLog,
  } = useFocusProtectionContext();

  return {
    // State
    isInFocus: state.isInFocus,
    sessionId: state.sessionId,
    startTime: state.startTime,
    suppressNotifications: state.suppressNotifications,
    queuedItemsCount: state.queuedItems.length,
    interruptionLogCount: state.interruptionLog.length,

    // Actions
    enterFocus,
    exitFocus,
    queueItem,
    markItemHandled,
    shouldAllowInterruption,
    getQueuedItems,
    logInterruption,
    getInterruptionLog,
  };
};
