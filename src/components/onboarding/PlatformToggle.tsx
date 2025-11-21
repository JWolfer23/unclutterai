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

const PlatformToggle = ({ platform, isConnected, onToggle }: PlatformToggleProps) => {
  const handleClick = () => {
    onToggle(platform.id);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="
        w-full flex items-center justify-between
        rounded-[20px]
        bg-white 
        px-4 py-3.5
        border border-gray-200
        shadow-[0_8px_24px_rgba(15,23,42,0.04)]
        hover:shadow-[0_12px_32px_rgba(15,23,42,0.10)]
        transition-all duration-150
        active:scale-[0.98]
        text-left
      "
    >
      {/* Left side: icon + name + description */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Icon bubble */}
        <div
          className="
            h-10 w-10 flex items-center justify-center 
            rounded-xl
            bg-gradient-to-br from-white to-gray-50
            border border-gray-200
            shadow-inner
          "
        >
          {platform.icon ? (
            platform.icon
          ) : (
            <span className="text-sm font-semibold text-gray-500">{platform.name.charAt(0)}</span>
          )}
        </div>

        <div className="space-y-0.5 overflow-hidden">
          <p className="text-sm font-semibold text-gray-900 truncate">{platform.name}</p>
          {platform.description && <p className="text-xs text-gray-500 truncate">{platform.description}</p>}
        </div>
      </div>

      {/* Right: iOS-style toggle */}
      <div
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors duration-200 ease-out
          ${isConnected ? "bg-emerald-500" : "bg-gray-300"}
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
