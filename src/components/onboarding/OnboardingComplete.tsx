import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingCompleteProps {
  connectedPlatforms: string[];
  onFinish: () => void;
}

const OnboardingComplete = ({
  connectedPlatforms,
  onFinish,
}: OnboardingCompleteProps) => {
  const totalConnected = connectedPlatforms.length;

  return (
    <div className="space-y-6 text-center">
      {/* Icon + title */}
      <div className="space-y-3">
        <div className="flex justify-center">
          <div className="inline-flex items-center justify-center rounded-full bg-emerald-500/15 p-3 shadow-sm border border-emerald-400/40">
            <CheckCircle2 className="w-8 h-8 text-emerald-300" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-slate-50">
          🎉 You're all set.
        </h2>
        <p className="text-sm text-slate-300">
          Sit back while we connect and sync your world in the background.
        </p>
      </div>

      {/* Connected list */}
      {totalConnected > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-200">
            Connected so far:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {connectedPlatforms.map((id) => (
              <span
                key={id}
                className="
                  inline-flex items-center justify-center
                  px-3 py-1.5 rounded-full
                  bg-emerald-500/12
                  border border-emerald-400/40
                  text-emerald-100 text-xs font-medium capitalize
                "
              >
                {id}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* What happens next card */}
      <div
        className="
          rounded-2xl
          bg-gradient-to-br from-purple-500/18 via-purple-500/10 to-indigo-500/18
          border border-purple-400/35
          text-left p-4 sm:p-5
        "
      >
        <p className="text-sm font-semibold text-purple-100 mb-2">
          ✨ What happens next
        </p>
        <ul className="list-disc list-inside text-sm text-purple-50/90 space-y-1">
          <li>We securely sync your connected platforms in the background.</li>
          <li>UnclutterAI starts summarising and prioritising your messages.</li>
          <li>Your focus feed will surface what actually matters first.</li>
          <li>You'll earn UCT tokens automatically as you stay in focus mode.</li>
        </ul>
      </div>

      {/* CTA */}
      <div className="pt-1">
        <Button
          type="button"
          onClick={onFinish}
          className="btn-primary w-full h-12 flex items-center justify-center text-sm"
        >
          Start using UnclutterAI →
        </Button>
        <p className="mt-3 text-xs text-slate-400">
          You can adjust your connections and settings anytime from the
          dashboard.
        </p>
      </div>
    </div>
  );
};

export default OnboardingComplete;
