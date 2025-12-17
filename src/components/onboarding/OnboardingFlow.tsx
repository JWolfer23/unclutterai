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

  const handleTogglePlatform = (platformId: string) => {
    setConnectedPlatforms((prev) => {
      const isConnected = prev.includes(platformId);
      const newPlatforms = isConnected
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId];

      if (!isConnected) {
        onConnect(platformId);
        toast({
          title: "Connected.",
          description: platformId,
        });
      }

      return newPlatforms;
    });
  };

  const handleNextStep = () => {
    if (currentStep < stepConfig.length) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleCompleteSetup = () => {
    setIsComplete(true);
    toast({
      title: "Ready.",
      description: "",
    });
  };

  const handleFinish = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl space-y-6">
        {!isComplete ? (
          <>
            {/* Hero copy only on first step */}
            {currentStep === 1 && (
              <div className="text-center space-y-3 mb-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-50 leading-tight px-2">
                  Give me 5 minutes, and you can delete the rest of your
                  messaging apps.
                </h1>
                <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto px-2">
                  We'll connect everything that distracts you — so we can
                  declutter your life. One feed, one assistant, zero chaos.
                </p>
                <p className="text-base sm:text-lg font-semibold text-slate-200 pt-1">
                  Let&apos;s begin.
                </p>
              </div>
            )}

            {/* Main onboarding glass card */}
            <div className="glass-card glass-card--primary">
              <OnboardingProgress
                currentStep={currentStep}
                totalSteps={stepConfig.length}
              />

              <OnboardingStepCard
                currentStep={currentStep}
                connectedPlatforms={connectedPlatforms}
                onTogglePlatform={handleTogglePlatform}
                onNextStep={handleNextStep}
                onComplete={handleCompleteSetup}
              />
            </div>

            {/* Connected platforms summary (secondary glass card) */}
            {connectedPlatforms.length > 0 && (
              <div className="glass-card">
                <ConnectedPlatforms connectedPlatforms={connectedPlatforms} />
              </div>
            )}
          </>
        ) : (
          <div className="glass-card glass-card--primary">
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
