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
    <div className="w-full space-y-4">
      {/* Upgrade prompt banner */}
      {upgradePrompt && (
        <Alert variant={upgradePrompt.variant} className="border-l-4">
          <Zap className="h-4 w-4" />
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>{upgradePrompt.message}</span>
            <Button 
              size="sm" 
              variant={upgradePrompt.type === 'hit' ? 'secondary' : 'outline'}
              className="whitespace-nowrap self-start sm:self-auto"
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

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">AI Usage Today</CardTitle>
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
                      isAtLimit ? 'text-destructive' : 
                      isNearLimit ? 'text-orange-500' : 
                      'text-muted-foreground'
                    }`} />
                    <span className="text-sm font-medium">{item.label}</span>
                    {isAtLimit && (
                      <span className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded-full">
                        Limit reached
                      </span>
                    )}
                  </div>
                  <span className={`text-sm ${
                    isAtLimit ? 'text-destructive font-medium' : 
                    isNearLimit ? 'text-orange-500' : 
                    'text-muted-foreground'
                  }`}>
                    {item.used} / {item.limit}
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className={`h-2 ${
                    isAtLimit ? '[&>div]:bg-destructive' : 
                    isNearLimit ? '[&>div]:bg-orange-500' : ''
                  }`}
                />
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Resets at midnight</span>
                </div>
              </div>
            );
          })}
          
          {/* Upgrade button at bottom */}
          <div className="pt-4 border-t">
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => {
                // TODO: Implement upgrade flow (Stripe/Token vault)
                console.log('Upgrade to Premium clicked');
              }}
            >
              <Zap className="h-4 w-4 mr-2" />
              🔓 Upgrade to Premium
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Get unlimited AI usage, priority support, and advanced features
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIUsageTracker;