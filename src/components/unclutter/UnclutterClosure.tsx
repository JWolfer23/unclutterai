import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useMemo } from "react";
import { useBetaUCT } from "@/hooks/useBetaUCT";
import { useVoiceTTS } from "@/hooks/useVoiceTTS";
import { useOnboardingMissions } from "@/hooks/useOnboardingMissions";
import { UCT_REWARDS } from "@/lib/uctBetaRules";

interface UnclutterClosureProps {
  loopsResolved: number;
  onExit: () => void;
}

// Deterministic subtext based on current hour (stable within the hour)
const getCompletionSubtext = (): string => {
  const hour = new Date().getHours();
  const subtexts = [
    "Nothing is waiting on you.",
    "Your inbox is clear — for now.",
    "You're caught up."
  ];
  return subtexts[hour % 3];
};

// Assistant speaks once, then silence
const ASSISTANT_LINE = "You're clear. I'll keep watch.";

const UnclutterClosure = ({ loopsResolved, onExit }: UnclutterClosureProps) => {
  const navigate = useNavigate();
  const { addUCT } = useBetaUCT();
  const { speak } = useVoiceTTS();
  const { missions, checkAndCompleteMission } = useOnboardingMissions();
  const hasSpokenRef = useRef(false);
  const hasAwardedRef = useRef(false);

  // Deterministic subtext
  const subtext = useMemo(() => getCompletionSubtext(), []);

  // Handle first completion mission (silent)
  useEffect(() => {
    const handleFirstCompletion = async () => {
      const unclutterMission = missions.find(m => m.id === 'first_unclutter');
      const isFirst = !unclutterMission?.completedAt;
      
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

  // Award completion UCT silently
  useEffect(() => {
    const awardCompletionBonus = async () => {
      if (!hasAwardedRef.current && loopsResolved > 0) {
        hasAwardedRef.current = true;
        try {
          await addUCT(UCT_REWARDS.unclutter_complete, 'unclutter_complete');
        } catch (e) {
          console.error('Failed to award completion UCT:', e);
        }
      }
    };
    awardCompletionBonus();
  }, [addUCT, loopsResolved]);

  // Speak once, then silence
  useEffect(() => {
    if (!hasSpokenRef.current) {
      hasSpokenRef.current = true;
      setTimeout(() => {
        speak(ASSISTANT_LINE);
      }, 600);
    }
  }, [speak]);

  const handleBeginFocus = () => {
    navigate('/focus');
  };

  const handleTakeBreak = () => {
    navigate('/');
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[70vh] text-center px-6 animate-fade-in">
      {/* Soft ambient glow background */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent rounded-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/8 rounded-full blur-3xl opacity-40 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 max-w-md">
        {/* Primary message */}
        <h2 className="text-2xl font-light text-foreground mb-4 tracking-wide">
          All loops resolved.
        </h2>
        <p className="text-muted-foreground text-lg mb-8">
          {subtext}
        </p>

        {/* Assistant line - single, calm */}
        <p className="text-muted-foreground/60 text-sm italic mb-12">
          "{ASSISTANT_LINE}"
        </p>

        {/* Two soft action buttons - user-led only */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <Button
            onClick={handleBeginFocus}
            variant="ghost"
            className="h-12 px-6 rounded-2xl bg-secondary/50 hover:bg-secondary/80 border border-border/50 text-foreground/80 hover:text-foreground font-normal transition-all duration-300"
          >
            Begin focus
          </Button>
          <Button
            onClick={handleTakeBreak}
            variant="ghost"
            className="h-12 px-6 rounded-2xl bg-secondary/50 hover:bg-secondary/80 border border-border/50 text-foreground/80 hover:text-foreground font-normal transition-all duration-300"
          >
            Take a break
          </Button>
        </div>

        {/* Optional context line - muted */}
        <p className="text-xs text-muted-foreground/40">
          Gmail and Outlook are up to date.
        </p>
      </div>
    </div>
  );
};

export default UnclutterClosure;
