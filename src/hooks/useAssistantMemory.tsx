import { useAssistantMemory as useAssistantMemoryContext } from '@/contexts/AssistantMemoryContext';

export type { 
  DeferredLoop, 
  TodayPriority, 
  FocusSessionContext, 
  AssistantMemoryState 
} from '@/contexts/AssistantMemoryContext';

/**
 * Hook for accessing and updating assistant memory.
 * 
 * Provides state continuity across navigation by remembering:
 * - Last unresolved loop
 * - Today's priorities
 * - Most recent focus session context
 * 
 * Use contextual phrase generators for natural references:
 * - getLoopReferencePhrase(): "Earlier you deferred..."
 * - getFocusReferencePhrase(): "Your last focus session..."
 * - getPriorityReferencePhrase(): "X remains your top priority..."
 */
export const useAssistantMemory = () => {
  const context = useAssistantMemoryContext();
  
  // Additional helper to get all available context
  const getFullContext = () => {
    const phrases: string[] = [];
    
    const loopPhrase = context.getLoopReferencePhrase();
    if (loopPhrase) phrases.push(loopPhrase);
    
    const focusPhrase = context.getFocusReferencePhrase();
    if (focusPhrase) phrases.push(focusPhrase);
    
    const priorityPhrase = context.getPriorityReferencePhrase();
    if (priorityPhrase) phrases.push(priorityPhrase);
    
    return phrases;
  };
  
  // Check if we have meaningful context to share
  const hasContext = () => {
    return !!(
      context.memory.lastUnresolvedLoop ||
      context.memory.recentFocusSession ||
      context.memory.todayPriorities.length > 0
    );
  };
  
  return {
    ...context,
    getFullContext,
    hasContext,
  };
};
