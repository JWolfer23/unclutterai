
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
    setIsComplete(true);
    onComplete(); // Call onComplete immediately to mark onboarding as finished
    toast({
      title: "🚀 Setup Complete!",
      description: "Your digital life is now unified in one place.",
    });
  };

  const handleFinish = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {!isComplete ? (
          <>
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                👋 Welcome to UnclutterAI
              </h1>
              <p className="text-gray-600 text-lg">
                Give me 5 minutes, and you can delete the rest of your messaging apps.
              </p>
              <p className="text-gray-500">
                We're going to connect everything that distracts you — so we can declutter your life. One feed, one assistant, zero chaos.
              </p>
            </div>

            <OnboardingProgress progress={progress} />

            <OnboardingStepCard
              currentStep={currentStep}
              connectedPlatforms={connectedPlatforms}
              onTogglePlatform={handleTogglePlatform}
              onNextStep={handleNextStep}
              onComplete={handleCompleteSetup}
            />

            <ConnectedPlatforms connectedPlatforms={connectedPlatforms} />
          </>
        ) : (
          <OnboardingComplete 
            connectedPlatforms={connectedPlatforms}
            onFinish={handleFinish}
          />
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow;
