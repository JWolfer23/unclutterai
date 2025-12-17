import { useCallback } from 'react';
import { toast as originalToast } from '@/hooks/use-toast';
import { useFocusProtectionContext } from '@/contexts/FocusProtectionContext';

type ToastProps = Parameters<typeof originalToast>[0];

type UrgencyLevel = 'critical' | 'time_sensitive' | 'informational';

interface ProtectedToastOptions extends ToastProps {
  urgency?: UrgencyLevel;
}

export const useProtectedToast = () => {
  const { state, queueItem, shouldAllowInterruption } = useFocusProtectionContext();

  const notify = useCallback((options: ProtectedToastOptions) => {
    const { urgency = 'informational', title, description, ...rest } = options;

    // If in focus mode, check if interruption is allowed
    if (state.isInFocus && !shouldAllowInterruption(urgency)) {
      // Queue silently instead of showing
      queueItem({
        type: 'notification',
        title: typeof title === 'string' ? title : 'Notification',
        urgency,
        handled: false,
      });
      return;
    }

    // Show the toast normally
    originalToast({ title, description, ...rest });
  }, [state.isInFocus, shouldAllowInterruption, queueItem]);

  // Expose both protected notify and direct toast for critical cases
  return {
    notify,
    // For truly critical notifications that must always show
    criticalNotify: (options: ToastProps) => {
      originalToast(options);
    },
  };
};
