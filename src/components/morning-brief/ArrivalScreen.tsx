import { Sunrise } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ArrivalScreenProps {
  greeting: string;
  onBegin: () => void;
}

export const ArrivalScreen = ({ greeting, onBegin }: ArrivalScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
      {/* Ambient gradient background effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-amber-500/10 via-orange-400/5 to-transparent blur-3xl" />
      </div>

      {/* Icon */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-2xl scale-150" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-300/30 via-orange-200/20 to-yellow-100/10 border border-amber-400/20 flex items-center justify-center">
          <Sunrise className="w-12 h-12 text-amber-300/80" />
        </div>
      </div>

      {/* Greeting */}
      <h1 className="text-4xl md:text-5xl font-semibold text-white/95 mb-4 text-center">
        {greeting}
      </h1>

      {/* Subtext */}
      <p className="text-lg text-white/50 mb-12 text-center max-w-md">
        Here's what deserves your attention today.
      </p>

      {/* CTA Button */}
      <Button
        onClick={onBegin}
        className="
          px-8 py-6 text-lg font-medium
          bg-gradient-to-r from-amber-500/80 via-orange-400/80 to-amber-500/80
          hover:from-amber-400/90 hover:via-orange-300/90 hover:to-amber-400/90
          text-white border-0
          rounded-full
          shadow-[0_0_30px_rgba(251,191,36,0.3)]
          hover:shadow-[0_0_40px_rgba(251,191,36,0.5)]
          transition-all duration-300
        "
      >
        <span className="mr-2">▶</span>
        Begin Brief
      </Button>
    </div>
  );
};
