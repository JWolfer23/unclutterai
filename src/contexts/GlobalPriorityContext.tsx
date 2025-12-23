import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { 
  computePriorities, 
  getNextBestActionText,
  PriorityEngineOutput,
  Priority,
  PriorityAction,
} from '@/lib/priorityEngine';
import { useOpenLoops } from '@/hooks/useOpenLoops';
import { useMessages } from '@/hooks/useMessages';
import { useFocusStats } from '@/hooks/useFocusStats';
import { useAssistantProfile } from '@/hooks/useAssistantProfile';

interface GlobalPriorityContextType {
  // Core output from priority engine
  output: PriorityEngineOutput;
  
  // User-facing recommendation (collapsed to single action)
  nextAction: {
    headline: string;
    description: string;
    cta: string;
    href: string;
  };
  
  // Quick access to state
  isAllClear: boolean;
  reassurance: string;
  
  // Raw counts (for internal use only, never expose to user)
  _internal: {
    openLoopsCount: number;
    urgentCount: number;
    calendarConflicts: number;
    focusState: 'idle' | 'active' | 'deferred' | 'completed';
  };
}

const GlobalPriorityContext = createContext<GlobalPriorityContextType | null>(null);

interface GlobalPriorityProviderProps {
  children: ReactNode;
}

export function GlobalPriorityProvider({ children }: GlobalPriorityProviderProps) {
  // Data sources
  const { inventory } = useOpenLoops();
  const { messages } = useMessages();
  const { todayMinutes, recentSessions } = useFocusStats();
  const { profile } = useAssistantProfile();

  // Compute counts with safe defaults
  const openLoopsCount = inventory?.total_count ?? 0;
  const urgentCount = messages?.filter(m => m.priority === 'high' && !m.is_read)?.length ?? 0;
  
  // Determine focus state from recent sessions
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = recentSessions?.filter(s => s.start_time?.startsWith(today)) ?? [];
  const hasActiveFocus = todaySessions.some(s => !s.is_completed && !s.end_time);
  const hasCompletedToday = todaySessions.some(s => s.is_completed);
  
  const focusState: 'idle' | 'active' | 'deferred' | 'completed' = 
    hasActiveFocus ? 'active' : 
    hasCompletedToday ? 'completed' : 
    'idle';

  // Trust violations (items that exceed authority level)
  const trustViolations = 0; // TODO: integrate with trust boundary system

  // Memoized priority computation
  const output = useMemo(() => 
    computePriorities({
      openLoopsCount,
      urgentMessageCount: urgentCount,
      calendarConflicts: 0, // TODO: integrate with calendar
      upcomingDeadlines: 0, // TODO: integrate with tasks due today
      focusState,
      focusMinutesToday: todayMinutes ?? 0,
      trustViolations,
    }), 
    [openLoopsCount, urgentCount, focusState, todayMinutes, trustViolations]
  );

  // User-facing collapsed recommendation
  const nextAction = useMemo(() => 
    getNextBestActionText(output), 
    [output]
  );

  const value: GlobalPriorityContextType = {
    output,
    nextAction,
    isAllClear: output.isAllClear,
    reassurance: output.reassurance,
    _internal: {
      openLoopsCount,
      urgentCount,
      calendarConflicts: 0,
      focusState,
    },
  };

  return (
    <GlobalPriorityContext.Provider value={value}>
      {children}
    </GlobalPriorityContext.Provider>
  );
}

/**
 * Hook to access the Global Priority Engine
 * Returns a single recommendation and reassurance state
 * Never exposes raw priority lists to consumers
 */
export function useGlobalPriority(): GlobalPriorityContextType {
  const context = useContext(GlobalPriorityContext);
  
  if (!context) {
    // Provide safe fallback for components outside provider
    return {
      output: {
        recommendation: null,
        priorities: [],
        isAllClear: true,
        reassurance: "Nothing urgent needs your attention.",
      },
      nextAction: {
        headline: "Nothing urgent needs your attention.",
        description: '',
        cta: '',
        href: '',
      },
      isAllClear: true,
      reassurance: "Nothing urgent needs your attention.",
      _internal: {
        openLoopsCount: 0,
        urgentCount: 0,
        calendarConflicts: 0,
        focusState: 'idle',
      },
    };
  }
  
  return context;
}

/**
 * Hook specifically for assistant responses
 * Returns only what the assistant should say
 */
export function useAssistantPriorityGuidance(): {
  shouldSpeak: boolean;
  message: string;
  action?: PriorityAction;
} {
  const { isAllClear, nextAction, output } = useGlobalPriority();
  
  if (isAllClear) {
    return {
      shouldSpeak: false,
      message: "You're clear. I'll keep watch.",
    };
  }
  
  return {
    shouldSpeak: true,
    message: nextAction.headline,
    action: output.recommendation?.action,
  };
}
