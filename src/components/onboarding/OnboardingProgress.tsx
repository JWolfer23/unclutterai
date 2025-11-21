interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

const OnboardingProgress = ({
  currentStep,
  totalSteps,
}: OnboardingProgressProps) => {
  const clamped = Math.max(1, Math.min(currentStep, totalSteps));
  const percentage = (clamped / totalSteps) * 100;

  return (
    <div className="w-full mb-6">
      <div
        className="w-full"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuenow={clamped}
      >
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden relative backdrop-blur">
          {/* Soft glow */}
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-[#A855F7]/25 to-[#3B82F6]/25 blur-md"
            style={{ opacity: percentage > 0 ? 1 : 0 }}
          />
          {/* Fill */}
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#A855F7] to-[#3B82F6] transition-all duration-400 ease-out relative"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <p className="mt-2 text-center text-xs font-semibold text-slate-200 tracking-wide">
        Step {clamped} of {totalSteps}
      </p>
    </div>
  );
};

export default OnboardingProgress;
