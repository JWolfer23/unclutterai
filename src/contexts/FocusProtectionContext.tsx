import { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { useAssistantProfile } from '@/hooks/useAssistantProfile';

export interface QueuedItem {
  id: string;
  type: 'message' | 'notification' | 'task' | 'inbox_scan';
  title: string;
  sender?: string;
  source?: 'gmail' | 'outlook' | 'system';
  timestamp: Date;
  urgency: 'critical' | 'time_sensitive' | 'informational';
  handled: boolean;
  deferredReason?: string;
}

export interface FocusSummary {
  // What arrived during focus
  itemsReceived: number;
  itemsHandled: number;
  itemsDeferred: number;
  itemsNeedingAttention: number;
  
  // Detailed breakdown
  queuedItems: QueuedItem[];
  
  // Session stats
  sessionDurationMinutes: number;
  interruptionsBlocked: number;
  inboxScansDeferred: number;
  
  // UCT reward
  uctEarned: number;
}

interface FocusProtectionState {
  isInFocus: boolean;
  sessionId: string | null;
  startTime: Date | null;
  
  // PROTECTION SYSTEM - not just a timer
  suppressNotifications: boolean;
  suppressAssistantInterruptions: boolean;
  deferInboxScanning: boolean;
  
  queuedItems: QueuedItem[];
  deferredInboxScans: number;
  
  // Track interruption events for analytics
  interruptionLog: Array<{
    timestamp: Date;
    urgency: 'critical' | 'time_sensitive' | 'informational';
    allowed: boolean;
    reason: string;
  }>;
}

interface FocusProtectionContextType {
  state: FocusProtectionState;
  enterFocus: (sessionId: string) => void;
  exitFocus: (uctEarned?: number) => FocusSummary;
  queueItem: (item: Omit<QueuedItem, 'id' | 'timestamp'>) => void;
  markItemHandled: (itemId: string) => void;
  shouldAllowInterruption: (urgency: 'critical' | 'time_sensitive' | 'informational') => boolean;
  deferInboxScan: (source: 'gmail' | 'outlook') => void;
  getQueuedItems: () => QueuedItem[];
  logInterruption: (urgency: 'critical' | 'time_sensitive' | 'informational', allowed: boolean, reason: string) => void;
  getInterruptionLog: () => FocusProtectionState['interruptionLog'];
}

const initialState: FocusProtectionState = {
  isInFocus: false,
  sessionId: null,
  startTime: null,
  suppressNotifications: false,
  suppressAssistantInterruptions: false,
  deferInboxScanning: false,
  queuedItems: [],
  deferredInboxScans: 0,
  interruptionLog: [],
};

const FocusProtectionContext = createContext<FocusProtectionContextType | null>(null);

export const FocusProtectionProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<FocusProtectionState>(initialState);
  const { profile } = useAssistantProfile();
  const itemIdCounter = useRef(0);

  /**
   * Enter Focus Mode - activates full protection system
   * 
   * Default behavior:
   * - Suppress ALL assistant interruptions
   * - Defer inbox scanning silently
   * - Block all notifications except critical
   */
  const enterFocus = useCallback((sessionId: string) => {
    console.log('[FocusProtection] Entering focus mode:', sessionId);
    setState({
      isInFocus: true,
      sessionId,
      startTime: new Date(),
      // PROTECTION DEFAULTS - maximum protection by default
      suppressNotifications: true,
      suppressAssistantInterruptions: true,
      deferInboxScanning: true,
      queuedItems: [],
      deferredInboxScans: 0,
      interruptionLog: [],
    });
  }, []);

  /**
   * Exit Focus Mode - generates comprehensive catch-up summary
   * 
   * Returns:
   * - What arrived during focus
   * - What was deferred
   * - What truly needs attention
   * - UCT earned
   */
  const exitFocus = useCallback((uctEarned: number = 0): FocusSummary => {
    const { queuedItems, interruptionLog, startTime, deferredInboxScans } = state;
    
    const itemsReceived = queuedItems.length;
    const itemsHandled = queuedItems.filter(item => item.handled).length;
    const itemsDeferred = queuedItems.filter(item => !item.handled && item.urgency !== 'critical').length;
    const itemsNeedingAttention = queuedItems.filter(
      item => !item.handled && (item.urgency === 'critical' || item.urgency === 'time_sensitive')
    ).length;
    
    // Calculate session duration
    const sessionDurationMinutes = startTime 
      ? Math.round((Date.now() - startTime.getTime()) / 60000)
      : 0;

    console.log('[FocusProtection] Exiting focus mode. Summary:', {
      itemsReceived,
      itemsHandled,
      itemsDeferred,
      itemsNeedingAttention,
      sessionDurationMinutes,
      interruptionsBlocked: interruptionLog.filter(l => !l.allowed).length,
      inboxScansDeferred: deferredInboxScans,
      uctEarned,
    });

    // Reset state
    setState(initialState);

    return {
      itemsReceived,
      itemsHandled,
      itemsDeferred,
      itemsNeedingAttention,
      queuedItems,
      sessionDurationMinutes,
      interruptionsBlocked: interruptionLog.filter(l => !l.allowed).length,
      inboxScansDeferred: deferredInboxScans,
      uctEarned,
    };
  }, [state]);

  const queueItem = useCallback((item: Omit<QueuedItem, 'id' | 'timestamp'>) => {
    const newItem: QueuedItem = {
      ...item,
      id: `queued-${++itemIdCounter.current}`,
      timestamp: new Date(),
      deferredReason: state.isInFocus ? 'Focus session active' : undefined,
    };

    console.log('[FocusProtection] Queuing item:', newItem.title, 'Urgency:', newItem.urgency, 'Deferred:', !!newItem.deferredReason);

    setState(prev => ({
      ...prev,
      queuedItems: [...prev.queuedItems, newItem],
    }));
  }, [state.isInFocus]);

  /**
   * Defer inbox scan silently - no notification to user
   */
  const deferInboxScan = useCallback((source: 'gmail' | 'outlook') => {
    if (!state.isInFocus) return;
    
    console.log('[FocusProtection] Deferring inbox scan:', source);
    
    setState(prev => ({
      ...prev,
      deferredInboxScans: prev.deferredInboxScans + 1,
      queuedItems: [
        ...prev.queuedItems,
        {
          id: `scan-${++itemIdCounter.current}`,
          type: 'inbox_scan' as const,
          title: `${source.charAt(0).toUpperCase() + source.slice(1)} sync deferred`,
          source,
          timestamp: new Date(),
          urgency: 'informational' as const,
          handled: true, // Considered "handled" by deferral
          deferredReason: 'Focus session active',
        },
      ],
    }));
  }, [state.isInFocus]);

  const markItemHandled = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      queuedItems: prev.queuedItems.map(item =>
        item.id === itemId ? { ...item, handled: true } : item
      ),
    }));
  }, []);

  /**
   * Global interruption rule - PROTECTION FIRST
   * 
   * Default: NO interruptions during focus
   * 
   * May interrupt ONLY if:
   * 1. Urgency is 'critical' (safety net - e.g., security alerts)
   * 2. User explicitly allows via interruptionPreference = 'balanced'
   * 
   * Otherwise: Defer silently
   */
  const shouldAllowInterruption = useCallback((urgency: 'critical' | 'time_sensitive' | 'informational'): boolean => {
    // If not in focus, always allow
    if (!state.isInFocus) return true;

    // Critical items ALWAYS interrupt - safety net
    if (urgency === 'critical') {
      console.log('[FocusProtection] Critical urgency - allowing interruption');
      return true;
    }

    // During focus: default is NO interruptions
    // User must explicitly opt-in to interruptions via profile
    const interruptionPref = profile?.interruptionPreference || 'minimal';

    switch (interruptionPref) {
      case 'minimal':
        // Only critical allowed (already handled above)
        return false;
      case 'time_sensitive':
        return urgency === 'time_sensitive';
      case 'balanced':
        // User explicitly allows all interruptions
        return true;
      default:
        // Default to NO interruptions during focus
        return false;
    }
  }, [state.isInFocus, profile?.interruptionPreference]);

  const logInterruption = useCallback((
    urgency: 'critical' | 'time_sensitive' | 'informational',
    allowed: boolean,
    reason: string
  ) => {
    if (!state.isInFocus) return;

    setState(prev => ({
      ...prev,
      interruptionLog: [
        ...prev.interruptionLog,
        { timestamp: new Date(), urgency, allowed, reason },
      ],
    }));
  }, [state.isInFocus]);

  const getQueuedItems = useCallback(() => state.queuedItems, [state.queuedItems]);
  const getInterruptionLog = useCallback(() => state.interruptionLog, [state.interruptionLog]);

  return (
    <FocusProtectionContext.Provider
      value={{
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
      }}
    >
      {children}
    </FocusProtectionContext.Provider>
  );
};

export const useFocusProtectionContext = () => {
  const context = useContext(FocusProtectionContext);
  if (!context) {
    throw new Error('useFocusProtectionContext must be used within FocusProtectionProvider');
  }
  return context;
};
