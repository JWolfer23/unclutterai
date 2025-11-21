interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

const OnboardingProgress = ({ currentStep, totalSteps }: OnboardingProgressProps) => {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full mt-1 mb-4">
      {/* Track */}
      <div className="h-2 w-full rounded-full bg-white/15 backdrop-blur-lg overflow-hidden relative">
        {/* Glow behind the bar */}
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-[#A855F7]/20 to-[#3B82F6]/20 blur-md"
          style={{
            opacity: percentage > 0 ? 1 : 0,
          }}
        />

        {/* Fill */}
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#A855F7] to-[#3B82F6] transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Step text */}
      <p className="text-center text-xs font-semibold text-white/70 mt-2 tracking-wide">
        Step {currentStep} of {totalSteps}
      </p>
    </div>
  );
};

export default OnboardingProgress;
