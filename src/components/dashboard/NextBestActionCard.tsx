import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useGlobalPriority } from "@/contexts/GlobalPriorityContext";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import type { PriorityAction } from "@/lib/priorityEngine";

// Explanation text for each action type
const WHY_EXPLANATIONS: Record<PriorityAction, string> = {
  close_loops: "Unfinished items fragment attention. Closing them first clears mental bandwidth for deeper work.",
  handle_urgent: "High-priority messages waiting too long erode trust. A quick reply now prevents larger problems.",
  resolve_conflict: "Overlapping commitments create stress. Resolving conflicts now prevents missed obligations.",
  start_focus: "With communications handled, this is your window for undistracted, high-value work.",
  continue_focus: "You have momentum. Staying in focus mode maximizes the value of this session.",
  take_break: "Rest is productive. A short break now will improve your focus when you return.",
};

export const NextBestActionCard = () => {
  const [showWhy, setShowWhy] = useState(false);
  const { output, nextAction, isAllClear } = useGlobalPriority();

  // Don't render action card if all clear - let parent show reassurance instead
  if (isAllClear) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-800/50 backdrop-blur-xl shadow-2xl">
        {/* Soft ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative p-6 text-center">
          <h2 className="text-lg font-medium text-white/90 mb-2">
            {nextAction.headline}
          </h2>
          <p className="text-sm text-white/40">
            Your assistant is monitoring everything.
          </p>
        </div>
      </div>
    );
  }

  const actionType = output.recommendation?.action || 'start_focus';

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
          {nextAction.headline}
        </h2>

        {/* Description */}
        <p className="text-sm text-slate-400 mb-5 leading-relaxed">
          {nextAction.description}
        </p>

        {/* Actions row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <Button 
            asChild 
            size="lg" 
            className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100 font-medium shadow-lg shadow-white/10 min-h-[48px] touch-manipulation"
          >
            <Link to={nextAction.href}>
              {nextAction.cta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <button
            onClick={() => setShowWhy(!showWhy)}
            className="text-xs text-slate-500 hover:text-slate-300 active:text-slate-200 transition-colors flex items-center justify-center sm:justify-start gap-1 py-2 touch-manipulation"
          >
            Why this?
            {showWhy ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        {/* Expandable explanation */}
        {showWhy && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-slate-500 leading-relaxed">
              {WHY_EXPLANATIONS[actionType]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NextBestActionCard;
