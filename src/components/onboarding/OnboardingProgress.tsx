interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

const OnboardingProgress = ({ currentStep, totalSteps }: OnboardingProgressProps) => {
  const clampedStep = Math.max(1, Math.min(currentStep, totalSteps));
  const progress = (clampedStep / totalSteps) * 100;

  return (
    <div className="space-y-2">
      {/* Bar */}
      <div
        className="w-full"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuenow={clampedStep}
      >
        <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Label */}
      <p className="text-xs font-medium text-gray-500 text-center">
        Step {clampedStep} of {totalSteps}
      </p>
    </div>
  );
};

export default OnboardingProgress;
