import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Flame, Coins, Award } from "lucide-react";
import { useFocusAnalytics } from "@/hooks/useFocusAnalytics";
import { useFocusStreaks } from "@/hooks/useFocusStreaks";

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtext: string;
  isLoading?: boolean;
}

const StatCard = ({ icon, title, value, subtext, isLoading }: StatCardProps) => {
  if (isLoading) {
    return (
      <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20">{icon}</div>
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20 bg-white/10" />
              <Skeleton className="h-7 w-16 bg-white/10" />
              <Skeleton className="h-3 w-24 bg-white/10" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur-xl hover:border-purple-500/30 transition-all duration-200">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-white truncate">{value}</p>
            <p className="text-xs text-slate-500 mt-1 truncate">{subtext}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const FocusStatsRow = () => {
  const {
    todayMinutes,
    weeklyUCT,
    lifetimeUCT,
    sessionsThisWeek,
    weeklyTier,
    isLoading,
  } = useFocusAnalytics();

  const { currentStreak, longestStreak, isLoading: streakLoading } = useFocusStreaks();

  const tierDisplay = weeklyTier.tier === 'none' ? '—' : 
    weeklyTier.tier.charAt(0).toUpperCase() + weeklyTier.tier.slice(1);

  const loading = isLoading || streakLoading;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<Clock className="w-5 h-5 text-purple-400" />}
        title="Today's Focus"
        value={`${todayMinutes} min`}
        subtext="Focused minutes logged"
        isLoading={loading}
      />
      <StatCard
        icon={<Flame className="w-5 h-5 text-orange-400" />}
        title="Current Streak"
        value={`${currentStreak} days`}
        subtext={`Longest: ${longestStreak} days`}
        isLoading={loading}
      />
      <StatCard
        icon={<Coins className="w-5 h-5 text-yellow-400" />}
        title="UCT Earned (Week)"
        value={weeklyUCT.toFixed(2)}
        subtext={`Lifetime: ${lifetimeUCT.toFixed(2)} UCT`}
        isLoading={loading}
      />
      <StatCard
        icon={<Award className="w-5 h-5 text-teal-400" />}
        title="Consistency Tier"
        value={tierDisplay}
        subtext={`${sessionsThisWeek} sessions this week`}
        isLoading={loading}
      />
    </div>
  );
};
