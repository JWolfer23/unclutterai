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

  const getTotalUsed = () => {
    if (!usage) return 0;
    return usage.summary + usage.task_generation + usage.scoring;
  };

  const getTotalLimit = () => {
    return AI_USAGE_LIMITS.summary + AI_USAGE_LIMITS.task_generation + AI_USAGE_LIMITS.scoring;
  };

  const isAtLimit = () => {
    if (!usage) return false;
    return usage.summary >= AI_USAGE_LIMITS.summary || 
           usage.task_generation >= AI_USAGE_LIMITS.task_generation || 
           usage.scoring >= AI_USAGE_LIMITS.scoring;
  };

  const isNearLimit = () => {
    if (!usage) return false;
    const summaryNear = usage.summary >= AI_USAGE_LIMITS.summary * 0.8;
    const taskNear = usage.task_generation >= AI_USAGE_LIMITS.task_generation * 0.8;
    const scoringNear = usage.scoring >= AI_USAGE_LIMITS.scoring * 0.8;
    return summaryNear || taskNear || scoringNear;
  };

  const getTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-3">
      {/* Upgrade prompt banner for hitting limits */}
      {isAtLimit() && (
        <Alert className="bg-orange-50 border-orange-200 text-orange-800">
          <Zap className="h-4 w-4" />
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-sm">You've hit your daily limit. Upgrade to Premium for 100 summaries/day.</span>
            <Button size="sm" variant="outline" className="text-xs bg-white hover:bg-orange-50">
              Upgrade Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Subtle banner for near limits */}
      {!isAtLimit() && isNearLimit() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700">Running low? Upgrade for more AI power.</p>
        </div>
      )}

      {/* Main usage card */}
      <Card className="bg-white/80 backdrop-blur-md border-white/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">AI Usage: {getTotalUsed()}/{getTotalLimit()} Today</p>
              <p className="text-xs text-gray-600">Resets in {getTimeUntilReset()}</p>
            </div>
            <div className="flex items-center space-x-2">
              {isAtLimit() && (
                <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                  Limit reached
                </span>
              )}
              {!isAtLimit() && isNearLimit() && (
                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                  Running low
                </span>
              )}
            </div>
          </div>
          
          {/* Upgrade button */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full text-xs bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-purple-200"
            >
              <span className="mr-1">🔓</span>
              Upgrade to Premium
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIUsageTracker;