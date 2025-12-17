import { Mail, CheckCircle2, Calendar, Clock, DollarSign, AlertCircle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriorityItem } from "@/hooks/useMorningBrief";

interface PriorityStackScreenProps {
  priority: PriorityItem | null;
  currentIndex: number;
  totalCount: number;
  onHandle: () => void;
  onSkip: () => void;
  onContinue: () => void;
}

const getSourceIcon = (sourceType: string) => {
  switch (sourceType) {
    case "email":
      return Mail;
    case "calendar":
      return Calendar;
    default:
      return CheckCircle2;
  }
};

const getReasonIcon = (reason: string) => {
  switch (reason) {
    case "Time-sensitive":
      return Clock;
    case "Revenue impact":
      return DollarSign;
    case "Decision required":
      return AlertCircle;
    case "Strategic opportunity":
      return Lightbulb;
    default:
      return Clock;
  }
};

const getReasonColor = (reason: string) => {
  switch (reason) {
    case "Time-sensitive":
      return "text-red-400 bg-red-500/10 border-red-500/20";
    case "Revenue impact":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    case "Decision required":
      return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    case "Strategic opportunity":
      return "text-purple-400 bg-purple-500/10 border-purple-500/20";
    default:
      return "text-white/60 bg-white/5 border-white/10";
  }
};

export const PriorityStackScreen = ({
  priority,
  currentIndex,
  totalCount,
  onHandle,
  onSkip,
  onContinue,
}: PriorityStackScreenProps) => {
  // No priorities - show empty state and continue
  if (!priority) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
        <div className="text-center mb-8">
          <CheckCircle2 className="w-16 h-16 text-emerald-400/50 mx-auto mb-6" />
          <h2 className="text-3xl font-semibold text-white/95 mb-2">All Clear</h2>
          <p className="text-white/50">No urgent priorities right now</p>
        </div>

        <Button
          onClick={onContinue}
          className="
            px-8 py-5
            bg-gradient-to-r from-emerald-500/80 to-teal-500/80
            hover:from-emerald-400/90 hover:to-teal-400/90
            text-white border-0
            rounded-full
            shadow-[0_0_20px_rgba(16,185,129,0.3)]
            hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]
            transition-all duration-300
          "
        >
          Continue
        </Button>
      </div>
    );
  }

  const SourceIcon = getSourceIcon(priority.sourceType);
  const ReasonIcon = getReasonIcon(priority.reason);
  const reasonColors = getReasonColor(priority.reason);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-white/40 text-sm mb-2">
          Priority {currentIndex + 1} of {totalCount}
        </p>
        <h2 className="text-3xl font-semibold text-white/95">Needs Your Attention</h2>
      </div>

      {/* Single Priority Card */}
      <div className="max-w-md w-full">
        <div className="rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 p-8 relative overflow-hidden">
          {/* Glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] bg-gradient-to-b from-purple-500/20 to-transparent blur-3xl" />

          <div className="relative">
            {/* Source icon */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <SourceIcon className="w-7 h-7 text-white/60" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-white/95 text-center mb-4 line-clamp-2">
              {priority.title}
            </h3>

            {/* Reason badge */}
            <div className="flex justify-center">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${reasonColors}`}>
                <ReasonIcon className="w-4 h-4" />
                {priority.reason}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-4 mt-8">
          <Button
            onClick={onHandle}
            className="
              px-10 py-6 text-lg font-medium w-full
              bg-gradient-to-r from-purple-500/80 to-indigo-500/80
              hover:from-purple-400/90 hover:to-indigo-400/90
              text-white border-0
              rounded-full
              shadow-[0_0_30px_rgba(147,51,234,0.3)]
              hover:shadow-[0_0_40px_rgba(147,51,234,0.5)]
              transition-all duration-300
            "
          >
            Handle This
          </Button>

          <button
            onClick={onSkip}
            className="text-white/40 hover:text-white/60 text-sm transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};
