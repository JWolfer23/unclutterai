import { QUICK_COMMANDS } from "@/lib/voiceCommands";

interface QuickCommandsProps {
  onSelect: (command: string) => void;
  disabled?: boolean;
}

export const QuickCommands = ({ onSelect, disabled }: QuickCommandsProps) => {
  return (
    <div className="space-y-3">
      <p className="text-xs text-white/40 uppercase tracking-wider text-center">
        Quick Commands
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {QUICK_COMMANDS.map((item) => (
          <button
            key={item.command}
            onClick={() => onSelect(item.command)}
            disabled={disabled}
            className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm
                       hover:bg-white/10 hover:border-white/20 hover:text-white
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
