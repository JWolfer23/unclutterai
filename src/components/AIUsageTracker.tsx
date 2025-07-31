import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAIUsage, AI_USAGE_LIMITS } from "@/hooks/useAIUsage";
import { Brain, CheckSquare, Target } from "lucide-react";

const AIUsageTracker = () => {
  const { usage, isLoading } = useAIUsage();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">AI Usage Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading usage data...</div>
        </CardContent>
      </Card>
    );
  }

  const usageItems = [
    {
      type: 'summary' as keyof typeof AI_USAGE_LIMITS,
      label: 'Message Summaries',
      icon: Brain,
      used: usage?.summary || 0,
      limit: AI_USAGE_LIMITS.summary,
    },
    {
      type: 'task_generation' as keyof typeof AI_USAGE_LIMITS,
      label: 'Task Generation',
      icon: CheckSquare,
      used: usage?.task_generation || 0,
      limit: AI_USAGE_LIMITS.task_generation,
    },
    {
      type: 'scoring' as keyof typeof AI_USAGE_LIMITS,
      label: 'Task Scoring',
      icon: Target,
      used: usage?.scoring || 0,
      limit: AI_USAGE_LIMITS.scoring,
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">AI Usage Today</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {usageItems.map((item) => {
          const percentage = (item.used / item.limit) * 100;
          const Icon = item.icon;
          
          return (
            <div key={item.type} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {item.used} / {item.limit}
                </span>
              </div>
              <Progress 
                value={percentage} 
                className="h-2"
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default AIUsageTracker;