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
