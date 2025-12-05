import { Flame, Coins } from "lucide-react";
import { useFocusStreaks } from "@/hooks/useFocusStreaks";

interface FocusStreakStripProps {
  isActive: boolean;
  duration: number;
  timeRemaining: number;
}

export const FocusStreakStrip = ({ isActive, duration, timeRemaining }: FocusStreakStripProps) => {
  const { currentStreak, longestStreak } = useFocusStreaks();

  // Calculate estimated reward for remaining time
  const remainingMinutes = Math.ceil(timeRemaining / 60);
  const estimatedReward = isActive ? (remainingMinutes * 0.05).toFixed(2) : null;

  return (
    <div className="relative w-full mt-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden">
      {/* Purple accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-teal-400" />
      
      <div className="flex items-center justify-between">
        {/* Left - Streak Info */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/30">
            <Flame className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Streak
            </p>
            <p className="text-xl font-bold text-white">
              {currentStreak} days
            </p>
            <p className="text-xs text-slate-500">
              Longest: {longestStreak}
            </p>
          </div>
        </div>

        {/* Right - Next Reward */}
        <div className="flex items-center gap-3 text-right">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Next Reward
            </p>
            <p className="text-xl font-bold text-yellow-400">
              {estimatedReward ? `~${estimatedReward} UCT` : '–'}
            </p>
            <p className="text-xs text-slate-500">
              {isActive ? 'Completing this session earns UCT' : 'Start session to earn UCT'}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
            <Coins className="w-5 h-5 text-yellow-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
