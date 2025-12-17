import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UnclutterStartProps {
  onStart: () => void;
  isLoading: boolean;
}

const UnclutterStart = ({ onStart, isLoading }: UnclutterStartProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-8">
        <RefreshCw className="h-10 w-10 text-emerald-400/60" />
      </div>
      
      {/* Title */}
      <h2 className="text-xl font-medium text-white mb-3">
        Let's close your open loops.
      </h2>
      
      {/* Subtitle */}
      <p className="text-white/50 text-sm max-w-sm mb-10">
        We'll scan your unread messages and help you resolve each one — no scrolling, just deciding.
      </p>

      {/* CTA */}
      <Button
        onClick={onStart}
        disabled={isLoading}
        className="h-14 px-10 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-lg"
      >
        Begin Scan
      </Button>
    </div>
  );
};

export default UnclutterStart;
