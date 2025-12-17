import { Archive, Mail, Calendar, FileText, Send, CheckCircle, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActionLogEntry as ActionLogEntryType, ActionType } from '@/hooks/useActionLog';
import { formatDistanceToNow } from 'date-fns';

interface ActionLogEntryProps {
  action: ActionLogEntryType;
  onUndo?: (actionId: string) => void;
  isUndoing?: boolean;
}

const getActionIcon = (actionType: ActionType) => {
  switch (actionType) {
    case 'archive':
      return <Archive className="w-4 h-4 text-emerald-400" />;
    case 'draft_created':
      return <FileText className="w-4 h-4 text-blue-400" />;
    case 'schedule':
      return <Calendar className="w-4 h-4 text-purple-400" />;
    case 'ignore':
      return <CheckCircle className="w-4 h-4 text-slate-400" />;
    case 'auto_reply':
      return <Send className="w-4 h-4 text-cyan-400" />;
    case 'task_created':
      return <Mail className="w-4 h-4 text-amber-400" />;
    default:
      return <CheckCircle className="w-4 h-4 text-slate-400" />;
  }
};

const getSourceLabel = (source: string) => {
  switch (source) {
    case 'focus_session':
      return 'Focus Session';
    case 'unclutter':
      return 'Unclutter';
    case 'auto_response':
      return 'Auto Response';
    case 'manual':
      return 'Manual';
    default:
      return source;
  }
};

export const ActionLogEntry = ({ action, onUndo, isUndoing }: ActionLogEntryProps) => {
  const isUndone = !!action.undoneAt;
  const canUndo = action.isUndoable && !isUndone;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 transition-opacity ${isUndone ? 'opacity-50' : ''}`}>
      <div className="flex-shrink-0 mt-0.5">
        {getActionIcon(action.actionType)}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm text-white/90 ${isUndone ? 'line-through' : ''}`}>
          {action.what}
        </p>
        
        {action.why && (
          <p className="text-xs text-slate-400 mt-1">
            {action.why}
          </p>
        )}
        
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-slate-500">
            {getSourceLabel(action.source)}
          </span>
          <span className="text-xs text-slate-600">•</span>
          <span className="text-xs text-slate-500">
            {formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}
          </span>
          {isUndone && (
            <>
              <span className="text-xs text-slate-600">•</span>
              <span className="text-xs text-amber-400">Undone</span>
            </>
          )}
        </div>
      </div>

      {canUndo && onUndo && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onUndo(action.id)}
          disabled={isUndoing}
          className="flex-shrink-0 text-slate-400 hover:text-white hover:bg-white/10"
        >
          <Undo2 className="w-4 h-4 mr-1" />
          Undo
        </Button>
      )}
    </div>
  );
};
