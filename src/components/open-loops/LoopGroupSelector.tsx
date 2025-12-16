import { Zap, Target, Clock, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoopInventory } from "@/hooks/useOpenLoops";

interface LoopGroupSelectorProps {
  inventory: LoopInventory;
  onSelectGroup: (group: keyof LoopInventory['groups']) => void;
  onStartQuickCloses: () => void;
}

const LoopGroupSelector = ({ inventory, onSelectGroup, onStartQuickCloses }: LoopGroupSelectorProps) => {
  const groups = [
    {
      key: 'quick_closes' as const,
      label: 'Quick Closes',
      description: '≤2 min each',
      icon: Zap,
      color: 'emerald',
      count: inventory.groups.quick_closes.length
    },
    {
      key: 'decisions_needed' as const,
      label: 'Decisions Needed',
      description: 'Requires thought',
      icon: Target,
      color: 'amber',
      count: inventory.groups.decisions_needed.length
    },
    {
      key: 'waiting_on_others' as const,
      label: 'Waiting on Others',
      description: 'Follow up later',
      icon: Clock,
      color: 'blue',
      count: inventory.groups.waiting_on_others.length
    },
    {
      key: 'noise' as const,
      label: 'Noise',
      description: 'Low priority',
      icon: VolumeX,
      color: 'slate',
      count: inventory.groups.noise.length
    }
  ];

  const colorStyles = {
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    slate: 'bg-slate-500/10 border-slate-500/30 text-slate-400'
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 px-6 py-8">
      <div className="max-w-lg mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-white">Loop Inventory</h1>
          <p className="text-white/50 text-sm">
            {inventory.total_count} items · ~{inventory.estimated_clear_time_minutes} min to clear
          </p>
        </div>

        {/* Group Cards */}
        <div className="space-y-3">
          {groups.map((group) => (
            <button
              key={group.key}
              onClick={() => onSelectGroup(group.key)}
              disabled={group.count === 0}
              className={`w-full p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                group.count > 0 
                  ? `${colorStyles[group.color]} hover:scale-[1.02] cursor-pointer` 
                  : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${group.count > 0 ? colorStyles[group.color] : 'bg-white/5'}`}>
                  <group.icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-white">{group.label}</p>
                  <p className="text-xs text-white/50">{group.description}</p>
                </div>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold ${
                group.count > 0 ? colorStyles[group.color] : 'bg-white/5 text-white/40'
              }`}>
                {group.count}
              </div>
            </button>
          ))}
        </div>

        {/* Start Button */}
        {inventory.groups.quick_closes.length > 0 && (
          <Button
            onClick={onStartQuickCloses}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-lg"
          >
            Start with Quick Closes →
          </Button>
        )}

        {inventory.total_count === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-medium text-white mb-2">All Clear!</h2>
            <p className="text-white/50">No open loops found. You're already uncluttered.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoopGroupSelector;
