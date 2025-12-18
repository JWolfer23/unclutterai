import { useNavigate } from "react-router-dom";
import { 
  Sun, Mic, RefreshCw, Target, MessageSquare, Newspaper,
  Zap, TrendingUp, Coins, Sliders, Users, BarChart3, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logoTransparent from "@/assets/logo-transparent.png";

// Mode definitions for the OS launcher grid
const modes = [
  // Row 1 - Primary actions (strongest glow)
  { id: "morning-brief", label: "Morning Brief", icon: Sun, route: "/morning-brief", row: 1 },
  { id: "voice-command", label: "Voice Command", icon: Mic, route: "/voice-command", row: 1 },
  { id: "clear-loops", label: "Clear Open Loops", icon: RefreshCw, route: "/clear-open-loops", row: 1 },
  { id: "deep-focus", label: "Deep Focus", icon: Target, route: "/focus-mode", row: 1 },
  
  // Row 2 - Secondary actions (balanced glow)
  { id: "communications", label: "Communications", icon: MessageSquare, route: "/communication-mode", row: 2 },
  { id: "intelligence", label: "Intelligence Feed", icon: Newspaper, route: "/intelligence-feed", row: 2 },
  { id: "energy", label: "Energy Systems", icon: Zap, route: "/health-mode", row: 2 },
  { id: "wealth", label: "Strategy & Wealth", icon: TrendingUp, route: "/strategy-wealth", row: 2 },
  
  // Row 3 - Tertiary actions (subdued glow)
  { id: "tokens", label: "Token Economy", icon: Coins, route: "/uct-tokens", row: 3 },
  { id: "customize", label: "AI Control", icon: Sliders, route: "/customize-ai", row: 3 },
  { id: "network", label: "Network", icon: Users, route: "/community-ranking", row: 3 },
  { id: "performance", label: "Performance Report", icon: BarChart3, route: "/performance-report", row: 3 },
];

// Glow intensity by row
const rowGlowStyles: Record<number, string> = {
  1: "shadow-[0_0_30px_rgba(147,51,234,0.5)] hover:shadow-[0_0_40px_rgba(147,51,234,0.7)]",
  2: "shadow-[0_0_20px_rgba(147,51,234,0.35)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]",
  3: "shadow-[0_0_12px_rgba(147,51,234,0.2)] hover:shadow-[0_0_20px_rgba(147,51,234,0.35)]",
};

interface OSViewProps {
  onClose: () => void;
}

const OSView = ({ onClose }: OSViewProps) => {
  const navigate = useNavigate();

  const handleModeSelect = (route: string) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header with back button */}
      <header className="sticky top-0 z-50 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-300 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <span className="text-xs text-muted-foreground px-2 py-1 bg-muted/20 rounded">
            OS View
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Logo */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-purple-500/20 blur-2xl" />
            <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-600/40 via-purple-800/60 to-slate-900/80 border border-purple-400/30 flex items-center justify-center shadow-[0_0_60px_rgba(147,51,234,0.35)]">
              <img
                src={logoTransparent}
                alt="UnclutterAI"
                className="w-20 h-20 object-contain"
              />
            </div>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-8">
          Your Operating System
        </p>

        {/* Mode Grid - 4 columns, 3 rows */}
        <div className="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const glowStyle = rowGlowStyles[mode.row];
            
            return (
              <button
                key={mode.id}
                onClick={() => handleModeSelect(mode.route)}
                className={`
                  group relative flex flex-col items-center justify-center
                  p-4 sm:p-6 rounded-xl
                  bg-slate-900/60 border border-purple-500/20
                  backdrop-blur-sm
                  transition-all duration-300
                  hover:border-purple-400/40 hover:bg-slate-800/60
                  ${glowStyle}
                `}
              >
                <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mb-2 group-hover:text-purple-300 transition-colors" />
                <span className="text-xs sm:text-sm text-slate-300 text-center group-hover:text-white transition-colors">
                  {mode.label}
                </span>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default OSView;
