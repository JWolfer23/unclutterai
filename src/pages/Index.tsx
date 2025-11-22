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

// NEW: Home screen component
import ModeGrid, { type ModeId } from "@/components/home/ModeGrid";

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

  // Mode selection handler
  const handleSelectMode = (modeId: ModeId) => {
    if (modeId === "focus") {
      setSelectedMode("focus");
    }
    // Other modes handled by ModeGrid's internal banner
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

  // ---------- VIEW: Focus Mode Dashboard ----------

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
  if (selectedMode === "focus") {
    return renderFocusDashboard();
  }

  // Show mode selection home screen
  return <ModeGrid onSelectMode={handleSelectMode} />;
};

export default Index;
