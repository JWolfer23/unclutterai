import React from 'react';
import { Check, Bot, Mail, Inbox, Focus, Coins, LucideIcon } from 'lucide-react';
import { useOnboardingMissions } from '@/hooks/useOnboardingMissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const ICON_MAP: Record<string, LucideIcon> = {
  Bot,
  Mail,
  Inbox,
  Focus,
};

export const OnboardingMissionChecklist: React.FC = () => {
  const {
    missions,
    completedCount,
    totalCount,
    totalUctEarned,
    totalUctAvailable,
    isLoading,
  } = useOnboardingMissions();

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-2 bg-muted rounded w-full" />
            <div className="space-y-2 mt-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercent = (completedCount / totalCount) * 100;
  const allComplete = completedCount === totalCount;

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Onboarding Missions
          </CardTitle>
          <div className="flex items-center gap-1.5 text-primary">
            <Coins className="w-4 h-4" />
            <span className="text-sm font-medium">
              {totalUctEarned} / {totalUctAvailable} UCT
            </span>
          </div>
        </div>
        <div className="mt-2">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1.5">
            {completedCount} of {totalCount} complete
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          {missions.map((mission) => {
            const IconComponent = ICON_MAP[mission.icon] || Bot;
            
            return (
              <div
                key={mission.id}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border transition-colors
                  ${mission.completed 
                    ? 'bg-primary/5 border-primary/20' 
                    : 'bg-muted/30 border-border/50'
                  }
                `}
              >
                {/* Icon / Check */}
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center shrink-0
                  ${mission.completed 
                    ? 'bg-primary/20 text-primary' 
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {mission.completed ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <IconComponent className="w-5 h-5" />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`
                    font-medium text-sm
                    ${mission.completed ? 'text-foreground' : 'text-foreground/80'}
                  `}>
                    {mission.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {mission.description}
                  </p>
                </div>
                
                {/* Reward badge */}
                <div className={`
                  flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0
                  ${mission.completed 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  <Coins className="w-3 h-3" />
                  +{mission.reward}
                </div>
              </div>
            );
          })}
        </div>
        
        {allComplete && (
          <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <p className="text-sm font-medium text-primary">
              All missions complete! You earned {totalUctAvailable} UCT.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
