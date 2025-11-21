
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Info } from "lucide-react";
import PlatformToggle from "./PlatformToggle";
import { stepConfig } from "@/config/platforms";

interface OnboardingStepCardProps {
  currentStep: number;
  connectedPlatforms: string[];
  onTogglePlatform: (platformId: string) => void;
  onNextStep: () => void;
  onComplete: () => void;
}

const OnboardingStepCard = ({ 
  currentStep, 
  connectedPlatforms, 
  onTogglePlatform, 
  onNextStep,
  onComplete 
}: OnboardingStepCardProps) => {
  const stepData = stepConfig.find(s => s.step === currentStep);
  
  if (!stepData) return null;

  const connectedInStep = stepData.platforms.filter(p => 
    connectedPlatforms.includes(p.id)
  ).length;

  const hasConnections = connectedInStep > 0;
  const isLastStep = currentStep === stepConfig.length;

  return (
    <div className="space-y-6">
      {/* Step header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">{stepData.title}</h2>
        <p className="text-base text-gray-600">{stepData.subtitle}</p>
      </div>

      {/* Platform toggles */}
      <div className="space-y-3">
        {stepData.platforms.map(platform => (
          <PlatformToggle
            key={platform.id}
            platform={platform}
            isConnected={connectedPlatforms.includes(platform.id)}
            onToggle={onTogglePlatform}
          />
        ))}
      </div>

      {/* Info box - "What you'll get" */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Info className="w-3 h-3 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-900 mb-1">What you'll get:</p>
            <p className="text-sm text-green-800">{stepData.description}</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={isLastStep ? onComplete : onNextStep}
          className="flex-1 h-12 bg-gradient-to-r from-[#3B82F6] to-[#A855F7] hover:from-[#2563EB] hover:to-[#9333EA] text-white font-semibold rounded-xl shadow-lg transition-all"
          disabled={!hasConnections && currentStep === 1}
        >
          {isLastStep ? 'Complete Setup' : 'Continue'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        
        {!isLastStep && (
          <Button 
            variant="outline" 
            onClick={onNextStep}
            className="px-6 h-12 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Skip
          </Button>
        )}
      </div>

      {/* Connection counter */}
      {hasConnections && (
        <div className="text-center text-sm text-green-600 font-medium">
          ✓ {connectedInStep} platform{connectedInStep > 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
};

export default OnboardingStepCard;
