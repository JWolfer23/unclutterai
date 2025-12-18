import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { type NextBestAction } from "@/hooks/useNextBestAction";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

interface NextBestActionCardProps {
  action: NextBestAction;
}

const WHY_EXPLANATIONS: Record<NextBestAction['type'], string> = {
  CLOSE_LOOPS: "Unfinished items fragment attention. Closing them first clears mental bandwidth for deeper work.",
  URGENT_REPLIES: "High-priority messages waiting too long erode trust. A quick reply now prevents larger problems.",
  START_FOCUS: "With communications handled, this is your window for undistracted, high-value work.",
};

export const NextBestActionCard = ({ action }: NextBestActionCardProps) => {
  const [showWhy, setShowWhy] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-800/50 backdrop-blur-xl shadow-2xl">
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative p-6">
        {/* Label */}
        <span className="inline-block text-[10px] font-semibold tracking-[0.2em] uppercase text-purple-400/80 mb-3">
          Next Best Action
        </span>

        {/* Title */}
        <h2 className="text-xl font-semibold text-white mb-2 tracking-tight">
          {action.title}
        </h2>

        {/* Description */}
        <p className="text-sm text-slate-400 mb-5 leading-relaxed">
          {action.description}
        </p>

        {/* Actions row */}
        <div className="flex items-center gap-4">
          <Button asChild size="sm" className="bg-white text-slate-900 hover:bg-slate-100 font-medium shadow-lg shadow-white/10">
            <Link to={action.href}>
              {action.ctaLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <button
            onClick={() => setShowWhy(!showWhy)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
          >
            Why this?
            {showWhy ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        {/* Expandable explanation */}
        {showWhy && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-slate-500 leading-relaxed">
              {WHY_EXPLANATIONS[action.type]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NextBestActionCard;
