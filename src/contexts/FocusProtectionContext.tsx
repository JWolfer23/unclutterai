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
}

interface FocusProtectionContextType {
  state: FocusProtectionState;
  enterFocus: (sessionId: string) => void;
  exitFocus: () => FocusSummary;
  queueItem: (item: Omit<QueuedItem, 'id' | 'timestamp'>) => void;
  markItemHandled: (itemId: string) => void;
  shouldAllowInterruption: (urgency: 'critical' | 'time_sensitive' | 'informational') => boolean;
  getQueuedItems: () => QueuedItem[];
}

const initialState: FocusProtectionState = {
  isInFocus: false,
  sessionId: null,
  startTime: null,
  suppressNotifications: false,
  queuedItems: [],
};

const FocusProtectionContext = createContext<FocusProtectionContextType | null>(null);

export const FocusProtectionProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<FocusProtectionState>(initialState);
  const { profile, shouldInterrupt } = useAssistantProfile();
  const itemIdCounter = useRef(0);

  const enterFocus = useCallback((sessionId: string) => {
    setState({
      isInFocus: true,
      sessionId,
      startTime: new Date(),
      suppressNotifications: true,
      queuedItems: [],
    });
  }, []);

  const exitFocus = useCallback((): FocusSummary => {
    const { queuedItems } = state;
    
    const itemsReceived = queuedItems.length;
    const itemsHandled = queuedItems.filter(item => item.handled).length;
    const itemsNeedingAttention = queuedItems.filter(item => !item.handled).length;

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

  const shouldAllowInterruption = useCallback((urgency: 'critical' | 'time_sensitive' | 'informational'): boolean => {
    // If not in focus, always allow
    if (!state.isInFocus) return true;

    // Use assistant profile's interruption preference
    const interruptionPref = profile?.interruptionPreference || 'minimal';

    // Interruption mapping based on preference:
    // - 'minimal' → only 'critical' interrupts
    // - 'time_sensitive' → 'critical' + 'time_sensitive' interrupt
    // - 'balanced' → all levels can interrupt
    switch (interruptionPref) {
      case 'minimal':
        return urgency === 'critical';
      case 'time_sensitive':
        return urgency === 'critical' || urgency === 'time_sensitive';
      case 'balanced':
        return true;
      default:
        // Default to minimal interruptions
        return urgency === 'critical';
    }
  }, [state.isInFocus, profile?.interruptionPreference]);

  const getQueuedItems = useCallback(() => state.queuedItems, [state.queuedItems]);

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
