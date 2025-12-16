import { Mail, CheckSquare, FileText, Clock, AlertTriangle, Minus } from "lucide-react";
import { OpenLoop } from "@/hooks/useOpenLoops";
import LoopActionBar from "./LoopActionBar";

interface LoopCardProps {
  loop: OpenLoop;
  currentIndex: number;
  totalInGroup: number;
  onReply: () => void;
  onConvertToTask: () => void;
  onSchedule: () => void;
  onArchive: () => void;
  onIgnore: () => void;
  isGeneratingDraft: boolean;
}

const LoopCard = ({
  loop,
  currentIndex,
  totalInGroup,
  onReply,
  onConvertToTask,
  onSchedule,
  onArchive,
  onIgnore,
  isGeneratingDraft
}: LoopCardProps) => {
  const getTypeIcon = () => {
    switch (loop.type) {
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'task':
        return <CheckSquare className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getDeadlineBadge = () => {
    switch (loop.deadline_sensitivity) {
      case 'urgent':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs">
            <AlertTriangle className="h-3 w-3" />
            Time-sensitive
          </span>
        );
      case 'soon':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs">
            <Clock className="h-3 w-3" />
            Due soon
          </span>
        );
      default:
        return null;
    }
  };

  const getEffortLabel = () => {
    if (loop.effort_estimate <= 2) return '~2 min';
    if (loop.effort_estimate <= 5) return '~5 min';
    if (loop.effort_estimate <= 8) return '~10 min';
    return '15+ min';
  };

  return (
    <div className="rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-white/10 text-white/60">
          {getTypeIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">
            {loop.type === 'email' ? 'Email' : loop.type === 'task' ? 'Task' : 'Draft'}
          </h3>
          <p className="text-sm text-white/50">
            {loop.original_data?.sender_name || loop.original_data?.title || 'Unknown source'}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-3">
        <p className="text-white/90 leading-relaxed">
          "{loop.summary}"
        </p>
        
        {loop.action_required && (
          <p className="text-white/60 text-sm">
            <span className="text-white/40">Action: </span>
            {loop.action_required}
          </p>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {getDeadlineBadge()}
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 text-white/60 text-xs">
          <Minus className="h-3 w-3" />
          Effort: {getEffortLabel()}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Action Buttons */}
      <LoopActionBar
        loopType={loop.type}
        onReply={onReply}
        onConvertToTask={onConvertToTask}
        onSchedule={onSchedule}
        onArchive={onArchive}
        onIgnore={onIgnore}
        isGeneratingDraft={isGeneratingDraft}
      />

      {/* Progress */}
      <div className="text-center">
        <p className="text-xs text-white/40">
          Loop {currentIndex + 1} of {totalInGroup}
        </p>
      </div>
    </div>
  );
};

export default LoopCard;
