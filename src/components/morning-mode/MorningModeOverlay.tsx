import { Flame, Target, Focus, Inbox, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { MorningPriority } from '@/hooks/useMorningMode';

export type MorningModeExitAction = 'focus' | 'unclutter' | 'defer';

interface MorningModeOverlayProps {
  focusStreak: number;
  priorities: MorningPriority[];
  isLoading: boolean;
  onComplete: (action: MorningModeExitAction) => void;
}

// Get time-appropriate greeting
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export function MorningModeOverlay({
  focusStreak,
  priorities,
  isLoading,
  onComplete,
}: MorningModeOverlayProps) {
  const greeting = getGreeting();

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6 overflow-hidden">
      {/* No dismiss button - user must choose an action */}

      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Greeting */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-light text-white tracking-tight">
            {greeting}
          </h1>
          <p className="text-white/50 text-sm">
            Here's what matters today
          </p>
        </div>

        {/* Focus Streak */}
        <Card className="bg-white/5 border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                focusStreak > 0 
                  ? "bg-amber-500/20" 
                  : "bg-white/10"
              )}>
                <Flame className={cn(
                  "w-6 h-6",
                  focusStreak > 0 
                    ? "text-amber-400" 
                    : "text-white/40"
                )} />
              </div>
              <div>
                <p className="text-white/60 text-sm">Focus Streak</p>
                <p className="text-2xl font-semibold text-white">
                  {focusStreak} {focusStreak === 1 ? 'day' : 'days'}
                </p>
              </div>
            </div>
            {focusStreak > 0 && (
              <span className="text-xs text-amber-400/80 bg-amber-400/10 px-2 py-1 rounded-full">
                Keep it going
              </span>
            )}
          </div>
        </Card>

        {/* Priorities - Max 3, no scrolling */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4" />
            Today's Priorities
          </h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
            </div>
          ) : priorities.length === 0 ? (
            <Card className="bg-white/5 border-white/10 p-4">
              <p className="text-white/50 text-sm text-center">
                No priorities set. Start fresh today.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {priorities.map((priority, index) => (
                <Card 
                  key={priority.id} 
                  className="bg-white/5 border-white/10 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-white/30 text-sm font-mono w-5 flex-shrink-0">
                      {index + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {priority.title}
                      </p>
                      <p className="text-white/40 text-xs mt-0.5">
                        {priority.reason}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Exit Actions - Must choose one */}
        <div className="space-y-3 pt-4">
          <p className="text-center text-white/40 text-xs uppercase tracking-wider">
            Choose how to begin
          </p>
          
          {/* Primary: Start Focus */}
          <Button
            onClick={() => onComplete('focus')}
            size="lg"
            className="w-full bg-white text-slate-900 hover:bg-white/90 font-medium h-14 text-base group"
          >
            <Focus className="w-5 h-5 mr-2" />
            Start Focus
          </Button>

          {/* Secondary options */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => onComplete('unclutter')}
              variant="outline"
              size="lg"
              className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 h-12"
            >
              <Inbox className="w-4 h-4 mr-2" />
              Unclutter
            </Button>
            
            <Button
              onClick={() => onComplete('defer')}
              variant="outline"
              size="lg"
              className="bg-white/5 border-white/20 text-white/70 hover:bg-white/10 hover:border-white/30 h-12"
            >
              <Clock className="w-4 h-4 mr-2" />
              Later today
            </Button>
          </div>
        </div>

        {/* Subtle hint - no silent exit */}
        <p className="text-center text-white/20 text-xs">
          Pick one to continue
        </p>
      </div>
    </div>
  );
}
