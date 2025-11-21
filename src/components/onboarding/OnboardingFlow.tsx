
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import OnboardingProgress from "./OnboardingProgress";
import OnboardingStepCard from "./OnboardingStepCard";
import OnboardingComplete from "./OnboardingComplete";
import ConnectedPlatforms from "./ConnectedPlatforms";
import { stepConfig } from "@/config/platforms";

interface OnboardingFlowProps {
  onComplete: () => void;
  onConnect: (platform: string) => void;
}

const OnboardingFlow = ({ onComplete, onConnect }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const progress = (currentStep / stepConfig.length) * 100;

  const handleTogglePlatform = (platformId: string) => {
    setConnectedPlatforms(prev => {
      const isConnected = prev.includes(platformId);
      const newPlatforms = isConnected 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId];
      
      // Call onConnect for newly connected platforms
      if (!isConnected) {
        onConnect(platformId);
        toast({
          title: "🎉 Connected!",
          description: `Successfully connected ${platformId}`,
        });
      }
      
      return newPlatforms;
    });
  };

  const handleNextStep = () => {
    if (currentStep < stepConfig.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleCompleteSetup = () => {
    // After last step, show completion
    setIsComplete(true);
    toast({
      title: "🚀 Setup Complete!",
      description: "Your digital life is now unified in one place.",
    });
  };

  const handleFinish = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-purple-100/40 to-purple-50/20 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl space-y-6">
        {!isComplete ? (
          <>
            {/* Top intro copy - shown on first step */}
            {currentStep === 1 && (
              <div className="text-center space-y-3 mb-8">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight px-4">
                  Give me 5 minutes, and you can delete the rest of your messaging apps.
                </h1>
                <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto px-4">
                  We're going to connect everything that distracts you — so we can declutter your life. One feed, one assistant, zero chaos.
                </p>
                <p className="text-base sm:text-lg font-semibold text-gray-800 pt-2">
                  Let's begin.
                </p>
              </div>
            )}

            {/* Onboarding Card */}
            <div className="bg-white rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04)] p-6 sm:p-8 space-y-6">
              {/* Progress bar at top of card */}
              <OnboardingProgress currentStep={currentStep} totalSteps={stepConfig.length} />

              {/* Step content */}
              <OnboardingStepCard
                currentStep={currentStep}
                connectedPlatforms={connectedPlatforms}
                onTogglePlatform={handleTogglePlatform}
                onNextStep={handleNextStep}
                onComplete={handleCompleteSetup}
              />
            </div>

            {/* Connected platforms display */}
            <ConnectedPlatforms connectedPlatforms={connectedPlatforms} />
          </>
        ) : (
          <div className="bg-white rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04)] p-6 sm:p-8">
            <OnboardingComplete 
              connectedPlatforms={connectedPlatforms}
              onFinish={handleFinish}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow;
