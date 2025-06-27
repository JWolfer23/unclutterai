
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

interface OnboardingCompleteProps {
  connectedPlatforms: string[];
  onFinish: () => void;
}

const OnboardingComplete = ({ connectedPlatforms, onFinish }: OnboardingCompleteProps) => {
  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/20 shadow-lg">
      <CardHeader className="text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-4 text-green-600">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <CardTitle className="text-2xl">🎉 You're all set.</CardTitle>
        <p className="text-gray-600">Sit back while we sync your world.</p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-purple-800">What happens next:</span>
          </div>
          <div className="space-y-2 text-sm text-purple-700">
            <p>• We're syncing your {connectedPlatforms.length} connected platforms</p>
            <p>• Your entire digital life will be in one place</p>
            <p>• Everything will be summarised, prioritised, and easy to act on</p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Next time you open UnclutterAI, your entire digital life will be in one place — summarised, prioritised, and easy to act on.
          </p>
          
          <Button 
            onClick={onFinish}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            size="lg"
          >
            Start Using UnclutterAI
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OnboardingComplete;
