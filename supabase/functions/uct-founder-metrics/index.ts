import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FounderMetrics {
  // Core metrics
  total_uct_earned: number;
  total_uct_spent: number;
  total_uct_decayed: number;
  total_uct_minted: number;
  avg_uct_per_user: number;
  
  // Activity metrics
  daily_active_earners: number;
  weekly_active_users: number;
  total_users_with_balance: number;
  
  // Revenue metrics
  agent_revenue_uct: number;
  total_focus_sessions: number;
  avg_session_duration_mins: number;
  
  // Leaderboards
  top_earners: Array<{ user_id: string; total_earned: number }>;
  top_spenders: Array<{ user_id: string; total_spent: number }>;
  
  // Timestamps
  calculated_at: string;
  period_start: string;
  period_end: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify cron secret or admin auth
    const authHeader = req.headers.get('authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    // Allow cron or authenticated admin
    let isAuthorized = false;
    let isAdmin = false;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (authHeader === `Bearer ${cronSecret}`) {
      isAuthorized = true;
    } else if (authHeader?.startsWith('Bearer ')) {
      // Check if user is admin
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        
        if (roleData) {
          isAuthorized = true;
          isAdmin = true;
        }
      }
    }

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating founder metrics...');

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // STEP 1: Aggregate Data from focus_ledger

    // Total UCT earned (positive rewards)
    const { data: earnedData } = await supabase
      .from('focus_ledger')
      .select('uct_reward')
      .gt('uct_reward', 0);
    
    const totalUctEarned = earnedData?.reduce((sum, e) => sum + (e.uct_reward || 0), 0) || 0;

    // Total UCT spent (negative rewards from agent execution)
    const { data: spentData } = await supabase
      .from('focus_ledger')
      .select('uct_reward')
      .eq('event_type', 'uct_spent');
    
    const totalUctSpent = Math.abs(spentData?.reduce((sum, e) => sum + (e.uct_reward || 0), 0) || 0);

    // Total UCT decayed
    const { data: decayedData } = await supabase
      .from('focus_ledger')
      .select('uct_reward')
      .eq('event_type', 'uct_decay');
    
    const totalUctDecayed = Math.abs(decayedData?.reduce((sum, e) => sum + (e.uct_reward || 0), 0) || 0);

    // Total UCT minted on-chain
    const { data: mintedData } = await supabase
      .from('focus_ledger')
      .select('uct_reward')
      .eq('event_type', 'uct_minted_onchain');
    
    const totalUctMinted = mintedData?.reduce((sum, e) => sum + (e.uct_reward || 0), 0) || 0;

    // Daily active earners (unique users with positive ledger entries in last 24h)
    const { data: dailyEarners } = await supabase
      .from('focus_ledger')
      .select('user_id')
      .gt('uct_reward', 0)
      .gte('created_at', twentyFourHoursAgo);
    
    const uniqueDailyEarners = new Set(dailyEarners?.map(e => e.user_id) || []);
    const dailyActiveEarners = uniqueDailyEarners.size;

    // Weekly active users (focus sessions in last 7 days)
    const { data: weeklyUsers } = await supabase
      .from('focus_sessions')
      .select('user_id')
      .eq('is_completed', true)
      .gte('end_time', sevenDaysAgo);
    
    const uniqueWeeklyUsers = new Set(weeklyUsers?.map(e => e.user_id) || []);
    const weeklyActiveUsers = uniqueWeeklyUsers.size;

    // Users with balance
    const { count: usersWithBalance } = await supabase
      .from('uct_balances')
      .select('*', { count: 'exact', head: true })
      .gt('balance', 0);

    // Average UCT per active user
    const avgUctPerUser = weeklyActiveUsers > 0 
      ? Math.round((totalUctEarned / weeklyActiveUsers) * 100) / 100 
      : 0;

    // AI Agent revenue (total spent on agents)
    const { data: agentRevenueData } = await supabase
      .from('focus_ledger')
      .select('uct_reward')
      .in('event_type', ['uct_spent', 'agent_execution']);
    
    const agentRevenueUct = Math.abs(agentRevenueData?.reduce((sum, e) => sum + (e.uct_reward || 0), 0) || 0);

    // Total focus sessions
    const { count: totalSessions } = await supabase
      .from('focus_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_completed', true);

    // Average session duration
    const { data: sessionDurations } = await supabase
      .from('focus_sessions')
      .select('actual_minutes')
      .eq('is_completed', true)
      .not('actual_minutes', 'is', null);
    
    const avgSessionDuration = sessionDurations && sessionDurations.length > 0
      ? Math.round(sessionDurations.reduce((sum, s) => sum + (s.actual_minutes || 0), 0) / sessionDurations.length)
      : 0;

    // Top 10 UCT earners
    const { data: topEarnersRaw } = await supabase
      .from('focus_ledger')
      .select('user_id, uct_reward')
      .gt('uct_reward', 0);
    
    const earnerTotals = new Map<string, number>();
    topEarnersRaw?.forEach(e => {
      earnerTotals.set(e.user_id, (earnerTotals.get(e.user_id) || 0) + e.uct_reward);
    });
    
    const topEarners = Array.from(earnerTotals.entries())
      .map(([user_id, total_earned]) => ({ user_id, total_earned }))
      .sort((a, b) => b.total_earned - a.total_earned)
      .slice(0, 10);

    // Top 10 UCT spenders
    const { data: topSpendersRaw } = await supabase
      .from('focus_ledger')
      .select('user_id, uct_reward')
      .lt('uct_reward', 0);
    
    const spenderTotals = new Map<string, number>();
    topSpendersRaw?.forEach(e => {
      spenderTotals.set(e.user_id, (spenderTotals.get(e.user_id) || 0) + Math.abs(e.uct_reward));
    });
    
    const topSpenders = Array.from(spenderTotals.entries())
      .map(([user_id, total_spent]) => ({ user_id, total_spent }))
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 10);

    // Compile metrics
    const metrics: FounderMetrics = {
      total_uct_earned: Math.round(totalUctEarned * 100) / 100,
      total_uct_spent: Math.round(totalUctSpent * 100) / 100,
      total_uct_decayed: Math.round(totalUctDecayed * 100) / 100,
      total_uct_minted: Math.round(totalUctMinted * 100) / 100,
      avg_uct_per_user: avgUctPerUser,
      daily_active_earners: dailyActiveEarners,
      weekly_active_users: weeklyActiveUsers,
      total_users_with_balance: usersWithBalance || 0,
      agent_revenue_uct: Math.round(agentRevenueUct * 100) / 100,
      total_focus_sessions: totalSessions || 0,
      avg_session_duration_mins: avgSessionDuration,
      top_earners: topEarners,
      top_spenders: topSpenders,
      calculated_at: now.toISOString(),
      period_start: twentyFourHoursAgo,
      period_end: now.toISOString(),
    };

    console.log('Metrics calculated:', JSON.stringify(metrics, null, 2));

    // STEP 2: Store snapshot
    const { error: insertError } = await supabase
      .from('uct_metrics_daily')
      .insert({
        metrics_json: metrics,
        total_uct_earned: metrics.total_uct_earned,
        total_uct_spent: metrics.total_uct_spent,
        total_uct_decayed: metrics.total_uct_decayed,
        avg_uct_per_user: metrics.avg_uct_per_user,
        daily_active_earners: metrics.daily_active_earners,
        agent_revenue_uct: metrics.agent_revenue_uct,
      });

    if (insertError) {
      console.error('Error storing metrics:', insertError);
    } else {
      console.log('Metrics snapshot stored successfully');
    }

    // STEP 3: Return metrics
    return new Response(
      JSON.stringify({
        metrics,
        status: 'calculated',
        stored: !insertError,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Founder metrics error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
