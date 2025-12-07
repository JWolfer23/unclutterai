import { useFocusAnalytics } from "@/hooks/useFocusAnalytics";
import { useFocusStreaks } from "@/hooks/useFocusStreaks";
import { useTokens } from "@/hooks/useTokens";
import { Card, CardContent } from "@/components/ui/card";
import { Coins, Zap, Flame, Trophy, Star, Diamond } from "lucide-react";
import { getLevelTitle } from "@/lib/focusMicroCopy";
import { FocusSystemExplainerModal } from "./FocusSystemExplainerModal";
import { WalletConnection } from "./WalletConnection";
const getTierInfo = (tier: string) => {
  switch (tier.toLowerCase()) {
    case 'diamond':
      return { color: '#7FFFFF', label: 'Diamond', icon: Diamond };
    case 'platinum':
      return { color: '#D8F3FF', label: 'Platinum', icon: Star };
    case 'gold':
      return { color: '#FFD700', label: 'Gold', icon: Star };
    case 'silver':
      return { color: '#C0C0C0', label: 'Silver', icon: Star };
    case 'bronze':
    default:
      return { color: '#C57A3B', label: 'Bronze', icon: Star };
  }
};

const getTierFromLevel = (level: number) => {
  if (level >= 20) return 'diamond';
  if (level >= 15) return 'platinum';
  if (level >= 10) return 'gold';
  if (level >= 5) return 'silver';
  return 'bronze';
};

export const ProfilePanel = () => {
  const { focusLevel, weeklyTier, sessionsThisWeek, lifetimeUCT, isLoading: analyticsLoading } = useFocusAnalytics();
  const { currentStreak, longestStreak, isLoading: streakLoading } = useFocusStreaks();
  const { balance, isLoading: tokenLoading } = useTokens();

  const isLoading = analyticsLoading || streakLoading || tokenLoading;

  const xpProgress = focusLevel.xp_to_next > 0 
    ? (focusLevel.xp_total / focusLevel.xp_to_next) * 100 
    : 0;

  const tierFromLevel = getTierFromLevel(focusLevel.level);
  const tierInfo = getTierInfo(tierFromLevel);
  const TierIcon = tierInfo.icon;

  const displayBalance = balance || lifetimeUCT || 0;

  if (isLoading) {
    return (
      <Card className="bg-slate-900/60 border border-white/10 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-white/5 rounded-xl" />
            <div className="h-20 bg-white/5 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-[0_0_30px_rgba(139,92,246,0.15)]">
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Section 1: UCT Balance */}
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/80 border border-white/5 overflow-hidden">
            {/* Glow effect behind */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-cyan-500/20 rounded-full blur-3xl" />
            
            <div className="relative flex items-start gap-3">
              <div 
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
                  boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)'
                }}
              >
                <Coins className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-medium">Unclutter Tokens (UCT)</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {displayBalance.toLocaleString()} <span className="text-sm font-normal text-cyan-400">UCT</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">Earned by staying focused and consistent.</p>
              </div>
            </div>
          </div>

          {/* Section 2: Focus Level + XP */}
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/80 border border-white/5 overflow-hidden">
            {/* Glow effect */}
            <div className="absolute top-1/2 right-0 w-20 h-20 bg-purple-500/20 rounded-full blur-3xl" />
            
            <div className="relative flex items-start gap-3">
              <div 
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                  boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)'
                }}
              >
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-medium">Focus Level</p>
                <p className="text-2xl font-bold text-white mt-1">Level {focusLevel.level}</p>
                <p className="text-xs text-purple-300 mt-0.5">{focusLevel.title || getLevelTitle(focusLevel.level)}</p>
                
                {/* XP Progress Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">XP Progress</span>
                    <span className="text-slate-400">{focusLevel.xp_total} / {focusLevel.xp_to_next} XP</span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.min(xpProgress, 100)}%`,
                        background: 'linear-gradient(90deg, #a855f7, #6366f1)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Streak */}
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/80 border border-white/5 overflow-hidden">
            {/* Warm accent bar for high streaks */}
            {currentStreak >= 7 && (
              <div 
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                style={{ background: 'linear-gradient(180deg, #f97316, #ef4444)' }}
              />
            )}
            
            <div className="relative flex items-start gap-3">
              <div 
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ 
                  background: currentStreak >= 7 
                    ? 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)' 
                    : 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                  boxShadow: currentStreak >= 7 
                    ? '0 0 20px rgba(249, 115, 22, 0.5)' 
                    : '0 0 15px rgba(245, 158, 11, 0.3)'
                }}
              >
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-medium">Streak</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-2xl font-bold text-white">{currentStreak}</p>
                  <span className="text-sm text-orange-400">days</span>
                  {currentStreak >= 7 && <span className="ml-1 text-lg">🔥</span>}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Longest streak: <span className="text-slate-300">{longestStreak} days</span>
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Consistency Tier / Badge */}
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/80 border border-white/5 overflow-hidden">
            {/* Tier glow */}
            <div 
              className="absolute top-1/2 right-0 w-16 h-16 rounded-full blur-2xl opacity-30"
              style={{ backgroundColor: tierInfo.color }}
            />
            
            <div className="relative flex items-start gap-3">
              <div 
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, ${tierInfo.color}40, ${tierInfo.color}20)`,
                  border: `1px solid ${tierInfo.color}50`,
                  boxShadow: `0 0 15px ${tierInfo.color}30`
                }}
              >
                <Trophy className="w-5 h-5" style={{ color: tierInfo.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-medium">Consistency Tier</p>
                
                {/* Badge Pill */}
                <div 
                  className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full"
                  style={{ 
                    backgroundColor: `${tierInfo.color}15`,
                    border: `1px solid ${tierInfo.color}40`,
                    boxShadow: `0 0 12px ${tierInfo.color}30, inset 0 1px 2px ${tierInfo.color}20`
                  }}
                >
                  <TierIcon className="w-3.5 h-3.5" style={{ color: tierInfo.color }} />
                  <span 
                    className="text-xs font-semibold"
                    style={{ color: tierInfo.color }}
                  >
                    {tierInfo.label}
                  </span>
                </div>
                
                <p className="text-xs text-slate-500 mt-2">
                  {tierFromLevel === 'diamond' 
                    ? "You've reached the highest tier!"
                    : `Sessions this week: ${sessionsThisWeek}`
                  }
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Wallet Connection Section */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <h3 className="text-xs text-slate-400 font-medium mb-3 text-center">Web3 Wallet</h3>
          <WalletConnection />
        </div>

        {/* Learn More Link */}
        <div className="mt-4 pt-4 border-t border-white/5 flex justify-center">
          <FocusSystemExplainerModal />
        </div>
      </CardContent>
    </Card>
  );
};
