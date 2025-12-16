import { Mail, CheckSquare, FileText, Loader2 } from "lucide-react";
import { UnclutterPhase } from "@/hooks/useOpenLoops";

interface ScanningScreenProps {
  phase: UnclutterPhase;
}

const ScanningScreen = ({ phase }: ScanningScreenProps) => {
  const getPhaseText = () => {
    switch (phase) {
      case 'scanning':
        return 'Scanning your world...';
      case 'compressing':
        return 'Compressing into summaries...';
      case 'grouping':
        return 'Grouping by priority...';
      default:
        return 'Preparing...';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 flex items-center justify-center px-6">
      <div className="text-center space-y-12">
        {/* Animated Scanner */}
        <div className="relative w-32 h-32 mx-auto">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-pulse" />
          
          {/* Middle ring */}
          <div className="absolute inset-4 rounded-full border-2 border-emerald-400/40 animate-spin" style={{ animationDuration: '3s' }} />
          
          {/* Inner circle with loader */}
          <div className="absolute inset-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
          </div>
        </div>

        {/* Phase text */}
        <div className="space-y-2">
          <h2 className="text-xl font-medium text-white">{getPhaseText()}</h2>
          <p className="text-white/50 text-sm">Finding everything that needs closure</p>
        </div>

        {/* Source icons */}
        <div className="flex items-center justify-center gap-6">
          <div className={`p-3 rounded-xl transition-all duration-500 ${
            phase === 'scanning' ? 'bg-blue-500/20 scale-110' : 'bg-white/5'
          }`}>
            <Mail className={`h-5 w-5 ${phase === 'scanning' ? 'text-blue-400 animate-pulse' : 'text-white/40'}`} />
          </div>
          <div className={`p-3 rounded-xl transition-all duration-500 ${
            phase === 'compressing' ? 'bg-purple-500/20 scale-110' : 'bg-white/5'
          }`}>
            <CheckSquare className={`h-5 w-5 ${phase === 'compressing' ? 'text-purple-400 animate-pulse' : 'text-white/40'}`} />
          </div>
          <div className={`p-3 rounded-xl transition-all duration-500 ${
            phase === 'grouping' ? 'bg-emerald-500/20 scale-110' : 'bg-white/5'
          }`}>
            <FileText className={`h-5 w-5 ${phase === 'grouping' ? 'text-emerald-400 animate-pulse' : 'text-white/40'}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanningScreen;
