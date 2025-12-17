import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IntelligenceScreenProps {
  insight: string;
  onContinue: () => void;
}

export const IntelligenceScreen = ({
  insight,
  onContinue,
}: IntelligenceScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-semibold text-white/95 mb-2">Intelligence</h2>
        <p className="text-white/50">One thing worth knowing</p>
      </div>

      {/* Single Insight Card */}
      <div className="max-w-md w-full">
        <div className="rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 p-8 relative overflow-hidden">
          {/* Glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] bg-gradient-to-b from-cyan-500/20 to-transparent blur-3xl" />

          <div className="relative">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Lightbulb className="w-7 h-7 text-cyan-400" />
              </div>
            </div>

            {/* Insight text */}
            <p className="text-white/80 text-lg text-center leading-relaxed">
              {insight || "No new intelligence today. Your focus is clear."}
            </p>
          </div>
        </div>

        {/* Continue button */}
        <div className="flex justify-center mt-8">
          <Button
            onClick={onContinue}
            className="
              px-10 py-6 text-lg font-medium w-full
              bg-gradient-to-r from-cyan-500/80 to-blue-500/80
              hover:from-cyan-400/90 hover:to-blue-400/90
              text-white border-0
              rounded-full
              shadow-[0_0_30px_rgba(6,182,212,0.3)]
              hover:shadow-[0_0_40px_rgba(6,182,212,0.5)]
              transition-all duration-300
            "
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};
