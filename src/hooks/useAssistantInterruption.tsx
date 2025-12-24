import { useCallback } from 'react';
import { useFocusProtectionContext } from '@/contexts/FocusProtectionContext';
import { useAssistantProfile } from '@/hooks/useAssistantProfile';
import { toast as originalToast } from '@/hooks/use-toast';
import { 
  applyCognitiveLoadGuardrail,
  resolveUncertainty,
  REASSURANCE_PHRASES 
} from '@/lib/cognitiveLoadGuardrail';

type UrgencyLevel = 'critical' | 'time_sensitive' | 'informational';

interface InterruptionRequest {
  type: 'notification' | 'message' | 'task' | 'assistant';
  title: string;
  description?: string;
  urgency: UrgencyLevel;
  sender?: string;
  action?: () => void;
}

interface InterruptionResult {
  allowed: boolean;
  reason: 'focus_mode' | 'user_preference' | 'threshold_not_met' | 'allowed';
  deferred: boolean;
}

/**
 * Global assistant interruption rules.
 * 
 * Default behavior:
 * - No interruptions during focus mode
 * 
 * Assistant may interrupt ONLY if:
 * - User explicitly allows (via interruptionPreference)
 * - OR urgency threshold is crossed (critical always allowed)
 * 
 * Otherwise:
 * - Defer the item
 * - Log for post-focus summary
 */
export const useAssistantInterruption = () => {
  const { state, queueItem, shouldAllowInterruption } = useFocusProtectionContext();
  const { profile, shouldInterrupt } = useAssistantProfile();

  /**
   * Check if an interruption should be allowed based on global rules.
   * Returns whether to proceed and the reason.
   */
  const checkInterruption = useCallback((urgency: UrgencyLevel): InterruptionResult => {
    // Rule 1: If not in focus mode, use user's preference
    if (!state.isInFocus) {
      const allowed = shouldInterrupt(urgency);
      return {
        allowed,
        reason: allowed ? 'allowed' : 'user_preference',
        deferred: false,
      };
    }

    // Rule 2: During focus mode, check if urgency threshold is crossed
    const allowed = shouldAllowInterruption(urgency);
    
    return {
      allowed,
      reason: allowed ? 'allowed' : 'focus_mode',
      deferred: !allowed,
    };
  }, [state.isInFocus, shouldInterrupt, shouldAllowInterruption]);

  /**
   * Request an interruption. If not allowed, the item is automatically
   * deferred and logged for the post-focus summary.
   */
  const requestInterruption = useCallback((request: InterruptionRequest): boolean => {
    const result = checkInterruption(request.urgency);

    if (!result.allowed) {
      // Defer: queue the item for post-focus summary
      queueItem({
        type: request.type === 'assistant' ? 'notification' : request.type,
        title: request.title,
        sender: request.sender,
        urgency: request.urgency,
        handled: false,
      });

      console.log('[Interruption] Deferred:', request.title, 'Reason:', result.reason);
      return false;
    }

    // Allowed: execute the action if provided
    if (request.action) {
      request.action();
    }

    return true;
  }, [checkInterruption, queueItem]);

  /**
   * Show a notification respecting global interruption rules AND cognitive load guardrail.
   * If blocked, the notification is silently queued.
   * Messages are validated to never ask unnecessary questions or present multiple options.
   */
  const notify = useCallback((options: {
    title: string;
    description?: string;
    urgency?: UrgencyLevel;
    variant?: 'default' | 'destructive';
  }) => {
    const urgency = options.urgency || 'informational';
    
    const allowed = requestInterruption({
      type: 'notification',
      title: options.title,
      description: options.description,
      urgency,
    });

    if (allowed) {
      // Apply cognitive load guardrail to the notification content
      const guardrailResult = applyCognitiveLoadGuardrail(
        options.description || options.title,
        {
          hasUrgentItems: urgency === 'critical',
          hasUserRequest: false,
          isInFocusMode: state.isInFocus,
          hasActionableItem: true,
          autoFix: true,
        }
      );

      // Only show if guardrail allows and didn't suppress
      if (!guardrailResult.wasSilent && guardrailResult.output) {
        originalToast({
          title: options.title,
          description: guardrailResult.output !== options.description 
            ? guardrailResult.output 
            : options.description,
          variant: options.variant,
        });
      }
    }
  }, [requestInterruption, state.isInFocus]);

  /**
   * Force a critical notification that bypasses all rules.
   * Use sparingly - only for truly critical system alerts.
   */
  const criticalNotify = useCallback((options: {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
  }) => {
    // Log even critical notifications during focus for summary
    if (state.isInFocus) {
      queueItem({
        type: 'notification',
        title: options.title,
        urgency: 'critical',
        handled: true, // Marked as handled since we're showing it
      });
    }

    originalToast({
      title: options.title,
      description: options.description,
      variant: options.variant || 'destructive',
    });
  }, [state.isInFocus, queueItem]);

  /**
   * Get current interruption settings summary
   */
  const getInterruptionSettings = useCallback(() => {
    return {
      isInFocus: state.isInFocus,
      focusSessionId: state.sessionId,
      interruptionPreference: profile?.interruptionPreference || 'minimal',
      queuedItemsCount: state.queuedItems.length,
      thresholds: {
        critical: true, // Always allowed
        time_sensitive: profile?.interruptionPreference !== 'minimal',
        informational: profile?.interruptionPreference === 'balanced',
      },
    };
  }, [state, profile]);

  /**
   * Handle uncertainty by converting to reassurance instead of questions
   * This enforces the cognitive load rule: "If uncertainty remains, respond with reassurance, not questions"
   */
  const handleUncertainty = useCallback((
    topic: string,
    confidenceLevel: number,
    hasPartialInfo: boolean = false
  ): string => {
    return resolveUncertainty({ topic, confidenceLevel, hasPartialInfo });
  }, []);

  return {
    // Core functions
    checkInterruption,
    requestInterruption,
    
    // Notification helpers
    notify,
    criticalNotify,
    
    // Cognitive load helpers
    handleUncertainty,
    REASSURANCE_PHRASES,
    
    // State
    isInFocus: state.isInFocus,
    queuedItemsCount: state.queuedItems.length,
    getInterruptionSettings,
  };
};

export type { UrgencyLevel, InterruptionRequest, InterruptionResult };
