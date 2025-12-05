import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's JWT for RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching focus analytics for user: ${user.id}`);

    // Fetch all analytics data in parallel
    const [
      todayMinutesResult,
      weeklyMinutesResult,
      weeklyUCTResult,
      monthlyUCTResult,
      lifetimeUCTResult,
      sessionsThisWeekResult,
      streakResult,
      weeklyTierResult,
      dailyMinutesResult,
      modeBreakdownResult,
      recentSessionsResult,
      totalSessionsResult,
    ] = await Promise.all([
      // Today's focus minutes
      supabase.rpc('get_focus_minutes_today', { p_user_id: user.id }),
      // Weekly focus minutes
      supabase.rpc('get_focus_minutes_week', { p_user_id: user.id }),
      // Weekly UCT earned
      supabase.rpc('get_uct_earned_week', { p_user_id: user.id }),
      // Monthly UCT earned
      supabase.rpc('get_uct_earned_month', { p_user_id: user.id }),
      // Lifetime UCT earned
      supabase.rpc('get_lifetime_uct', { p_user_id: user.id }),
      // Sessions this week
      supabase.rpc('get_sessions_this_week', { p_user_id: user.id }),
      // Streak data
      supabase.from('focus_streaks').select('*').eq('user_id', user.id).maybeSingle(),
      // Weekly tier
      supabase.rpc('get_weekly_tier', { p_user_id: user.id }),
      // Daily minutes (last 30 days)
      supabase.rpc('get_focus_minutes_by_day', { p_user_id: user.id }),
      // Mode breakdown
      supabase.rpc('get_mode_usage_breakdown', { p_user_id: user.id }),
      // Recent sessions (last 10)
      supabase
        .from('focus_sessions')
        .select('id, mode, goal, start_time, end_time, actual_minutes, uct_reward, is_completed, focus_score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      // Total completed sessions
      supabase
        .from('focus_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_completed', true),
    ]);

    // Extract values with defaults
    const todayMinutes = todayMinutesResult.data ?? 0;
    const weeklyMinutes = weeklyMinutesResult.data ?? 0;
    const weeklyUCT = weeklyUCTResult.data ?? 0;
    const monthlyUCT = monthlyUCTResult.data ?? 0;
    const lifetimeUCT = lifetimeUCTResult.data ?? 0;
    const sessionsThisWeek = sessionsThisWeekResult.data ?? 0;
    const totalSessions = totalSessionsResult.count ?? 0;

    // Streak data
    const currentStreak = streakResult.data?.current_streak ?? 0;
    const longestStreak = streakResult.data?.longest_streak ?? 0;
    const lastSession = streakResult.data?.last_session ?? null;

    // Weekly tier
    const weeklyTierData = weeklyTierResult.data?.[0];
    const tier = weeklyTierData?.tier ?? 'none';
    const tierBonus = weeklyTierData?.bonus_percent ?? 0;

    // Daily minutes for graph
    const dailyMinutes = dailyMinutesResult.data ?? [];

    // Mode breakdown
    const modeBreakdown = modeBreakdownResult.data ?? [];

    // Recent sessions
    const recentSessions = recentSessionsResult.data ?? [];

    // Log summary
    console.log(`Analytics: ${todayMinutes}min today, ${weeklyMinutes}min week, ${weeklyUCT} UCT week, streak: ${currentStreak}, tier: ${tier}`);

    const analytics = {
      today_minutes: todayMinutes,
      weekly_minutes: weeklyMinutes,
      weekly_uct: Number(weeklyUCT),
      monthly_uct: Number(monthlyUCT),
      lifetime_uct: Number(lifetimeUCT),
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_session: lastSession,
      tier,
      tier_bonus_percent: tierBonus,
      sessions_this_week: sessionsThisWeek,
      total_sessions: totalSessions,
      focus_history: recentSessions.map(s => ({
        id: s.id,
        mode: s.mode,
        goal: s.goal,
        start_time: s.start_time,
        end_time: s.end_time,
        duration_minutes: s.actual_minutes,
        uct_reward: s.uct_reward,
        is_completed: s.is_completed,
        focus_score: s.focus_score,
      })),
      mode_breakdown: modeBreakdown.map(m => ({
        mode: m.mode,
        session_count: m.session_count,
        total_minutes: m.total_minutes,
      })),
      graph_30_days: dailyMinutes.map(d => ({
        day: d.day,
        total_minutes: d.total_minutes,
      })),
    };

    return new Response(
      JSON.stringify(analytics),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Focus analytics error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
