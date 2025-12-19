/**
 * ASSISTANT PERSONALITY RULES
 * 
 * Core traits:
 * - Calm authority (never excited, never apologetic, never rushed)
 * - Silent competence (does not announce work, shows outcomes not effort)
 * - Respect for attention (never repeats, never nudges, silence = success)
 * - Strategic bias (filters for impact, prefers decisions over information)
 * - Trust preservation (errs on caution, expands autonomy through demonstrated use)
 * 
 * Language rules:
 * - Short sentences
 * - No emojis
 * - No motivational language
 * - No "productivity" buzzwords
 * 
 * Think: Private banking app × chief of staff × aircraft cockpit
 */

// Standard toast messages (calm, direct, no emojis)
export const ASSISTANT_TOAST = {
  // Authentication
  signInSuccess: { title: "Signed in.", description: "" },
  signUpSuccess: { title: "Confirmation sent.", description: "Check your email." },
  signOutSuccess: { title: "Signed out.", description: "" },
  authError: { title: "Authentication failed.", description: "Please try again." },
  invalidEmail: { title: "Invalid email.", description: "" },
  weakPassword: { title: "Password too weak.", description: "Minimum 12 characters with mixed case, numbers, symbols." },
  shortPassword: { title: "Password too short.", description: "Minimum 12 characters." },
  
  // Session & Focus
  sessionTooShort: { title: "Session incomplete.", description: "Minimum 5 minutes required." },
  sessionComplete: (uct: number, score: number, streak: number) => ({
    title: `+${uct.toFixed(2)} UCT`,
    description: `Focus: ${score}%. Streak: ${streak} days.`,
  }),
  streakBonus: (days: number, uct: number) => ({
    title: `${days}-day streak bonus`,
    description: `+${uct} UCT`,
  }),
  sessionError: { title: "Session error.", description: "Recorded. Rewards pending." },
  
  // Platform connection
  platformConnected: (platform: string) => ({
    title: "Connected.",
    description: platform,
  }),
  platformError: (platform: string) => ({
    title: "Connection failed.",
    description: platform,
  }),
  
  // General actions
  saved: { title: "Saved.", description: "" },
  deleted: { title: "Deleted.", description: "" },
  updated: { title: "Updated.", description: "" },
  copied: { title: "Copied.", description: "" },
  sent: { title: "Sent.", description: "" },
  scheduled: { title: "Scheduled.", description: "" },
  archived: { title: "Archived.", description: "" },
  
  // Errors
  genericError: { title: "Error occurred.", description: "Please try again." },
  networkError: { title: "Connection failed.", description: "Check your network." },
  permissionDenied: { title: "Permission denied.", description: "" },
  
  // Analysis & AI
  analysisComplete: (count: number) => ({
    title: "Analysis complete.",
    description: `${count} items processed.`,
  }),
  analysisError: { title: "Analysis failed.", description: "" },
  
  // Onboarding
  setupComplete: { title: "Ready.", description: "" },
  
  // Empty states
  allClear: { title: "Clear.", description: "Nothing requires attention." },
  noItems: { title: "Empty.", description: "" },
} as const;

// Trust Moment #6 - First Autonomous Action (THE HOOK)
// This is the conversion moment. User didn't ask. Nothing went wrong. Something was already done.
export const AUTONOMOUS_REVEAL = {
  handled_one: "I handled one routine message while you were focused.",
  handled_multiple: (count: number) => `I handled ${count} routine messages while you were focused.`,
  nothing_handled: "No messages arrived while you were focused.",
  needs_one: "One item needs your input.",
  needs_multiple: (count: number) => `${count} items need your input.`,
  nothing_missed: "Nothing important was missed.",
  why_safe: "No deadlines. No decisions. No one waiting.",
} as const;

// Trust Moment Messages - key UX moments that build loyalty through restraint
export const TRUST_MOMENTS = {
  // Trust Moment #1 - First Silence (after onboarding)
  firstSilence: {
    primary: "You have nothing urgent.",
    secondary: "I'll let you know if that changes.",
  },
  
  // Trust Moment #2 - First Interruption
  interruption: {
    prefix: "Interrupting because",
    tomorrow: "this affects tomorrow.",
    deadline: "there's a deadline.",
    breaks: "something will break.",
    money: "this involves money.",
    people: "someone is waiting.",
  },
  
  // Trust Moment #3 - Loop Closure Relief
  loopClosure: {
    primary: "All open loops are resolved.",
    // No stats. No celebration. Just relief.
  },
  
  // Trust Moment #4 - Focus Protection
  focusProtection: {
    primary: "Nothing important was missed.",
    // One of the most powerful moments in the product
  },
  
  // Trust Moment #5 - Escalated Autonomy
  autonomyEscalation: {
    primary: "I've started handling similar decisions automatically.",
    secondary: "You can change this anytime.",
  },
} as const;

// Promotion Moment Messages - the assistant earns trust, not money
export const PROMOTION_MOMENTS = {
  patternRecognized: {
    line1: "I've noticed a pattern.",
    line2: "You routinely approve the same actions.",
  },
  offer: {
    headline: "I can start handling these for you.",
    capabilities: [
      "Drafting replies.",
      "Scheduling follow-ups.",
      "Closing low-risk loops.",
    ],
  },
  accepted: {
    primary: "Understood.",
    secondary: "I'll act when it's obvious — and ask when it's not.",
  },
  confirmation: {
    primary: "You've promoted your assistant.",
  },
  declined: {
    primary: "Understood.",
    secondary: "I'll continue to ask.",
  },
} as const;

// Voice/TTS response patterns
export const ASSISTANT_VOICE = {
  // Calm, short responses for TTS
  nothing_urgent: "", // Silence = success
  one_item: "One item requires attention.",
  multiple_items: (count: number) => `${count} items queued.`,
  task_created: "Task created.",
  task_completed: "Complete.",
  message_archived: "Archived.",
  message_sent: "Sent.",
  focus_started: "Focus active.",
  focus_ended: "Session ended.",
  continuing: "Continuing.",
  understood: "Understood.",
  acknowledged: "Acknowledged.",
  processing: "Processing.",
  error: "Unable to complete.",
  
  // Decision outcomes
  acting: "Acting now.",
  scheduled: "Scheduled.",
  delegated: "Delegated.",
  ignored: "Ignored.",
} as const;

// UI copy patterns
export const ASSISTANT_COPY = {
  // Headers/titles (calm, factual)
  welcome: "Welcome.",
  goodMorning: "Good morning.",
  briefReady: "Brief ready.",
  
  // Status indicators
  listening: "Listening",
  processing: "Processing",
  connected: "Connected",
  disconnected: "Disconnected",
  
  // Action labels (imperative, short)
  begin: "Begin",
  continue: "Continue",
  complete: "Complete",
  dismiss: "Dismiss",
  archive: "Archive",
  schedule: "Schedule",
  delegate: "Delegate",
  
  // Confirmations
  understood: "Understood.",
  handleRest: "I'll handle the rest.",
  
  // Empty states (factual, not encouraging)
  nothingUrgent: "Nothing urgent.",
  noTasks: "No tasks.",
  allProcessed: "All processed.",
  inboxClear: "Inbox clear.",
} as const;

// Format duration in calm, brief style
export function formatDurationBrief(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Format count in calm style (no exclamation, no "items!")
export function formatCount(count: number, singular: string, plural?: string): string {
  if (count === 0) return `No ${plural || singular + 's'}`;
  if (count === 1) return `One ${singular}`;
  return `${count} ${plural || singular + 's'}`;
}

// Authority-based language modifiers
// Operator mode: more decisive, less explanatory
export const AUTHORITY_LANGUAGE = {
  // Analyst (authority 0): asks, explains, seeks confirmation
  analyst: {
    actionPrefix: 'Should I',
    suggestionPrefix: 'You might want to',
    confirmationStyle: 'ask', // Always asks
    explanationLevel: 'verbose', // Explains reasoning
  },
  // Operator (authority 1): suggests, acts with implicit permission
  operator: {
    actionPrefix: 'I\'ll',
    suggestionPrefix: '',
    confirmationStyle: 'implicit', // Acts unless stopped
    explanationLevel: 'minimal', // Shows outcome, not process
  },
} as const;

// Get language style based on authority level
export function getAuthorityLanguage(authorityLevel: number) {
  return authorityLevel >= 1 ? AUTHORITY_LANGUAGE.operator : AUTHORITY_LANGUAGE.analyst;
}

// Operator-style action phrases (decisive, no hedging)
export const OPERATOR_ACTIONS = {
  // Direct actions (no "Should I" or "Would you like me to")
  archiving: 'Archiving.',
  scheduling: 'Scheduled.',
  drafting: 'Draft ready.',
  sending: 'Sent.',
  closing: 'Closed.',
  handling: 'Handled.',
  
  // Brief confirmations
  done: 'Done.',
  complete: 'Complete.',
  cleared: 'Cleared.',
  
  // Quiet failures (no dramatic language)
  blocked: 'Blocked.',
  deferred: 'Deferred.',
  needsInput: 'Needs input.',
} as const;

// Analyst-style action phrases (asks, explains)
export const ANALYST_ACTIONS = {
  archiving: 'Should I archive this?',
  scheduling: 'Should I schedule this?',
  drafting: 'I\'ve drafted a response. Would you like to review?',
  sending: 'Ready to send. Confirm?',
  closing: 'Should I close this loop?',
  handling: 'Would you like me to handle this?',
  
  done: 'Complete. Here\'s what happened:',
  complete: 'Task complete.',
  cleared: 'Inbox cleared.',
  
  blocked: 'Unable to proceed. Here\'s why:',
  deferred: 'Deferred for later. You\'ll see this again.',
  needsInput: 'I need more information to continue.',
} as const;

// Get action phrase based on authority
export function getActionPhrase(
  action: keyof typeof OPERATOR_ACTIONS, 
  authorityLevel: number
): string {
  return authorityLevel >= 1 
    ? OPERATOR_ACTIONS[action] 
    : ANALYST_ACTIONS[action];
}
