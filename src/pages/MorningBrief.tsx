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
    nextScreen,
    generateBrief,
    handlePriorityAction,
    completeBrief,
    markBriefShown,
  } = useMorningBrief();

  // Generate brief on mount
  useEffect(() => {
    generateBrief();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePriorityActionWithNavigation = (
    id: string,
    action: "handle" | "schedule" | "delegate" | "dismiss"
  ) => {
    handlePriorityAction(id, action);
    
    if (action === "handle") {
      // Navigate to relevant source (could be expanded based on sourceType)
      navigate("/communication");
    }
  };

  const handleEnterFocus = () => {
    markBriefShown();
    navigate("/focus");
  };

  const handleBeginAction = () => {
    completeBrief();
    // Navigate based on action type - for now go home
    navigate("/");
  };

  const handleChangeRecommendation = () => {
    // Could regenerate or show alternatives
    generateBrief();
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
    intelligence: { market: [], personal: "" },
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
            priorities={data.priorities}
            onAction={handlePriorityActionWithNavigation}
            onContinue={nextScreen}
          />
        )}

        {currentScreen === 3 && (
          <IntelligenceScreen
            intelligence={data.intelligence}
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
            onChangeRecommendation={handleChangeRecommendation}
          />
        )}
      </div>
    </div>
  );
};

export default MorningBrief;
