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
 * Generate spoken response for Next Best Action
 */
export function getNextBestActionSpeech(
  type: 'CLOSE_LOOPS' | 'URGENT_REPLIES' | 'START_FOCUS',
  count?: number
): string {
  switch (type) {
    case 'CLOSE_LOOPS':
      return count && count > 1 
        ? `${count} items need closure. Tap to review.`
        : 'One item needs closure.';
    case 'URGENT_REPLIES':
      return count && count > 1
        ? `${count} urgent messages. Tap to reply.`
        : 'One urgent message.';
    case 'START_FOCUS':
      return 'All clear. Ready to focus.';
    default:
      return 'Nothing urgent.';
  }
}

/**
 * Reassurance phrases for Driver Mode
 */
export const DRIVER_REASSURANCE = {
  nothingUrgent: 'Nothing urgent.',
  allClear: 'All clear.',
  handled: 'Handled.',
  deferred: 'Deferred.',
} as const;
