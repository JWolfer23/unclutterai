import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Memory item types
interface DeferredLoop {
  id: string;
  title: string;
  sender?: string;
  deferredAt: Date;
  reason?: string;
}

interface TodayPriority {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  addedAt: Date;
}

interface FocusSessionContext {
  id: string;
  mode: string;
  goal?: string;
  startTime: Date;
  endTime?: Date;
  actualMinutes?: number;
  itemsHandled?: number;
  itemsDeferred?: number;
}

interface AssistantMemoryState {
  // Core memory items
  lastUnresolvedLoop: DeferredLoop | null;
  todayPriorities: TodayPriority[];
  recentFocusSession: FocusSessionContext | null;
  
  // Navigation context
  lastVisitedScreen: string | null;
  lastVisitedAt: Date | null;
  
  // Conversation continuity
  lastMentionedItem: string | null;
  pendingFollowUp: string | null;
}

interface AssistantMemoryContextType {
  memory: AssistantMemoryState;
  
  // Update functions
  setLastUnresolvedLoop: (loop: DeferredLoop | null) => void;
  addTodayPriority: (priority: Omit<TodayPriority, 'addedAt'>) => void;
  updatePriorityStatus: (id: string, status: TodayPriority['status']) => void;
  setRecentFocusSession: (session: FocusSessionContext | null) => void;
  setLastVisitedScreen: (screen: string) => void;
  setLastMentionedItem: (item: string | null) => void;
  setPendingFollowUp: (followUp: string | null) => void;
  
  // Contextual phrase generators
  getContextualGreeting: () => string;
  getLoopReferencePhrase: () => string | null;
  getFocusReferencePhrase: () => string | null;
  getPriorityReferencePhrase: () => string | null;
  
  // Memory sync
  syncFromDatabase: () => Promise<void>;
  clearMemory: () => void;
}

const STORAGE_KEY = 'assistant_memory';

const initialState: AssistantMemoryState = {
  lastUnresolvedLoop: null,
  todayPriorities: [],
  recentFocusSession: null,
  lastVisitedScreen: null,
  lastVisitedAt: null,
  lastMentionedItem: null,
  pendingFollowUp: null,
};

// Load from localStorage with date revival
const loadFromStorage = (): AssistantMemoryState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialState;
    
    const parsed = JSON.parse(stored, (key, value) => {
      // Revive date strings
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        return new Date(value);
      }
      return value;
    });
    
    // Filter out stale priorities (older than today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (parsed.todayPriorities) {
      parsed.todayPriorities = parsed.todayPriorities.filter((p: TodayPriority) => {
        const addedDate = new Date(p.addedAt);
        addedDate.setHours(0, 0, 0, 0);
        return addedDate.getTime() === today.getTime();
      });
    }
    
    return { ...initialState, ...parsed };
  } catch {
    return initialState;
  }
};

const AssistantMemoryContext = createContext<AssistantMemoryContextType | null>(null);

export const AssistantMemoryProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [memory, setMemory] = useState<AssistantMemoryState>(loadFromStorage);

  // Persist to localStorage on changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  }, [memory]);

  // Update functions
  const setLastUnresolvedLoop = useCallback((loop: DeferredLoop | null) => {
    setMemory(prev => ({ ...prev, lastUnresolvedLoop: loop }));
  }, []);

  const addTodayPriority = useCallback((priority: Omit<TodayPriority, 'addedAt'>) => {
    setMemory(prev => ({
      ...prev,
      todayPriorities: [
        ...prev.todayPriorities.filter(p => p.id !== priority.id),
        { ...priority, addedAt: new Date() },
      ],
    }));
  }, []);

  const updatePriorityStatus = useCallback((id: string, status: TodayPriority['status']) => {
    setMemory(prev => ({
      ...prev,
      todayPriorities: prev.todayPriorities.map(p =>
        p.id === id ? { ...p, status } : p
      ),
    }));
  }, []);

  const setRecentFocusSession = useCallback((session: FocusSessionContext | null) => {
    setMemory(prev => ({ ...prev, recentFocusSession: session }));
  }, []);

  const setLastVisitedScreen = useCallback((screen: string) => {
    setMemory(prev => ({
      ...prev,
      lastVisitedScreen: screen,
      lastVisitedAt: new Date(),
    }));
  }, []);

  const setLastMentionedItem = useCallback((item: string | null) => {
    setMemory(prev => ({ ...prev, lastMentionedItem: item }));
  }, []);

  const setPendingFollowUp = useCallback((followUp: string | null) => {
    setMemory(prev => ({ ...prev, pendingFollowUp: followUp }));
  }, []);

  // Contextual phrase generators
  const getContextualGreeting = useCallback((): string => {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    
    // If returning to app after focus
    if (memory.recentFocusSession?.endTime) {
      const minutesAgo = Math.floor((Date.now() - new Date(memory.recentFocusSession.endTime).getTime()) / 60000);
      if (minutesAgo < 30) {
        return `Good ${timeGreeting}. Your ${memory.recentFocusSession.mode || 'focus'} session wrapped up ${minutesAgo} minutes ago.`;
      }
    }
    
    // If there's a pending follow-up
    if (memory.pendingFollowUp) {
      return memory.pendingFollowUp;
    }
    
    // If there are today's priorities
    const pendingPriorities = memory.todayPriorities.filter(p => p.status !== 'completed');
    if (pendingPriorities.length > 0) {
      const topPriority = pendingPriorities.find(p => p.priority === 'high') || pendingPriorities[0];
      return `Good ${timeGreeting}. "${topPriority.title}" is still your top priority.`;
    }
    
    return `Good ${timeGreeting}.`;
  }, [memory]);

  const getLoopReferencePhrase = useCallback((): string | null => {
    if (!memory.lastUnresolvedLoop) return null;
    
    const deferredAt = new Date(memory.lastUnresolvedLoop.deferredAt);
    const hoursAgo = Math.floor((Date.now() - deferredAt.getTime()) / 3600000);
    
    if (hoursAgo < 1) {
      return `Earlier you deferred "${memory.lastUnresolvedLoop.title}"${memory.lastUnresolvedLoop.sender ? ` from ${memory.lastUnresolvedLoop.sender}` : ''}.`;
    } else if (hoursAgo < 24) {
      return `${hoursAgo} hours ago you deferred "${memory.lastUnresolvedLoop.title}".`;
    } else {
      return `You have an unresolved item: "${memory.lastUnresolvedLoop.title}".`;
    }
  }, [memory.lastUnresolvedLoop]);

  const getFocusReferencePhrase = useCallback((): string | null => {
    if (!memory.recentFocusSession) return null;
    
    const session = memory.recentFocusSession;
    const endTime = session.endTime ? new Date(session.endTime) : null;
    
    if (!endTime) {
      return `You're in a ${session.mode || 'focus'} session${session.goal ? ` working on "${session.goal}"` : ''}.`;
    }
    
    const minutesAgo = Math.floor((Date.now() - endTime.getTime()) / 60000);
    
    if (minutesAgo < 60) {
      let phrase = `Your last ${session.mode || 'focus'} session was ${session.actualMinutes || 'a few'} minutes.`;
      if (session.itemsHandled && session.itemsHandled > 0) {
        phrase += ` ${session.itemsHandled} items were handled automatically.`;
      }
      if (session.itemsDeferred && session.itemsDeferred > 0) {
        phrase += ` ${session.itemsDeferred} items were deferred for your review.`;
      }
      return phrase;
    }
    
    return null;
  }, [memory.recentFocusSession]);

  const getPriorityReferencePhrase = useCallback((): string | null => {
    const pendingPriorities = memory.todayPriorities.filter(p => p.status !== 'completed');
    
    if (pendingPriorities.length === 0) return null;
    
    const highPriority = pendingPriorities.filter(p => p.priority === 'high');
    
    if (highPriority.length > 0) {
      if (highPriority.length === 1) {
        return `"${highPriority[0].title}" remains your top priority today.`;
      }
      return `You have ${highPriority.length} high-priority items remaining.`;
    }
    
    return `${pendingPriorities.length} priorities remain for today.`;
  }, [memory.todayPriorities]);

  // Sync from database
  const syncFromDatabase = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Fetch recent focus session
      const { data: focusSession } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (focusSession) {
        setRecentFocusSession({
          id: focusSession.id,
          mode: focusSession.mode || 'focus',
          goal: focusSession.goal || undefined,
          startTime: new Date(focusSession.start_time),
          endTime: focusSession.end_time ? new Date(focusSession.end_time) : undefined,
          actualMinutes: focusSession.actual_minutes || undefined,
        });
      }

      // Fetch today's high priority tasks
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('priority', 'high')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      if (tasks && tasks.length > 0) {
        tasks.forEach(task => {
          addTodayPriority({
            id: task.id,
            title: task.title,
            priority: task.priority as 'high' | 'medium' | 'low',
            status: task.status === 'completed' ? 'completed' : 'pending',
          });
        });
      }

      // Fetch last deferred message (unresolved loop)
      const { data: deferredMessage } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .eq('is_read', false)
        .not('metadata->unclutter_outcome', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (deferredMessage) {
        setLastUnresolvedLoop({
          id: deferredMessage.id,
          title: deferredMessage.subject,
          sender: deferredMessage.sender_name,
          deferredAt: new Date(deferredMessage.updated_at || deferredMessage.created_at || new Date()),
        });
      }
    } catch (error) {
      console.error('[AssistantMemory] Sync error:', error);
    }
  }, [user?.id, setRecentFocusSession, addTodayPriority, setLastUnresolvedLoop]);

  // Initial sync on mount
  useEffect(() => {
    if (user?.id) {
      syncFromDatabase();
    }
  }, [user?.id, syncFromDatabase]);

  const clearMemory = useCallback(() => {
    setMemory(initialState);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AssistantMemoryContext.Provider
      value={{
        memory,
        setLastUnresolvedLoop,
        addTodayPriority,
        updatePriorityStatus,
        setRecentFocusSession,
        setLastVisitedScreen,
        setLastMentionedItem,
        setPendingFollowUp,
        getContextualGreeting,
        getLoopReferencePhrase,
        getFocusReferencePhrase,
        getPriorityReferencePhrase,
        syncFromDatabase,
        clearMemory,
      }}
    >
      {children}
    </AssistantMemoryContext.Provider>
  );
};

export const useAssistantMemory = () => {
  const context = useContext(AssistantMemoryContext);
  if (!context) {
    throw new Error('useAssistantMemory must be used within AssistantMemoryProvider');
  }
  return context;
};

export type { DeferredLoop, TodayPriority, FocusSessionContext, AssistantMemoryState };
