// UCT Token Economics - Stake & Burn System

// STAKING TIERS — "I trust you" (Security deposit for delegation authority)
export const STAKE_TIERS = {
  tier_1: {
    id: 'tier_1',
    amount: 500,
    capability: 'auto_close_emails',
    name: 'Email Guardian',
    description: 'Auto-close low-risk emails',
    autonomyLevel: 1,
  },
  tier_2: {
    id: 'tier_2',
    amount: 1500,
    capability: 'auto_schedule',
    name: 'Time Manager',
    description: 'Auto-schedule meetings',
    autonomyLevel: 2,
  },
  tier_3: {
    id: 'tier_3',
    amount: 3000,
    capability: 'full_autonomy',
    name: 'Full Operator',
    description: 'Full Unclutter autonomy',
    autonomyLevel: 3,
  },
} as const;

export type StakeTierId = keyof typeof STAKE_TIERS;
export type StakeTier = typeof STAKE_TIERS[StakeTierId];

// BURN RATES — "Make this faster" (Operational fuel for acceleration)
export const BURN_RATES = {
  batch_process: {
    id: 'batch_process',
    base: 0.5,
    perItem: 0.02,
    description: 'Process all unread messages',
    speedBoost: '2x faster',
  },
  priority_override: {
    id: 'priority_override',
    flat: 1.0,
    description: 'Skip queue, process now',
    speedBoost: 'Instant',
  },
  extended_focus: {
    id: 'extended_focus',
    perHour: 0.25,
    description: 'Extended focus protection',
    speedBoost: '+1 hour',
  },
  high_volume: {
    id: 'high_volume',
    multiplier: 1.5,
    description: 'High-volume automation (10x capacity)',
    speedBoost: '10x volume',
  },
} as const;

export type BurnRateId = keyof typeof BURN_RATES;
export type BurnRate = typeof BURN_RATES[BurnRateId];

// STAKE COOLDOWNS
export const UNSTAKE_COOLDOWN_DAYS = 7;
export const REVOCATION_RECOVERY_DAYS = 7;

// Helper functions
export function calculateBurnCost(
  burnType: BurnRateId,
  context?: { itemCount?: number; hours?: number }
): number {
  switch (burnType) {
    case 'batch_process': {
      const rate = BURN_RATES.batch_process;
      return rate.base + (context?.itemCount || 0) * rate.perItem;
    }
    case 'priority_override': {
      return BURN_RATES.priority_override.flat;
    }
    case 'extended_focus': {
      return (context?.hours || 1) * BURN_RATES.extended_focus.perHour;
    }
    case 'high_volume': {
      return BURN_RATES.high_volume.multiplier;
    }
    default:
      return 0;
  }
}

export function getTierByCapability(capability: string): StakeTier | undefined {
  return Object.values(STAKE_TIERS).find(tier => tier.capability === capability);
}

export function getTierByAmount(amount: number): StakeTier | undefined {
  // Get the highest tier the amount qualifies for
  const tiers = Object.values(STAKE_TIERS).sort((a, b) => b.amount - a.amount);
  return tiers.find(tier => amount >= tier.amount);
}

export function getAutonomyLevel(stakedAmount: number): number {
  const tier = getTierByAmount(stakedAmount);
  return tier?.autonomyLevel || 0;
}
