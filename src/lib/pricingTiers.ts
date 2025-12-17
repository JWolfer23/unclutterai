export type TierId = 'analyst' | 'operator' | 'chief_of_staff';

export interface PricingTier {
  id: TierId;
  name: string;
  emoji: string;
  role: string;
  authority: string;
  price: number;
  priceLabel: string;
  tagline: string;
  capabilities: string[];
  bestFor: string;
  highlight?: boolean;
}

export const PRICING_TIERS: Record<TierId, PricingTier> = {
  analyst: {
    id: 'analyst',
    name: 'Analyst',
    emoji: '🆓',
    role: 'Observer',
    authority: 'None',
    price: 0,
    priceLabel: 'Free',
    tagline: 'Your assistant watches, summarizes, and advises.',
    capabilities: [
      'Briefings',
      'Summaries',
      'Suggestions',
      'Manual approval required',
    ],
    bestFor: 'Getting comfortable. Building trust.',
  },
  operator: {
    id: 'operator',
    name: 'Operator',
    emoji: '⚡',
    role: 'Executor',
    authority: 'Conditional',
    price: 25,
    priceLabel: '$25/month',
    tagline: 'Your assistant takes action with your approval.',
    capabilities: [
      'Drafts replies',
      'Schedules meetings',
      'Closes open loops',
      'Runs Morning & Unclutter fully',
    ],
    bestFor: 'This is where people feel time return to them.',
    highlight: true,
  },
  chief_of_staff: {
    id: 'chief_of_staff',
    name: 'Chief of Staff',
    emoji: '👑',
    role: 'Strategic Partner',
    authority: 'Delegated',
    price: 79,
    priceLabel: '$79/month',
    tagline: 'Your assistant handles decisions within your rules.',
    capabilities: [
      'Autonomous loop closure',
      'Predictive scheduling',
      'Voice-first execution',
      'Priority overrides',
      'UCT-powered automation',
    ],
    bestFor: 'This tier replaces mental load.',
  },
} as const;

export const TIER_ORDER: TierId[] = ['analyst', 'operator', 'chief_of_staff'];

export function getAuthorityLevel(tier: TierId): number {
  switch (tier) {
    case 'analyst':
      return 0;
    case 'operator':
      return 1;
    case 'chief_of_staff':
      return 3;
    default:
      return 0;
  }
}

export function getTierByAuthority(authority: number): TierId {
  if (authority >= 3) return 'chief_of_staff';
  if (authority >= 1) return 'operator';
  return 'analyst';
}
