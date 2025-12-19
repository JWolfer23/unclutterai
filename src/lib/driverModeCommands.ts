/**
 * Driver Mode Commands - Locked list of supported commands
 * 
 * Driver Mode is a command-first, eyes-free interface.
 * No free-form chat. No text input. Large tap-friendly buttons only.
 */

export type DriverCommandId = 
  | 'whats_next'
  | 'summarize_messages'
  | 'clear_unread'
  | 'start_focus';

export interface DriverCommand {
  id: DriverCommandId;
  label: string;
  spokenLabel: string; // What the assistant says when activated
  icon: string; // Lucide icon name
  action: () => void | Promise<void>;
}

/**
 * Locked list of Driver Mode commands
 * DO NOT add more commands without updating eyes-free rules
 */
export const DRIVER_COMMANDS: Omit<DriverCommand, 'action'>[] = [
  {
    id: 'whats_next',
    label: "What's next?",
    spokenLabel: "Here's what's next.",
    icon: 'ArrowRight',
  },
  {
    id: 'summarize_messages',
    label: 'Summarize messages',
    spokenLabel: 'Summarizing your messages.',
    icon: 'MessageSquare',
  },
  {
    id: 'clear_unread',
    label: 'Clear unread',
    spokenLabel: 'Clearing unread messages.',
    icon: 'CheckCircle',
  },
  {
    id: 'start_focus',
    label: 'Start focus',
    spokenLabel: 'Starting focus session.',
    icon: 'Focus',
  },
];

/**
 * Driver Mode greeting - spoken once on open
 */
export const DRIVER_MODE_GREETING = "You're in Driver Mode. I'll handle prioritization.";

/**
 * Spoken confirmations for Driver Mode actions
 * 
 * Rules:
 * - Voice confirms execution
 * - Voice never narrates UI
 * - Voice never explains mechanics
 */
export const DRIVER_CONFIRMATIONS = {
  // Execution confirmations
  startingFocus: "Starting focus now.",
  clearingInbox: "Clearing your inbox.",
  summarizing: "Summarizing now.",
  
  // Next best action responses
  closingLoops: (count: number) => 
    count === 1 ? "One item needs closure." : `${count} items need closure.`,
  urgentMessages: (count: number) => 
    count === 1 ? "One urgent message." : `${count} urgent messages.`,
  readyToFocus: "All clear. Ready to focus.",
  
  // Reassurance (nothing to do)
  nothingUrgent: "Nothing urgent needs your attention.",
  allClear: "All clear.",
  inboxEmpty: "Inbox is empty.",
  
  // Cannot proceed explanations (calm, brief)
  cannotClear: "Nothing to clear.",
  alreadyInFocus: "Already in focus.",
  noMessages: "No messages to summarize.",
  
  // Guide phrases (for multi-step actions)
  guidingInbox: "I'll guide you through clearing your inbox.",
  guidingLoops: "I'll guide you through your open items.",
} as const;

/**
 * Generate spoken response for Next Best Action
 */
export function getNextBestActionSpeech(
  type: 'CLOSE_LOOPS' | 'URGENT_REPLIES' | 'START_FOCUS',
  count?: number
): string {
  switch (type) {
    case 'CLOSE_LOOPS':
      return DRIVER_CONFIRMATIONS.closingLoops(count || 1);
    case 'URGENT_REPLIES':
      return DRIVER_CONFIRMATIONS.urgentMessages(count || 1);
    case 'START_FOCUS':
      return DRIVER_CONFIRMATIONS.readyToFocus;
    default:
      return DRIVER_CONFIRMATIONS.nothingUrgent;
  }
}
