
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
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
    <Card className="bg-white/80 backdrop-blur-md border-white/20 shadow-lg">
      <CardHeader className="text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 flex items-center justify-center mx-auto mb-4 text-purple-600">
          <span className="text-2xl font-bold">{currentStep}</span>
        </div>
        <CardTitle className="text-xl">{stepData.title}</CardTitle>
        <p className="text-gray-600 text-sm">{stepData.subtitle}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
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

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">What you'll get:</span>
          </div>
          <p className="text-sm text-green-700">{stepData.description}</p>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={isLastStep ? onComplete : onNextStep}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            size="lg"
            disabled={!hasConnections}
          >
            {isLastStep ? 'Complete Setup' : 'Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
          {!isLastStep && (
            <Button 
              variant="outline" 
              onClick={onNextStep}
              className="px-6"
            >
              Skip
            </Button>
          )}
        </div>

        {hasConnections && (
          <div className="text-center text-sm text-green-600">
            ✓ {connectedInStep} platform{connectedInStep > 1 ? 's' : ''} selected
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OnboardingStepCard;
