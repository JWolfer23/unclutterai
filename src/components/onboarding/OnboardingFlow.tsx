
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  MessageSquare, 
  Slack, 
  Phone, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Users
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
      // Show immediate value after first connection
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

  const handleSkip = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const getCurrentStepData = () => steps.find(step => step.id === currentStep);
  const currentStepData = getCurrentStepData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Progress Header */}
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Welcome to Unclutter
          </h1>
          <p className="text-gray-600">We get it. Setups are annoying. Let's start small.</p>
          
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-500">{Math.round(progress)}% complete</p>
          </div>
        </div>

        {/* Current Step Card */}
        {currentStepData && (
          <Card className="bg-white/80 backdrop-blur-md border-white/20 shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 flex items-center justify-center mx-auto mb-4 text-purple-600">
                {currentStepData.icon}
              </div>
              <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
              <p className="text-gray-600 text-sm">{currentStepData.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentStep === 1 && (
                <div className="space-y-3">
                  <Button 
                    onClick={() => handleConnect("gmail")}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    size="lg"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Connect Gmail
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleConnect("apple-mail")}
                    className="w-full"
                    size="lg"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Connect Apple Mail
                  </Button>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-800 mb-2">Your Morning Summary</h3>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• 8 emails processed</li>
                      <li>• 3 action items found</li>
                      <li>• 2 meetings today</li>
                      <li>• Priority: Budget review with Sarah</li>
                    </ul>
                  </div>
                  <Button 
                    onClick={handleViewSummary}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    size="lg"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Amazing! Continue Setup
                  </Button>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-3">
                  <Button 
                    onClick={() => handleConnect("slack")}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    size="lg"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Connect Slack
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={onComplete}
                    className="w-full"
                  >
                    I'll do this later
                  </Button>
                </div>
              )}

              {currentStep >= 4 && (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 flex items-center justify-center mx-auto text-green-600">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">You're all set!</h3>
                    <p className="text-sm text-gray-600">Ready to transform your digital overwhelm into clarity</p>
                  </div>
                  <Button 
                    onClick={onComplete}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    size="lg"
                  >
                    Start Using Unclutter
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Connected Platforms */}
        {connectedPlatforms.length > 0 && (
          <Card className="bg-white/60 backdrop-blur-md border-white/20">
            <CardContent className="pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Connected Platforms</h3>
              <div className="flex flex-wrap gap-2">
                {connectedPlatforms.map(platform => (
                  <Badge key={platform} variant="secondary" className="bg-green-100 text-green-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {platform === 'gmail' ? 'Gmail' : platform === 'slack' ? 'Slack' : 'Apple Mail'}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Setup Option */}
        {currentStep === 1 && (
          <Card className="bg-white/60 backdrop-blur-md border-white/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">In a hurry?</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    handleConnect("gmail");
                    handleConnect("slack");
                    toast({
                      title: "🚀 Express Setup Complete!",
                      description: "All your accounts are now connected and ready to go.",
                    });
                  }}
                  className="w-full"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Quick Setup (Connect All)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow;
