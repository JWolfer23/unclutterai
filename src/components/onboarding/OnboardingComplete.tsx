import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  sectionTitle,
  sectionSubtitle,
  lightInfoCardPurple,
  primaryGradientButton,
  buttonTap,
  pillTag,
} from "@/ui/styles";

interface OnboardingCompleteProps {
  connectedPlatforms: string[];
  onFinish: () => void;
}

const OnboardingComplete = ({ connectedPlatforms, onFinish }: OnboardingCompleteProps) => {
  const totalConnected = connectedPlatforms.length;

  return (
    <div className="space-y-6 text-center">
      {/* Icon + Heading */}
      <div className="space-y-3">
        <div className="flex justify-center">
          <div className="inline-flex items-center justify-center rounded-full bg-green-100 p-3 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <h2 className={sectionTitle}>🎉 You’re all set.</h2>
        <p className={sectionSubtitle}>Sit back while we connect and sync your world in the background.</p>
      </div>

      {/* Summary of what’s connected */}
      {totalConnected > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Connected so far:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {connectedPlatforms.map((platformId) => (
              <span key={platformId} className={pillTag}>
                {/* You can later map platformId → label/icon if needed */}
                {platformId}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* “What happens next” card */}
      <div className={lightInfoCardPurple}>
        <div className="text-left space-y-2">
          <p className="text-sm font-semibold text-purple-900">✨ What happens next</p>
          <ul className="list-disc list-inside text-sm text-purple-800 space-y-1">
            <li>We securely sync your connected apps in the background.</li>
            <li>UnclutterAI starts summarising and prioritising your messages.</li>
            <li>Your focus feed will show what actually matters first.</li>
            <li>You’ll earn UCT tokens automatically as you stay in focus mode.</li>
          </ul>
        </div>
      </div>

      {/* Primary CTA */}
      <div className="pt-2">
        <Button type="button" onClick={onFinish} className={`${primaryGradientButton} ${buttonTap} w-full h-12`}>
          Start using UnclutterAI →
        </Button>
        <p className="mt-3 text-xs text-gray-500">
          You can adjust your connections and settings anytime from the dashboard.
        </p>
      </div>
    </div>
  );
};

export default OnboardingComplete;
