import { Progress } from "@/components/ui/progress";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

const OnboardingProgress = ({ currentStep, totalSteps }: OnboardingProgressProps) => {
  const progress = (currentStep / totalSteps) * 100;
  
  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <p className="text-center text-sm font-medium text-gray-600">
        Step {currentStep} of {totalSteps}
      </p>
    </div>
  );
};

export default OnboardingProgress;
