/**
 * Cognitive Load Guardrail
 * 
 * Global rules for assistant behavior to minimize user cognitive load:
 * 1. Never ask unnecessary questions
 * 2. Never present more than one option verbally
 * 3. Default to silence when no action is required
 * 4. Resolve uncertainty internally before speaking
 * 5. If uncertainty remains, respond with reassurance, not questions
 */

// Patterns that indicate unnecessary questions
const UNNECESSARY_QUESTION_PATTERNS = [
  /would you like me to/i,
  /do you want me to/i,
  /should I/i,
  /what would you prefer/i,
  /which (one|option) (would you|do you)/i,
  /let me know if/i,
  /would you prefer/i,
  /can I help you with/i,
  /is there anything else/i,
  /do you need me to/i,
];

// Patterns that indicate multiple options being presented
const MULTIPLE_OPTION_PATTERNS = [
  /option (1|one|a)[:\s].*option (2|two|b)/is,
  /you (can|could) either.*or/i,
  /there are (several|multiple|a few) (options|ways|choices)/i,
  /first option.*second option/is,
  /alternatively,/i,
  /on the other hand/i,
  /or would you rather/i,
  /choose between/i,
  /pick one of/i,
];

// Patterns that indicate open-ended questions
const OPEN_ENDED_PATTERNS = [
  /what do you think/i,
  /what would you like/i,
  /how would you like/i,
  /when would you like/i,
  /where should I/i,
  /which.*do you want/i,
  /\?.*\?/s, // Multiple questions
];

// Reassurance phrases for when uncertainty remains
export const REASSURANCE_PHRASES = {
  handled: "I've got this covered.",
  monitoring: "I'm keeping an eye on things.",
  noAction: "Nothing needs your attention right now.",
  processing: "I'm working on it.",
  resolved: "All handled.",
  safe: "Everything looks good.",
  waiting: "I'll let you know if anything comes up.",
} as const;

export type ViolationType = 
  | 'unnecessary_question'
  | 'multiple_options'
  | 'open_ended'
  | 'no_action_needed';

export interface GuardrailViolation {
  type: ViolationType;
  pattern: string;
  suggestion: string;
}

export interface GuardrailResult {
  isValid: boolean;
  violations: GuardrailViolation[];
  sanitizedOutput: string | null;
  shouldBeSilent: boolean;
}

/**
 * Check if the output contains unnecessary questions
 */
function detectUnnecessaryQuestions(text: string): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];
  
  for (const pattern of UNNECESSARY_QUESTION_PATTERNS) {
    if (pattern.test(text)) {
      violations.push({
        type: 'unnecessary_question',
        pattern: pattern.source,
        suggestion: 'Make a decision and act, or use reassurance instead.',
      });
    }
  }
  
  return violations;
}

/**
 * Check if the output presents multiple options
 */
function detectMultipleOptions(text: string): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];
  
  for (const pattern of MULTIPLE_OPTION_PATTERNS) {
    if (pattern.test(text)) {
      violations.push({
        type: 'multiple_options',
        pattern: pattern.source,
        suggestion: 'Select the single best option and present only that.',
      });
    }
  }
  
  return violations;
}

/**
 * Check if the output contains open-ended questions
 */
function detectOpenEndedQuestions(text: string): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];
  
  for (const pattern of OPEN_ENDED_PATTERNS) {
    if (pattern.test(text)) {
      violations.push({
        type: 'open_ended',
        pattern: pattern.source,
        suggestion: 'Resolve uncertainty internally; if unsure, use reassurance.',
      });
    }
  }
  
  return violations;
}

/**
 * Determine if the assistant should remain silent
 */
export function shouldRemainSilent(context: {
  hasUrgentItems: boolean;
  hasUserRequest: boolean;
  isInFocusMode: boolean;
  hasActionableItem: boolean;
}): boolean {
  // Default to silence unless there's a clear reason to speak
  if (!context.hasUrgentItems && !context.hasUserRequest && !context.hasActionableItem) {
    return true;
  }
  
  // In focus mode, only speak for truly urgent items
  if (context.isInFocusMode && !context.hasUrgentItems) {
    return true;
  }
  
  return false;
}

/**
 * Validate assistant output against cognitive load rules
 */
export function validateOutput(text: string): GuardrailResult {
  const violations: GuardrailViolation[] = [
    ...detectUnnecessaryQuestions(text),
    ...detectMultipleOptions(text),
    ...detectOpenEndedQuestions(text),
  ];
  
  return {
    isValid: violations.length === 0,
    violations,
    sanitizedOutput: violations.length > 0 ? sanitizeOutput(text) : text,
    shouldBeSilent: false,
  };
}

/**
 * Attempt to sanitize output by removing violations
 */
function sanitizeOutput(text: string): string | null {
  let sanitized = text;
  
  // Remove question marks and trailing questions
  sanitized = sanitized.replace(/\?+\s*$/g, '.');
  
  // Remove "would you like" type phrases
  for (const pattern of UNNECESSARY_QUESTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  // If the result is too short or empty, return null (should be silent)
  if (sanitized.trim().length < 10) {
    return null;
  }
  
  return sanitized.trim();
}

/**
 * Convert uncertainty into reassurance
 */
export function resolveUncertainty(uncertaintyContext: {
  topic: string;
  confidenceLevel: number; // 0-1
  hasPartialInfo: boolean;
}): string {
  const { confidenceLevel, hasPartialInfo } = uncertaintyContext;
  
  // High confidence: proceed with action statement
  if (confidenceLevel >= 0.8) {
    return REASSURANCE_PHRASES.handled;
  }
  
  // Medium confidence: acknowledge and reassure
  if (confidenceLevel >= 0.5) {
    return hasPartialInfo 
      ? REASSURANCE_PHRASES.processing 
      : REASSURANCE_PHRASES.monitoring;
  }
  
  // Low confidence: default to safe reassurance
  return REASSURANCE_PHRASES.waiting;
}

/**
 * Select the single best action from multiple options
 * Always returns exactly one action - never presents choices to user
 */
export function selectSingleBestAction<T extends { priority?: number; urgency?: string; score?: number }>(
  options: T[]
): T | null {
  if (options.length === 0) return null;
  if (options.length === 1) return options[0];
  
  // Score and sort options
  const scored = options.map(option => {
    let score = option.score ?? 0;
    
    // Boost by priority
    if (option.priority !== undefined) {
      score += (10 - option.priority) * 10; // Lower priority number = higher score
    }
    
    // Boost by urgency
    if (option.urgency === 'critical') score += 100;
    else if (option.urgency === 'high') score += 50;
    else if (option.urgency === 'medium') score += 25;
    
    return { option, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  
  // Return only the single best option
  return scored[0].option;
}

/**
 * Format a response that follows cognitive load rules
 */
export function formatClearResponse(params: {
  action?: string;
  context?: string;
  isComplete?: boolean;
}): string {
  const { action, context, isComplete = true } = params;
  
  if (!action) {
    return REASSURANCE_PHRASES.noAction;
  }
  
  // Build a clear, declarative statement
  let response = action;
  
  if (context) {
    response = `${context}. ${action}`;
  }
  
  if (!isComplete) {
    response += ` ${REASSURANCE_PHRASES.monitoring}`;
  }
  
  return response;
}

/**
 * Main guardrail function - validates and optionally fixes assistant output
 */
export function applyCognitiveLoadGuardrail(
  output: string,
  context: {
    hasUrgentItems?: boolean;
    hasUserRequest?: boolean;
    isInFocusMode?: boolean;
    hasActionableItem?: boolean;
    autoFix?: boolean;
  } = {}
): { 
  output: string | null; 
  wasSilent: boolean; 
  wasModified: boolean;
  violations: GuardrailViolation[];
} {
  // Check if we should be silent
  if (shouldRemainSilent({
    hasUrgentItems: context.hasUrgentItems ?? false,
    hasUserRequest: context.hasUserRequest ?? false,
    isInFocusMode: context.isInFocusMode ?? false,
    hasActionableItem: context.hasActionableItem ?? false,
  })) {
    return {
      output: null,
      wasSilent: true,
      wasModified: true,
      violations: [],
    };
  }
  
  // Validate the output
  const result = validateOutput(output);
  
  if (result.isValid) {
    return {
      output,
      wasSilent: false,
      wasModified: false,
      violations: [],
    };
  }
  
  // If autoFix is enabled, try to sanitize
  if (context.autoFix !== false) {
    const sanitized = result.sanitizedOutput;
    
    // If sanitization failed, use reassurance instead
    if (!sanitized) {
      return {
        output: REASSURANCE_PHRASES.handled,
        wasSilent: false,
        wasModified: true,
        violations: result.violations,
      };
    }
    
    return {
      output: sanitized,
      wasSilent: false,
      wasModified: true,
      violations: result.violations,
    };
  }
  
  // Return original with violations flagged
  return {
    output,
    wasSilent: false,
    wasModified: false,
    violations: result.violations,
  };
}
