
import { useState } from "react";
import { 
  Mail, 
  MessageSquare, 
  Sparkles
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import OnboardingProgress from "./OnboardingProgress";
import OnboardingStepCard from "./OnboardingStepCard";
import ConnectedPlatforms from "./ConnectedPlatforms";
import QuickSetupCard from "./QuickSetupCard";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  platform: string;
  completed: boolean;
}

interface OnboardingFlowProps {
  onComplete: () => void;
  onConnect: (platform: string) => void;
}

const OnboardingFlow = ({ onComplete, onConnect }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showValue, setShowValue] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: "Connect Your Email",
      description: "Let's start small — connect Gmail or Apple Mail to see your morning summary",
      icon: <Mail className="w-6 h-6" />,
      action: "Connect Gmail",
      platform: "gmail",
      completed: connectedPlatforms.includes("gmail")
    },
    {
      id: 2,
      title: "See the Magic",
      description: "Here's your personalized message summary — saving you time already!",
      icon: <Sparkles className="w-6 h-6" />,
      action: "View Summary",
      platform: "summary",
      completed: showValue
    },
    {
      id: 3,
      title: "Add Team Chat",
      description: "You've saved 8 minutes this week! Want to add Slack next?",
      icon: <MessageSquare className="w-6 h-6" />,
      action: "Connect Slack",
      platform: "slack",
      completed: connectedPlatforms.includes("slack")
    }
  ];

  const progress = (connectedPlatforms.length / 3) * 100;

  const handleConnect = (platform: string) => {
    setConnectedPlatforms(prev => [...prev, platform]);
    onConnect(platform);
    
    if (platform === "gmail") {
      setTimeout(() => {
        setShowValue(true);
        setCurrentStep(2);
        toast({
          title: "🎉 Connected!",
          description: "Your inbox is now organized. Here's what we found...",
        });
      }, 1500);
    } else if (platform === "slack") {
      setCurrentStep(4);
      toast({
        title: "✨ Awesome!",
        description: "Slack connected. You're getting the full Unclutter experience!",
      });
    }
  };

  const handleViewSummary = () => {
    setShowValue(true);
    setCurrentStep(3);
    toast({
      title: "📊 Your Summary",
      description: "8 emails processed, 3 action items found, 2 meetings today",
    });
  };

  const handleQuickSetup = () => {
    handleConnect("gmail");
    handleConnect("slack");
    toast({
      title: "🚀 Express Setup Complete!",
      description: "All your accounts are now connected and ready to go.",
    });
  };

  const getCurrentStepData = () => steps.find(step => step.id === currentStep);
  const currentStepData = getCurrentStepData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <OnboardingProgress progress={progress} />

        {currentStepData && (
          <OnboardingStepCard
            step={currentStepData}
            currentStep={currentStep}
            onConnect={handleConnect}
            onViewSummary={handleViewSummary}
            onComplete={onComplete}
          />
        )}

        <ConnectedPlatforms connectedPlatforms={connectedPlatforms} />

        {currentStep === 1 && (
          <QuickSetupCard onQuickSetup={handleQuickSetup} />
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow;
