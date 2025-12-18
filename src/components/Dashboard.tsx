import PriorityDashboardCards from "@/components/PriorityDashboardCards";
import { UserStatsOverview } from "@/components/UserStatsOverview";

interface DashboardProps {
  assistantName: string;
  subscriptionTier: string;
}

const Dashboard = ({ assistantName, subscriptionTier }: DashboardProps) => {
  // Schedule button handler - placeholder for now
  const handleShowSchedule = () => {
    console.log("Schedule clicked - feature coming soon");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Welcome back
          </h1>
          <p className="text-gray-400 text-sm">
            Assistant: {assistantName} • Tier: {subscriptionTier}
          </p>
        </div>

        {/* Priority Dashboard Cards - Focus Score, UCT Tokens, Community Ranking */}
        <PriorityDashboardCards 
          onShowRecoveryDashboard={handleShowSchedule} 
        />

        {/* Your AI Stats */}
        <UserStatsOverview />

        {/* AI Usage Today - without upgrade prompts */}
        <AIUsageTrackerMinimal />
      </div>
    </div>
  );
};

/**
 * Minimal AI Usage Tracker without upgrade prompts/paywalls
 * Shows only the usage progress bars
 */
const AIUsageTrackerMinimal = () => {
  // Import inline to avoid circular deps and keep component self-contained
  const { useAIUsage, AI_USAGE_LIMITS } = require("@/hooks/useAIUsage");
  const { Card, CardContent, CardHeader, CardTitle } = require("@/components/ui/card");
  const { Progress } = require("@/components/ui/progress");
  const { Brain, CheckSquare, Target, Clock } = require("lucide-react");

  const { usage, isLoading } = useAIUsage();

  if (isLoading) {
    return (
      <Card className="w-full bg-black/40 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">AI Usage Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-white/60">Loading usage data...</div>
        </CardContent>
      </Card>
    );
  }

  const usageItems = [
    {
      type: 'summary',
      label: 'Message Summaries',
      icon: Brain,
      used: usage?.summary || 0,
      limit: AI_USAGE_LIMITS.summary,
    },
    {
      type: 'task_generation',
      label: 'Task Generation',
      icon: CheckSquare,
      used: usage?.task_generation || 0,
      limit: AI_USAGE_LIMITS.task_generation,
    },
    {
      type: 'scoring',
      label: 'Task Scoring',
      icon: Target,
      used: usage?.scoring || 0,
      limit: AI_USAGE_LIMITS.scoring,
    },
  ];

  return (
    <Card className="w-full bg-black/40 border-white/10 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">AI Usage Today</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {usageItems.map((item) => {
          const percentage = (item.used / item.limit) * 100;
          const Icon = item.icon;
          const isAtLimit = item.used >= item.limit;
          const isNearLimit = item.used >= item.limit * 0.8;
          
          return (
            <div key={item.type} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <Icon className={`h-4 w-4 ${
                    isAtLimit ? 'text-pink-400' : 
                    isNearLimit ? 'text-purple-400' : 
                    'text-white/60'
                  }`} />
                  <span className="text-sm font-medium text-white">{item.label}</span>
                </div>
                <span className={`text-sm ${
                  isAtLimit ? 'text-pink-400 font-medium' : 
                  isNearLimit ? 'text-purple-400' : 
                  'text-white/60'
                }`}>
                  {item.used} / {item.limit}
                </span>
              </div>
              <Progress 
                value={percentage} 
                className={`h-2 bg-white/10 ${
                  isAtLimit ? '[&>div]:bg-gradient-to-r [&>div]:from-pink-500 [&>div]:to-purple-500' : 
                  isNearLimit ? '[&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-400' : 
                  '[&>div]:bg-gradient-to-r [&>div]:from-purple-600 [&>div]:to-pink-500'
                }`}
              />
              <div className="flex items-center gap-1 text-xs text-white/50">
                <Clock className="h-3 w-3" />
                <span>Resets at midnight</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default Dashboard;

