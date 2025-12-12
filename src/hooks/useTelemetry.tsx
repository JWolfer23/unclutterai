import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TelemetryEvent {
  event_type: string;
  event_name: string;
  payload?: Record<string, unknown>;
  latency_ms?: number;
  success?: boolean;
  error_message?: string;
}

export function useTelemetry() {
  // Track single event
  const trackMutation = useMutation({
    mutationFn: async (event: TelemetryEvent) => {
      const { data, error } = await supabase.functions.invoke('telemetry', {
        body: { action: 'track', ...event }
      });
      if (error) throw error;
      return data;
    },
  });

  // Track multiple events
  const batchMutation = useMutation({
    mutationFn: async (events: TelemetryEvent[]) => {
      const { data, error } = await supabase.functions.invoke('telemetry', {
        body: { action: 'batch', events }
      });
      if (error) throw error;
      return data;
    },
  });

  // Submit AI feedback
  const feedbackMutation = useMutation({
    mutationFn: async (feedback: {
      ai_block_type: string;
      input_hash?: string;
      output_preview?: string;
      rating?: number;
      thumbs_up?: boolean;
      feedback_text?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('telemetry', {
        body: { action: 'feedback', ...feedback }
      });
      if (error) throw error;
      return data;
    },
  });

  // Helper to track with timing
  const trackWithTiming = async <T,>(
    eventType: string,
    eventName: string,
    operation: () => Promise<T>,
    payload?: Record<string, unknown>
  ): Promise<T> => {
    const start = performance.now();
    let success = true;
    let errorMessage: string | undefined;
    let result: T;

    try {
      result = await operation();
    } catch (e) {
      success = false;
      errorMessage = e instanceof Error ? e.message : 'Unknown error';
      throw e;
    } finally {
      const latency = Math.round(performance.now() - start);
      trackMutation.mutate({
        event_type: eventType,
        event_name: eventName,
        payload,
        latency_ms: latency,
        success,
        error_message: errorMessage,
      });
    }

    return result!;
  };

  return {
    track: trackMutation.mutate,
    trackAsync: trackMutation.mutateAsync,
    trackBatch: batchMutation.mutate,
    trackWithTiming,
    submitFeedback: feedbackMutation.mutate,
    isTracking: trackMutation.isPending,
  };
}

// Standalone tracking function for use outside React components
export async function trackEvent(event: TelemetryEvent): Promise<void> {
  try {
    await supabase.functions.invoke('telemetry', {
      body: { action: 'track', ...event }
    });
  } catch (e) {
    console.error('Telemetry tracking failed:', e);
  }
}
