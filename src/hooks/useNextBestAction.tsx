import { useGlobalPriority } from "@/contexts/GlobalPriorityContext";

export type NextBestAction = {
  type: 'CLOSE_LOOPS' | 'URGENT_REPLIES' | 'START_FOCUS' | 'CONTINUE_FOCUS' | 'RESOLVE_CONFLICT' | 'ALL_CLEAR';
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
};

/**
 * Legacy hook that wraps the Global Priority Engine
 * for backward compatibility with existing components.
 * 
 * Prefer using useGlobalPriority() directly in new code.
 */
export function useNextBestAction() {
  const { output, nextAction, isAllClear, _internal } = useGlobalPriority();

  // Map from Global Priority Engine to legacy NextBestAction format
  const nextBestAction: NextBestAction = isAllClear
    ? {
        type: 'ALL_CLEAR',
        title: nextAction.headline,
        description: '',
        ctaLabel: '',
        href: '',
      }
    : {
        type: mapActionToLegacyType(output.recommendation?.action),
        title: nextAction.headline,
        description: nextAction.description,
        ctaLabel: nextAction.cta,
        href: nextAction.href,
      };

  return {
    nextBestAction,
    // Expose counts for display/debugging (internal use only)
    openLoopsCount: _internal.openLoopsCount,
    urgentCount: _internal.urgentCount,
    todayFocusMinutes: 0, // Deprecated, use useFocusStats directly
    todaySessions: 0, // Deprecated, use useFocusStats directly
  };
}

function mapActionToLegacyType(
  action?: string
): NextBestAction['type'] {
  switch (action) {
    case 'close_loops':
      return 'CLOSE_LOOPS';
    case 'handle_urgent':
      return 'URGENT_REPLIES';
    case 'resolve_conflict':
      return 'RESOLVE_CONFLICT';
    case 'continue_focus':
      return 'CONTINUE_FOCUS';
    case 'start_focus':
    default:
      return 'START_FOCUS';
  }
}

// Re-export the pure selection function for testing
export { computePriorities as selectNextBestAction } from '@/lib/priorityEngine';
