/**
 * Driver Mode Commands - Locked list of supported commands
 * 
 * Driver Mode is a command-first, eyes-free interface.
 * No free-form chat. No text input. Large tap-friendly buttons only.
 * 
 * IMPORTANT: All voice output uses constants from driverModeVoice.ts
 */

import {
  DM_ENTER_1,
  NBA_OPEN_LOOPS,
  NBA_URGENT_COMMS,
  NBA_FOCUS,
  NBA_NOTHING,
  CONF_SUMMARIZE,
  CONF_CLEAR_UNREAD,
  CONF_FOCUS_START,
  CONF_ALL_CLEAR,
  CONF_NOTHING_TO_CLEAR,
  CONF_NO_MESSAGES,
  CONF_ALREADY_FOCUS,
  CONF_INBOX_EMPTY,
  GUIDE_INBOX,
  GUIDE_LOOPS,
  getNBASpeech,
} from './driverModeVoice';

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
    spokenLabel: NBA_FOCUS, // Default, actual varies by context
    icon: 'ArrowRight',
  },
  {
    id: 'summarize_messages',
    label: 'Summarize messages',
    spokenLabel: CONF_SUMMARIZE,
    icon: 'MessageSquare',
  },
  {
    id: 'clear_unread',
    label: 'Clear unread',
    spokenLabel: CONF_CLEAR_UNREAD,
    icon: 'CheckCircle',
  },
  {
    id: 'start_focus',
    label: 'Start focus',
    spokenLabel: CONF_FOCUS_START,
    icon: 'Focus',
  },
];

/**
 * Driver Mode greeting - spoken once on open
 */
export const DRIVER_MODE_GREETING = DM_ENTER_1;

/**
 * Spoken confirmations for Driver Mode actions
 * 
 * STRICT DRIVER MODE PRIORITY RULE:
 * - ALWAYS surface exactly ONE Next Best Action
 * - NEVER present multiple tasks verbally
 * - NEVER ask "what would you like to do?"
 * - If no action needed, speak: "Nothing urgent needs your attention."
 * 
 * Rules:
 * - Voice confirms execution
 * - Voice never narrates UI
 * - Voice never explains mechanics
 */
export const DRIVER_CONFIRMATIONS = {
  // Execution confirmations
  startingFocus: CONF_FOCUS_START,
  clearingInbox: CONF_CLEAR_UNREAD,
  summarizing: CONF_SUMMARIZE,
  
  // Next best action responses - always ONE action, never multiple
  closingLoops: NBA_OPEN_LOOPS,
  urgentMessages: NBA_URGENT_COMMS,
  readyToFocus: NBA_FOCUS,
  
  // CANONICAL: Nothing urgent phrase - overrides all other UI logic
  nothingUrgent: NBA_NOTHING,
  
  // Other reassurance (calm, brief)
  allClear: CONF_ALL_CLEAR,
  inboxEmpty: CONF_INBOX_EMPTY,
  
  // Cannot proceed explanations (calm, brief)
  cannotClear: CONF_NOTHING_TO_CLEAR,
  alreadyInFocus: CONF_ALREADY_FOCUS,
  noMessages: CONF_NO_MESSAGES,
  
  // Guide phrases (for multi-step actions)
  guidingInbox: GUIDE_INBOX,
  guidingLoops: GUIDE_LOOPS,
} as const;

/**
 * Generate spoken response for Next Best Action
 */
export const getNextBestActionSpeech = getNBASpeech;
