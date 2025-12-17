import { ArrowLeft, History, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useActionLog } from '@/hooks/useActionLog';
import { ActionLogGroup } from '@/components/action-log/ActionLogGroup';
import { toast } from "@/components/ui/sonner";
import { isToday, isYesterday, isThisWeek, format } from 'date-fns';

const WhatIHandled = () => {
  const navigate = useNavigate();
  const { actions, isLoading, undoAction, isUndoing, getActionsByDay } = useActionLog();

  const handleUndo = async (actionId: string) => {
    const success = await undoAction(actionId);
    if (success) {
      toast.success('Undone.');
    } else {
      toast.error('Could not undo this action.');
    }
  };

  const actionsByDay = getActionsByDay();
  const sortedDays = Object.keys(actionsByDay).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const getDayLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'MMM d, yyyy');
  };

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <History className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">What I Handled</h1>
            <p className="text-sm text-slate-400">Review assistant actions</p>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full" />
        </div>
      ) : actions.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-400">No actions today.</p>
          <p className="text-sm text-slate-500 mt-1">
            Actions will appear here as your assistant handles items.
          </p>
        </div>
      ) : (
        <div>
          {sortedDays.map(day => (
            <ActionLogGroup
              key={day}
              title={getDayLabel(day)}
              actions={actionsByDay[day]}
              onUndo={handleUndo}
              isUndoing={isUndoing}
              defaultExpanded={isToday(new Date(day)) || isYesterday(new Date(day))}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default WhatIHandled;
