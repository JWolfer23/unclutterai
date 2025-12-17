// Beta UCT System - No on-chain, no staking

// Level thresholds
export const UCT_LEVELS = {
  starter: { min: 0, max: 49 },
  active: { min: 50, max: 199 },
  power: { min: 200, max: 499 },
  elite: { min: 500, max: Infinity },
} as const;

export type UCTLevel = keyof typeof UCT_LEVELS;

// Level effects
export const UCT_LEVEL_EFFECTS = {
  starter: {
    confirmationReduction: 0,
    resolutionSpeedBoost: 1.0,
    skipScheduleConfirm: false,
    skipSendConfirm: false,
  },
  active: {
    confirmationReduction: 1,
    resolutionSpeedBoost: 1.0,
    skipScheduleConfirm: true,
    skipSendConfirm: false,
  },
  power: {
    confirmationReduction: 2,
    resolutionSpeedBoost: 1.5,
    skipScheduleConfirm: true,
    skipSendConfirm: true,
  },
  elite: {
    confirmationReduction: 3,
    resolutionSpeedBoost: 2.0,
    skipScheduleConfirm: true,
    skipSendConfirm: true,
  },
} as const;

// UCT rewards for various activities
export const UCT_REWARDS = {
  // Focus sessions (existing)
  focus_session_short: 0.25,   // 5-14 minutes
  focus_session_medium: 0.5,  // 15-29 minutes
  focus_session_long: 1.0,    // 30-59 minutes
  focus_session_deep: 2.0,    // 60+ minutes
  
  // Unclutter/Loop resolution
  loop_resolved: 0.05,        // Base per loop
  loop_archive: 0.02,         // Quick archive bonus
  loop_reply_sent: 0.10,      // Action taken
  loop_task_created: 0.08,    // Task conversion
  loop_speed_bonus: 0.03,     // If resolved quickly
  
  // Streaks
  streak_3_day: 1,
  streak_7_day: 3,
  streak_14_day: 7,
  streak_30_day: 20,
} as const;

// Helper to get level from balance
export function getUCTLevel(balance: number): UCTLevel {
  if (balance >= UCT_LEVELS.elite.min) return 'elite';
  if (balance >= UCT_LEVELS.power.min) return 'power';
  if (balance >= UCT_LEVELS.active.min) return 'active';
  return 'starter';
}

// Helper to get effects for a level
export function getUCTEffects(level: UCTLevel) {
  return UCT_LEVEL_EFFECTS[level];
}

// Helper to get next level info
export function getNextLevelInfo(balance: number): { nextLevel: UCTLevel | null; remaining: number } {
  const currentLevel = getUCTLevel(balance);
  
  if (currentLevel === 'elite') {
    return { nextLevel: null, remaining: 0 };
  }
  
  const levels: UCTLevel[] = ['starter', 'active', 'power', 'elite'];
  const currentIndex = levels.indexOf(currentLevel);
  const nextLevel = levels[currentIndex + 1];
  const remaining = UCT_LEVELS[nextLevel].min - balance;
  
  return { nextLevel, remaining };
}

// Level display names
export const UCT_LEVEL_NAMES: Record<UCTLevel, string> = {
  starter: 'Starter',
  active: 'Active',
  power: 'Power',
  elite: 'Elite',
};

// Level colors for UI
export const UCT_LEVEL_COLORS: Record<UCTLevel, string> = {
  starter: 'from-slate-400 to-slate-500',
  active: 'from-blue-400 to-cyan-500',
  power: 'from-violet-400 to-purple-500',
  elite: 'from-amber-400 to-orange-500',
};
