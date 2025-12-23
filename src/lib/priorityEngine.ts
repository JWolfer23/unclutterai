// Global Priority Engine - Core Logic
// Powers: Home, Morning Mode, Driver Mode, Focus Mode, Assistant responses
// Rule: Maximum 3 priorities, collapse to 1 recommendation if more

export type PrioritySource = 
  | 'inbox_loop'      // Unresolved Gmail/Outlook messages
  | 'calendar'        // Conflicts, upcoming meetings, deadlines
  | 'focus'           // Active/deferred/completed focus state
  | 'trust_boundary'; // User trust level violations

export type PriorityAction = 
  | 'close_loops'
  | 'handle_urgent'
  | 'resolve_conflict'
  | 'start_focus'
  | 'continue_focus'
  | 'take_break';

export interface Priority {
  id: string;
  source: PrioritySource;
  action: PriorityAction;
  title: string;
  description: string;
  weight: number; // 0-100, higher = more urgent
  href?: string;
}

export interface PriorityEngineOutput {
  // The single recommendation (or null if all clear)
  recommendation: Priority | null;
  // Underlying priorities (max 3, never exposed to user)
  priorities: Priority[];
  // Whether user is all clear
  isAllClear: boolean;
  // Reassurance message when all clear
  reassurance: string;
}

// Weight configuration for priority sources
const SOURCE_WEIGHTS: Record<PrioritySource, number> = {
  inbox_loop: 70,
  calendar: 80,
  focus: 50,
  trust_boundary: 90,
};

// Action labels for user-facing text
export const ACTION_LABELS: Record<PriorityAction, { title: string; cta: string }> = {
  close_loops: { title: 'Close open loops', cta: 'Close loops' },
  handle_urgent: { title: 'Handle urgent messages', cta: 'Reply now' },
  resolve_conflict: { title: 'Resolve calendar conflict', cta: 'Review' },
  start_focus: { title: 'Start focus session', cta: 'Start focus' },
  continue_focus: { title: 'Continue focus session', cta: 'Continue' },
  take_break: { title: 'Take a break', cta: 'Take break' },
};

// Action routes
export const ACTION_ROUTES: Record<PriorityAction, string> = {
  close_loops: '/open-loops',
  handle_urgent: '/communication',
  resolve_conflict: '/communication',
  start_focus: '/focus',
  continue_focus: '/focus',
  take_break: '/',
};

// Deterministic reassurance messages based on hour
const REASSURANCE_MESSAGES = [
  "Nothing urgent needs your attention.",
  "Your assistant is monitoring everything.",
  "You're clear. We'll interrupt only if it matters.",
  "All loops are closed.",
];

function getReassurance(): string {
  const hour = new Date().getHours();
  const index = hour % REASSURANCE_MESSAGES.length;
  return REASSURANCE_MESSAGES[index];
}

/**
 * Core priority computation - pure function, no side effects
 */
export function computePriorities(inputs: {
  openLoopsCount: number;
  urgentMessageCount: number;
  calendarConflicts: number;
  upcomingDeadlines: number;
  focusState: 'idle' | 'active' | 'deferred' | 'completed';
  focusMinutesToday: number;
  trustViolations: number;
}): PriorityEngineOutput {
  const priorities: Priority[] = [];

  // 1. Trust boundary violations (highest priority)
  if (inputs.trustViolations > 0) {
    priorities.push({
      id: 'trust_violation',
      source: 'trust_boundary',
      action: 'handle_urgent',
      title: 'Review flagged items',
      description: 'Items need your approval before proceeding.',
      weight: SOURCE_WEIGHTS.trust_boundary,
      href: '/communication',
    });
  }

  // 2. Calendar conflicts
  if (inputs.calendarConflicts > 0) {
    priorities.push({
      id: 'calendar_conflict',
      source: 'calendar',
      action: 'resolve_conflict',
      title: 'Resolve schedule conflict',
      description: 'You have overlapping commitments.',
      weight: SOURCE_WEIGHTS.calendar,
      href: '/communication',
    });
  }

  // 3. Urgent messages
  if (inputs.urgentMessageCount > 0) {
    priorities.push({
      id: 'urgent_messages',
      source: 'inbox_loop',
      action: 'handle_urgent',
      title: 'Handle urgent messages',
      description: 'Reply fast to what matters, then move on.',
      weight: SOURCE_WEIGHTS.inbox_loop + 10, // Boost for urgency
      href: '/communication',
    });
  }

  // 4. Open loops
  if (inputs.openLoopsCount > 0) {
    priorities.push({
      id: 'open_loops',
      source: 'inbox_loop',
      action: 'close_loops',
      title: 'Clear open loops',
      description: "Close what's unfinished so your mind is quiet.",
      weight: SOURCE_WEIGHTS.inbox_loop,
      href: '/open-loops',
    });
  }

  // 5. Focus state
  if (inputs.focusState === 'active') {
    priorities.push({
      id: 'focus_active',
      source: 'focus',
      action: 'continue_focus',
      title: 'Continue focus session',
      description: 'You have an active session.',
      weight: SOURCE_WEIGHTS.focus + 30, // Boost active sessions
      href: '/focus',
    });
  } else if (inputs.focusState === 'idle' && priorities.length === 0) {
    // Only suggest focus if nothing else is pressing
    priorities.push({
      id: 'start_focus',
      source: 'focus',
      action: 'start_focus',
      title: 'Start focus session',
      description: 'With everything handled, lock in.',
      weight: SOURCE_WEIGHTS.focus,
      href: '/focus',
    });
  }

  // 6. Upcoming deadlines
  if (inputs.upcomingDeadlines > 0) {
    priorities.push({
      id: 'deadlines',
      source: 'calendar',
      action: 'handle_urgent',
      title: 'Review upcoming deadlines',
      description: 'Tasks due soon need attention.',
      weight: SOURCE_WEIGHTS.calendar - 10,
      href: '/communication',
    });
  }

  // Sort by weight (highest first)
  priorities.sort((a, b) => b.weight - a.weight);

  // Limit to max 3 priorities
  const limitedPriorities = priorities.slice(0, 3);

  // If more than 3, the recommendation is the single highest
  // Otherwise, recommendation is still the highest (or null if empty)
  const recommendation = limitedPriorities.length > 0 ? limitedPriorities[0] : null;
  const isAllClear = recommendation === null;

  return {
    recommendation,
    priorities: limitedPriorities,
    isAllClear,
    reassurance: getReassurance(),
  };
}

/**
 * Collapse multiple priorities into a single clear recommendation
 * Used when presenting to user - never expose raw list
 */
export function getNextBestActionText(output: PriorityEngineOutput): {
  headline: string;
  description: string;
  cta: string;
  href: string;
} {
  if (output.isAllClear || !output.recommendation) {
    return {
      headline: output.reassurance,
      description: '',
      cta: '',
      href: '',
    };
  }

  const { recommendation } = output;
  const actionConfig = ACTION_LABELS[recommendation.action];

  return {
    headline: recommendation.title,
    description: recommendation.description,
    cta: actionConfig.cta,
    href: recommendation.href || ACTION_ROUTES[recommendation.action],
  };
}
