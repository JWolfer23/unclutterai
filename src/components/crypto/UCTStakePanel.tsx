import { useState } from 'react';
import { Lock, Unlock, Shield, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUCTStake } from '@/hooks/useUCTStake';
import { useUCTBalance } from '@/hooks/useUCTBalance';
import { STAKE_TIERS, UNSTAKE_COOLDOWN_DAYS, type StakeTierId } from '@/lib/uctTokenomics';

export const UCTStakePanel = () => {
  const { 
    activeStakes, 
    stakes,
    totalStaked, 
    autonomyLevel,
    stake, 
    isStaking,
    requestUnstake,
    isRequestingUnstake,
    completeUnstake,
    isCompletingUnstake,
    hasCapability,
  } = useUCTStake();
  
  const { availableBalance } = useUCTBalance();
  const [selectedTier, setSelectedTier] = useState<StakeTierId | null>(null);

  const tiers = Object.entries(STAKE_TIERS) as [StakeTierId, typeof STAKE_TIERS[StakeTierId]][];

  const getStakeForTier = (tierId: StakeTierId) => {
    return stakes.find(s => s.stake_tier === tierId && (s.status === 'active' || s.status === 'unstaking'));
  };

  const canStakeTier = (tierId: StakeTierId) => {
    const tier = STAKE_TIERS[tierId];
    return availableBalance >= tier.amount && !getStakeForTier(tierId);
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/80 border-white/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          Trust Delegation
        </CardTitle>
        <p className="text-xs text-slate-400">
          Stake UCT to grant your assistant authority. Your tokens are preserved, not spent.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <div>
            <p className="text-xs text-slate-400">Total Staked</p>
            <p className="text-xl font-bold text-white">{totalStaked.toFixed(0)} UCT</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Autonomy Level</p>
            <p className="text-xl font-bold text-purple-400">{autonomyLevel}/3</p>
          </div>
        </div>

        {/* Tier Cards */}
        <div className="space-y-3">
          {tiers.map(([tierId, tier]) => {
            const existingStake = getStakeForTier(tierId);
            const isStaked = existingStake?.status === 'active';
            const isUnstaking = existingStake?.status === 'unstaking';
            const canAfford = availableBalance >= tier.amount;
            const unlocked = hasCapability(tier.capability);

            return (
              <div
                key={tierId}
                className={`p-4 rounded-xl border transition-all ${
                  unlocked 
                    ? 'bg-purple-500/10 border-purple-500/30' 
                    : 'bg-slate-800/50 border-white/5'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      unlocked ? 'bg-purple-500/20' : 'bg-slate-700/50'
                    }`}>
                      {unlocked ? (
                        <Unlock className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">{tier.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{tier.description}</p>
                      <p className="text-xs text-purple-400 mt-1 font-medium">
                        {tier.amount} UCT required
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {isStaked && (
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                      </span>
                    )}
                    
                    {isUnstaking && existingStake?.unlocks_at && (
                      <span className="flex items-center gap-1 text-xs text-amber-400">
                        <Calendar className="w-3 h-3" />
                        Unlocks {new Date(existingStake.unlocks_at).toLocaleDateString()}
                      </span>
                    )}

                    {!existingStake && !canAfford && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <AlertCircle className="w-3 h-3" />
                        Need {(tier.amount - availableBalance).toFixed(0)} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  {!existingStake && (
                    <Button
                      size="sm"
                      onClick={() => stake(tierId)}
                      disabled={!canAfford || isStaking}
                      className={`flex-1 ${
                        canAfford 
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500' 
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {isStaking && selectedTier === tierId ? 'Staking...' : 'Delegate Trust'}
                    </Button>
                  )}

                  {isStaked && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => requestUnstake(existingStake.id)}
                      disabled={isRequestingUnstake}
                      className="flex-1 border-white/10 hover:bg-white/5"
                    >
                      {isRequestingUnstake ? 'Requesting...' : `Revoke (${UNSTAKE_COOLDOWN_DAYS}d cooldown)`}
                    </Button>
                  )}

                  {isUnstaking && existingStake?.unlocks_at && new Date(existingStake.unlocks_at) <= new Date() && (
                    <Button
                      size="sm"
                      onClick={() => completeUnstake(existingStake.id)}
                      disabled={isCompletingUnstake}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                    >
                      {isCompletingUnstake ? 'Completing...' : 'Complete Unstake'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="p-3 rounded-lg bg-slate-800/30 border border-white/5">
          <p className="text-xs text-slate-400 leading-relaxed">
            <strong className="text-slate-300">Trust, not spending:</strong> Staked UCT remains yours. 
            You can unstake after a {UNSTAKE_COOLDOWN_DAYS}-day cooldown. If the assistant breaks trust, 
            stakes are temporarily paused, never destroyed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
