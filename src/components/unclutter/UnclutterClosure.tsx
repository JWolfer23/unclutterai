import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface UnclutterClosureProps {
  loopsResolved: number;
  onExit: () => void;
}

const UnclutterClosure = ({ loopsResolved, onExit }: UnclutterClosureProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      {/* Success icon */}
      <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-8">
        <Check className="h-10 w-10 text-emerald-400" />
      </div>
      
      {/* Message */}
      <h2 className="text-xl font-medium text-white mb-10">
        All open loops are resolved.
      </h2>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          onClick={() => navigate('/')}
          className="h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium"
        >
          Return Home
        </Button>
        
        <Button
          onClick={onExit}
          variant="ghost"
          className="h-12 rounded-xl text-white/50 hover:text-white hover:bg-white/5"
        >
          Start Over
        </Button>
      </div>
    </div>
  );
};

export default UnclutterClosure;
