import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Decay configuration
const DECAY_RATE = 0.02; // 2% per inactive week
const MIN_DECAY = 0.1;   // Minimum decay amount
const MAX_DECAY = 5.0;   // Maximum decay amount
const INACTIVITY_DAYS = 7;

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

    console.log('Starting weekly UCT decay process...');

    // Get cutoff date (7 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - INACTIVITY_DAYS);
    const cutoffISO = cutoffDate.toISOString();

    // Fetch all users with UCT balance
    const { data: balances, error: balanceError } = await supabase
      .from('uct_balances')
      .select('user_id, balance')
      .gt('balance', 0);

    if (balanceError) {
      throw new Error(`Failed to fetch balances: ${balanceError.message}`);
    }

    if (!balances || balances.length === 0) {
      console.log('No users with positive balance found');
      return new Response(
        JSON.stringify({ processed: 0, decayed: 0, status: 'no_users' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processedCount = 0;
    let decayedCount = 0;
    let totalDecayed = 0;
    const results: Array<{ user_id: string; decayed: number; new_balance: number }> = [];

    for (const userBalance of balances) {
      const userId = userBalance.user_id;
      const currentBalance = userBalance.balance || 0;

      // STEP 1: Check Activity - get last focus session
      const { data: lastSession, error: sessionError } = await supabase
        .from('focus_sessions')
        .select('end_time')
        .eq('user_id', userId)
        .eq('is_completed', true)
        .order('end_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError) {
        console.error(`Error fetching sessions for user ${userId}:`, sessionError);
        continue;
      }

      // Skip if user was active within last 7 days
      if (lastSession?.end_time && new Date(lastSession.end_time) >= cutoffDate) {
        console.log(`User ${userId} is active, skipping decay`);
        processedCount++;
        continue;
      }

      // Calculate inactivity days
      const lastActiveDate = lastSession?.end_time ? new Date(lastSession.end_time) : null;
      const inactivityDays = lastActiveDate 
        ? Math.floor((Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999; // Never had a session

      // STEP 2: Calculate Decay
      const rawDecay = currentBalance * DECAY_RATE;
      const decayAmount = Math.min(Math.max(rawDecay, MIN_DECAY), MAX_DECAY);
      
      // Don't decay below 0
      const actualDecay = Math.min(decayAmount, currentBalance);
      const newBalance = currentBalance - actualDecay;

      // STEP 3: Apply Decay
      const { error: updateError } = await supabase
        .from('uct_balances')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error(`Error applying decay for user ${userId}:`, updateError);
        continue;
      }

      // STEP 4: Log Ledger Entry
      await supabase.from('focus_ledger').insert({
        user_id: userId,
        event_type: 'uct_decay',
        payload: {
          inactivity_days: inactivityDays,
          decay_rate: DECAY_RATE,
          original_balance: currentBalance,
        },
        uct_reward: -actualDecay,
      });

      console.log(`Decayed ${actualDecay} UCT from user ${userId} (inactive ${inactivityDays} days)`);

      processedCount++;
      decayedCount++;
      totalDecayed += actualDecay;
      results.push({
        user_id: userId,
        decayed: actualDecay,
        new_balance: newBalance,
      });
    }

    console.log(`Weekly decay complete: ${decayedCount}/${processedCount} users decayed, total ${totalDecayed} UCT`);

    // STEP 5: Return summary
    return new Response(
      JSON.stringify({
        processed: processedCount,
        decayed_users: decayedCount,
        total_decayed: totalDecayed,
        status: 'applied',
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('UCT decay error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
