import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserDashboard } from "@/hooks/useUserDashboard";

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  isLoading?: boolean;
}

const StatCard = ({ icon, label, value, isLoading }: StatCardProps) => {
  if (isLoading) {
    return (
      <Card className="animate-fade-in bg-black/40 border-white/10 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{icon}</span>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 bg-white/10" />
              <Skeleton className="h-8 w-16 bg-white/10" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card animate-fade-in hover-scale transition-all duration-200 bg-black/40 border-white/10 backdrop-blur-xl">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="text-sm text-white/60 font-medium">{label}</p>
            <p className={`text-2xl font-bold ${value === 0 ? 'text-white/40' : 'text-white'}`}>
              {value.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const UserStatsOverview = () => {
  const { dashboardData, isLoading } = useUserDashboard();

  const stats = [
    {
      icon: "🧠",
      label: "Summaries Today",
      value: dashboardData?.daily_summaries || 0,
    },
    {
      icon: "✅",
      label: "Tasks Created",
      value: dashboardData?.tasks_generated || 0,
    },
    {
      icon: "💰",
      label: "UCT Earned",
      value: dashboardData?.tokens_earned || 0,
    },
    {
      icon: "🔥",
      label: "Current Streak",
      value: dashboardData?.focus_streak || 0,
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Your AI Stats</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
};