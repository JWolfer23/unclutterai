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
    <div className="w-full space-y-4">
      {/* Upgrade prompt banner */}
      {upgradePrompt && (
        <Alert variant={upgradePrompt.variant} className="border-l-4 border-purple-500/50 bg-purple-500/10 backdrop-blur-xl">
          <Zap className="h-4 w-4 text-purple-400" />
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-white">
            <span>{upgradePrompt.message}</span>
            <Button 
              size="sm" 
              variant={upgradePrompt.type === 'hit' ? 'secondary' : 'outline'}
              className="whitespace-nowrap self-start sm:self-auto bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 border-0 text-white"
              onClick={() => {
                // TODO: Implement upgrade flow (Stripe/Token vault)
                console.log('Upgrade clicked');
              }}
            >
              <ArrowUp className="h-3 w-3 mr-1" />
              Upgrade
            </Button>
          </AlertDescription>
        </Alert>
      )}

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
                    {isAtLimit && (
                      <span className="text-xs px-2 py-1 bg-pink-500/20 text-pink-400 rounded-full border border-pink-500/30">
                        Limit reached
                      </span>
                    )}
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
          
          {/* Upgrade button at bottom */}
          <div className="pt-4 border-t border-white/10">
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white border-0 shadow-lg shadow-purple-500/30" 
              onClick={() => {
                // TODO: Implement upgrade flow (Stripe/Token vault)
                console.log('Upgrade to Premium clicked');
              }}
            >
              <Zap className="h-4 w-4 mr-2" />
              🔓 Upgrade to Premium
            </Button>
            <p className="text-xs text-white/50 text-center mt-2">
              Get unlimited AI usage, priority support, and advanced features
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIUsageTracker;