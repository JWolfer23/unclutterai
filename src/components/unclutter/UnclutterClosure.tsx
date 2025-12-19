import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useBetaUCT } from "@/hooks/useBetaUCT";
import { useVoiceTTS } from "@/hooks/useVoiceTTS";
import { useOnboardingMissions } from "@/hooks/useOnboardingMissions";
import { UCT_REWARDS } from "@/lib/uctBetaRules";

interface UnclutterClosureProps {
  loopsResolved: number;
  onExit: () => void;
}

// Spoken confirmation - calm, final
const COMPLETION_VOICE = "All loops resolved. Nothing is waiting on you.";

// Reinforcement copy - earned, not promotional
const REINFORCEMENT_COPY = {
  primary: "Most people never reach inbox zero.",
  secondary: "You did — calmly.",
};

const UnclutterClosure = ({ loopsResolved, onExit }: UnclutterClosureProps) => {
  const navigate = useNavigate();
  const { addUCT } = useBetaUCT();
  const { speak } = useVoiceTTS();
  const { missions, checkAndCompleteMission } = useOnboardingMissions();
  const [uctAwarded, setUctAwarded] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [isFirstCompletion, setIsFirstCompletion] = useState(false);
  const hasSpokenRef = useRef(false);

  // Check if this is first unclutter completion and award bonus
  useEffect(() => {
    const handleFirstCompletion = async () => {
      // Check if first_unclutter mission is not yet completed
      const unclutterMission = missions.find(m => m.id === 'first_unclutter');
      const isFirst = !unclutterMission?.completedAt;
      setIsFirstCompletion(isFirst);

      // Award first completion bonus (+10 UCT via mission system)
      if (isFirst) {
        try {
          await checkAndCompleteMission('first_unclutter');
        } catch (e) {
          console.error('Failed to complete first_unclutter mission:', e);
        }
      }
    };

    handleFirstCompletion();
  }, [missions, checkAndCompleteMission]);

  // Award regular completion bonus UCT once
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

  // Speak completion confirmation once
  useEffect(() => {
    if (!hasSpokenRef.current) {
      hasSpokenRef.current = true;
      // Small delay for the moment to land visually first
      setTimeout(() => {
        speak(COMPLETION_VOICE);
      }, 500);
    }
  }, [speak]);

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
      <h2 className="text-2xl font-light text-foreground mb-3 tracking-wide">
        All loops resolved.
      </h2>
      <p className="text-muted-foreground text-lg mb-6">
        Nothing is waiting on you.
      </p>

      {/* Reinforcement copy - earned feeling */}
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-1 duration-700 delay-500">
        <p className="text-muted-foreground/60 text-sm mb-1">
          {REINFORCEMENT_COPY.primary}
        </p>
        <p className="text-foreground/80 text-sm font-medium">
          {REINFORCEMENT_COPY.secondary}
        </p>
      </div>

      {/* UCT reward display */}
      {showReward && loopsResolved > 0 && (
        <div className="flex flex-col items-center gap-2 mb-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-cyan-300 text-sm">
              +{UCT_REWARDS.unclutter_complete} UCT completion bonus
            </span>
          </div>
          {isFirstCompletion && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 animate-in fade-in duration-300 delay-200">
              <Sparkles className="h-4 w-4 text-violet-400" />
              <span className="text-violet-300 text-sm">
                +10 UCT first completion
              </span>
            </div>
          )}
        </div>
      )}

      {/* Stats summary */}
      {loopsResolved > 0 && !showReward && (
        <p className="text-muted-foreground/50 text-sm mb-10">
          {loopsResolved} item{loopsResolved !== 1 ? 's' : ''} resolved this session
        </p>
      )}

      {/* Single acknowledgment button - explicit, no auto-dismiss */}
      <Button
        onClick={handleAcknowledge}
        className="h-14 px-10 rounded-2xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-medium transition-all duration-300"
      >
        Done
      </Button>
    </div>
  );
};

export default UnclutterClosure;
