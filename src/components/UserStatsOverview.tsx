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
      <Card className="animate-fade-in">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{icon}</span>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card animate-fade-in hover-scale transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className={`text-2xl font-bold ${value === 0 ? 'text-muted-foreground' : 'text-foreground'}`}>
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
      <h2 className="text-xl font-semibold text-foreground">Your AI Stats</h2>
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