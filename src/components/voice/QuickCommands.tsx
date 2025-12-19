import { QUICK_COMMANDS } from "@/lib/voiceCommands";
import { cn } from "@/lib/utils";

interface QuickCommandsProps {
  onSelect: (command: string) => void;
  disabled?: boolean;
  highlighted?: boolean;
}

export const QuickCommands = ({ onSelect, disabled, highlighted }: QuickCommandsProps) => {
  return (
    <div className={cn(
      "space-y-3 transition-all duration-300",
      highlighted && "p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 animate-pulse"
    )}>
      <p className={cn(
        "text-xs uppercase tracking-wider text-center",
        highlighted ? "text-cyan-400 font-medium" : "text-white/40"
      )}>
        {highlighted ? "Tap a Command" : "Quick Commands"}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {QUICK_COMMANDS.map((item) => (
          <button
            key={item.command}
            onClick={() => onSelect(item.command)}
            disabled={disabled}
            className={cn(
              "px-4 py-2 rounded-full text-sm transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              highlighted 
                ? "bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 hover:bg-cyan-500/30 hover:text-white font-medium"
                : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20 hover:text-white"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
