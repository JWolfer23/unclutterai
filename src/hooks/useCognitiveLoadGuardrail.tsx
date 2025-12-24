import { useCallback, useMemo } from 'react';
import { useFocusProtectionContext } from '@/contexts/FocusProtectionContext';
import {
  applyCognitiveLoadGuardrail,
  selectSingleBestAction,
  resolveUncertainty,
  formatClearResponse,
  shouldRemainSilent,
  REASSURANCE_PHRASES,
  type GuardrailViolation,
} from '@/lib/cognitiveLoadGuardrail';

interface GuardrailContext {
  hasUrgentItems?: boolean;
  hasUserRequest?: boolean;
  hasActionableItem?: boolean;
}

interface ProcessedOutput {
  output: string | null;
  shouldSpeak: boolean;
  wasModified: boolean;
  violations: GuardrailViolation[];
}

/**
 * Hook for applying cognitive load guardrails to assistant behavior.
 * 
 * Rules enforced:
 * 1. Never ask unnecessary questions
 * 2. Never present more than one option verbally
 * 3. Default to silence when no action is required
 * 4. Resolve uncertainty internally before speaking
 * 5. If uncertainty remains, respond with reassurance
 */
export function useCognitiveLoadGuardrail() {
  const { state } = useFocusProtectionContext();

  /**
   * Process assistant output through the guardrail
   */
  const processOutput = useCallback((
    output: string,
    context: GuardrailContext = {}
  ): ProcessedOutput => {
    const result = applyCognitiveLoadGuardrail(output, {
      ...context,
      isInFocusMode: state.isInFocus,
      autoFix: true,
    });

    return {
      output: result.output,
      shouldSpeak: !result.wasSilent && result.output !== null,
      wasModified: result.wasModified,
      violations: result.violations,
    };
  }, [state.isInFocus]);

  /**
   * Check if assistant should remain silent given current context
   */
  const checkSilence = useCallback((context: GuardrailContext): boolean => {
    return shouldRemainSilent({
      hasUrgentItems: context.hasUrgentItems ?? false,
      hasUserRequest: context.hasUserRequest ?? false,
      isInFocusMode: state.isInFocus,
      hasActionableItem: context.hasActionableItem ?? false,
    });
  }, [state.isInFocus]);

  /**
   * Select the single best action from a list - never returns multiple options
   */
  const selectBestAction = useCallback(<T extends { priority?: number; urgency?: string; score?: number }>(
    options: T[]
  ): T | null => {
    return selectSingleBestAction(options);
  }, []);

  /**
   * Convert uncertainty into reassurance instead of questions
   */
  const handleUncertainty = useCallback((
    topic: string,
    confidenceLevel: number,
    hasPartialInfo: boolean = false
  ): string => {
    return resolveUncertainty({ topic, confidenceLevel, hasPartialInfo });
  }, []);

  /**
   * Format a clear, declarative response
   */
  const formatResponse = useCallback((params: {
    action?: string;
    context?: string;
    isComplete?: boolean;
  }): string => {
    return formatClearResponse(params);
  }, []);

  /**
   * Get a reassurance phrase for a given situation
   */
  const getReassurance = useCallback((
    type: keyof typeof REASSURANCE_PHRASES = 'noAction'
  ): string => {
    return REASSURANCE_PHRASES[type];
  }, []);

  // Memoized context state
  const guardrailState = useMemo(() => ({
    isInFocusMode: state.isInFocus,
    defaultToSilence: !state.isInFocus, // Outside focus, still prefer silence by default
  }), [state.isInFocus]);

  return {
    // Core processing
    processOutput,
    checkSilence,
    
    // Decision helpers
    selectBestAction,
    handleUncertainty,
    
    // Formatting
    formatResponse,
    getReassurance,
    
    // State
    ...guardrailState,
    
    // Constants for external use
    REASSURANCE_PHRASES,
  };
}

export type { GuardrailContext, ProcessedOutput };
