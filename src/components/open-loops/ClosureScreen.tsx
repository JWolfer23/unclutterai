import { CheckCircle2, Clock, Brain, Coins, Home, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ClosureScreenProps {
  stats: {
    loopsCleared: number;
    timeSpent: number;
    estimatedTimeSaved: number;
    mentalLoadMessage: string;
    uctEarned: number;
  };
  onReturnToFocus: () => void;
  onExit: () => void;
}

const ClosureScreen = ({ stats, onReturnToFocus, onExit }: ClosureScreenProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Success Icon */}
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-white">All Loops Closed</h1>
          <p className="text-white/50">Your mind is clear. Your world is organized.</p>
        </div>

        {/* Stats */}
        <div className="rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Loops Cleared */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-2xl font-bold text-emerald-400">{stats.loopsCleared}</span>
              </div>
              <p className="text-xs text-white/50">loops cleared</p>
            </div>

            {/* Time Saved */}
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-blue-400" />
                <span className="text-2xl font-bold text-blue-400">{stats.estimatedTimeSaved}</span>
              </div>
              <p className="text-xs text-white/50">min saved</p>
            </div>
          </div>

          {/* Mental Load */}
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Brain className="h-4 w-4 text-purple-400" />
              <span className="text-lg font-medium text-purple-400">{stats.mentalLoadMessage}</span>
            </div>
            <p className="text-xs text-white/50">mental load</p>
          </div>

          {/* UCT Earned */}
          {stats.uctEarned > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Coins className="h-4 w-4 text-amber-400" />
                <span className="text-2xl font-bold text-amber-400">+{stats.uctEarned.toFixed(2)}</span>
              </div>
              <p className="text-xs text-white/50">UCT earned</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/focus')}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-lg gap-2"
          >
            <Home className="h-5 w-5" />
            Return to Focus
          </Button>
          
          <Button
            variant="ghost"
            onClick={onExit}
            className="w-full text-white/50 hover:text-white gap-2"
          >
            <X className="h-4 w-4" />
            Exit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClosureScreen;
