/**
 * Driver Mode Voice Script Dictionary
 * 
 * STRICT RULES:
 * - Short executive lines (max 1 sentence)
 * - No multi-option voice output
 * - No open-ended questions
 * - Voice MUST end with either: a recommendation, a confirmation, or reassurance
 * 
 * This is the ONLY source of truth for Driver Mode spoken output.
 * Never use ad-hoc strings in Driver Mode voice.
 */

// =============================================================================
// ENTRY & GREETING
// =============================================================================

/** Spoken once when Driver Mode opens */
export const DM_ENTER_1 = "You're in Driver Mode. I'll handle prioritization.";

// =============================================================================
// NEXT BEST ACTION (NBA) - Always exactly ONE action
// =============================================================================

/** When user has open loops to close */
export const NBA_OPEN_LOOPS = (count: number) => 
  count === 1 ? "One item needs closure." : `${count} items need closure.`;

/** When user has urgent communications */
export const NBA_URGENT_COMMS = (count: number) => 
  count === 1 ? "One urgent message." : `${count} urgent messages.`;

/** When all clear - recommend focus */
export const NBA_FOCUS = "All clear. Ready to focus.";

/** When nothing needs attention - reassurance */
export const NBA_NOTHING = "Nothing urgent needs your attention.";

// =============================================================================
// CONFIRMATIONS (CONF) - After action execution
// =============================================================================

/** After generating a brief/summary */
export const CONF_BRIEF = "Here's your brief.";

/** After summarizing messages */
export const CONF_SUMMARIZE = "Summarizing now.";

/** After marking messages as read */
export const CONF_CLEAR_UNREAD = "Cleared.";

/** After starting a focus session */
export const CONF_FOCUS_START = "Starting focus now.";

/** After completing a focus session */
export const CONF_FOCUS_END = "Focus complete. Nothing important was missed.";

// =============================================================================
// ERRORS (ERR) - Beta-friendly, never blame user
// =============================================================================

/** When voice capability is limited */
export const ERR_VOICE_LIMITED = "Voice not available right now.";

/** Generic retry suggestion */
export const ERR_TRY_AGAIN = "Let's try that again.";

/** When feature/action is not available */
export const ERR_NOT_AVAILABLE = "Not available yet.";

// =============================================================================
// ADDITIONAL CONFIRMATIONS
// =============================================================================

/** All clear reassurance */
export const CONF_ALL_CLEAR = "All clear.";

/** Nothing to clear */
export const CONF_NOTHING_TO_CLEAR = "Nothing to clear.";

/** No messages to summarize */
export const CONF_NO_MESSAGES = "No messages to summarize.";

/** Already in focus */
export const CONF_ALREADY_FOCUS = "Already in focus.";

/** Inbox empty */
export const CONF_INBOX_EMPTY = "Inbox is empty.";

// =============================================================================
// GUIDE PHRASES (for multi-step actions)
// =============================================================================

/** Guiding through inbox clearing */
export const GUIDE_INBOX = "I'll guide you through clearing your inbox.";

/** Guiding through open loops */
export const GUIDE_LOOPS = "I'll guide you through your open items.";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get NBA speech based on action type
 */
export function getNBASpeech(
  type: 'CLOSE_LOOPS' | 'URGENT_REPLIES' | 'START_FOCUS',
  count?: number
): string {
  switch (type) {
    case 'CLOSE_LOOPS':
      return NBA_OPEN_LOOPS(count || 1);
    case 'URGENT_REPLIES':
      return NBA_URGENT_COMMS(count || 1);
    case 'START_FOCUS':
      return NBA_FOCUS;
    default:
      return NBA_NOTHING;
  }
}

/**
 * Get message summary speech
 */
export function getMessageSummary(count: number, senders: string[]): string {
  if (count === 0) return CONF_NO_MESSAGES;
  if (count === 1) return `One message from ${senders[0]}.`;
  if (senders.length <= 2) return `${count} messages from ${senders.join(' and ')}.`;
  return `${count} messages from ${senders.length} people.`;
}
