import { Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FirstAction } from "@/hooks/useMorningBrief";

interface FirstActionScreenProps {
  action: FirstAction;
  onBegin: () => void;
}

export const FirstActionScreen = ({
  action,
  onBegin,
}: FirstActionScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-semibold text-white/95 mb-2">Start Here</h2>
        <p className="text-white/50">Your first action</p>
      </div>

      {/* Action Card */}
      <div className="max-w-md w-full">
        <div className="rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 p-8 relative overflow-hidden">
          {/* Glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] bg-gradient-to-b from-emerald-500/20 to-transparent blur-3xl" />

          <div className="relative">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center">
                <Play className="w-8 h-8 text-emerald-400" />
              </div>
            </div>

            {/* Action title */}
            <h3 className="text-xl font-semibold text-white/95 text-center mb-4">
              {action.title}
            </h3>

            {/* Time estimate */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-white/40" />
              <span className="text-white/50 text-sm">
                ~{action.estimatedMinutes} min
              </span>
            </div>

            {/* Reason */}
            <p className="text-white/60 text-sm text-center leading-relaxed">
              {action.reason}
            </p>
          </div>
        </div>

        {/* Begin button */}
        <div className="flex justify-center mt-8">
          <Button
            onClick={onBegin}
            className="
              px-10 py-6 text-lg font-medium w-full
              bg-gradient-to-r from-emerald-500/80 via-teal-500/80 to-emerald-500/80
              hover:from-emerald-400/90 hover:via-teal-400/90 hover:to-emerald-400/90
              text-white border-0
              rounded-full
              shadow-[0_0_30px_rgba(16,185,129,0.3)]
              hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]
              transition-all duration-300
            "
          >
            <Play className="w-5 h-5 mr-2" />
            Begin
          </Button>
        </div>
      </div>
    </div>
  );
};
