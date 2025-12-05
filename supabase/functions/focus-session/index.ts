import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mode multipliers for reward calculation
const MODE_MULTIPLIERS: Record<string, number> = {
  learning: 1.3,
  career: 1.2,
  wealth: 1.1,
  health: 1.0,
};

// Tier thresholds based on weekly sessions
const TIER_THRESHOLDS = [
  { minSessions: 10, tier: 'platinum', bonus: 0.15 },
  { minSessions: 7, tier: 'gold', bonus: 0.10 },
  { minSessions: 5, tier: 'silver', bonus: 0.05 },
  { minSessions: 3, tier: 'bronze', bonus: 0.02 },
  { minSessions: 0, tier: 'none', bonus: 0 },
];

interface RewardCalculation {
  base: number;
  modeBonus: number;
  streakBonus: number;
  tierBonus: number;
  total: number;
  tier: string;
}

// Calculate reward based on session parameters
function calculateReward(
  durationMinutes: number,
  mode: string,
  currentStreak: number,
  sessionsThisWeek: number
): RewardCalculation {
  const base = durationMinutes * 0.05;
  const modeMultiplier = MODE_MULTIPLIERS[mode] || 1.0;
  const modeBonus = base * (modeMultiplier - 1);
  const streakBonus = durationMinutes * (currentStreak * 0.005);
  
  // Determine tier
  const tierInfo = TIER_THRESHOLDS.find(t => sessionsThisWeek >= t.minSessions) || TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];
  
  const subtotal = base + modeBonus + streakBonus;
  const tierBonus = subtotal * tierInfo.bonus;
  const total = Math.round((subtotal + tierBonus) * 100) / 100;
  
  return {
    base: Math.round(base * 100) / 100,
    modeBonus: Math.round(modeBonus * 100) / 100,
    streakBonus: Math.round(streakBonus * 100) / 100,
    tierBonus: Math.round(tierBonus * 100) / 100,
    total,
    tier: tierInfo.tier,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's JWT for RLS
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Create admin client for operations that need elevated privileges
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, ...params } = await req.json();
    console.log(`Focus session action: ${action} for user: ${user.id}`);

    switch (action) {
      case 'start':
        return await handleStart(supabaseUser, user.id, params);
      case 'complete':
        return await handleComplete(supabaseUser, supabaseAdmin, user.id, params);
      case 'break':
        return await handleBreak(supabaseUser, user.id, params);
      case 'notes':
        return await handleNotes(supabaseUser, user.id, params);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Focus session error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// 1️⃣ START SESSION
async function handleStart(supabase: any, userId: string, params: { mode: string; goal: string }) {
  const { mode, goal } = params;
  
  if (!mode) {
    return new Response(
      JSON.stringify({ error: 'Mode is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Starting focus session for user ${userId}, mode: ${mode}, goal: ${goal}`);

  const { data: session, error } = await supabase
    .from('focus_sessions')
    .insert({
      user_id: userId,
      mode,
      goal: goal || null,
      start_time: new Date().toISOString(),
      end_time: null,
      actual_minutes: null,
      notes: null,
      uct_reward: 0,
      is_completed: false,
      interruptions: 0,
    })
    .select('id, start_time')
    .single();

  if (error) {
    console.error('Error starting session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Session started: ${session.id}`);
  return new Response(
    JSON.stringify({ session_id: session.id, start_time: session.start_time }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// 2️⃣ COMPLETE SESSION
async function handleComplete(supabase: any, supabaseAdmin: any, userId: string, params: { session_id: string; actual_minutes?: number; interruptions?: number }) {
  const { session_id, actual_minutes, interruptions = 0 } = params;

  if (!session_id) {
    return new Response(
      JSON.stringify({ error: 'Session ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Completing session ${session_id} for user ${userId}`);

  // Fetch the session
  const { data: session, error: fetchError } = await supabase
    .from('focus_sessions')
    .select('*')
    .eq('id', session_id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !session) {
    console.error('Session not found:', fetchError);
    return new Response(
      JSON.stringify({ error: 'Session not found or access denied' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Calculate duration
  const endTime = new Date();
  const startTime = new Date(session.start_time);
  const durationMinutes = actual_minutes ?? Math.round((endTime.getTime() - startTime.getTime()) / 60000);

  console.log(`Session duration: ${durationMinutes} minutes`);

  // Get or create streak
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  let { data: streakData } = await supabase
    .from('focus_streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  let currentStreak = 1;
  let longestStreak = 1;

  if (streakData) {
    const lastSession = streakData.last_session;
    if (lastSession === today) {
      currentStreak = streakData.current_streak || 1;
    } else if (lastSession === yesterday) {
      currentStreak = (streakData.current_streak || 0) + 1;
    } else {
      currentStreak = 1;
    }
    longestStreak = Math.max(streakData.longest_streak || 0, currentStreak);
  }

  console.log(`Streak: current=${currentStreak}, longest=${longestStreak}`);

  // Get sessions this week for tier calculation
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const { count: sessionsThisWeek } = await supabase
    .from('focus_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_completed', true)
    .gte('start_time', weekStart.toISOString());

  const weeklySessionCount = (sessionsThisWeek || 0) + 1; // +1 for current session

  // Calculate reward
  const reward = calculateReward(durationMinutes, session.mode || 'health', currentStreak, weeklySessionCount);
  console.log(`Reward calculation:`, reward);

  // Calculate focus score
  const focusScore = Math.max(0, Math.min(100, Math.round(
    (durationMinutes / (session.planned_minutes || durationMinutes)) * 100 - (interruptions * 5)
  )));

  // Update session
  const { error: updateError } = await supabase
    .from('focus_sessions')
    .update({
      end_time: endTime.toISOString(),
      actual_minutes: durationMinutes,
      uct_reward: reward.total,
      is_completed: true,
      interruptions,
      focus_score: focusScore,
    })
    .eq('id', session_id);

  if (updateError) {
    console.error('Error updating session:', updateError);
    return new Response(
      JSON.stringify({ error: updateError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Update streak (upsert)
  const { error: streakError } = await supabase
    .from('focus_streaks')
    .upsert({
      user_id: userId,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_session: today,
    });

  if (streakError) {
    console.error('Error updating streak:', streakError);
  }

  // Insert reward history
  const { error: rewardHistoryError } = await supabase
    .from('focus_rewards_history')
    .insert({
      user_id: userId,
      session_id,
      reward_value: reward.total,
      streak_value: reward.streakBonus,
      tier_value: reward.tierBonus,
    });

  if (rewardHistoryError) {
    console.error('Error inserting reward history:', rewardHistoryError);
  }

  // Update wallet balance
  let walletBalance = 0;
  const { data: wallet } = await supabase
    .from('tokens')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (wallet) {
    walletBalance = (wallet.balance || 0) + reward.total;
    await supabase
      .from('tokens')
      .update({ balance: walletBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  } else {
    walletBalance = reward.total;
    await supabase
      .from('tokens')
      .insert({ user_id: userId, balance: walletBalance, updated_at: new Date().toISOString() });
  }

  console.log(`Wallet updated: ${walletBalance} UCT`);

  return new Response(
    JSON.stringify({
      session_id,
      duration_minutes: durationMinutes,
      focus_score: focusScore,
      reward_total: reward.total,
      reward_breakdown: {
        base: reward.base,
        mode_bonus: reward.modeBonus,
        streak_bonus: reward.streakBonus,
        tier_bonus: reward.tierBonus,
      },
      streak: {
        current_streak: currentStreak,
        longest_streak: longestStreak,
      },
      tier: reward.tier,
      wallet_balance_after: walletBalance,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// 3️⃣ BREAK SESSION
async function handleBreak(supabase: any, userId: string, params: { session_id: string; actual_minutes?: number; interruptions?: number }) {
  const { session_id, actual_minutes, interruptions = 0 } = params;

  if (!session_id) {
    return new Response(
      JSON.stringify({ error: 'Session ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Breaking session ${session_id} for user ${userId}`);

  // Fetch the session to verify ownership
  const { data: session, error: fetchError } = await supabase
    .from('focus_sessions')
    .select('start_time')
    .eq('id', session_id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !session) {
    console.error('Session not found:', fetchError);
    return new Response(
      JSON.stringify({ error: 'Session not found or access denied' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Calculate duration
  const endTime = new Date();
  const startTime = new Date(session.start_time);
  const durationMinutes = actual_minutes ?? Math.round((endTime.getTime() - startTime.getTime()) / 60000);

  // Update session with no reward
  const { error: updateError } = await supabase
    .from('focus_sessions')
    .update({
      end_time: endTime.toISOString(),
      actual_minutes: durationMinutes,
      uct_reward: 0,
      is_completed: false,
      interruptions,
    })
    .eq('id', session_id);

  if (updateError) {
    console.error('Error breaking session:', updateError);
    return new Response(
      JSON.stringify({ error: updateError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Session broken after ${durationMinutes} minutes`);

  return new Response(
    JSON.stringify({
      status: 'interrupted',
      duration_minutes: durationMinutes,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// 4️⃣ SAVE NOTES
async function handleNotes(supabase: any, userId: string, params: { session_id: string; notes: string }) {
  const { session_id, notes } = params;

  if (!session_id) {
    return new Response(
      JSON.stringify({ error: 'Session ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Saving notes for session ${session_id}`);

  // Update session notes
  const { error: updateError } = await supabase
    .from('focus_sessions')
    .update({ notes })
    .eq('id', session_id)
    .eq('user_id', userId);

  if (updateError) {
    console.error('Error saving notes:', updateError);
    return new Response(
      JSON.stringify({ error: updateError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Notes saved successfully`);

  return new Response(
    JSON.stringify({
      status: 'success',
      notes,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
