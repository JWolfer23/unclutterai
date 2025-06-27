
import { Progress } from "@/components/ui/progress";

interface OnboardingProgressProps {
  progress: number;
}

const OnboardingProgress = ({ progress }: OnboardingProgressProps) => {
  return (
    <div className="text-center space-y-4">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
        Welcome to Unclutter
      </h1>
      <p className="text-gray-600">We get it. Setups are annoying. Let's start small.</p>
      
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-gray-500">{Math.round(progress)}% complete</p>
      </div>
    </div>
  );
};

export default OnboardingProgress;
