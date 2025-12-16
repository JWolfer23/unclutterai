import { Mail, CheckCircle2, Calendar, Clock, DollarSign, AlertCircle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriorityItem } from "@/hooks/useMorningBrief";

interface PriorityStackScreenProps {
  priorities: PriorityItem[];
  onAction: (id: string, action: "handle" | "schedule" | "delegate" | "dismiss") => void;
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
  priorities,
  onAction,
  onContinue,
}: PriorityStackScreenProps) => {
  return (
    <div className="flex flex-col min-h-[70vh] animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-semibold text-white/95 mb-2">Top Priorities</h2>
        <p className="text-white/50">The 3 things that matter most right now</p>
      </div>

      {/* Priority Cards */}
      <div className="flex-1 space-y-4 max-w-lg mx-auto w-full">
        {priorities.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-emerald-400/50 mx-auto mb-4" />
            <p className="text-white/60">No urgent priorities right now</p>
            <p className="text-white/40 text-sm mt-1">You're in great shape!</p>
          </div>
        ) : (
          priorities.slice(0, 3).map((priority, index) => {
            const SourceIcon = getSourceIcon(priority.sourceType);
            const ReasonIcon = getReasonIcon(priority.reason);
            const reasonColors = getReasonColor(priority.reason);

            return (
              <div
                key={priority.id}
                className="
                  relative rounded-2xl
                  bg-black/40 backdrop-blur-xl
                  border border-white/10
                  p-5
                  hover:border-white/20
                  transition-all duration-300
                "
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Number badge */}
                <div className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/80 to-indigo-500/80 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                  {index + 1}
                </div>

                <div className="flex items-start gap-4">
                  {/* Source icon */}
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <SourceIcon className="w-5 h-5 text-white/60" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h3 className="text-white/90 font-medium text-base mb-2 line-clamp-2">
                      {priority.title}
                    </h3>

                    {/* Reason badge */}
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${reasonColors}`}>
                      <ReasonIcon className="w-3 h-3" />
                      {priority.reason}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-4 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAction(priority.id, "handle")}
                    className="text-xs bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white/80"
                  >
                    Handle now
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAction(priority.id, "schedule")}
                    className="text-xs bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white/80"
                  >
                    Schedule
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAction(priority.id, "delegate")}
                    className="text-xs bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white/80"
                  >
                    Delegate
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onAction(priority.id, "dismiss")}
                    className="text-xs text-white/40 hover:text-white/60 hover:bg-white/5"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Continue button */}
      <div className="flex justify-center mt-8">
        <Button
          onClick={onContinue}
          className="
            px-8 py-5
            bg-gradient-to-r from-purple-500/80 to-indigo-500/80
            hover:from-purple-400/90 hover:to-indigo-400/90
            text-white border-0
            rounded-full
            shadow-[0_0_20px_rgba(147,51,234,0.3)]
            hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]
            transition-all duration-300
          "
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
