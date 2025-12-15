import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pricing configuration
const BASE_PRICE = 1.0; // USD reference unit
const MIN_MULTIPLIER = 1.0;
const MAX_MULTIPLIER = 2.5;
const DEMAND_FACTOR = 0.05;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron request');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting daily UCT price recalculation...');

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // STEP 1: Calculate total UCT spent in last 24h
    const { data: spentData, error: spentError } = await supabase
      .from('focus_ledger')
      .select('uct_reward')
      .eq('event_type', 'uct_spent')
      .gte('created_at', twentyFourHoursAgo);

    if (spentError) {
      console.error('Error fetching spent data:', spentError);
    }

    const totalUctSpent24h = spentData
      ? spentData.reduce((sum, entry) => sum + Math.abs(entry.uct_reward || 0), 0)
      : 0;

    // STEP 2: Count active users (users with focus sessions in last 24h)
    const { data: activeUsersData, error: activeError } = await supabase
      .from('focus_sessions')
      .select('user_id')
      .eq('is_completed', true)
      .gte('end_time', twentyFourHoursAgo);

    if (activeError) {
      console.error('Error fetching active users:', activeError);
    }

    const uniqueActiveUsers = new Set(activeUsersData?.map(s => s.user_id) || []);
    const totalActiveUsers = uniqueActiveUsers.size;

    // STEP 3: Calculate avg focus sessions per active user
    const { count: totalSessions } = await supabase
      .from('focus_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_completed', true)
      .gte('end_time', twentyFourHoursAgo);

    const avgFocusSessions = totalActiveUsers > 0 
      ? (totalSessions || 0) / totalActiveUsers 
      : 0;

    // STEP 4: Calculate demand score and price multiplier
    const demandScore = (totalUctSpent24h / Math.max(totalActiveUsers, 1)) * avgFocusSessions;
    
    const rawMultiplier = 1 + (demandScore * DEMAND_FACTOR);
    const priceMultiplier = Math.min(Math.max(rawMultiplier, MIN_MULTIPLIER), MAX_MULTIPLIER);
    
    const newUctPrice = Math.round(BASE_PRICE * priceMultiplier * 100) / 100;

    console.log(`Demand calculation: spent=${totalUctSpent24h}, users=${totalActiveUsers}, avg_sessions=${avgFocusSessions}`);
    console.log(`Demand score: ${demandScore}, multiplier: ${priceMultiplier}, new_price: ${newUctPrice}`);

    // STEP 5: Store price in uct_pricing table
    const { data: pricingEntry, error: insertError } = await supabase
      .from('uct_pricing')
      .insert({
        price: newUctPrice,
        demand_score: demandScore,
        price_multiplier: priceMultiplier,
        total_uct_spent_24h: totalUctSpent24h,
        total_active_users: totalActiveUsers,
        avg_focus_sessions: avgFocusSessions,
        calculated_at: now.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing price:', insertError);
      throw new Error(`Failed to store price: ${insertError.message}`);
    }

    console.log(`UCT price updated: $${newUctPrice} (multiplier: ${priceMultiplier}x)`);

    // STEP 6: Return result
    return new Response(
      JSON.stringify({
        uct_price: newUctPrice,
        multiplier: priceMultiplier,
        demand_score: demandScore,
        metrics: {
          total_uct_spent_24h: totalUctSpent24h,
          total_active_users: totalActiveUsers,
          avg_focus_sessions: avgFocusSessions,
        },
        status: 'updated',
        pricing_id: pricingEntry?.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('UCT pricing error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
