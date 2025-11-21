
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface OnboardingCompleteProps {
  connectedPlatforms: string[];
  onFinish: () => void;
}

const OnboardingComplete = ({ connectedPlatforms, onFinish }: OnboardingCompleteProps) => {
  return (
    <div className="space-y-6 text-center">
      {/* Large green check icon */}
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-12 h-12 text-green-600" strokeWidth={2.5} />
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <h2 className="text-[28px] font-bold text-[#0A0A0A]">🎉 You're all set.</h2>
        <p className="text-[17px] font-medium text-[#555555]">Sit back while we sync your world.</p>
      </div>

      {/* Purple info card */}
      <div className="bg-purple-50 rounded-[20px] p-6 border border-purple-200/60 text-left">
        <div className="mb-4">
          <span className="font-bold text-[15px] text-purple-900">✨ What happens next:</span>
        </div>
        <ul className="space-y-3 text-[15px] text-purple-800 font-medium">
          <li className="flex items-start">
            <span className="mr-3">•</span>
            <span>We're syncing your {connectedPlatforms.length} connected platforms</span>
          </li>
          <li className="flex items-start">
            <span className="mr-3">•</span>
            <span>Your entire digital life will be in one place</span>
          </li>
          <li className="flex items-start">
            <span className="mr-3">•</span>
            <span>Everything will be summarised, prioritised, and easy to act on</span>
          </li>
          <li className="flex items-start">
            <span className="mr-3">•</span>
            <span>You'll get a daily digest of what actually matters</span>
          </li>
          <li className="flex items-start">
            <span className="mr-3">•</span>
            <span>Reply to everything from one unified inbox</span>
          </li>
        </ul>
      </div>

      {/* CTA Button */}
      <Button 
        onClick={onFinish}
        className="w-full h-12 bg-gradient-to-r from-[#3B82F6] to-[#A855F7] hover:from-[#2563EB] hover:to-[#9333EA] text-white font-semibold rounded-[16px] shadow-md transition-all"
      >
        <span className="flex items-center justify-center gap-2 w-full">
          Start Using UnclutterAI
          <ArrowRight className="w-5 h-5" />
        </span>
      </Button>
    </div>
  );
};

export default OnboardingComplete;
