import { useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMorningBrief } from "@/hooks/useMorningBrief";
import {
  ArrivalScreen,
  PriorityStackScreen,
  IntelligenceScreen,
  EnergyCheckScreen,
  FirstActionScreen,
} from "@/components/morning-brief";

const MorningBrief = () => {
  const navigate = useNavigate();
  const {
    currentScreen,
    briefData,
    isLoading,
    greeting,
    currentPriority,
    currentPriorityIndex,
    totalPriorities,
    nextScreen,
    advancePriority,
    generateBrief,
    completeBrief,
    markBriefShown,
  } = useMorningBrief();

  // Generate brief on mount
  useEffect(() => {
    generateBrief();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePriorityHandle = () => {
    // Navigate to relevant source
    navigate("/communication");
  };

  const handlePrioritySkip = () => {
    advancePriority();
  };

  const handlePriorityContinue = () => {
    nextScreen();
  };

  const handleEnterFocus = () => {
    markBriefShown();
    navigate("/focus");
  };

  const handleBeginAction = () => {
    completeBrief();
    navigate("/");
  };

  const handleBack = () => {
    markBriefShown();
    navigate("/");
  };

  // Loading state
  if (isLoading && !briefData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-400/60 animate-spin mx-auto mb-4" />
          <p className="text-white/50">Preparing your brief...</p>
        </div>
      </div>
    );
  }

  // Default data if none available
  const data = briefData || {
    greeting,
    priorities: [],
    insight: "",
    energy: { level: "medium" as const, focusWindowMinutes: 60, recoveryNeeded: false },
    firstAction: { title: "Plan your day", estimatedMinutes: 10, reason: "Start with clarity" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 text-white px-6 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Back button - only show after screen 1 */}
        {currentScreen > 1 && (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Exit Brief</span>
          </button>
        )}

        {/* Progress indicator */}
        {currentScreen > 1 && (
          <div className="flex gap-2 justify-center mb-8">
            {[1, 2, 3, 4, 5].map((screen) => (
              <div
                key={screen}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${screen === currentScreen 
                    ? "w-6 bg-white/80" 
                    : screen < currentScreen 
                      ? "bg-white/40" 
                      : "bg-white/15"
                  }
                `}
              />
            ))}
          </div>
        )}

        {/* Screen content */}
        {currentScreen === 1 && (
          <ArrivalScreen
            greeting={data.greeting}
            onBegin={nextScreen}
          />
        )}

        {currentScreen === 2 && (
          <PriorityStackScreen
            priority={currentPriority}
            currentIndex={currentPriorityIndex}
            totalCount={totalPriorities}
            onHandle={handlePriorityHandle}
            onSkip={handlePrioritySkip}
            onContinue={handlePriorityContinue}
          />
        )}

        {currentScreen === 3 && (
          <IntelligenceScreen
            insight={data.insight}
            onContinue={nextScreen}
          />
        )}

        {currentScreen === 4 && (
          <EnergyCheckScreen
            energy={data.energy}
            onEnterFocus={handleEnterFocus}
            onContinue={nextScreen}
          />
        )}

        {currentScreen === 5 && (
          <FirstActionScreen
            action={data.firstAction}
            onBegin={handleBeginAction}
          />
        )}
      </div>
    </div>
  );
};

export default MorningBrief;
