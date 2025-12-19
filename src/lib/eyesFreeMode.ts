/**
 * Eyes-Free Mode Interaction Rules
 * 
 * These rules apply to Driver Mode and all Assistant voice output.
 * 
 * CORE PRINCIPLES:
 * 1. Voice output must never present multiple options
 * 2. Voice output must never ask open-ended questions
 * 3. Voice output must always conclude with ONE of:
 *    - A single recommendation
 *    - A confirmation
 *    - Explicit reassurance
 * 4. If multiple actions exist, choose ONE - UI can show secondary context
 * 5. Silence is preferred over unnecessary speech
 */

export type VoiceOutputType = 
  | 'recommendation'
  | 'confirmation'
  | 'reassurance'
  | 'silent';

export interface EyesFreeOutput {
  type: VoiceOutputType;
  spokenText: string | null; // null means silence
  uiContext?: string; // Additional context shown in UI but NOT spoken
  selectedAction?: {
    id: string;
    label: string;
  };
  alternativeActions?: Array<{
    id: string;
    label: string;
  }>; // Shown in UI only, never spoken
}

// Validation patterns to detect rule violations
const MULTI_OPTION_PATTERNS = [
  /would you (like|prefer|want) (to |.*)or/i,
  /you (can|could) either/i,
  /options (are|include)/i,
  /choose between/i,
  /which (one|would you)/i,
  /do you want .+ or .+\?/i,
  /\b(first|second|third)\b.+\b(first|second|third)\b/i,
];

const OPEN_ENDED_PATTERNS = [
  /^what (do|would|should) you/i,
  /^how (do|would|should) you/i,
  /^why (do|would|did) you/i,
  /^what('s| is) your/i,
  /tell me (about|more)/i,
  /^can you (describe|explain|tell)/i,
];

const REASSURANCE_PHRASES = {
  nothingUrgent: "Nothing urgent needs attention.",
  allClear: "All clear.",
  handledIt: "Handled.",
  noActionNeeded: "No action needed.",
  focusProtected: "Your focus is protected.",
  silentDeferral: null, // Explicit silence
};

const CONFIRMATION_PHRASES = {
  done: "Done.",
  confirmed: "Confirmed.",
  scheduled: "Scheduled.",
  deferred: "Deferred.",
  sent: "Sent.",
  archived: "Archived.",
  noted: "Noted.",
};

/**
 * Validates that voice output follows Eyes-Free rules
 */
export function validateVoiceOutput(text: string): {
  isValid: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  // Check for multiple options
  for (const pattern of MULTI_OPTION_PATTERNS) {
    if (pattern.test(text)) {
      violations.push('Voice output presents multiple options');
      break;
    }
  }

  // Check for open-ended questions
  for (const pattern of OPEN_ENDED_PATTERNS) {
    if (pattern.test(text)) {
      violations.push('Voice output asks an open-ended question');
      break;
    }
  }

  // Check it concludes properly (has a clear ending)
  const hasProperConclusion = 
    text.endsWith('.') || 
    text.endsWith('!') ||
    Object.values(CONFIRMATION_PHRASES).some(phrase => 
      phrase && text.toLowerCase().includes(phrase.toLowerCase())
    ) ||
    Object.values(REASSURANCE_PHRASES).some(phrase => 
      phrase && text.toLowerCase().includes(phrase.toLowerCase())
    );

  if (!hasProperConclusion) {
    violations.push('Voice output lacks clear conclusion');
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}

/**
 * Selects the single best action from multiple options
 * Uses priority scoring to determine which action to recommend
 */
export function selectPrimaryAction<T extends { 
  id: string; 
  priority?: number;
  urgency?: 'critical' | 'high' | 'medium' | 'low';
  type?: string;
}>(
  actions: T[]
): { primary: T | null; alternatives: T[] } {
  if (actions.length === 0) {
    return { primary: null, alternatives: [] };
  }

  if (actions.length === 1) {
    return { primary: actions[0], alternatives: [] };
  }

  // Score and sort actions
  const scored = actions.map(action => ({
    action,
    score: calculateActionScore(action),
  })).sort((a, b) => b.score - a.score);

  return {
    primary: scored[0].action,
    alternatives: scored.slice(1).map(s => s.action),
  };
}

function calculateActionScore(action: {
  priority?: number;
  urgency?: 'critical' | 'high' | 'medium' | 'low';
  type?: string;
}): number {
  let score = 0;

  // Urgency scoring
  const urgencyScores = {
    critical: 100,
    high: 75,
    medium: 50,
    low: 25,
  };
  if (action.urgency) {
    score += urgencyScores[action.urgency] || 0;
  }

  // Priority scoring (higher priority = higher score)
  if (typeof action.priority === 'number') {
    score += action.priority;
  }

  return score;
}

/**
 * Formats a single recommendation for voice output
 */
export function formatRecommendation(
  action: string,
  context?: string
): EyesFreeOutput {
  return {
    type: 'recommendation',
    spokenText: action.endsWith('.') ? action : `${action}.`,
    uiContext: context,
  };
}

/**
 * Formats a confirmation for voice output
 */
export function formatConfirmation(
  action: keyof typeof CONFIRMATION_PHRASES | string
): EyesFreeOutput {
  const phrase = CONFIRMATION_PHRASES[action as keyof typeof CONFIRMATION_PHRASES] || action;
  return {
    type: 'confirmation',
    spokenText: phrase,
  };
}

/**
 * Formats a reassurance for voice output
 */
export function formatReassurance(
  type: keyof typeof REASSURANCE_PHRASES = 'nothingUrgent'
): EyesFreeOutput {
  return {
    type: 'reassurance',
    spokenText: REASSURANCE_PHRASES[type],
  };
}

/**
 * Creates a silent response (preferred over unnecessary speech)
 */
export function formatSilence(uiContext?: string): EyesFreeOutput {
  return {
    type: 'silent',
    spokenText: null,
    uiContext,
  };
}

/**
 * Sanitizes voice output to comply with Eyes-Free rules
 * Attempts to fix violations automatically
 */
export function sanitizeVoiceOutput(text: string): string {
  let sanitized = text;

  // Remove option presentations
  sanitized = sanitized.replace(/would you (like|prefer|want) to .+ or .+\?/gi, '');
  sanitized = sanitized.replace(/you (can|could) either .+ or .+/gi, '');

  // Convert questions to statements where possible
  sanitized = sanitized.replace(/^do you want me to (.+)\?$/i, 'I\'ll $1.');
  sanitized = sanitized.replace(/^should I (.+)\?$/i, 'I\'ll $1.');
  sanitized = sanitized.replace(/^would you like me to (.+)\?$/i, 'I\'ll $1.');

  // Ensure proper ending
  sanitized = sanitized.trim();
  if (sanitized && !sanitized.match(/[.!]$/)) {
    sanitized += '.';
  }

  return sanitized;
}

/**
 * Determines if voice output should be silent
 */
export function shouldBeSilent(context: {
  hasUrgentItems: boolean;
  hasUserRequest: boolean;
  isInFocusMode: boolean;
  lastSpokenMs?: number;
}): boolean {
  // Silence during focus unless urgent
  if (context.isInFocusMode && !context.hasUrgentItems) {
    return true;
  }

  // Silence if no user request and nothing urgent
  if (!context.hasUserRequest && !context.hasUrgentItems) {
    return true;
  }

  // Avoid speaking too frequently (minimum 3 seconds between outputs)
  if (context.lastSpokenMs && Date.now() - context.lastSpokenMs < 3000) {
    return true;
  }

  return false;
}

// Export phrases for use in components
export const EYES_FREE_PHRASES = {
  reassurance: REASSURANCE_PHRASES,
  confirmation: CONFIRMATION_PHRASES,
};
