/**
 * Beta Messaging System
 * 
 * CORE PRINCIPLES:
 * - Never label errors as failures
 * - Never blame the user
 * - Frame limitations as intentional and temporary
 * - Position learning as collaborative
 * 
 * This assistant is in training. Your behavior teaches it.
 */

// =============================================================================
// CANONICAL BETA PHRASES
// =============================================================================

export const BETA_PHRASES = {
  // Primary beta indicator
  training: {
    primary: "This assistant is in training.",
    secondary: "Your behavior teaches it.",
    combined: "This assistant is in training. Your behavior teaches it.",
  },
  
  // Limitation framing (intentional, not broken)
  limitations: {
    notYet: "This isn't available yet.",
    comingSoon: "Coming soon.",
    learning: "Still learning this.",
    intentional: "Not enabled in this version.",
    exploring: "Exploring this capability.",
  },
  
  // Error reframing (not failures, not user's fault)
  errors: {
    // Instead of "Error" or "Failed"
    couldntComplete: "Couldn't complete that.",
    tryAgain: "Let's try that again.",
    unexpected: "Something unexpected happened.",
    stillLearning: "Still learning how to handle that.",
    needsWork: "That needs more work on our end.",
    
    // Instead of "Invalid input" or "Wrong format"
    didntUnderstand: "Didn't quite catch that.",
    differentApproach: "Let's try a different approach.",
    
    // Network/system issues (never blame user)
    connectionIssue: "Connection interrupted.",
    takingLonger: "Taking longer than expected.",
    temporaryIssue: "Temporary issue. Will retry.",
  },
  
  // Feedback encouragement
  feedback: {
    helps: "Your feedback helps improve this.",
    learning: "Learning from how you use this.",
    appreciated: "Your patience is appreciated.",
    shaping: "You're helping shape this experience.",
  },
} as const;

// =============================================================================
// VOICE-OPTIMIZED PHRASES
// =============================================================================

export const BETA_VOICE = {
  // Spoken acknowledgments (brief, non-disruptive)
  noted: "Noted.",
  understood: "Understood.",
  learning: "Learning.",
  
  // Spoken limitations (calm, not apologetic)
  notYet: "Not available yet.",
  stillLearning: "Still learning that.",
  
  // Spoken error recovery (reassuring)
  tryingAgain: "Trying again.",
  oneMoreTime: "One more time.",
  letMeRetry: "Let me retry.",
} as const;

// =============================================================================
// UI COMPONENTS - Subtle indicators
// =============================================================================

export const BETA_UI = {
  // Badge text (very short)
  badge: "Beta",
  trainingBadge: "Training",
  
  // Tooltip content
  tooltip: BETA_PHRASES.training.combined,
  
  // Footer text (minimal)
  footer: "Assistant in training",
  
  // Empty state messaging
  emptyState: {
    title: "Nothing here yet",
    subtitle: "This feature is being developed.",
  },
} as const;

// =============================================================================
// ERROR MESSAGE TRANSFORMS
// =============================================================================

/**
 * Transforms technical error messages into user-friendly beta language
 * Never blames user, never says "failed" or "error"
 */
export function humanizeError(technicalError: string): string {
  const errorLower = technicalError.toLowerCase();
  
  // Network errors
  if (errorLower.includes('network') || errorLower.includes('fetch') || errorLower.includes('timeout')) {
    return BETA_PHRASES.errors.connectionIssue;
  }
  
  // Auth errors (don't say "unauthorized" or "forbidden")
  if (errorLower.includes('auth') || errorLower.includes('401') || errorLower.includes('403')) {
    return BETA_PHRASES.errors.tryAgain;
  }
  
  // Validation errors (don't say "invalid")
  if (errorLower.includes('invalid') || errorLower.includes('validation') || errorLower.includes('format')) {
    return BETA_PHRASES.errors.didntUnderstand;
  }
  
  // Not found (don't say "error 404")
  if (errorLower.includes('not found') || errorLower.includes('404')) {
    return BETA_PHRASES.limitations.notYet;
  }
  
  // Server errors (never expose technical details)
  if (errorLower.includes('500') || errorLower.includes('server')) {
    return BETA_PHRASES.errors.needsWork;
  }
  
  // Rate limiting (don't say "too many requests")
  if (errorLower.includes('rate') || errorLower.includes('limit') || errorLower.includes('429')) {
    return BETA_PHRASES.errors.takingLonger;
  }
  
  // Default fallback - never expose raw error
  return BETA_PHRASES.errors.couldntComplete;
}

/**
 * Creates a spoken error message for voice interfaces
 */
export function getSpokenError(technicalError?: string): string {
  if (!technicalError) {
    return BETA_VOICE.tryingAgain;
  }
  
  const humanized = humanizeError(technicalError);
  
  // Keep it brief for voice
  if (humanized.length > 30) {
    return BETA_VOICE.letMeRetry;
  }
  
  return humanized;
}

// =============================================================================
// LIMITATION MESSAGING
// =============================================================================

/**
 * Returns appropriate messaging for a feature limitation
 */
export function getLimitationMessage(
  type: 'unavailable' | 'coming_soon' | 'learning' | 'disabled' = 'unavailable'
): { title: string; description: string } {
  switch (type) {
    case 'coming_soon':
      return {
        title: BETA_PHRASES.limitations.comingSoon,
        description: "This is planned for a future update.",
      };
    case 'learning':
      return {
        title: BETA_PHRASES.limitations.learning,
        description: BETA_PHRASES.feedback.learning,
      };
    case 'disabled':
      return {
        title: BETA_PHRASES.limitations.intentional,
        description: "This may be enabled in future versions.",
      };
    case 'unavailable':
    default:
      return {
        title: BETA_PHRASES.limitations.notYet,
        description: BETA_PHRASES.feedback.shaping,
      };
  }
}

// =============================================================================
// TRAINING INDICATOR HELPERS
// =============================================================================

/**
 * Returns the training message for display
 */
export function getTrainingMessage(format: 'full' | 'short' | 'badge' = 'full'): string {
  switch (format) {
    case 'badge':
      return BETA_UI.trainingBadge;
    case 'short':
      return BETA_PHRASES.training.primary;
    case 'full':
    default:
      return BETA_PHRASES.training.combined;
  }
}
