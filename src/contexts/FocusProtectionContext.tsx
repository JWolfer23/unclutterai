import { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { useAssistantProfile } from '@/hooks/useAssistantProfile';

export interface QueuedItem {
  id: string;
  type: 'message' | 'notification' | 'task';
  title: string;
  sender?: string;
  timestamp: Date;
  urgency: 'critical' | 'time_sensitive' | 'informational';
  handled: boolean;
}

export interface FocusSummary {
  itemsReceived: number;
  itemsHandled: number;
  itemsNeedingAttention: number;
  queuedItems: QueuedItem[];
}

interface FocusProtectionState {
  isInFocus: boolean;
  sessionId: string | null;
  startTime: Date | null;
  suppressNotifications: boolean;
  queuedItems: QueuedItem[];
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
  exitFocus: () => FocusSummary;
  queueItem: (item: Omit<QueuedItem, 'id' | 'timestamp'>) => void;
  markItemHandled: (itemId: string) => void;
  shouldAllowInterruption: (urgency: 'critical' | 'time_sensitive' | 'informational') => boolean;
  getQueuedItems: () => QueuedItem[];
  logInterruption: (urgency: 'critical' | 'time_sensitive' | 'informational', allowed: boolean, reason: string) => void;
  getInterruptionLog: () => FocusProtectionState['interruptionLog'];
}

const initialState: FocusProtectionState = {
  isInFocus: false,
  sessionId: null,
  startTime: null,
  suppressNotifications: false,
  queuedItems: [],
  interruptionLog: [],
};

const FocusProtectionContext = createContext<FocusProtectionContextType | null>(null);

export const FocusProtectionProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<FocusProtectionState>(initialState);
  const { profile } = useAssistantProfile();
  const itemIdCounter = useRef(0);

  const enterFocus = useCallback((sessionId: string) => {
    console.log('[FocusProtection] Entering focus mode:', sessionId);
    setState({
      isInFocus: true,
      sessionId,
      startTime: new Date(),
      suppressNotifications: true,
      queuedItems: [],
      interruptionLog: [],
    });
  }, []);

  const exitFocus = useCallback((): FocusSummary => {
    const { queuedItems, interruptionLog } = state;
    
    const itemsReceived = queuedItems.length;
    const itemsHandled = queuedItems.filter(item => item.handled).length;
    const itemsNeedingAttention = queuedItems.filter(item => !item.handled).length;

    console.log('[FocusProtection] Exiting focus mode. Summary:', {
      itemsReceived,
      itemsHandled,
      itemsNeedingAttention,
      totalInterruptions: interruptionLog.length,
      allowedInterruptions: interruptionLog.filter(l => l.allowed).length,
    });

    // Reset state
    setState(initialState);

    return {
      itemsReceived,
      itemsHandled,
      itemsNeedingAttention,
      queuedItems,
    };
  }, [state]);

  const queueItem = useCallback((item: Omit<QueuedItem, 'id' | 'timestamp'>) => {
    const newItem: QueuedItem = {
      ...item,
      id: `queued-${++itemIdCounter.current}`,
      timestamp: new Date(),
    };

    console.log('[FocusProtection] Queuing item:', newItem.title, 'Urgency:', newItem.urgency);

    setState(prev => ({
      ...prev,
      queuedItems: [...prev.queuedItems, newItem],
    }));
  }, []);

  const markItemHandled = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      queuedItems: prev.queuedItems.map(item =>
        item.id === itemId ? { ...item, handled: true } : item
      ),
    }));
  }, []);

  /**
   * Global interruption rule:
   * 
   * Default: No interruptions during focus
   * 
   * May interrupt ONLY if:
   * 1. User explicitly allows via interruptionPreference
   * 2. OR urgency is 'critical' (always allowed)
   * 
   * Otherwise: Defer
   */
  const shouldAllowInterruption = useCallback((urgency: 'critical' | 'time_sensitive' | 'informational'): boolean => {
    // If not in focus, always allow
    if (!state.isInFocus) return true;

    // Critical items ALWAYS interrupt - safety net
    if (urgency === 'critical') {
      console.log('[FocusProtection] Critical urgency - allowing interruption');
      return true;
    }

    // Use assistant profile's interruption preference
    const interruptionPref = profile?.interruptionPreference || 'minimal';

    // Default during focus: minimal interruptions
    // - 'minimal' → only 'critical' interrupts (already handled above)
    // - 'time_sensitive' → 'critical' + 'time_sensitive' interrupt
    // - 'balanced' → all levels can interrupt (not recommended during focus)
    switch (interruptionPref) {
      case 'minimal':
        // Only critical allowed (already handled)
        return false;
      case 'time_sensitive':
        return urgency === 'time_sensitive';
      case 'balanced':
        // User explicitly allows all interruptions
        return true;
      default:
        // Default to no interruptions during focus
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
