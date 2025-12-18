import { useMemo } from "react";
import { useOpenLoops } from "./useOpenLoops";
import { useMessages } from "./useMessages";
import { useFocusStats } from "./useFocusStats";

export type NextBestAction = {
  type: 'CLOSE_LOOPS' | 'URGENT_REPLIES' | 'START_FOCUS';
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
};

const NBA_CONFIG: Record<NextBestAction['type'], Omit<NextBestAction, 'type'>> = {
  CLOSE_LOOPS: {
    title: 'Clear open loops',
    description: "Close what's unfinished so your mind is quiet.",
    ctaLabel: 'Close loops',
    href: '/clear-open-loops',
  },
  URGENT_REPLIES: {
    title: 'Handle urgent messages',
    description: 'Reply fast to what matters, then move on.',
    ctaLabel: 'Reply now',
    href: '/communication',
  },
  START_FOCUS: {
    title: 'Start focus session',
    description: 'With everything handled, lock in.',
    ctaLabel: 'Start focus',
    href: '/focus',
  },
};

/**
 * Pure selection function - deterministic, no side effects
 * Priority: CLOSE_LOOPS > URGENT_REPLIES > START_FOCUS
 */
export function selectNextBestAction(
  openLoopsCount: number,
  urgentCount: number
): NextBestAction {
  let type: NextBestAction['type'];

  if (openLoopsCount > 0) {
    type = 'CLOSE_LOOPS';
  } else if (urgentCount > 0) {
    type = 'URGENT_REPLIES';
  } else {
    type = 'START_FOCUS';
  }

  return {
    type,
    ...NBA_CONFIG[type],
  };
}

/**
 * Hook that computes the Next Best Action based on current user state.
 * 
 * IMPORTANT: Never blocks rendering. All values have safe defaults (0).
 * Uses data from existing hooks when available.
 */
export function useNextBestAction() {
  // Open loops from scan inventory (0 if no scan has been run)
  const { inventory } = useOpenLoops();
  
  // Messages for urgent count
  const { messages } = useMessages();
  
  // Focus stats for today
  const { todayMinutes, recentSessions, dailySessions } = useFocusStats();

  // Safe counts with fallbacks to 0
  const openLoopsCount = inventory?.total_count ?? 0;
  const urgentCount = messages?.filter(m => m.priority === 'high' && !m.is_read)?.length ?? 0;
  const todayFocusMinutes = todayMinutes ?? 0;
  
  // Calculate today's sessions from dailySessions or recentSessions
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = dailySessions?.[today]?.sessions 
    ?? recentSessions?.filter(s => s.start_time?.startsWith(today))?.length 
    ?? 0;

  // Memoized NBA selection - deterministic based on counts
  const nextBestAction = useMemo(
    () => selectNextBestAction(openLoopsCount, urgentCount),
    [openLoopsCount, urgentCount]
  );

  return {
    nextBestAction,
    // Expose counts for display/debugging
    openLoopsCount,
    urgentCount,
    todayFocusMinutes,
    todaySessions,
  };
}
