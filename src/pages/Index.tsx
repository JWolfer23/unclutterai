import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import ContextualSetupPrompt from "@/components/onboarding/ContextualSetupPrompt";
import CommandPalette from "@/components/onboarding/CommandPalette";
import HeaderSection from "@/components/HeaderSection";
import AuthPage from "@/components/auth/AuthPage";
import PriorityDashboardCards from "@/components/PriorityDashboardCards";
import { useOnboarding } from "@/hooks/useOnboarding";
import { toast } from "@/hooks/use-toast";
import logoNew from "@/assets/logo-new.png";

import {
  ArrowUpRight,
  Newspaper,
  GraduationCap,
  HeartPulse,
  Briefcase,
  DollarSign,
  MessageCircle,
  SlidersHorizontal,
  Users,
  Bitcoin,
  Activity,
  Coins,
} from "lucide-react";

type ModeId =
  | "focus"
  | "news"
  | "learning"
  | "health"
  | "career"
  | "wealth"
  | "communication"
  | "uctTokens"
  | "community"
  | "crypto"
  | "customize"
  | "aiUsage";

const Index = () => {
  const { user, loading: authLoading } = useAuth();

  const [showContextualPrompt, setShowContextualPrompt] = useState<{
    platform: string;
    feature: string;
  } | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showRecoveryDashboard, setShowRecoveryDashboard] = useState(false);

  const [selectedMode, setSelectedMode] = useState<ModeId | null>(null);

  const {
    state: onboardingState,
    completeOnboarding,
    connectPlatform,
    skipOnboarding,
    requiresPlatform,
    isOnboardingComplete,
  } = useOnboarding();

  // 🔹 Mode config used by the 12-button grid
  const modes: {
    id: ModeId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string; // Tailwind gradient classes for the outline
  }[] = [
    {
      id: "focus",
      label: "Focus Mode",
      icon: ArrowUpRight,
      color: "from-pink-500 via-purple-500 to-indigo-500",
    },
    {
      id: "news",
      label: "News Mode",
      icon: Newspaper,
      color: "from-sky-400 to-blue-500",
    },
    {
      id: "learning",
      label: "Learning Mode",
      icon: GraduationCap,
      color: "from-cyan-400 to-teal-400",
    },
    {
      id: "health",
      label: "Health Mode",
      icon: HeartPulse,
      color: "from-green-400 to-teal-400",
    },
    {
      id: "career",
      label: "Career Mode",
      icon: Briefcase,
      color: "from-sky-400 to-indigo-500",
    },
    {
      id: "wealth",
      label: "Wealth Mode",
      icon: DollarSign,
      color: "from-yellow-400 to-amber-500",
    },
    {
      id: "communication",
      label: "Communication Mode",
      icon: MessageCircle,
      color: "from-pink-500 to-purple-500",
    },
    {
      id: "uctTokens", // ✅ 3rd row, middle
      label: "UCT Tokens Earned",
      icon: Coins,
      color: "from-sky-400 to-emerald-400",
    },
    {
      id: "community",
      label: "Community Ranking",
      icon: Users,
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "crypto",
      label: "Crypto Hub",
      icon: Bitcoin,
      color: "from-amber-500 to-orange-500",
    },
    {
      id: "customize",
      label: "Customize AI",
      icon: SlidersHorizontal,
      color: "from-sky-400 to-blue-500",
    },
    {
      id: "aiUsage",
      label: "AI Usage",
      icon: Activity,
      color: "from-pink-500 to-purple-500",
    },
  ];

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!user) {
    return <AuthPage />;
  }

  const handleConnect = (platform: string) => {
    connectPlatform(platform);
    setShowContextualPrompt(null);
    toast({
      title: "🎉 Connected!",
      description: `${platform} is now connected and ready to use.`,
    });
  };

  const handleCommand = (command: string) => {
    toast({
      title: "✨ Command Executed",
      description: `Processing: ${command}`,
    });
  };

  const handleSetupRequired = (platform: string, feature: string) => {
    if (requiresPlatform(platform)) {
      setShowContextualPrompt({ platform, feature });
    } else {
      handleCommand(feature);
    }
  };

  // Mode selection from the home grid
  const handleSelectMode = (modeId: ModeId) => {
    if (modeId === "focus") {
      setSelectedMode("focus");
      return;
    }

    const mode = modes.find((m) => m.id === modeId);
    toast({
      title: mode?.label ?? "Mode",
      description: "This mode is coming soon. For now, try Focus Mode.",
    });
  };

  // Show onboarding for first-time users
  if (onboardingState.showOnboarding && !isOnboardingComplete) {
    return (
      <OnboardingFlow onComplete={completeOnboarding} onConnect={handleConnect} />
    );
  }

  // ---------- VIEW 1: Neon Outline 12-button home screen ----------
  const renderModesHome = () => (
    <div className="min-h-screen w-full flex flex-col items-center px-6 py-10 text-white bg-gradient-to-b from-black via-slate-950 to-slate-900">
      {/* Logo + title */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-cyan-400/20 via-purple-600/30 to-pink-500/20 backdrop-blur-xl flex items-center justify-center border border-white/10 shadow-[0_0_40px_rgba(59,130,246,0.6)]">
          <img
            src={logoNew}
            className="w-14 h-14 opacity-90"
            alt="UnclutterAI logo"
          />
        </div>

        <h1 className="text-4xl font-bold mt-6 tracking-tight">unclutterAI</h1>
        <p className="text-xs text-white/60 tracking-[0.25em] mt-2">
          CHOOSE YOUR MODE
        </p>
      </div>

      {/* Grid of 12 modes — dark tiles with neon outlines */}
      <div className="grid grid-cols-3 gap-5 w-full max-w-md">
        {modes.map((mode, index) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => handleSelectMode(mode.id)}
              className="
                group relative rounded-[28px] p-[2px]
                shadow-[0_0_25px_rgba(15,23,42,0.9)]
                transition-transform duration-200
                active:scale-[0.97]
                opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards]
              "
              style={{
                backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
              }}
            >
              {/* Outer gradient via Tailwind utility */}
              <div className={`absolute inset-0 rounded-[28px] bg-gradient-to-br ${mode.color}`} />

              {/* Inner dark tile */}
              <div
                className="
                  relative flex h-28 flex-col items-center justify-center
                  rounded-[24px]
                  bg-black/80
                  backdrop-blur-2xl
                  border border-white/10
                  overflow-hidden
                "
              >
                {/* Glow halo */}
                <div
                  className="
                    pointer-events-none absolute inset-0 opacity-40
                    group-hover:opacity-80 transition-opacity duration-300
                  "
                  style={{
                    background:
                      "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.18), transparent 55%)",
                  }}
                />

                {/* Icon bubble */}
                <div
                  className="
                    relative mb-3 flex h-10 w-10 items-center justify-center
                    rounded-2xl border border-white/60 bg-black/40
                    shadow-[0_0_22px_rgba(148,163,184,0.55)]
                    group-hover:shadow-[0_0_30px_rgba(148,163,184,0.9)]
                    transition-shadow duration-300
                  "
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>

                {/* Label */}
                <span className="relative mt-1 text-[12px] font-medium text-white/90 text-center leading-tight">
                  {mode.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ---------- VIEW 2: Existing dashboard (Focus Mode) ----------
  const renderFocusDashboard = () => (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 text-white">
      <HeaderSection onShowCommandPalette={() => setShowCommandPalette(true)} />

      {/* Back to modes */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <button
          type="button"
          onClick={() => setSelectedMode(null)}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          ← All modes
        </button>
      </div>

      {/* Priority dashboard cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        <PriorityDashboardCards
          onShowRecoveryDashboard={() => setShowRecoveryDashboard(true)}
        />
      </div>

      {/* Modals */}
      {showContextualPrompt && (
        <ContextualSetupPrompt
          platform={showContextualPrompt.platform}
          feature={showContextualPrompt.feature}
          onConnect={handleConnect}
          onDismiss={() => setShowContextualPrompt(null)}
        />
      )}

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onCommand={handleCommand}
        onSetupRequired={handleSetupRequired}
      />
    </div>
  );

  // ---------- FINAL RENDER ----------
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900">
      {selectedMode === "focus" ? renderFocusDashboard() : renderModesHome()}
    </div>
  );
};

export default Index;
