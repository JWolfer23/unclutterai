import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import ContextualSetupPrompt from "@/components/onboarding/ContextualSetupPrompt";
import CommandPalette from "@/components/onboarding/CommandPalette";
import HeaderSection from "@/components/HeaderSection";
import SidebarSection from "@/components/SidebarSection";
import MessageTabs from "@/components/MessageTabs";
import AuthPage from "@/components/auth/AuthPage";
import PriorityDashboardCards from "@/components/PriorityDashboardCards";
import AIUsageTracker from "@/components/AIUsageTracker";
import { UserStatsOverview } from "@/components/UserStatsOverview";
import { AIUsageResetTimer } from "@/components/AIUsageResetTimer";
import { useOnboarding } from "@/hooks/useOnboarding";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

import logoNew from "@/assets/logo-new.png";
import {
  ArrowUpRight,
  Newspaper,
  GraduationCap,
  HeartPulse,
  Briefcase,
  DollarSign,
  MessageCircle,
  Sliders,
  Users2,
  Bitcoin,
  Sparkles,
} from "lucide-react";

// Types for the 12 modes
type ModeId =
  | "focus"
  | "news"
  | "learning"
  | "health"
  | "career"
  | "wealth"
  | "communication"
  | "customize1"
  | "community"
  | "crypto"
  | "customize2"
  | "aiusage";

// Config for the 12 neon buttons
const modes: {
  id: ModeId;
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "focus", label: "Focus Mode", icon: ArrowUpRight, color: "from-purple-500 to-pink-500" },
  { id: "news", label: "News Mode", icon: Newspaper, color: "from-cyan-400 to-blue-500" },
  { id: "learning", label: "Learning Mode", icon: GraduationCap, color: "from-cyan-400 to-teal-400" },
  { id: "health", label: "Health Mode", icon: HeartPulse, color: "from-teal-400 to-green-400" },
  { id: "career", label: "Career Mode", icon: Briefcase, color: "from-blue-400 to-green-400" },
  { id: "wealth", label: "Wealth Mode", icon: DollarSign, color: "from-yellow-400 to-amber-500" },
  { id: "communication", label: "Communication Mode", icon: MessageCircle, color: "from-purple-400 to-fuchsia-500" },
  { id: "customize1", label: "Customize AI", icon: Sliders, color: "from-cyan-400 to-blue-400" },
  { id: "community", label: "Community Ranking", icon: Users2, color: "from-purple-400 to-pink-500" },
  { id: "crypto", label: "Crypto Hub", icon: Bitcoin, color: "from-yellow-400 to-orange-500" },
  { id: "customize2", label: "Customize AI", icon: Sliders, color: "from-cyan-400 to-blue-500" },
  { id: "aiusage", label: "AI Usage", icon: Sparkles, color: "from-purple-400 to-fuchsia-500" },
];

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { messages, isLoading: messagesLoading } = useMessages();

  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageTypeFilter, setMessageTypeFilter] = useState<string | null>(null);
  const [showContextualPrompt, setShowContextualPrompt] = useState<{
    platform: string;
    feature: string;
  } | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showRecoveryDashboard, setShowRecoveryDashboard] = useState(false);

  // NEW: which mode is selected (null = show neon grid)
  const [selectedMode, setSelectedMode] = useState<ModeId | null>(null);

  const {
    state: onboardingState,
    completeOnboarding,
    connectPlatform,
    skipOnboarding,
    requiresPlatform,
    isOnboardingComplete,
  } = useOnboarding();

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

  const handleMessageAction = (
    messageId: number,
    action: "block" | "unsubscribe" | "safe" | "quarantine"
  ) => {
    const actionMessages = {
      block: "🛡️ Sender blocked and future messages will be filtered",
      unsubscribe: "📧 Unsubscribed successfully",
      safe: "✅ Sender marked as safe",
      quarantine: "🗂️ Message moved to quarantine",
    };

    toast({
      title: "Action Complete",
      description: actionMessages[action],
    });
  };

  const handleMessageTypeFilter = (type: string | null) => {
    const platformMap: { [key: string]: string } = {
      email: "gmail",
      text: "whatsapp",
      social: "twitter",
      voice: "whatsapp",
    };

    if (type && requiresPlatform(platformMap[type])) {
      setShowContextualPrompt({
        platform: platformMap[type],
        feature: `View ${type} messages`,
      });
      return;
    }

    setMessageTypeFilter(type);
  };

  const handleViewMessage = (messageId: number) => {
    const message = messages.find((m) => m.id === messageId.toString());
    if (message) {
      setSelectedMessage(message);
      const messageElement = document.getElementById(`message-${messageId}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

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

  // NEW: mode selection handler
  const handleSelectMode = (modeId: ModeId) => {
    setSelectedMode(modeId);

    if (modeId !== "focus") {
      const mode = modes.find((m) => m.id === modeId);
      toast({
        title: mode?.label ?? "Mode",
        description: "This mode is coming soon. For now, try Focus Mode.",
      });
    }
  };

  // Show onboarding for first-time users
  if (onboardingState.showOnboarding && !isOnboardingComplete) {
    return (
      <OnboardingFlow onComplete={completeOnboarding} onConnect={handleConnect} />
    );
  };

  // Convert Supabase messages to the format expected by existing components

  const formattedMessages = messages.map((msg, index) => ({
    id: index + 1,
    originalId: msg.id,
    type: msg.type,
    from: msg.sender_name,
    avatar: msg.sender_avatar || "/placeholder.svg",
    subject: msg.subject,
    preview:
      msg.preview || (msg.content ? msg.content.substring(0, 100) + "..." : ""),
    time: new Date(msg.received_at || msg.created_at).toLocaleString(),
    priority: msg.priority || "medium",
    platform: msg.platform,
    tasks: [],
    sentiment: msg.sentiment || "neutral",
  }));

  // ---------- VIEW 1: Neon 12-button home screen ----------

  const renderModesHome = () => (
    <div className="min-h-screen w-full flex flex-col items-center px-6 py-10 text-white bg-gradient-to-b from-black via-slate-950 to-slate-900">
      {/* Logo + title */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-cyan-400/20 via-purple-600/30 to-pink-500/20 backdrop-blur-xl flex items-center justify-center border border-white/10 shadow-[0_0_40px_rgba(59,130,246,0.6)]">
          <img src={logoNew} className="w-14 h-14 opacity-90" alt="UnclutterAI logo" />
        </div>

        <h1 className="text-4xl font-bold mt-6 tracking-tight">unclutterAI</h1>
        <p className="text-xs text-white/60 tracking-[0.25em] mt-2">
          CHOOSE YOUR MODE
        </p>
      </div>

      {/* Grid of 12 modes */}
      <div className="grid grid-cols-3 gap-5 w-full max-w-md">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => handleSelectMode(mode.id)}
              className={`rounded-3xl p-5 flex flex-col items-center justify-center bg-slate-950/80 border border-white/10 shadow-[0_0_35px_rgba(0,0,0,0.9)] bg-gradient-to-br ${mode.color} bg-opacity-5 backdrop-blur-xl transition-all hover:scale-105 active:scale-100`}
            >
              <div className="w-10 h-10 rounded-2xl border border-white/30 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-white/85 text-center leading-tight">
                {mode.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ---------- VIEW 2: Existing dashboard (Focus Mode) ----------

  const renderFocusDashboard = () => (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 text-white">
      {/* Header bar */}
      <HeaderSection onShowCommandPalette={() => setShowCommandPalette(true)} />

      {/* "Back to modes" CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-white/70 hover:text-white hover:bg-white/5 px-2"
          onClick={() => setSelectedMode(null)}
        >
          ← All Modes
        </Button>
      </div>

      {/* Priority dashboard cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-6">
        <PriorityDashboardCards
          onShowRecoveryDashboard={() => setShowRecoveryDashboard(true)}
        />
        <div className="space-y-4">
          <UserStatsOverview />
          <AIUsageResetTimer />
        </div>
        <AIUsageTracker />
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <SidebarSection
            onMessageTypeFilter={handleMessageTypeFilter}
            onViewMessage={handleViewMessage}
            messages={formattedMessages}
            onMessageAction={handleMessageAction}
          />

          <div className="lg:col-span-3 space-y-6">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <MessageTabs
                messages={formattedMessages}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                messageTypeFilter={messageTypeFilter}
                onClearFilter={() => setMessageTypeFilter(null)}
                selectedMessage={selectedMessage}
                onSelectMessage={setSelectedMessage}
              />
            )}
          </div>
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
  return selectedMode === "focus" ? renderFocusDashboard() : renderModesHome();
};

export default Index;
