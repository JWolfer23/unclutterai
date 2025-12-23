import { useFocusProtectionContext, QueuedItem, FocusSummary } from '@/contexts/FocusProtectionContext';

export type { QueuedItem, FocusSummary };

/**
 * Hook for accessing Focus Protection System.
 * 
 * Focus Mode is a PROTECTION SYSTEM, not a timer.
 * 
 * During focus:
 * - Suppress all assistant interruptions by default
 * - Defer inbox scanning silently
 * - Do not surface notifications unless user explicitly allows
 * 
 * At focus end:
 * - Generate Focus Catch-Up Summary
 * - Show what arrived, what was deferred, what needs attention
 * - Include reassurance: "Nothing important was missed."
 * - Award UCT for completed sessions
 */
export const useFocusProtection = () => {
  const {
    state,
    enterFocus,
    exitFocus,
    queueItem,
    markItemHandled,
    shouldAllowInterruption,
    deferInboxScan,
    getQueuedItems,
    logInterruption,
    getInterruptionLog,
  } = useFocusProtectionContext();

  return {
    // State
    isInFocus: state.isInFocus,
    sessionId: state.sessionId,
    startTime: state.startTime,
    
    // Protection flags
    suppressNotifications: state.suppressNotifications,
    suppressAssistantInterruptions: state.suppressAssistantInterruptions,
    deferInboxScanning: state.deferInboxScanning,
    
    // Counts
    queuedItemsCount: state.queuedItems.length,
    interruptionLogCount: state.interruptionLog.length,
    deferredInboxScans: state.deferredInboxScans,

    // Actions
    enterFocus,
    exitFocus,
    queueItem,
    markItemHandled,
    shouldAllowInterruption,
    deferInboxScan,
    getQueuedItems,
    logInterruption,
    getInterruptionLog,
  };
};
