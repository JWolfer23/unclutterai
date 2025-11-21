import { Button } from "@/components/ui/button";
import { ArrowRight, Info } from "lucide-react";
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
  onComplete,
}: OnboardingStepCardProps) => {
  const stepData = stepConfig.find((s) => s.step === currentStep);
  if (!stepData) return null;

  const connectedInStep = stepData.platforms.filter((p) =>
    connectedPlatforms.includes(p.id)
  ).length;

  const hasConnections = connectedInStep > 0;
  const isLastStep = currentStep === stepConfig.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-slate-50">
          {stepData.title}
        </h2>
        <p className="text-sm text-slate-300">{stepData.subtitle}</p>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        {stepData.platforms.map((platform) => (
          <PlatformToggle
            key={platform.id}
            platform={platform}
            isConnected={connectedPlatforms.includes(platform.id)}
            onToggle={onTogglePlatform}
          />
        ))}
      </div>

      {/* Info box */}
      <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Info className="w-3 h-3 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-100 mb-1">
              What you'll get
            </p>
            <p className="text-sm text-emerald-50/90">
              {stepData.description}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={isLastStep ? onComplete : onNextStep}
          className="btn-primary flex-1 h-12 flex items-center justify-center gap-2 text-sm"
          disabled={!hasConnections && currentStep === 1}
        >
          {isLastStep ? "Complete setup" : "Continue"}
          <ArrowRight className="w-4 h-4" />
        </Button>

        {!isLastStep && (
          <Button
            type="button"
            variant="outline"
            onClick={onNextStep}
            className="btn-secondary h-12 px-6 text-sm"
          >
            Skip
          </Button>
        )}
      </div>

      {/* Connection counter */}
      {hasConnections && (
        <div className="text-center text-sm text-emerald-300 font-medium">
          ✓ {connectedInStep} platform
          {connectedInStep > 1 ? "s" : ""} selected
        </div>
      )}
    </div>
  );
};

export default OnboardingStepCard;
