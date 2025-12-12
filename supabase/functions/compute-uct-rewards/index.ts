import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UCT Earning Rules
const UCT_RULES = {
  // Task completion rewards
  quick_win: 0.25,           // <2min effort task
  medium_task: 1.0,          // 2-30min effort task
  high_effort_task: 2.5,     // >30min effort task
  
  // Focus session rewards
  instant_catchup: 3.0,      // Complete Instant Catch-Up session
  focus_hour: 0.5,           // 1hr uninterrupted focus (base, stacks)
  focus_minute: 0.05,        // Per minute base (used for partial sessions)
  
  // Mode multipliers for focus
  mode_multipliers: {
    learning: 1.3,
    career: 1.2,
    wealth: 1.1,
    health: 1.0,
    communication: 1.0,
  } as Record<string, number>,
  
  // Spam/protection rewards
  spam_blocked: 0.02,        // Block spam/energy vampire
  auto_archive: 0.02,        // Auto-archive low value
  
  // Streak bonuses (percentage)
  streak_bonus_per_day: 0.005, // 0.5% per streak day
  streak_cap: 0.25,          // Max 25% bonus from streak
  
  // Weekly consistency tiers
  weekly_tiers: {
    bronze: { min_sessions: 3, bonus: 0.02 },
    silver: { min_sessions: 5, bonus: 0.05 },
    gold: { min_sessions: 7, bonus: 0.10 },
    platinum: { min_sessions: 10, bonus: 0.15 },
  },
  
  // Thresholds
  settlement_threshold: 10.0, // Min UCT to trigger on-chain batch
};

interface LedgerEvent {
  event_type: string;
  payload: {
    task_id?: string;
    task_effort?: number;
    duration_minutes?: number;
    mode?: string;
    messages_count?: number;
    spam_blocked?: number;
    auto_archived?: number;
    current_streak?: number;
    sessions_this_week?: number;
    method?: string;
  };
  message_ids?: string[];
}

interface RewardResult {
  base_reward: number;
  streak_bonus: number;
  tier_bonus: number;
  mode_bonus: number;
  total_reward: number;
  breakdown: string[];
}

function computeUctRewards(event: LedgerEvent): RewardResult {
  const payload = event.payload || {};
  let base_reward = 0;
  const breakdown: string[] = [];
  
  switch (event.event_type) {
    case 'task_completed':
      // Determine task effort level
      const effort = payload.task_effort || 5;
      if (effort <= 2) {
        base_reward = UCT_RULES.quick_win;
        breakdown.push(`Quick win (<2m): +${UCT_RULES.quick_win}`);
      } else if (effort <= 6) {
        base_reward = UCT_RULES.medium_task;
        breakdown.push(`Medium task: +${UCT_RULES.medium_task}`);
      } else {
        base_reward = UCT_RULES.high_effort_task;
        breakdown.push(`High-effort task: +${UCT_RULES.high_effort_task}`);
      }
      break;
      
    case 'instant_catchup':
      base_reward = UCT_RULES.instant_catchup;
      breakdown.push(`Instant Catch-Up: +${UCT_RULES.instant_catchup}`);
      // Add per-message bonus
      const msgCount = payload.messages_count || 0;
      const msgBonus = msgCount * 0.02;
      base_reward += msgBonus;
      if (msgBonus > 0) breakdown.push(`Messages processed (${msgCount}): +${msgBonus.toFixed(2)}`);
      break;
      
    case 'focus_session':
      const minutes = payload.duration_minutes || 0;
      const mode = payload.mode || 'health';
      const multiplier = UCT_RULES.mode_multipliers[mode] || 1.0;
      
      // Calculate base from minutes
      base_reward = minutes * UCT_RULES.focus_minute * multiplier;
      breakdown.push(`Focus ${minutes}m (${mode}): +${base_reward.toFixed(2)}`);
      
      // Add hourly bonus for uninterrupted sessions
      if (minutes >= 60) {
        const hourlyBonus = Math.floor(minutes / 60) * UCT_RULES.focus_hour;
        base_reward += hourlyBonus;
        breakdown.push(`Hourly bonus: +${hourlyBonus.toFixed(2)}`);
      }
      break;
      
    case 'spam_blocked':
      const spamCount = payload.spam_blocked || 1;
      base_reward = spamCount * UCT_RULES.spam_blocked;
      breakdown.push(`Spam blocked (${spamCount}): +${base_reward.toFixed(2)}`);
      break;
      
    case 'auto_archive':
      const archiveCount = payload.auto_archived || 1;
      base_reward = archiveCount * UCT_RULES.auto_archive;
      breakdown.push(`Auto-archived (${archiveCount}): +${base_reward.toFixed(2)}`);
      break;
      
    default:
      // Unknown event type, no reward
      breakdown.push(`Unknown event: ${event.event_type}`);
      break;
  }
  
  // Calculate streak bonus
  const currentStreak = payload.current_streak || 0;
  const streakMultiplier = Math.min(
    currentStreak * UCT_RULES.streak_bonus_per_day,
    UCT_RULES.streak_cap
  );
  const streak_bonus = base_reward * streakMultiplier;
  if (streak_bonus > 0) {
    breakdown.push(`Streak bonus (${currentStreak}d): +${streak_bonus.toFixed(2)}`);
  }
  
  // Calculate weekly tier bonus
  const sessionsThisWeek = payload.sessions_this_week || 0;
  let tier_bonus = 0;
  let tierName = 'none';
  
  if (sessionsThisWeek >= UCT_RULES.weekly_tiers.platinum.min_sessions) {
    tier_bonus = base_reward * UCT_RULES.weekly_tiers.platinum.bonus;
    tierName = 'platinum';
  } else if (sessionsThisWeek >= UCT_RULES.weekly_tiers.gold.min_sessions) {
    tier_bonus = base_reward * UCT_RULES.weekly_tiers.gold.bonus;
    tierName = 'gold';
  } else if (sessionsThisWeek >= UCT_RULES.weekly_tiers.silver.min_sessions) {
    tier_bonus = base_reward * UCT_RULES.weekly_tiers.silver.bonus;
    tierName = 'silver';
  } else if (sessionsThisWeek >= UCT_RULES.weekly_tiers.bronze.min_sessions) {
    tier_bonus = base_reward * UCT_RULES.weekly_tiers.bronze.bonus;
    tierName = 'bronze';
  }
  
  if (tier_bonus > 0) {
    breakdown.push(`${tierName} tier bonus: +${tier_bonus.toFixed(2)}`);
  }
  
  // Mode bonus already included in base for focus sessions
  const mode_bonus = 0;
  
  const total_reward = base_reward + streak_bonus + tier_bonus + mode_bonus;
  
  return {
    base_reward: Number(base_reward.toFixed(4)),
    streak_bonus: Number(streak_bonus.toFixed(4)),
    tier_bonus: Number(tier_bonus.toFixed(4)),
    mode_bonus: Number(mode_bonus.toFixed(4)),
    total_reward: Number(total_reward.toFixed(4)),
    breakdown,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { event, ledger_id } = await req.json();
    
    if (!event || !event.event_type) {
      return new Response(
        JSON.stringify({ error: 'Missing event or event_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Computing UCT rewards for user ${user.id}, event: ${event.event_type}`);

    // Fetch user's current streak and weekly sessions for bonus calculation
    const { data: streakData } = await supabase
      .from('focus_streaks')
      .select('current_streak')
      .eq('user_id', user.id)
      .maybeSingle();
    
    const currentStreak = streakData?.current_streak || 0;
    
    // Count sessions this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const { count: sessionsThisWeek } = await supabase
      .from('focus_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_completed', true)
      .gte('start_time', weekStart.toISOString());

    // Enrich event payload with streak/tier data
    const enrichedEvent: LedgerEvent = {
      ...event,
      payload: {
        ...event.payload,
        current_streak: currentStreak,
        sessions_this_week: sessionsThisWeek || 0,
      },
    };

    // Compute rewards
    const rewardResult = computeUctRewards(enrichedEvent);
    
    console.log(`Computed reward: ${rewardResult.total_reward} UCT`, rewardResult.breakdown);

    // Update ledger entry with reward if ledger_id provided
    if (ledger_id) {
      await supabase
        .from('focus_ledger')
        .update({ uct_reward: rewardResult.total_reward })
        .eq('id', ledger_id)
        .eq('user_id', user.id);
    }

    // Update uct_balances - add to pending
    const { data: existingBalance } = await supabase
      .from('uct_balances')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingBalance) {
      const newPending = (existingBalance.pending || 0) + rewardResult.total_reward;
      const newLifetime = (existingBalance.lifetime_earned || 0) + rewardResult.total_reward;
      
      await supabase
        .from('uct_balances')
        .update({
          pending: newPending,
          lifetime_earned: newLifetime,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      
      // Check if we should trigger settlement
      const shouldSettle = newPending >= UCT_RULES.settlement_threshold;
      
      return new Response(
        JSON.stringify({
          success: true,
          reward: rewardResult,
          balance: {
            available: existingBalance.available,
            pending: newPending,
            on_chain: existingBalance.on_chain,
            lifetime_earned: newLifetime,
          },
          should_settle: shouldSettle,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Create new balance record
      await supabase
        .from('uct_balances')
        .insert({
          user_id: user.id,
          available: 0,
          pending: rewardResult.total_reward,
          on_chain: 0,
          lifetime_earned: rewardResult.total_reward,
        });
      
      return new Response(
        JSON.stringify({
          success: true,
          reward: rewardResult,
          balance: {
            available: 0,
            pending: rewardResult.total_reward,
            on_chain: 0,
            lifetime_earned: rewardResult.total_reward,
          },
          should_settle: false,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Compute UCT rewards error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
