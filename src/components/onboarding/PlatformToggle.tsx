import { ReactNode } from "react";

interface PlatformConfig {
  id: string;
  name: string;
  description?: string;
  icon?: ReactNode;
}

interface PlatformToggleProps {
  platform: PlatformConfig;
  isConnected: boolean;
  onToggle: (platformId: string) => void;
}

const PlatformToggle = ({
  platform,
  isConnected,
  onToggle,
}: PlatformToggleProps) => {
  const handleClick = () => {
    onToggle(platform.id);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="
        w-full flex items-center justify-between
        rounded-2xl
        bg-white/5
        px-4 py-3.5
        border border-white/12
        shadow-[0_10px_30px_rgba(0,0,0,0.45)]
        hover:shadow-[0_14px_40px_rgba(0,0,0,0.65)]
        transition-all duration-150
        active:scale-[0.98]
        text-left
      "
    >
      {/* Left: icon + text */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="
            h-10 w-10 flex items-center justify-center
            rounded-xl
            bg-gradient-to-br from-slate-900 to-slate-800
            border border-white/10
            shadow-inner
          "
        >
          {platform.icon ? (
            platform.icon
          ) : (
            <span className="text-sm font-semibold text-slate-100">
              {platform.name.charAt(0)}
            </span>
          )}
        </div>

        <div className="space-y-0.5 overflow-hidden">
          <p className="text-sm font-semibold text-slate-50 truncate">
            {platform.name}
          </p>
          {platform.description && (
            <p className="text-xs text-slate-300 truncate">
              {platform.description}
            </p>
          )}
        </div>
      </div>

      {/* Right: iOS-style toggle */}
      <div
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors duration-200 ease-out
          ${isConnected ? "bg-emerald-500" : "bg-slate-500/70"}
        `}
        aria-hidden="true"
      >
        <span
          className={`
            inline-block h-5 w-5 transform rounded-full bg-white
            shadow-sm transition-transform duration-200 ease-out
            ${isConnected ? "translate-x-[20px]" : "translate-x-[2px]"}
          `}
        />
      </div>
    </button>
  );
};

export default PlatformToggle;
