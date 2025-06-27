
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  MessageSquare, 
  Sparkles,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  platform: string;
  completed: boolean;
}

interface OnboardingStepCardProps {
  step: OnboardingStep;
  currentStep: number;
  onConnect: (platform: string) => void;
  onViewSummary: () => void;
  onComplete: () => void;
}

const OnboardingStepCard = ({ 
  step, 
  currentStep, 
  onConnect, 
  onViewSummary, 
  onComplete 
}: OnboardingStepCardProps) => {
  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/20 shadow-lg">
      <CardHeader className="text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 flex items-center justify-center mx-auto mb-4 text-purple-600">
          {step.icon}
        </div>
        <CardTitle className="text-xl">{step.title}</CardTitle>
        <p className="text-gray-600 text-sm">{step.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentStep === 1 && (
          <div className="space-y-3">
            <Button 
              onClick={() => onConnect("gmail")}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              size="lg"
            >
              <Mail className="w-4 h-4 mr-2" />
              Connect Gmail
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onConnect("apple-mail")}
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
              onClick={onViewSummary}
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
              onClick={() => onConnect("slack")}
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
  );
};

export default OnboardingStepCard;
