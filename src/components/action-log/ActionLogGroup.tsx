import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ActionLogEntry as ActionLogEntryType } from '@/hooks/useActionLog';
import { ActionLogEntry } from './ActionLogEntry';

interface ActionLogGroupProps {
  title: string;
  actions: ActionLogEntryType[];
  onUndo: (actionId: string) => void;
  isUndoing: boolean;
  defaultExpanded?: boolean;
}

export const ActionLogGroup = ({
  title,
  actions,
  onUndo,
  isUndoing,
  defaultExpanded = true,
}: ActionLogGroupProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (actions.length === 0) return null;

  const activeCount = actions.filter(a => !a.undoneAt).length;

  return (
    <div className="mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-2 px-1 text-left hover:bg-white/5 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-white/80">{title}</h3>
          <span className="text-xs text-slate-500">
            {activeCount} action{activeCount !== 1 ? 's' : ''}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="space-y-2 mt-3">
          {actions.map(action => (
            <ActionLogEntry
              key={action.id}
              action={action}
              onUndo={onUndo}
              isUndoing={isUndoing}
            />
          ))}
        </div>
      )}
    </div>
  );
};
