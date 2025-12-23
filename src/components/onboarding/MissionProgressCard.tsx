import React, { useEffect, useRef } from 'react';
import { Check, Circle, Zap, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useOnboardingMissions } from '@/hooks/useOnboardingMissions';
import { useBetaProUnlock } from '@/hooks/useBetaProUnlock';
import { 
  PRO_UNLOCK_UCT, 
  EARN_FIRST_MESSAGE,
} from '@/lib/onboardingMissions';
import { cn } from '@/lib/utils';

const TARGET_UCT = PRO_UNLOCK_UCT; // 40

interface MissionItemProps {
  label: string;
  reward: number;
  isComplete: boolean;
}

const MissionItem: React.FC<MissionItemProps> = ({ label, reward, isComplete }) => {
  return (
    <div className={cn(
      "flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors duration-200",
      isComplete 
        ? "bg-primary/5 border border-primary/10" 
        : "bg-muted/30 border border-transparent"
    )}>
      {/* Status icon */}
      <div className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200",
        isComplete 
          ? "bg-primary/20 text-primary" 
          : "bg-muted/50 text-muted-foreground/40"
      )}>
        {isComplete ? (
          <Check className="w-3 h-3" strokeWidth={3} />
        ) : (
          <Circle className="w-3 h-3" />
        )}
      </div>
      
      {/* Label */}
      <span className={cn(
        "flex-1 text-sm transition-colors duration-200",
        isComplete 
          ? "text-foreground/70 line-through" 
          : "text-foreground/90"
      )}>
        {label}
      </span>
      
      {/* Reward */}
      <span className={cn(
        "text-xs font-medium tabular-nums transition-colors duration-200",
        isComplete 
          ? "text-primary/60" 
          : "text-primary/80"
      )}>
        +{reward} UCT
      </span>
    </div>
  );
};

// Completion state component - Pro unlocked
const CompletionState: React.FC<{ isOperator: boolean }> = ({ isOperator }) => {
  return (
    <div className="flex flex-col items-center text-center py-4 space-y-4">
      {/* Success icon */}
      <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Zap className="w-6 h-6 text-primary" />
      </div>
      
      {/* Title */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          You've unlocked your first month of Pro.
        </h3>
        <p className="text-sm text-muted-foreground">
          This is how Operator Mode feels.
        </p>
      </div>
      
      {/* Operator badge */}
      {isOperator && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">Operator Mode Active</span>
        </div>
      )}
    </div>
  );
};

export const MissionProgressCard: React.FC = () => {
  const { missions, totalUctEarned, completedCount, totalCount, hasUnlockedPro } = useOnboardingMissions();
  const { checkAndUnlockPro, isOperator } = useBetaProUnlock();
  const hasTriggeredUnlock = useRef(false);
  
  const progressPercent = (totalUctEarned / TARGET_UCT) * 100;
  const allComplete = completedCount >= totalCount && totalCount > 0;

  // Auto-trigger Pro unlock when user earns 40 UCT
  useEffect(() => {
    if (hasUnlockedPro && !hasTriggeredUnlock.current) {
      hasTriggeredUnlock.current = true;
      checkAndUnlockPro(totalUctEarned);
    }
  }, [hasUnlockedPro, totalUctEarned, checkAndUnlockPro]);

  // Show completion state when all missions done
  if (allComplete) {
    return (
      <Card className="bg-card/40 backdrop-blur-md border-border/30 border-primary/20">
        <CardContent className="pt-6">
          <CompletionState isOperator={isOperator} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/40 backdrop-blur-md border-border/30">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-foreground/90 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary/70" />
              Onboarding Missions
            </CardTitle>
            <span className="text-xs text-muted-foreground tabular-nums">
              {completedCount}/{totalCount}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {EARN_FIRST_MESSAGE}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-foreground/80 font-medium tabular-nums">
              {totalUctEarned} / {TARGET_UCT} UCT
            </span>
          </div>
          <Progress 
            value={progressPercent} 
            className="h-2 bg-muted/30"
          />
        </div>
        
        {/* Mission checklist */}
        <div className="space-y-1.5">
          {missions.map(mission => (
            <MissionItem
              key={mission.id}
              label={mission.title}
              reward={mission.reward}
              isComplete={mission.completed}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MissionProgressCard;
