import { CheckCircle2, Home, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { TRUST_MOMENTS } from "@/lib/assistantPersonality";

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

// Trust Moment #3: Loop Closure Relief
// No stats. No celebration. Just relief.
const ClosureScreen = ({ stats, onReturnToFocus, onExit }: ClosureScreenProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-12">
        {/* Subtle success indicator */}
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-full bg-emerald-500/10" />
          <div className="absolute inset-0 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400/80" />
          </div>
        </div>

        {/* Trust Moment #3: Simple relief message */}
        <p className="text-xl font-light text-white/90">
          {TRUST_MOMENTS.loopClosure.primary}
        </p>

        {/* Actions - minimal */}
        <div className="space-y-3 pt-8">
          <Button
            onClick={() => navigate('/focus')}
            className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium gap-2 border border-white/10"
          >
            <Home className="h-4 w-4" />
            Continue
          </Button>
          
          <Button
            variant="ghost"
            onClick={onExit}
            className="w-full text-white/40 hover:text-white/60 gap-2"
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
