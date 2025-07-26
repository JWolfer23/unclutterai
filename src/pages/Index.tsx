
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
import { useOnboarding } from "@/hooks/useOnboarding";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Coins, Trophy } from "lucide-react";
import { useFocusRecovery } from "@/hooks/useFocusRecovery";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { messages, isLoading: messagesLoading } = useMessages();
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageTypeFilter, setMessageTypeFilter] = useState<string | null>(null);
  const [showContextualPrompt, setShowContextualPrompt] = useState<{platform: string, feature: string} | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showRecoveryDashboard, setShowRecoveryDashboard] = useState(false);
  const [focusScore] = useState(87);
  
  const { 
    isNotificationsMuted 
  } = useFocusRecovery();
  
  const { 
    state: onboardingState, 
    completeOnboarding, 
    connectPlatform, 
    skipOnboarding,
    requiresPlatform,
    isOnboardingComplete 
  } = useOnboarding();

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!user) {
    return <AuthPage />;
  }

  const handleMessageAction = (messageId: number, action: 'block' | 'unsubscribe' | 'safe' | 'quarantine') => {
    console.log(`Message ${messageId} action: ${action}`);
    
    const actionMessages = {
      block: "🛡️ Sender blocked and future messages will be filtered",
      unsubscribe: "📧 Unsubscribed successfully",
      safe: "✅ Sender marked as safe",
      quarantine: "🗂️ Message moved to quarantine"
    };
    
    toast({
      title: "Action Complete",
      description: actionMessages[action],
    });
  };

  const handleMessageTypeFilter = (type: string | null) => {
    const platformMap: {[key: string]: string} = {
      'email': 'gmail',
      'text': 'whatsapp', 
      'social': 'twitter',
      'voice': 'whatsapp'
    };
    
    if (type && requiresPlatform(platformMap[type])) {
      setShowContextualPrompt({platform: platformMap[type], feature: `View ${type} messages`});
      return;
    }
    
    setMessageTypeFilter(type);
  };

  const handleViewMessage = (messageId: number) => {
    const message = messages.find(m => m.id === messageId.toString());
    if (message) {
      setSelectedMessage(message);
      const messageElement = document.getElementById(`message-${messageId}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      setShowContextualPrompt({platform, feature});
    } else {
      handleCommand(feature);
    }
  };

  // Show onboarding for first-time users
  if (onboardingState.showOnboarding && !isOnboardingComplete) {
    return (
      <OnboardingFlow 
        onComplete={completeOnboarding}
        onConnect={handleConnect}
      />
    );
  }

  // Convert Supabase messages to the format expected by existing components
  const formattedMessages = messages.map((msg, index) => ({
    id: index + 1, // Use array index for compatibility instead of parsing UUID
    originalId: msg.id, // Keep original UUID for database operations
    type: msg.type,
    from: msg.sender_name,
    avatar: msg.sender_avatar || "/placeholder.svg",
    subject: msg.subject,
    preview: msg.preview || (msg.content ? msg.content.substring(0, 100) + "..." : ""),
    time: new Date(msg.received_at || msg.created_at).toLocaleString(),
    priority: msg.priority || "medium",
    platform: msg.platform,
    tasks: [], // This would need to be populated from the tasks table
    sentiment: msg.sentiment || "neutral"
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
      <HeaderSection onShowCommandPalette={() => setShowCommandPalette(true)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <SidebarSection 
            onMessageTypeFilter={handleMessageTypeFilter}
            onViewMessage={handleViewMessage}
            messages={formattedMessages}
            onMessageAction={handleMessageAction}
          />

          <div className="lg:col-span-3 space-y-6">
            {/* Focus Summary Banner - 3 Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              {/* Focus Score Card */}
              <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Focus Score</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowRecoveryDashboard(true)}
                          className="ml-2 h-7 px-3 text-xs border-purple-300 text-purple-700 hover:bg-purple-100"
                        >
                          Schedule
                        </Button>
                      </div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-purple-700">
                          {focusScore}%
                        </span>
                        <span className="text-sm text-gray-500">
                          +3%
                        </span>
                      </div>
                      <p className="text-xs text-purple-600 font-medium">
                        ↗ Improving
                      </p>
                      {isNotificationsMuted && (
                        <p className="text-xs text-purple-600 font-medium mt-1">🔕 Notifications Muted</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* UCT Tokens Card */}
              <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                      <Coins className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">UCT Tokens Earned</h3>
                      <p className="text-2xl font-bold text-amber-700">2,847</p>
                      <p className="text-xs text-amber-600 font-medium">+47 today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Community Ranking Card */}
              <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Community Ranking</h3>
                      <p className="text-2xl font-bold text-emerald-700">Top 15%</p>
                      <p className="text-xs text-emerald-600 font-medium">↗ +2% this week</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {messagesLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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
};

export default Index;
