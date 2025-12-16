import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS
const allowedOrigins = [
  'https://c60e33de-49ec-4dd9-ac69-f86f4e5a2b40.lovableproject.com',
  'https://lovable.dev',
  /^https:\/\/.*\.lovable\.app$/,
  /^https:\/\/.*\.lovableproject\.com$/,
  'http://localhost:5173',
  'http://localhost:3000',
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return allowedOrigins.some(allowed => 
    typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
  );
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = isAllowedOrigin(origin) ? origin! : '';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Mode multipliers for reward calculation (updated per new spec)
const MODE_MULTIPLIERS: Record<string, number> = {
  deep_work: 1.5,
  catch_up: 1.25,
  learning: 1.3,
  career: 1.2,
  wealth: 1.1,
  health: 1.0,
  focus: 1.0,
};

// Tier thresholds based on weekly sessions
const TIER_THRESHOLDS = [
  { minSessions: 10, tier: 'platinum', bonus: 0.15 },
  { minSessions: 7, tier: 'gold', bonus: 0.10 },
  { minSessions: 5, tier: 'silver', bonus: 0.05 },
  { minSessions: 3, tier: 'bronze', bonus: 0.02 },
  { minSessions: 0, tier: 'none', bonus: 0 },
];

// Level titles based on level brackets
const LEVEL_TITLES: { minLevel: number; title: string }[] = [
  { minLevel: 20, title: 'Master of Focus' },
  { minLevel: 15, title: 'Deep Work Practitioner' },
  { minLevel: 10, title: 'Consistent Operator' },
  { minLevel: 5, title: 'Focused Beginner' },
  { minLevel: 1, title: 'Getting Started' },
];

interface RewardCalculation {
  base: number;
  modeBonus: number;
  streakBonus: number;
  tierBonus: number;
  total: number;
  tier: string;
}

interface XPCalculation {
  xp_earned: number;
  xp_total: number;
  xp_to_next: number;
  level: number;
  leveled_up: boolean;
  title: string;
}

// Calculate XP required for a given level: 100 * (N * N)
function xpRequiredForLevel(level: number): number {
  return 100 * (level * level);
}

// Get level title based on level
function getLevelTitle(level: number): string {
  const titleInfo = LEVEL_TITLES.find(t => level >= t.minLevel);
  return titleInfo?.title || 'Getting Started';
}

// Calculate XP earned from a session
function calculateXP(
  durationMinutes: number,
  mode: string,
  currentStreak: number
): number {
  const baseXP = durationMinutes;
  const modeMultiplier = MODE_MULTIPLIERS[mode] || 1.0;
  const streakBonusPercent = currentStreak * 0.01; // +1% per streak day
  
  const xp = baseXP * modeMultiplier * (1 + streakBonusPercent);
  return Math.round(xp);
}

// Process level-up logic and return updated level data
function processLevelUp(
  currentLevel: number,
  currentXPTotal: number,
  xpEarned: number
): XPCalculation {
  let level = currentLevel;
  let xpTotal = currentXPTotal + xpEarned;
  let xpToNext = xpRequiredForLevel(level);
  const startingLevel = currentLevel;
  
  // Check for level-ups
  while (xpTotal >= xpToNext) {
    level += 1;
    xpToNext = xpRequiredForLevel(level);
  }
  
  return {
    xp_earned: xpEarned,
    xp_total: xpTotal,
    xp_to_next: xpToNext,
    level,
    leveled_up: level > startingLevel,
    title: getLevelTitle(level),
  };
}

// NEW: Duration-based tiered base reward (per spec)
function getBaseReward(durationMinutes: number): number {
  if (durationMinutes >= 60) return 2.0;
  if (durationMinutes >= 30) return 1.0;
  if (durationMinutes >= 15) return 0.5;
  if (durationMinutes >= 5) return 0.25;
  return 0; // Under 5 minutes = no reward
}

// Calculate reward based on session parameters (updated per new spec)
function calculateReward(
  durationMinutes: number,
  mode: string,
  interruptions: number,
  sessionsThisWeek: number
): RewardCalculation {
  // STEP 2: Tiered base reward
  const base = getBaseReward(durationMinutes);
  
  // STEP 3: Mode multiplier
  const modeMultiplier = MODE_MULTIPLIERS[mode?.toLowerCase()] || 1.0;
  
  // STEP 4: Interruption penalty (3+ interruptions = 0.75x)
  const interruptionMultiplier = interruptions >= 3 ? 0.75 : 1.0;
  
  // Combined multiplier
  const combinedMultiplier = modeMultiplier * interruptionMultiplier;
  
  // Determine tier for bonus display (not affecting main calc per spec)
  const tierInfo = TIER_THRESHOLDS.find(t => sessionsThisWeek >= t.minSessions) || TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];
  
  // STEP 5: Final calculation
  const total = Math.round(base * combinedMultiplier * 100) / 100;
  
  return {
    base: Math.round(base * 100) / 100,
    modeBonus: Math.round((base * (modeMultiplier - 1)) * 100) / 100,
    streakBonus: 0, // Streak no longer in new formula
    tierBonus: 0, // Tier no longer in new formula
    total,
    tier: tierInfo.tier,
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Reject requests from disallowed origins
  if (!isAllowedOrigin(origin)) {
    console.warn(`[SECURITY] Blocked request from disallowed origin: ${origin}`);
    return new Response(
      JSON.stringify({ error: 'Forbidden' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
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
      case 'get_level':
        return await handleGetLevel(supabaseUser, user.id);
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

// 2️⃣ COMPLETE SESSION (with XP + Level system)
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

  // STEP 1: Validate minimum duration (5+ minutes required for rewards)
  if (durationMinutes < 5) {
    console.log('Session too short for rewards (< 5 minutes)');
    
    // Still update session as completed but with 0 reward
    const { error: updateError } = await supabase
      .from('focus_sessions')
      .update({
        end_time: endTime.toISOString(),
        actual_minutes: durationMinutes,
        uct_reward: 0,
        is_completed: true,
        interruptions,
        focus_score: 0,
      })
      .eq('id', session_id);

    if (updateError) {
      console.error('Error updating short session:', updateError);
    }

    return new Response(
      JSON.stringify({
        focus_session_id: session_id,
        uct_earned: 0,
        new_pending_balance: 0,
        status: 'too_short',
        message: 'Sessions must be at least 5 minutes for rewards',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

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

  // Calculate reward using NEW formula (with interruptions penalty)
  const mode = session.mode || 'focus';
  const reward = calculateReward(durationMinutes, mode, interruptions, weeklySessionCount);
  console.log(`Reward calculation:`, reward);

  // Calculate XP
  const xpEarned = calculateXP(durationMinutes, mode, currentStreak);
  console.log(`XP earned: ${xpEarned}`);

  // Get or create focus_levels row
  let { data: levelData } = await supabase
    .from('focus_levels')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  let currentLevel = 1;
  let currentXPTotal = 0;

  if (levelData) {
    currentLevel = levelData.level;
    currentXPTotal = levelData.xp_total;
  }

  // Process level-up logic
  const xpResult = processLevelUp(currentLevel, currentXPTotal, xpEarned);
  console.log(`XP result: level=${xpResult.level}, xp_total=${xpResult.xp_total}, leveled_up=${xpResult.leveled_up}`);

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
  const previousStreak = streakData?.current_streak || 0;
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

  // ========================================
  // STREAK MILESTONE BONUS LOGIC
  // ========================================
  const STREAK_MILESTONES: Record<number, number> = {
    3: 1,    // 3-day streak → 1 UCT
    7: 3,    // 7-day streak → 3 UCT
    14: 7,   // 14-day streak → 7 UCT
    30: 20,  // 30-day streak → 20 UCT
  };

  let streakBonusUct = 0;
  let streakMilestoneAchieved: number | null = null;

  // Check if a new milestone was achieved
  for (const [milestone, bonus] of Object.entries(STREAK_MILESTONES)) {
    const milestoneNum = parseInt(milestone);
    if (currentStreak >= milestoneNum && previousStreak < milestoneNum) {
      streakBonusUct = bonus;
      streakMilestoneAchieved = milestoneNum;
      console.log(`Streak milestone achieved: ${milestoneNum} days → +${bonus} UCT bonus`);
      break; // Only award highest new milestone
    }
  }

  // Award streak bonus if milestone achieved
  if (streakBonusUct > 0 && streakMilestoneAchieved) {
    // Log to Focus Ledger
    const { error: streakLedgerError } = await supabase
      .from('focus_ledger')
      .insert({
        user_id: userId,
        event_type: 'focus_streak_bonus',
        payload: {
          streak_days: streakMilestoneAchieved,
          previous_streak: previousStreak,
        },
        uct_reward: streakBonusUct,
        onchain_tx: null,
      });

    if (streakLedgerError) {
      console.error('Error logging streak bonus to ledger:', streakLedgerError);
    }

    // Credit to uct_balances.pending
    const { data: existingBalance } = await supabase
      .from('uct_balances')
      .select('pending')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingBalance) {
      await supabase
        .from('uct_balances')
        .update({
          pending: (existingBalance.pending || 0) + streakBonusUct,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('uct_balances')
        .insert({
          user_id: userId,
          balance: 0,
          pending: streakBonusUct,
        });
    }

    console.log(`Streak bonus of ${streakBonusUct} UCT credited to pending balance`);
  }

  // Update or create focus_levels row
  if (levelData) {
    const { error: levelError } = await supabase
      .from('focus_levels')
      .update({
        level: xpResult.level,
        xp_total: xpResult.xp_total,
        xp_to_next: xpResult.xp_to_next,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (levelError) {
      console.error('Error updating focus_levels:', levelError);
    }
  } else {
    const { error: levelError } = await supabase
      .from('focus_levels')
      .insert({
        user_id: userId,
        level: xpResult.level,
        xp_total: xpResult.xp_total,
        xp_to_next: xpResult.xp_to_next,
      });

    if (levelError) {
      console.error('Error inserting focus_levels:', levelError);
    }
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

  // STEP 6: Log to Focus Ledger (idempotent - check for existing entry)
  const { data: existingLedger } = await supabase
    .from('focus_ledger')
    .select('id')
    .eq('user_id', userId)
    .eq('event_type', 'focus_session_completed')
    .contains('payload', { focus_session_id: session_id })
    .maybeSingle();

  if (!existingLedger) {
    const { error: ledgerError } = await supabase
      .from('focus_ledger')
      .insert({
        user_id: userId,
        event_type: 'focus_session_completed',
        payload: {
          focus_session_id: session_id,
          duration_minutes: durationMinutes,
          mode: mode,
          interruptions: interruptions,
        },
        uct_reward: reward.total,
        onchain_tx: null,
      });

    if (ledgerError) {
      console.error('Error inserting focus_ledger:', ledgerError);
    } else {
      console.log('Focus ledger entry created');
    }
  } else {
    console.log('Focus ledger entry already exists (idempotent check)');
  }

  // STEP 7: Credit to uct_balances.pending (new approach per spec)
  let newPendingBalance = 0;
  const { data: existingUctBalance } = await supabase
    .from('uct_balances')
    .select('balance, pending')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingUctBalance) {
    newPendingBalance = (existingUctBalance.pending || 0) + reward.total;
    const { error: uctError } = await supabase
      .from('uct_balances')
      .update({
        pending: newPendingBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (uctError) {
      console.error('Error updating uct_balances:', uctError);
    }
  } else {
    newPendingBalance = reward.total;
    const { error: uctError } = await supabase
      .from('uct_balances')
      .insert({
        user_id: userId,
        balance: 0,
        pending: newPendingBalance,
      });

    if (uctError) {
      console.error('Error inserting uct_balances:', uctError);
    }
  }

  // Add streak bonus to pending balance total (already credited separately above)
  const totalPendingWithBonus = newPendingBalance + streakBonusUct;

  // STEP 9: Return standardized response
  return new Response(
    JSON.stringify({
      focus_session_id: session_id,
      uct_earned: reward.total,
      new_pending_balance: totalPendingWithBonus,
      status: 'recorded',
      // Additional data for UI
      duration_minutes: durationMinutes,
      focus_score: focusScore,
      reward_breakdown: {
        base: reward.base,
        mode_multiplier: MODE_MULTIPLIERS[mode?.toLowerCase()] || 1.0,
        interruption_penalty: interruptions >= 3 ? 0.75 : 1.0,
        final: reward.total,
      },
      streak: {
        current_streak: currentStreak,
        longest_streak: longestStreak,
        previous_streak: previousStreak,
      },
      // Streak bonus info
      streak_bonus: streakBonusUct > 0 ? {
        milestone_days: streakMilestoneAchieved,
        bonus_uct: streakBonusUct,
        status: 'awarded',
      } : null,
      tier: reward.tier,
      xp: {
        xp_earned: xpResult.xp_earned,
        xp_total: xpResult.xp_total,
        xp_to_next: xpResult.xp_to_next,
        level: xpResult.level,
        leveled_up: xpResult.leveled_up,
        title: xpResult.title,
      },
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

// 6️⃣ GET FOCUS LEVEL
async function handleGetLevel(supabase: any, userId: string) {
  console.log(`Getting focus level for user ${userId}`);

  const { data: levelData, error } = await supabase
    .from('focus_levels')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching focus level:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Default values if no level data exists
  const level = levelData?.level ?? 1;
  const xpTotal = levelData?.xp_total ?? 0;
  const xpToNext = levelData?.xp_to_next ?? 100;
  const title = getLevelTitle(level);

  return new Response(
    JSON.stringify({
      level,
      xp_total: xpTotal,
      xp_to_next: xpToNext,
      title,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
