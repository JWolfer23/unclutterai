import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latency_ms: number;
  details?: Record<string, unknown>;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  total_latency_ms: number;
  checks: HealthCheck[];
  feature_flags: Array<{ flag_name: string; is_enabled: boolean; rollout_percentage: number }>;
  metrics: {
    total_events_24h: number;
    success_rate: string;
    event_breakdown: Record<string, number>;
  };
}

interface MetricsResponse {
  period: string;
  total_events: number;
  success_rate: string;
  avg_latency_ms: number;
  by_type: Record<string, { total: number; success: number; avg_latency: number }>;
}

export function useOpsHealth() {
  // Fetch health status
  const { data: health, isLoading: isLoadingHealth, refetch: refetchHealth } = useQuery({
    queryKey: ['ops-health'],
    queryFn: async (): Promise<HealthResponse | null> => {
      const { data, error } = await supabase.functions.invoke('ops-health', {
        body: {}
      });
      if (error) {
        console.error('Health check error:', error);
        return null;
      }
      return data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch detailed metrics
  const { data: metrics, isLoading: isLoadingMetrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['ops-metrics'],
    queryFn: async (): Promise<MetricsResponse | null> => {
      const { data, error } = await supabase.functions.invoke('telemetry', {
        body: { action: 'metrics', period: '24h' }
      });
      if (error) {
        console.error('Metrics error:', error);
        return null;
      }
      return data;
    },
    refetchInterval: 5 * 60000, // Refresh every 5 minutes
  });

  return {
    health,
    metrics,
    isLoading: isLoadingHealth || isLoadingMetrics,
    refetch: () => {
      refetchHealth();
      refetchMetrics();
    },
    isHealthy: health?.status === 'healthy',
    isDegraded: health?.status === 'degraded',
    isDown: health?.status === 'down',
  };
}
