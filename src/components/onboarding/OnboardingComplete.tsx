
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

interface OnboardingCompleteProps {
  connectedPlatforms: string[];
  onFinish: () => void;
}

const OnboardingComplete = ({ connectedPlatforms, onFinish }: OnboardingCompleteProps) => {
  return (
    <div className="space-y-6 text-center">
      {/* Large green check icon */}
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto shadow-lg">
        <CheckCircle2 className="w-14 h-14 text-green-600" />
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">🎉 You're all set.</h2>
        <p className="text-lg text-gray-600">Sit back while we sync your world.</p>
      </div>

      {/* Purple info card */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200 text-left">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-purple-900">✨ What happens next:</span>
        </div>
        <ul className="space-y-2 text-sm text-purple-800">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>We're syncing your {connectedPlatforms.length} connected platforms</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Your entire digital life will be in one place</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Everything will be summarised, prioritised, and easy to act on</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>You'll get a daily digest of what actually matters</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Reply to everything from one unified inbox</span>
          </li>
        </ul>
      </div>

      {/* CTA Button */}
      <Button 
        onClick={onFinish}
        className="w-full h-12 bg-gradient-to-r from-[#3B82F6] to-[#A855F7] hover:from-[#2563EB] hover:to-[#9333EA] text-white font-semibold rounded-xl shadow-lg transition-all"
      >
        Start Using UnclutterAI
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
};

export default OnboardingComplete;
