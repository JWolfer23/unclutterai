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
  Users,
  Bitcoin,
  Activity,
} from "lucide-react";

type ModeId =
  | "focus"
  | "news"
  | "learning"
  | "health"
  | "career"
  | "wealth"
  | "communication"
  | "customize-ai"
  | "community-ranking"
  | "crypto-hub"
  | "customize"
  | "ai-usage";

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

  // 🌟 NEW: which "mode" is active (null = show 12-icon grid)
  const [selectedMode, setSelectedMode] = useState<ModeId | null>(null);

  const {
    state: onboardingState,
    completeOnboarding,
    connectPlatform,
    requiresPlatform,
    isOnboardingComplete,
  } = useOnboarding();

  // ---------- AUTH / ONBOARDING ----------

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (onboardingState.showOnboarding && !isOnboardingComplete) {
    return (
      <OnboardingFlow
        onComplete={completeOnboarding}
        onConnect={(platform) => {
          connectPlatform(platform);
          toast({
            title: "🎉 Connected!",
            description: `${platform} is now connected and ready to use.`,
          });
        }}
      />
    );
  }

  // ---------- HELPERS ----------

  const handleMessageAction = (
    messageId: number,
    action: "block" | "unsubscribe" | "safe" | "quarantine"
  ) => {
    const actionMessages = {
      block: "🛡️ Sender blocked and future messages will be filtered",
      unsubscribe: "📧 Unsubscribed successfully",
      safe: "✅ Sender marked as safe",
      quarantine: "🗂️ Message moved to quarantine",
    } as const;

    toast({
      title: "Action complete",
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
      const el = document.getElementById(`message-${messageId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleCommand = (command: string) => {
    toast({
      title: "✨ Command executed",
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

  const formattedMessages = messages.map((msg, index) => ({
    id: index + 1,
    originalId: msg.id,
    type: msg.type,
    from: msg.sender_name,
    avatar: msg.sender_avatar || "/placeholder.svg",
    subject: msg.subject,
    preview:
      msg.preview ||
      (msg.content ? msg.content.substring(0, 100) + "..." : ""),
    time: new Date(msg.received_at || msg.created_at).toLocaleString(),
    priority: msg.priority || "medium",
    platform: msg.platform,
    tasks: [],
    sentiment: msg.sentiment || "neutral",
  }));

  // ---------- 12-BUTTON MODE GRID ----------

  const modes: {
    id: ModeId;
    label: string;
    Icon: React.ComponentType<any>;
    border: string;
    glow: string;
  }[] = [
    { id: "focus", label: "Focus Mode", Icon: ArrowUpRight, border: "border-fuchsia-500", glow: "shadow-[0_0_40px_rgba(236,72,153,0.45)]" },
    { id: "news", label: "News Mode", Icon: Newspaper, border: "border-cyan-400", glow: "shadow-[0_0_40px_rgba(56,189,248,0.45)]" },
    { id: "learning", label: "Learning Mode", Icon: GraduationCap, border: "border-teal-400", glow: "shadow-[0_0_40px_rgba(45,212,191,0.45)]" },
    { id: "health", label: "Health Mode", Icon: HeartPulse, border: "border-emerald-400", glow: "shadow-[0_0_40px_rgba(52,211,153,0.45)]" },
    { id: "career", label: "Career Mode", Icon: Briefcase, border: "border-sky-400", glow: "shadow-[0_0_40px_rgba(56,189,248,0.45)]" },
    { id: "wealth", label: "Wealth Mode", Icon: DollarSign, border: "border-amber-400", glow: "shadow-[0_0_40px_rgba(251,191,36,0.45)]" },
    { id: "communication", label: "Communication Mode", Icon: MessageCircle, border: "border-cyan-400", glow: "shadow-[0_0_40px_rgba(56,189,248,0.45)]" },
    { id: "customize-ai", label: "Customize AI", Icon: Sliders, border: "border-sky-400", glow: "shadow-[0_0_40px_rgba(56,189,248,0.45)]" },
    { id: "community-ranking", label: "Community Ranking", Icon: Users, border: "border-fuchsia-500", glow: "shadow-[0_0_40px_rgba(236,72,153,0.45)]" },
    { id: "crypto-hub", label: "Crypto Hub", Icon: Bitcoin, border: "border-amber-400", glow: "shadow-[0_0_40px_rgba(251,191,36,0.45)]" },
    { id: "customize", label: "Customize AI", Icon: Sliders, border: "border-sky-400", glow: "shadow-[0_0_40px_rgba(56,189,248,0.45)]" },
    { id: "ai-usage", label: "AI Usage", Icon: Activity, border: "border-fuchsia-500", glow: "shadow-[0_0_40px_rgba(236,72,153,0.45)]" },
  ];

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

  const renderModesHome = () => (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 text-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-10">
        {/* Logo + title */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-cyan-500 to-fuchsia-500 flex items-center justify-center shadow-[0_0_80px_rgba(56,189,248,0.55)]">
            <div className="w-16 h-16 rounded-[24px] bg-black/80 flex items-center justify-center border border-white/10">
              <img
                src={logoNew}
                alt="UnclutterAI Logo"
                className="w-10 h-10 object-contain"
              />
            </div>
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              unclutterAI
            </h1>
            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
              CHOOSE YOUR MODE
            </p>
          </div>
        </div>

        {/* 12-button grid */}
        <div className="grid grid-cols-3 gap-3">
          {modes.map(({ id, label, Icon, border, glow }) => (
            <button
              key={id}
              onClick={() => handleSelectMode(id)}
              className={`
                group flex flex-col items-center justify-center
                rounded-3xl border ${border}
                bg-slate-950/70
                ${glow}
                px-2 py-3
                transition-transform transition-shadow duration-150
                hover:-translate-y-0.5
                active:scale-[0.97]
              `}
            >
              <div className="w-10 h-10 rounded-2xl border border-current flex items-center justify-center mb-2 text-white">
                <Icon className="w-5 h-5 text-current" />
              </div>
              <span className="text-[11px] font-medium text-slate-100 text-center leading-snug">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ---------- FOCUS MODE DASHBOARD (your existing layout) ----------

  const renderFocusDashboard = () => (
    <>
      <HeaderSection onShowCommandPalette={() => setShowCommandPalette(true)} />

      {/* Back to modes */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
        <button
          type="button"
          onClick={() => setSelectedMode(null)}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          ← All modes
        </button>
      </div>

      {/* Priority cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <PriorityDashboardCards
          onShowRecoveryDashboard={() => setShowRecoveryDashboard(true)}
        />
        <div className="space-y-4">
          <UserStatsOverview />
          <AIUsageResetTimer />
        </div>
        <AIUsageTracker />
      </div>

      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-4">
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
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
    </>
  );

  // ---------- FINAL RENDER ----------
  return renderModesHome();

  // (temporarily comment out everything below)
  /*
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900">
      {selectedMode === "focus" ? renderFocusDashboard() : renderModesHome()}

      {showContextualPrompt && (
        <ContextualSetupPrompt
          platform={showContextualPrompt.platform}
          feature={showContextualPrompt.feature}
          onConnect={(platform) => {
            connectPlatform(platform);
            setShowContextualPrompt(null);
            toast({
              title: "🎉 Connected!",
              description: `${platform} is now connected and ready to use.`,
            });
          }}
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
  */
};

export default Index;
