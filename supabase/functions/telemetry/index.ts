import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelemetryEvent {
  event_type: string;
  event_name: string;
  payload?: Record<string, unknown>;
  latency_ms?: number;
  success?: boolean;
  error_message?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header if present
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const body = await req.json();
    const { action } = body;

    // TRACK: Record a telemetry event
    if (action === 'track') {
      const { event_type, event_name, payload, latency_ms, success, error_message } = body as TelemetryEvent;

      const { error } = await supabase.from('telemetry_events').insert({
        user_id: userId,
        event_type,
        event_name,
        payload: payload || {},
        latency_ms,
        success: success ?? true,
        error_message,
      });

      if (error) {
        console.error('Telemetry insert error:', error);
      }

      return new Response(JSON.stringify({ tracked: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // BATCH: Track multiple events
    if (action === 'batch') {
      const { events } = body as { events: TelemetryEvent[] };

      const rows = events.map(e => ({
        user_id: userId,
        event_type: e.event_type,
        event_name: e.event_name,
        payload: e.payload || {},
        latency_ms: e.latency_ms,
        success: e.success ?? true,
        error_message: e.error_message,
      }));

      const { error } = await supabase.from('telemetry_events').insert(rows);

      if (error) {
        console.error('Batch telemetry error:', error);
      }

      return new Response(JSON.stringify({ tracked: rows.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // METRICS: Get aggregated metrics
    if (action === 'metrics') {
      const { period = '24h', event_type } = body;

      const periodHours = period === '7d' ? 168 : period === '1h' ? 1 : 24;
      const since = new Date(Date.now() - periodHours * 60 * 60 * 1000).toISOString();

      let query = supabase
        .from('telemetry_events')
        .select('*')
        .gte('created_at', since);

      if (event_type) {
        query = query.eq('event_type', event_type);
      }

      const { data: events, error } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Calculate metrics
      const totalEvents = events?.length || 0;
      const successEvents = events?.filter(e => e.success).length || 0;
      const avgLatency = events?.length 
        ? events.reduce((sum, e) => sum + (e.latency_ms || 0), 0) / events.length
        : 0;

      const byType = events?.reduce((acc, e) => {
        if (!acc[e.event_type]) {
          acc[e.event_type] = { total: 0, success: 0, avg_latency: 0, latencies: [] };
        }
        acc[e.event_type].total++;
        if (e.success) acc[e.event_type].success++;
        if (e.latency_ms) acc[e.event_type].latencies.push(e.latency_ms);
        return acc;
      }, {} as Record<string, { total: number; success: number; avg_latency: number; latencies: number[] }>) || {};

      // Calculate averages
      Object.values(byType).forEach(v => {
        v.avg_latency = v.latencies.length 
          ? Math.round(v.latencies.reduce((a, b) => a + b, 0) / v.latencies.length)
          : 0;
        delete (v as any).latencies;
      });

      return new Response(JSON.stringify({
        period,
        total_events: totalEvents,
        success_rate: totalEvents ? (successEvents / totalEvents * 100).toFixed(1) + '%' : 'N/A',
        avg_latency_ms: Math.round(avgLatency),
        by_type: byType,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // FEEDBACK: Record AI quality feedback
    if (action === 'feedback') {
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { ai_block_type, input_hash, output_preview, rating, thumbs_up, feedback_text } = body;

      const { error } = await supabase.from('ai_feedback').insert({
        user_id: userId,
        ai_block_type,
        input_hash,
        output_preview,
        rating,
        thumbs_up,
        feedback_text,
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ recorded: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Telemetry error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
