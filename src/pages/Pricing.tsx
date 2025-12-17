import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Eye, Zap, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PRICING_TIERS, TIER_ORDER, TierId } from '@/lib/pricingTiers';
import { useSubscription } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';

const tierIcons: Record<TierId, React.ReactNode> = {
  analyst: <Eye className="w-6 h-6" />,
  operator: <Zap className="w-6 h-6" />,
  chief_of_staff: <Crown className="w-6 h-6" />,
};

const tierColors: Record<TierId, string> = {
  analyst: 'from-slate-500/20 to-slate-600/10 border-slate-500/30',
  operator: 'from-purple-500/20 to-blue-500/10 border-purple-500/40',
  chief_of_staff: 'from-amber-500/20 to-orange-500/10 border-amber-500/40',
};

const tierGlows: Record<TierId, string> = {
  analyst: '',
  operator: 'shadow-[0_0_60px_-15px_rgba(168,85,247,0.5)]',
  chief_of_staff: 'shadow-[0_0_60px_-15px_rgba(251,191,36,0.4)]',
};

export default function Pricing() {
  const navigate = useNavigate();
  const { tier: currentTier, updateTier, isUpdating } = useSubscription();

  const handleSelectTier = (tierId: TierId) => {
    if (tierId === currentTier) return;
    
    // For now, direct upgrade (Stripe integration would go here)
    if (tierId === 'analyst') {
      updateTier(tierId);
    } else {
      // In production, this would redirect to Stripe checkout
      updateTier(tierId);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Choose Your Level of Delegation
          </h1>
          <p className="text-lg text-muted-foreground">
            Authority, not features. Seniority, not subscriptions.
          </p>
        </div>

        {/* Tier Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {TIER_ORDER.map((tierId) => {
            const tier = PRICING_TIERS[tierId];
            const isCurrentTier = currentTier === tierId;
            const Icon = tierIcons[tierId];

            return (
              <div
                key={tierId}
                className={cn(
                  'relative rounded-3xl border-2 p-6 transition-all duration-300',
                  'bg-gradient-to-br backdrop-blur-xl',
                  tierColors[tierId],
                  tierGlows[tierId],
                  tier.highlight && 'md:scale-105 md:-my-2',
                  isCurrentTier && 'ring-2 ring-primary/50'
                )}
              >
                {/* Current badge */}
                {isCurrentTier && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    Current
                  </div>
                )}

                {/* Emoji & Name */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{tier.emoji}</span>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{tier.name}</h2>
                    <p className="text-sm text-muted-foreground">{tier.priceLabel}</p>
                  </div>
                </div>

                {/* Role Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full',
                    'bg-background/50 border border-border/50'
                  )}>
                    {Icon}
                    <span className="text-sm font-medium text-foreground">
                      Role: {tier.role}
                    </span>
                  </div>
                </div>

                {/* Authority Level */}
                <div className="mb-4">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Authority
                  </span>
                  <p className="text-lg font-semibold text-foreground">{tier.authority}</p>
                </div>

                {/* Tagline */}
                <p className="text-foreground/80 mb-6 min-h-[48px]">
                  {tier.tagline}
                </p>

                {/* Capabilities */}
                <ul className="space-y-2 mb-6">
                  {tier.capabilities.map((capability, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                      <span>{capability}</span>
                    </li>
                  ))}
                </ul>

                {/* Best For */}
                <div className="pt-4 border-t border-border/30 mb-6">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Best for
                  </p>
                  <p className="text-sm text-foreground font-medium italic">
                    {tier.bestFor}
                  </p>
                </div>

                {/* CTA Button */}
                <Button
                  className={cn(
                    'w-full',
                    tierId === 'analyst' && 'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
                    tierId === 'operator' && 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600',
                    tierId === 'chief_of_staff' && 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                  )}
                  disabled={isCurrentTier || isUpdating}
                  onClick={() => handleSelectTier(tierId)}
                >
                  {isCurrentTier ? 'Current Plan' : tierId === 'analyst' ? 'Downgrade' : 'Upgrade'}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Powerful Footnote */}
        <div className="text-center py-12 border-t border-border/30">
          <div className="inline-block px-8 py-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10">
            <p className="text-lg text-foreground/90 leading-relaxed">
              <span className="block mb-1">Authority increases with use.</span>
              <span className="block mb-1">Autonomy expands with trust.</span>
              <span className="block font-semibold text-foreground">You remain in control — always.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
