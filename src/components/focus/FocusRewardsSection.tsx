import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useFocusAnalytics } from "@/hooks/useFocusAnalytics";
import { Award, Sparkles } from "lucide-react";

const TIER_CONFIG: Record<string, { 
  color: string; 
  bgColor: string; 
  borderColor: string;
  description: string;
  nextTier?: string;
  nextThreshold?: number;
}> = {
  none: { 
    color: 'text-slate-400', 
    bgColor: 'bg-slate-500/10', 
    borderColor: 'border-slate-500/30',
    description: 'Start focusing to earn rewards',
    nextTier: 'Bronze',
    nextThreshold: 3,
  },
  bronze: { 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-500/10', 
    borderColor: 'border-amber-500/40',
    description: 'Building consistency',
    nextTier: 'Silver',
    nextThreshold: 5,
  },
  silver: { 
    color: 'text-slate-300', 
    bgColor: 'bg-slate-400/10', 
    borderColor: 'border-slate-400/40',
    description: 'Strong weekly momentum',
    nextTier: 'Gold',
    nextThreshold: 7,
  },
  gold: { 
    color: 'text-yellow-400', 
    bgColor: 'bg-yellow-500/10', 
    borderColor: 'border-yellow-500/40',
    description: 'High performer',
    nextTier: 'Platinum',
    nextThreshold: 10,
  },
  platinum: { 
    color: 'text-cyan-300', 
    bgColor: 'bg-cyan-500/10', 
    borderColor: 'border-cyan-500/40',
    description: 'Elite focus',
  },
};

export const FocusRewardsSection = () => {
  const { weeklyTier, sessionsThisWeek } = useFocusAnalytics();
  
  const tierKey = weeklyTier.tier.toLowerCase();
  const config = TIER_CONFIG[tierKey] || TIER_CONFIG.none;
  
  const tierLabel = tierKey === 'none' ? 'No Tier' : 
    tierKey.charAt(0).toUpperCase() + tierKey.slice(1);

  // Calculate progress to next tier
  const currentSessions = sessionsThisWeek;
  const nextThreshold = config.nextThreshold || currentSessions;
  const progress = config.nextThreshold 
    ? Math.min(100, (currentSessions / nextThreshold) * 100)
    : 100;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-400" />
        Focus Rewards
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Tier Card */}
        <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${config.bgColor} border ${config.borderColor}`}>
                <Award className={`w-8 h-8 ${config.color}`} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">
                  Current Tier
                </p>
                <p className={`text-2xl font-bold ${config.color}`}>
                  {tierLabel}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {config.description}
                </p>
                {weeklyTier.bonus_percent > 0 && (
                  <p className="text-xs text-emerald-400 mt-2">
                    +{(weeklyTier.bonus_percent * 100).toFixed(0)}% bonus rewards
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress to Next Tier */}
        <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-3">
              Progress to {config.nextTier || 'Max Tier'}
            </p>
            
            {config.nextTier ? (
              <>
                <Progress 
                  value={progress} 
                  className="h-3 bg-white/10"
                />
                <div className="flex justify-between mt-3">
                  <span className="text-sm text-slate-400">
                    {currentSessions} / {nextThreshold} sessions
                  </span>
                  <span className="text-sm text-purple-400 font-medium">
                    {Math.round(progress)}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Complete {nextThreshold - currentSessions} more sessions this week to reach {config.nextTier}
                </p>
              </>
            ) : (
              <div className="flex items-center gap-3 mt-2">
                <div className="w-full h-3 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400" />
              </div>
            )}
            
            {!config.nextTier && (
              <p className="text-sm text-cyan-400 mt-4 font-medium">
                🎉 Max tier reached this week!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
