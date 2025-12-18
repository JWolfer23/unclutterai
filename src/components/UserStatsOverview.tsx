import { Card, CardContent } from "@/components/ui/card";
import { useUserDashboard } from "@/hooks/useUserDashboard";

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  emptyText: string;
}

const StatCard = ({ icon, label, value, emptyText }: StatCardProps) => {
  const displayValue = value === 0 ? emptyText : value.toLocaleString();
  const isZero = value === 0;

  return (
    <Card className="glass-card animate-fade-in hover-scale transition-all duration-200 bg-black/40 border-white/10 backdrop-blur-xl">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="text-sm text-white/60 font-medium">{label}</p>
            <p className={`text-xl font-bold ${isZero ? 'text-slate-500 text-base' : 'text-white text-2xl'}`}>
              {displayValue}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const UserStatsOverview = () => {
  const { dashboardData } = useUserDashboard();

  const stats = [
    {
      icon: "🧠",
      label: "Summaries Today",
      value: dashboardData?.daily_summaries || 0,
      emptyText: "None today",
    },
    {
      icon: "✅",
      label: "Tasks Created",
      value: dashboardData?.tasks_generated || 0,
      emptyText: "None yet",
    },
    {
      icon: "💰",
      label: "UCT Earned",
      value: dashboardData?.tokens_earned || 0,
      emptyText: "0 earned",
    },
    {
      icon: "🔥",
      label: "Current Streak",
      value: dashboardData?.focus_streak || 0,
      emptyText: "No active streak",
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
            emptyText={stat.emptyText}
          />
        ))}
      </div>
    </div>
  );
};