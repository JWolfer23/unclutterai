
import { Progress } from "@/components/ui/progress";

interface OnboardingProgressProps {
  progress: number;
}

const OnboardingProgress = ({ progress }: OnboardingProgressProps) => {
  return (
    <div className="text-center space-y-4">
      <p className="text-gray-600 font-medium">Let's begin.</p>
      
      <div className="space-y-2">
        <Progress value={progress} className="h-3" />
        <p className="text-sm text-gray-500">Step {Math.ceil(progress / 25)} of 4</p>
      </div>
    </div>
  );
};

export default OnboardingProgress;
