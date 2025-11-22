import { ReactNode } from "react";

interface PlatformConfig {
  id: string;
  name: string;
  description?: string;
  icon?: ReactNode; // can be a React element OR a string name
}

interface PlatformToggleProps {
  platform: PlatformConfig;
  isConnected: boolean;
  onToggle: (platformId: string) => void;
}

const PlatformToggle = ({ platform, isConnected, onToggle }: PlatformToggleProps) => {
  const handleClick = () => {
    onToggle(platform.id);
  };

  // Safely render icon:
  // - if it's a React node → render it
  // - if it's a string (e.g. "MessageCircle") → ignore and use first letter fallback
  const renderIcon = () => {
    if (!platform.icon || typeof platform.icon === "string") {
      return (
        <span className="text-sm font-semibold text-white/70">
          {platform.name.charAt(0)}
        </span>
      );
    }

    return platform.icon;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="
        w-full flex items-center justify-between
        rounded-2xl bg-[#0b0c10]
        px-4 py-3.5
        border border-white/10
        shadow-[0_18px_45px_rgba(0,0,0,0.65)]
        hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(0,0,0,0.85)]
        transition-all duration-150
      "
    >
      {/* Left: Icon + Text */}
      <div className="flex items-center gap-3 text-left">
        {/* Icon bubble */}
        <div
          className="
            flex h-10 w-10 items-center justify-center
            rounded-xl
            bg-gradient-to-br from-slate-900 to-slate-800
            border border-white/10
            shadow-[0_0_18px_rgba(15,23,42,0.8)]
          "
        >
          {renderIcon()}
        </div>

        {/* Name + description */}
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-white">{platform.name}</p>
          {platform.description && (
            <p className="text-xs text-white/55">{platform.description}</p>
          )}
        </div>
      </div>

      {/* Right: iOS-style toggle */}
      <div
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors duration-150
          ${isConnected ? "bg-emerald-400" : "bg-slate-600"}
        `}
        aria-hidden="true"
      >
        <span
          className={`
            inline-block h-5 w-5 transform rounded-full bg-white
            shadow-sm transition-transform duration-150
            ${isConnected ? "translate-x-[20px]" : "translate-x-[2px]"}
          `}
        />
      </div>
    </button>
  );
};

export default PlatformToggle;
