import { useMemo } from "react";
import { useOpenLoops } from "./useOpenLoops";
import { useMessages } from "./useMessages";

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
 * Hook that computes the Next Best Action based on current user state
 */
export function useNextBestAction() {
  const { inventory } = useOpenLoops();
  const { messages } = useMessages();

  const openLoopsCount = inventory?.total_count ?? 0;
  const urgentCount = messages?.filter(m => m.priority === 'high' && !m.is_read)?.length ?? 0;

  const nextBestAction = useMemo(
    () => selectNextBestAction(openLoopsCount, urgentCount),
    [openLoopsCount, urgentCount]
  );

  return {
    nextBestAction,
    openLoopsCount,
    urgentCount,
  };
}
