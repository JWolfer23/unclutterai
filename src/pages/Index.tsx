import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { OnboardingInterview } from "@/components/onboarding/interview";
import ContextualSetupPrompt from "@/components/onboarding/ContextualSetupPrompt";
import CommandPalette from "@/components/onboarding/CommandPalette";
import HeaderSection from "@/components/HeaderSection";
import AuthPage from "@/components/auth/AuthPage";
import PriorityDashboardCards from "@/components/PriorityDashboardCards";
import { UserStatsOverview } from "@/components/UserStatsOverview";
import { AIUsageResetTimer } from "@/components/AIUsageResetTimer";
import AIUsageTracker from "@/components/AIUsageTracker";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useAssistantPromotion } from "@/hooks/useAssistantPromotion";
import { AssistantPromotionFlow } from "@/components/promotion";
import { toast } from "@/hooks/use-toast";
import logoNew from "@/assets/logo-transparent.png";

const MORNING_BRIEF_SHOWN_KEY = "last_morning_brief_date";
import { 
  FocusStatsRow, 
  FocusRewardsSection, 
  ModeBreakdownChart, 
  RecentSessionsList,
  FocusLevelCard,
  ProfilePanel
} from "@/components/focus";

import {
  Sunrise,
  Mic,
  CheckCircle2,
  Shield,
  MessageCircle,
  Brain,
  Zap,
  TrendingUp,
  Coins,
  SlidersHorizontal,
  Users,
  BarChart3,
  Menu,
  LogOut,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

// New Billionaire Assistant Mode IDs
type ModeId =
  | "morningBrief"
  | "voiceCommand"
  | "clearOpenLoops"
  | "deepFocus"
  | "communications"
  | "intelligenceFeed"
  | "energySystems"
  | "strategyWealth"
  | "tokenEconomy"
  | "aiControl"
  | "network"
  | "performanceReport";

interface Mode {
  id: ModeId;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  row: 1 | 2 | 3;
  gradient: string;
}

// Row-based glow intensity styles
const getRowStyles = (row: 1 | 2 | 3) => {
  switch (row) {
    case 1: // STRONGEST - Executive priority
      return {
        borderOpacity: "border-white/40",
        shadow: "shadow-[0_0_35px_rgba(255,255,255,0.15)]",
        hoverShadow: "group-hover:shadow-[0_0_50px_rgba(255,255,255,0.25)]",
        glowOpacity: "opacity-50",
        hoverGlowOpacity: "group-hover:opacity-80",
      };
    case 2: // BALANCED - Life systems
      return {
        borderOpacity: "border-white/25",
        shadow: "shadow-[0_0_25px_rgba(255,255,255,0.08)]",
        hoverShadow: "group-hover:shadow-[0_0_35px_rgba(255,255,255,0.15)]",
        glowOpacity: "opacity-35",
        hoverGlowOpacity: "group-hover:opacity-60",
      };
    case 3: // SUBDUED - System status
      return {
        borderOpacity: "border-white/15",
        shadow: "shadow-[0_0_15px_rgba(255,255,255,0.04)]",
        hoverShadow: "group-hover:shadow-[0_0_22px_rgba(255,255,255,0.08)]",
        glowOpacity: "opacity-20",
        hoverGlowOpacity: "group-hover:opacity-40",
      };
  }
};

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [showContextualPrompt, setShowContextualPrompt] = useState<{
    platform: string;
    feature: string;
  } | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showRecoveryDashboard, setShowRecoveryDashboard] = useState(false);
  const [showPromotion, setShowPromotion] = useState(false);

  const [selectedMode, setSelectedMode] = useState<ModeId | null>(null);

  const {
    state: onboardingState,
    completeOnboarding,
    connectPlatform,
    skipOnboarding,
    requiresPlatform,
    isOnboardingComplete,
  } = useOnboarding();

  // Assistant promotion eligibility
  const {
    isEligible: isPromotionEligible,
    isLoading: promotionLoading,
    acceptPromotion,
    declinePromotion,
  } = useAssistantPromotion();

  // Trigger promotion flow when eligible
  useEffect(() => {
    if (!promotionLoading && isPromotionEligible && !onboardingState.showOnboarding) {
      setShowPromotion(true);
    }
  }, [isPromotionEligible, promotionLoading, onboardingState.showOnboarding]);

  // Billionaire Assistant Mode Configuration
  const modes: Mode[] = [
    // ROW 1 — PRIMARY EXECUTIVE MODES
    {
      id: "morningBrief",
      label: "Morning Brief",
      subtitle: "Your day, organized before it begins",
      icon: Sunrise,
      row: 1,
      gradient: "from-amber-300/70 via-orange-200/50 to-yellow-100/30",
    },
    {
      id: "voiceCommand",
      label: "Voice Command",
      subtitle: "Hands-free execution",
      icon: Mic,
      row: 1,
      gradient: "from-slate-200/70 via-zinc-200/50 to-white/30",
    },
    {
      id: "clearOpenLoops",
      label: "Clear Open Loops",
      subtitle: "Close what's unfinished",
      icon: CheckCircle2,
      row: 1,
      gradient: "from-emerald-300/70 via-teal-200/50 to-cyan-100/30",
    },
    {
      id: "deepFocus",
      label: "Deep Focus",
      subtitle: "Protected execution",
      icon: Shield,
      row: 1,
      gradient: "from-purple-400/70 via-indigo-300/50 to-blue-200/30",
    },
    // ROW 2 — LIFE OPERATING SYSTEM
    {
      id: "communications",
      label: "Communications",
      subtitle: "Prioritized, filtered, summarized",
      icon: MessageCircle,
      row: 2,
      gradient: "from-blue-400/50 via-indigo-300/35 to-violet-200/20",
    },
    {
      id: "intelligenceFeed",
      label: "Intelligence Feed",
      subtitle: "Only what matters",
      icon: Brain,
      row: 2,
      gradient: "from-cyan-400/50 via-sky-300/35 to-blue-200/20",
    },
    {
      id: "energySystems",
      label: "Energy Systems",
      subtitle: "Body, recovery, performance",
      icon: Zap,
      row: 2,
      gradient: "from-lime-400/50 via-emerald-300/35 to-teal-200/20",
    },
    {
      id: "strategyWealth",
      label: "Strategy & Wealth",
      subtitle: "Build, decide, grow",
      icon: TrendingUp,
      row: 2,
      gradient: "from-amber-400/50 via-yellow-300/35 to-orange-200/20",
    },
    // ROW 3 — SYSTEM & STATUS
    {
      id: "tokenEconomy",
      label: "Token Economy",
      subtitle: "Rewards, status, access",
      icon: Coins,
      row: 3,
      gradient: "from-slate-400/35 via-zinc-300/25 to-gray-200/15",
    },
    {
      id: "aiControl",
      label: "AI Control",
      subtitle: "Intelligence, tuned",
      icon: SlidersHorizontal,
      row: 3,
      gradient: "from-indigo-400/35 via-purple-300/25 to-violet-200/15",
    },
    {
      id: "network",
      label: "Network",
      subtitle: "Rank, challenges, access",
      icon: Users,
      row: 3,
      gradient: "from-rose-400/35 via-pink-300/25 to-fuchsia-200/15",
    },
    {
      id: "performanceReport",
      label: "Performance Report",
      subtitle: "Time saved. Impact gained.",
      icon: BarChart3,
      row: 3,
      gradient: "from-teal-400/35 via-cyan-300/25 to-sky-200/15",
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
      title: "Connected.",
      description: platform,
    });
  };

  const handleCommand = (command: string) => {
    toast({
      title: "Executing.",
      description: command,
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
    // Route mapping for each mode
    const routes: Record<ModeId, string> = {
      morningBrief: "/morning-brief",
      voiceCommand: "/voice",
      clearOpenLoops: "/open-loops",
      deepFocus: "/focus",
      communications: "/communication",
      intelligenceFeed: "/intelligence",
      energySystems: "/health",
      strategyWealth: "/strategy",
      tokenEconomy: "/uct-tokens",
      aiControl: "/customize",
      network: "/community",
      performanceReport: "/performance",
    };

    // Performance Report opens the dashboard inline
    if (modeId === "performanceReport") {
      setSelectedMode("performanceReport");
      return;
    }

    // Navigate to the appropriate route
    const route = routes[modeId];
    if (route) {
      navigate(route);
    }
  };

  // Auto-launch Morning Brief on first open of the day (5 AM - 12 PM)
  useEffect(() => {
    if (!user || onboardingState.showOnboarding) return;
    
    const currentHour = new Date().getHours();
    const lastShown = localStorage.getItem(MORNING_BRIEF_SHOWN_KEY);
    const today = new Date().toDateString();
    
    if (currentHour >= 5 && currentHour < 12 && lastShown !== today) {
      navigate("/morning-brief");
    }
  }, [user, onboardingState.showOnboarding, navigate]);

  // Always show onboarding interview when user first logs in
  if (onboardingState.showOnboarding) {
    return <OnboardingInterview onComplete={completeOnboarding} />;
  }

  // Handle sign out
  const handleSignOut = async () => {
    sessionStorage.removeItem('onboarding-shown-this-session');
    await signOut();
    navigate('/auth');
  };

  // ---------- VIEW 1: Billionaire Assistant Home Screen ----------
  const renderModesHome = () => (
    <div className="min-h-screen w-full flex flex-col items-center px-6 py-10 text-white bg-gradient-to-b from-black via-slate-950 to-slate-900">
      {/* Hamburger menu - top right */}
      <div className="absolute top-6 right-6">
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="
                flex items-center justify-center w-10 h-10
                rounded-xl bg-black/40 backdrop-blur-xl
                border border-white/10
                shadow-[0_0_20px_rgba(15,23,42,0.8)]
                hover:border-white/20 hover:shadow-[0_0_30px_rgba(148,163,184,0.6)]
                transition-all duration-200
              "
            >
              <Menu className="h-5 w-5 text-white/60" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="
              w-64 bg-black/95 backdrop-blur-2xl
              border-l border-white/10
              text-white
            "
          >
            <div className="flex flex-col gap-4 pt-8">
              <button
                onClick={handleSignOut}
                className="
                  flex items-center gap-3 px-4 py-3
                  rounded-xl bg-white/5 hover:bg-white/10
                  border border-white/10
                  transition-colors duration-200
                "
              >
                <LogOut className="h-5 w-5 text-white/60" />
                <span className="text-sm font-medium text-white/90">Sign Out</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Logo + title */}
      <div className="flex flex-col items-center mb-10">
        {/* App icon with refined premium glow */}
        <div className="relative">
          {/* Ambient glow behind */}
          <div className="absolute -inset-3 rounded-[28px] bg-purple-500/15 blur-2xl" />
          
          {/* Main container with gradient fill */}
          <div className="relative w-32 h-32 flex items-center justify-center rounded-3xl bg-gradient-to-br from-purple-600/30 via-purple-800/50 to-slate-900/70 border border-purple-400/20 shadow-[0_0_30px_rgba(147,51,234,0.25)]">
            <img
              src={logoNew}
              className="w-28 h-28 object-contain"
              alt="UnclutterAI logo"
            />
          </div>
        </div>

        <h1 className="text-3xl font-semibold mt-6 tracking-tight text-white/95">unclutterAI</h1>
        <p className="text-[10px] text-white/40 tracking-[0.3em] mt-2 uppercase">
          Your Operating System
        </p>
      </div>

      {/* Grid of 12 modes — Executive Aesthetic with Row Hierarchy */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-md">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const rowStyles = getRowStyles(mode.row);
          
          return (
            <button
              key={mode.id}
              onClick={() => handleSelectMode(mode.id)}
              className={`
                group relative rounded-[24px] p-[1.5px]
                ${rowStyles.shadow}
                ${rowStyles.hoverShadow}
                transition-all duration-300
                active:scale-[0.97]
              `}
            >
              {/* Outer gradient border */}
              <div className={`absolute inset-0 rounded-[24px] bg-gradient-to-br ${mode.gradient}`} />

              {/* Inner dark tile */}
              <div
                className={`
                  relative flex h-32 flex-col items-center justify-center
                  rounded-[22px]
                  bg-black/85
                  backdrop-blur-2xl
                  ${rowStyles.borderOpacity}
                  border
                  overflow-hidden
                `}
              >
                {/* Subtle top glow halo */}
                <div
                  className={`
                    pointer-events-none absolute inset-0 
                    ${rowStyles.glowOpacity}
                    ${rowStyles.hoverGlowOpacity}
                    transition-opacity duration-300
                  `}
                  style={{
                    background:
                      "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.12), transparent 50%)",
                  }}
                />

                {/* Icon */}
                <div
                  className={`
                    relative mb-2 flex h-9 w-9 items-center justify-center
                    rounded-xl border ${rowStyles.borderOpacity} bg-black/30
                    transition-all duration-300
                  `}
                >
                  <Icon className="h-4 w-4 text-white/90" />
                </div>

                {/* Title */}
                <span className="relative text-[11px] font-medium text-white/90 text-center leading-tight px-2">
                  {mode.label}
                </span>
                
                {/* Subtitle */}
                <span className="relative text-[9px] text-white/40 text-center leading-tight mt-1 px-2">
                  {mode.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ---------- VIEW 2: Performance Report Dashboard ----------
  const renderPerformanceDashboard = () => (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 text-white pb-12">
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

      {/* Profile Panel - Unified UCT, Level, Streak, Tier */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <ProfilePanel />
      </div>

      {/* Top Stats Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <FocusStatsRow />
      </div>

      {/* Priority dashboard cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <PriorityDashboardCards
          onShowRecoveryDashboard={() => setShowRecoveryDashboard(true)}
        />
      </div>

      {/* Focus Rewards Section - New */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <FocusRewardsSection />
      </div>

      {/* Mode Breakdown & Recent Sessions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ModeBreakdownChart />
          <RecentSessionsList />
        </div>
      </div>

      {/* Your AI Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Your AI Stats</h2>
        <UserStatsOverview />
      </div>

      {/* AI Usage Today */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <AIUsageResetTimer />
        <div className="mt-4">
          <AIUsageTracker />
        </div>
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
      {selectedMode === "performanceReport" ? renderPerformanceDashboard() : renderModesHome()}
      
      {/* Assistant Promotion Flow */}
      {showPromotion && (
        <AssistantPromotionFlow
          onAccept={acceptPromotion}
          onDecline={declinePromotion}
          onComplete={() => setShowPromotion(false)}
        />
      )}
    </div>
  );
};

export default Index;
