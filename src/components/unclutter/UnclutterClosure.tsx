import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useBetaUCT } from "@/hooks/useBetaUCT";
import { UCT_REWARDS } from "@/lib/uctBetaRules";

interface UnclutterClosureProps {
  loopsResolved: number;
  onExit: () => void;
}

const UnclutterClosure = ({ loopsResolved, onExit }: UnclutterClosureProps) => {
  const navigate = useNavigate();
  const { addUCT } = useBetaUCT();
  const [uctAwarded, setUctAwarded] = useState(false);
  const [showReward, setShowReward] = useState(false);

  // Award completion bonus UCT once
  useEffect(() => {
    const awardCompletionBonus = async () => {
      if (!uctAwarded && loopsResolved > 0) {
        try {
          const bonusReward = UCT_REWARDS.unclutter_complete;
          await addUCT(bonusReward, 'unclutter_complete');
          setUctAwarded(true);
          // Delay showing reward for smooth animation
          setTimeout(() => setShowReward(true), 300);
        } catch (e) {
          console.error('Failed to award completion UCT:', e);
        }
      }
    };
    awardCompletionBonus();
  }, [addUCT, loopsResolved, uctAwarded]);

  const handleAcknowledge = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      {/* Calm success icon with subtle glow */}
      <div className="relative mb-10">
        <div className="absolute inset-0 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl animate-pulse" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Check className="h-12 w-12 text-emerald-400" strokeWidth={1.5} />
        </div>
      </div>
      
      {/* Primary message - calm and final */}
      <h2 className="text-2xl font-light text-white mb-3 tracking-wide">
        All loops resolved.
      </h2>
      <p className="text-white/40 text-lg mb-8">
        Nothing is waiting on you.
      </p>

      {/* Optional UCT reward display */}
      {showReward && loopsResolved > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span className="text-cyan-300 text-sm">
            +{UCT_REWARDS.unclutter_complete} UCT completion bonus
          </span>
        </div>
      )}

      {/* Stats summary */}
      {loopsResolved > 0 && (
        <p className="text-white/30 text-sm mb-10">
          {loopsResolved} item{loopsResolved !== 1 ? 's' : ''} resolved this session
        </p>
      )}

      {/* Single acknowledgment button - explicit, no auto-dismiss */}
      <Button
        onClick={handleAcknowledge}
        className="h-14 px-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all duration-300"
      >
        Done
      </Button>
    </div>
  );
};

export default UnclutterClosure;
