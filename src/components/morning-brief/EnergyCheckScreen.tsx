import { Battery, BatteryLow, BatteryFull, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnergyState } from "@/hooks/useMorningBrief";

interface EnergyCheckScreenProps {
  energy: EnergyState;
  onEnterFocus: () => void;
  onContinue: () => void;
}

const getEnergyIcon = (level: string) => {
  switch (level) {
    case "high":
      return BatteryFull;
    case "low":
      return BatteryLow;
    default:
      return Battery;
  }
};

const getEnergyColor = (level: string) => {
  switch (level) {
    case "high":
      return {
        text: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        glow: "shadow-[0_0_20px_rgba(16,185,129,0.2)]",
      };
    case "low":
      return {
        text: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        glow: "shadow-[0_0_20px_rgba(245,158,11,0.2)]",
      };
    default:
      return {
        text: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        glow: "shadow-[0_0_20px_rgba(59,130,246,0.2)]",
      };
  }
};

export const EnergyCheckScreen = ({
  energy,
  onEnterFocus,
  onContinue,
}: EnergyCheckScreenProps) => {
  const EnergyIcon = getEnergyIcon(energy.level);
  const colors = getEnergyColor(energy.level);

  return (
    <div className="flex flex-col min-h-[70vh] animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-semibold text-white/95 mb-2">Your Operating State</h2>
        <p className="text-white/50">Calibrate for optimal performance</p>
      </div>

      {/* Energy Display */}
      <div className="flex-1 max-w-lg mx-auto w-full space-y-6">
        {/* Main energy indicator */}
        <div className={`rounded-2xl ${colors.bg} border ${colors.border} ${colors.glow} p-8 text-center`}>
          <div className="relative inline-block mb-6">
            <div className={`absolute inset-0 ${colors.bg} rounded-full blur-xl scale-150`} />
            <div className={`relative w-20 h-20 rounded-full ${colors.bg} border ${colors.border} flex items-center justify-center`}>
              <EnergyIcon className={`w-10 h-10 ${colors.text}`} />
            </div>
          </div>

          <h3 className={`text-2xl font-semibold capitalize ${colors.text} mb-2`}>
            {energy.level} Energy
          </h3>
          <p className="text-white/50 text-sm">
            {energy.level === "high" && "You're operating at peak capacity"}
            {energy.level === "medium" && "Good energy for focused work"}
            {energy.level === "low" && "Consider lighter tasks or recovery"}
          </p>
        </div>

        {/* Focus window recommendation */}
        <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Recommended Focus Window</p>
              <p className="text-white/90 text-xl font-semibold">
                {energy.focusWindowMinutes} minutes
              </p>
            </div>
          </div>
        </div>

        {/* Recovery flag */}
        {energy.recoveryNeeded && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-5">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-amber-400 font-medium mb-1">Recovery Recommended</h4>
                <p className="text-amber-200/70 text-sm">
                  Your focus streak has broken. Consider a lighter day or recovery activities before deep work.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Focus prompt */}
        <div className="text-center py-4">
          <p className="text-white/60 text-sm mb-6">
            Would you like to protect focus this morning?
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={onEnterFocus}
              className="
                px-6 py-5
                bg-gradient-to-r from-purple-500/80 to-indigo-500/80
                hover:from-purple-400/90 hover:to-indigo-400/90
                text-white border-0
                rounded-full
                shadow-[0_0_20px_rgba(147,51,234,0.3)]
                hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]
                transition-all duration-300
              "
            >
              Enter Deep Focus
            </Button>
            <Button
              onClick={onContinue}
              variant="outline"
              className="
                px-6 py-5
                bg-transparent
                border-white/20 hover:border-white/40
                text-white/80 hover:text-white
                rounded-full
                transition-all duration-300
              "
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
