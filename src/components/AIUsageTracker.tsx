import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAIUsage, AI_USAGE_LIMITS } from "@/hooks/useAIUsage";
import { Brain, CheckSquare, Target, Clock, Zap, ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";

const AIUsageTracker = () => {
  const { usage, isLoading } = useAIUsage();

  const getUpgradePrompt = () => {
    if (!usage) return null;

    // Check if any limit is hit
    const hitLimits = [];
    const nearLimits = [];

    Object.entries(usage).forEach(([type, used]) => {
      const limit = AI_USAGE_LIMITS[type as keyof typeof AI_USAGE_LIMITS];
      if (used >= limit) {
        hitLimits.push({ type, used, limit });
      } else if (used >= limit * 0.8) { // 80% threshold for "near limit"
        nearLimits.push({ type, used, limit });
      }
    });

    if (hitLimits.length > 0) {
      return {
        type: 'hit',
        message: `You've hit your daily limit${hitLimits.length > 1 ? 's' : ''}. Upgrade to Premium for unlimited AI power!`,
        variant: 'destructive' as const
      };
    }

    if (nearLimits.length > 0) {
      return {
        type: 'near',
        message: 'Running low on AI usage? Upgrade for unlimited access.',
        variant: 'default' as const
      };
    }

    return null;
  };

  const upgradePrompt = getUpgradePrompt();

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
    <Card className="bg-white/80 backdrop-blur-md border-white/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">AI Usage: 3/55 Today</p>
            <p className="text-xs text-gray-600">Resets in 6h 43m</p>
          </div>
          <Button size="sm" variant="outline" className="text-xs">
            Upgrade to Premium
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIUsageTracker;