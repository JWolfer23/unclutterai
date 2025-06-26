
import { useState } from "react";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import ContextualSetupPrompt from "@/components/onboarding/ContextualSetupPrompt";
import CommandPalette from "@/components/onboarding/CommandPalette";
import HeaderSection from "@/components/HeaderSection";
import SidebarSection from "@/components/SidebarSection";
import MessageTabs from "@/components/MessageTabs";
import { useOnboarding } from "@/hooks/useOnboarding";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageTypeFilter, setMessageTypeFilter] = useState<string | null>(null);
  const [showContextualPrompt, setShowContextualPrompt] = useState<{platform: string, feature: string} | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  
  const { 
    state: onboardingState, 
    completeOnboarding, 
    connectPlatform, 
    skipOnboarding,
    requiresPlatform,
    isOnboardingComplete 
  } = useOnboarding();

  const mockMessages = [
    {
      id: 1,
      type: "email",
      from: "Sarah Chen",
      avatar: "/placeholder.svg",
      subject: "Q4 Budget Review Meeting",
      preview: "Hi team, I wanted to schedule our quarterly budget review for next week. Could everyone please...",
      time: "2 hours ago",
      priority: "high",
      platform: "Gmail",
      tasks: ["Schedule budget review", "Prepare Q4 reports"],
      sentiment: "neutral"
    },
    {
      id: 2,
      type: "text",
      from: "Alex Thompson",
      avatar: "/placeholder.svg",
      subject: "Weekend Plans",
      preview: "Hey! Are we still on for hiking this Saturday? The weather looks perfect and I found a new trail...",
      time: "4 hours ago",
      priority: "low",
      platform: "iMessage",
      tasks: [],
      sentiment: "positive"
    },
    {
      id: 3,
      type: "social",
      from: "TechCrunch",
      avatar: "/placeholder.svg",
      subject: "New AI breakthrough announced",
      preview: "Breaking: Major AI research lab announces breakthrough in language understanding...",
      time: "6 hours ago",
      priority: "medium",
      platform: "Twitter",
      tasks: ["Read full article", "Share with team"],
      sentiment: "neutral"
    },
    {
      id: 4,
      type: "voice",
      from: "Mom",
      avatar: "/placeholder.svg",
      subject: "Voice Message",
      preview: "AI Transcription: Hi honey, just wanted to check in and see how your new job is going...",
      time: "1 day ago",
      priority: "medium",
      platform: "WhatsApp",
      tasks: ["Call mom back"],
      sentiment: "positive"
    }
  ];

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
    const message = mockMessages.find(m => m.id === messageId);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
      <HeaderSection onShowCommandPalette={() => setShowCommandPalette(true)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <SidebarSection 
            onMessageTypeFilter={handleMessageTypeFilter}
            onViewMessage={handleViewMessage}
          />

          <div className="lg:col-span-3 space-y-6">
            <MessageTabs
              messages={mockMessages}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              messageTypeFilter={messageTypeFilter}
              onClearFilter={() => setMessageTypeFilter(null)}
              selectedMessage={selectedMessage}
              onSelectMessage={setSelectedMessage}
            />
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
