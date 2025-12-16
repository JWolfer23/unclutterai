import { Reply, ListPlus, Calendar, Archive, SkipForward, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoopActionBarProps {
  loopType: 'email' | 'task' | 'draft';
  onReply: () => void;
  onConvertToTask: () => void;
  onSchedule: () => void;
  onArchive: () => void;
  onIgnore: () => void;
  isGeneratingDraft: boolean;
}

const LoopActionBar = ({
  loopType,
  onReply,
  onConvertToTask,
  onSchedule,
  onArchive,
  onIgnore,
  isGeneratingDraft
}: LoopActionBarProps) => {
  const actions = [
    {
      key: 'reply',
      label: 'Reply',
      icon: Reply,
      onClick: onReply,
      show: loopType === 'email',
      variant: 'default' as const,
      loading: isGeneratingDraft
    },
    {
      key: 'task',
      label: 'Task',
      icon: ListPlus,
      onClick: onConvertToTask,
      show: true,
      variant: 'ghost' as const
    },
    {
      key: 'schedule',
      label: 'Sched',
      icon: Calendar,
      onClick: onSchedule,
      show: true,
      variant: 'ghost' as const
    },
    {
      key: 'archive',
      label: 'Arch',
      icon: Archive,
      onClick: onArchive,
      show: true,
      variant: 'ghost' as const
    },
    {
      key: 'ignore',
      label: 'Skip',
      icon: SkipForward,
      onClick: onIgnore,
      show: true,
      variant: 'ghost' as const
    }
  ];

  return (
    <div className="flex items-center justify-center gap-2">
      {actions
        .filter(action => action.show)
        .map(action => (
          <Button
            key={action.key}
            variant={action.variant}
            onClick={action.onClick}
            disabled={action.loading}
            className={`flex-1 flex flex-col items-center gap-1 h-auto py-3 rounded-xl ${
              action.variant === 'default'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white'
                : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-0'
            }`}
          >
            {action.loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <action.icon className="h-4 w-4" />
            )}
            <span className="text-xs">{action.label}</span>
          </Button>
        ))}
    </div>
  );
};

export default LoopActionBar;
