import React from 'react';
import { Check, Circle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useOnboardingMissions } from '@/hooks/useOnboardingMissions';
import { ONBOARDING_MISSIONS, TOTAL_ONBOARDING_UCT } from '@/lib/onboardingMissions';
import { cn } from '@/lib/utils';

// Display labels for the 4 missions
const MISSION_LABELS: Record<string, string> = {
  assistant_setup: 'Complete assistant setup',
  connect_gmail: 'Connect messaging (Gmail)',
  first_unclutter: 'Complete first Unclutter session',
  first_focus: 'Start first Focus session',
};

const TARGET_UCT = TOTAL_ONBOARDING_UCT; // 40

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

export const MissionProgressCard: React.FC = () => {
  const { missions, totalUctEarned, completedCount, totalCount } = useOnboardingMissions();
  
  const progressPercent = (totalUctEarned / TARGET_UCT) * 100;

  return (
    <Card className="bg-card/40 backdrop-blur-md border-border/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground/90 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary/70" />
            EARN YOUR FIRST 40 UCT
          </CardTitle>
          <span className="text-xs text-muted-foreground tabular-nums">
            {completedCount}/{totalCount} complete
          </span>
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
              label={MISSION_LABELS[mission.id] || mission.title}
              reward={mission.reward}
              isComplete={mission.completed}
            />
          ))}
        </div>
        
        {/* Completion message */}
        {totalUctEarned >= TARGET_UCT && (
          <div className="pt-2 text-center">
            <p className="text-xs text-primary/80 font-medium">
              All missions complete. Pro features unlocked.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MissionProgressCard;
