import { useCallback } from 'react';
import { toast as originalToast } from '@/hooks/use-toast';
import { useFocusProtectionContext } from '@/contexts/FocusProtectionContext';

type ToastProps = Parameters<typeof originalToast>[0];

type UrgencyLevel = 'critical' | 'time_sensitive' | 'informational';

interface ProtectedToastOptions extends ToastProps {
  urgency?: UrgencyLevel;
}

/**
 * Protected toast hook that respects global interruption rules.
 * 
 * Rules:
 * - No interruptions during focus (default)
 * - May interrupt if user explicitly allows OR urgency is critical
 * - Otherwise: Defer and log for post-focus summary
 */
export const useProtectedToast = () => {
  const { state, queueItem, shouldAllowInterruption, logInterruption } = useFocusProtectionContext();

  const notify = useCallback((options: ProtectedToastOptions) => {
    const { urgency = 'informational', title, description, ...rest } = options;

    // Check global interruption rules
    const allowed = shouldAllowInterruption(urgency);

    if (state.isInFocus) {
      // Log the interruption attempt
      logInterruption(
        urgency,
        allowed,
        allowed ? 'threshold_crossed' : 'focus_mode_blocked'
      );

      if (!allowed) {
        // Defer: queue silently for post-focus summary
        queueItem({
          type: 'notification',
          title: typeof title === 'string' ? title : 'Notification',
          urgency,
          handled: false,
        });
        console.log('[ProtectedToast] Deferred notification:', title);
        return;
      }
    }

    // Show the toast
    originalToast({ title, description, ...rest });
  }, [state.isInFocus, shouldAllowInterruption, queueItem, logInterruption]);

  // Critical notify - always shows but still logs during focus
  const criticalNotify = useCallback((options: ToastProps) => {
    if (state.isInFocus) {
      logInterruption('critical', true, 'critical_override');
      // Log it so it appears in summary
      queueItem({
        type: 'notification',
        title: typeof options.title === 'string' ? options.title : 'Critical Alert',
        urgency: 'critical',
        handled: true, // Marked handled since we're showing it
      });
    }
    originalToast(options);
  }, [state.isInFocus, logInterruption, queueItem]);

  return {
    notify,
    criticalNotify,
    // Expose focus state for conditional rendering
    isInFocus: state.isInFocus,
  };
};
