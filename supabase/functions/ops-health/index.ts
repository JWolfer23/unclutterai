import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latency_ms: number;
  details?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const checks: HealthCheck[] = [];

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Database health check
    const dbStart = Date.now();
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      checks.push({
        service: 'database',
        status: error ? 'degraded' : 'healthy',
        latency_ms: Date.now() - dbStart,
        details: error ? { error: error.message } : undefined
      });
    } catch (e) {
      checks.push({
        service: 'database',
        status: 'down',
        latency_ms: Date.now() - dbStart,
        details: { error: e instanceof Error ? e.message : 'Unknown error' }
      });
    }

    // 2. Auth service check
    const authStart = Date.now();
    try {
      const { data, error } = await supabase.auth.getSession();
      checks.push({
        service: 'auth',
        status: error ? 'degraded' : 'healthy',
        latency_ms: Date.now() - authStart,
      });
    } catch (e) {
      checks.push({
        service: 'auth',
        status: 'down',
        latency_ms: Date.now() - authStart,
        details: { error: e instanceof Error ? e.message : 'Unknown error' }
      });
    }

    // 3. Edge functions check (self-ping)
    checks.push({
      service: 'edge_functions',
      status: 'healthy',
      latency_ms: Date.now() - startTime,
    });

    // 4. Lovable AI gateway check
    const aiStart = Date.now();
    try {
      const lovableKey = Deno.env.get('LOVABLE_API_KEY');
      if (lovableKey) {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/models', {
          headers: { Authorization: `Bearer ${lovableKey}` },
        });
        checks.push({
          service: 'ai_gateway',
          status: aiResponse.ok ? 'healthy' : 'degraded',
          latency_ms: Date.now() - aiStart,
          details: { status_code: aiResponse.status }
        });
      } else {
        checks.push({
          service: 'ai_gateway',
          status: 'degraded',
          latency_ms: 0,
          details: { error: 'LOVABLE_API_KEY not configured' }
        });
      }
    } catch (e) {
      checks.push({
        service: 'ai_gateway',
        status: 'down',
        latency_ms: Date.now() - aiStart,
        details: { error: e instanceof Error ? e.message : 'Unknown error' }
      });
    }

    // 5. Check feature flags
    const { data: flags, error: flagsError } = await supabase
      .from('feature_flags')
      .select('flag_name, is_enabled, rollout_percentage');

    // 6. Calculate metrics summary
    const metricsStart = Date.now();
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { data: telemetryStats } = await supabase
      .from('telemetry_events')
      .select('event_type, success')
      .gte('created_at', oneDayAgo.toISOString());

    const metrics = {
      total_events_24h: telemetryStats?.length || 0,
      success_rate: telemetryStats?.length 
        ? (telemetryStats.filter(e => e.success).length / telemetryStats.length * 100).toFixed(1) + '%'
        : 'N/A',
      event_breakdown: telemetryStats?.reduce((acc, e) => {
        acc[e.event_type] = (acc[e.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {}
    };

    // Overall status
    const overallStatus = checks.every(c => c.status === 'healthy') 
      ? 'healthy' 
      : checks.some(c => c.status === 'down') 
        ? 'down' 
        : 'degraded';

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      total_latency_ms: Date.now() - startTime,
      checks,
      feature_flags: flags || [],
      metrics,
    };

    // Log health check
    await supabase.from('telemetry_events').insert({
      event_type: 'ops',
      event_name: 'health_check',
      payload: { status: overallStatus, checks_count: checks.length },
      latency_ms: Date.now() - startTime,
      success: overallStatus !== 'down',
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Health check error:', error);
    return new Response(JSON.stringify({ 
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
