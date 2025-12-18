import { useAssistantReadOnly } from '@/contexts/AssistantReadOnlyContext';
import { Lock } from 'lucide-react';

export const ExecutionLockedTooltip = () => {
  const { tooltipState } = useAssistantReadOnly();

  if (!tooltipState.visible) return null;

  return (
    <div
      className="fixed z-50 pointer-events-none animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        left: tooltipState.x,
        top: tooltipState.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/95 border border-slate-700/50 shadow-lg backdrop-blur-sm">
        <Lock className="w-3 h-3 text-slate-400" />
        <span className="text-xs text-slate-300 whitespace-nowrap">
          Execution unlocks at Operator tier.
        </span>
      </div>
      {/* Arrow */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800/95 border-r border-b border-slate-700/50 rotate-45"
        style={{ bottom: '-4px' }}
      />
    </div>
  );
};

export default ExecutionLockedTooltip;
