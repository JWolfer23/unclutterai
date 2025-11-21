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
      className="w-full flex items-center justify-between rounded-2xl bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] border border-gray-100 px-4 py-3.5 transition-transform transition-shadow duration-150 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
    >
      {/* Left: Icon + Text */}
      <div className="flex items-center gap-3 text-left">
        {/* Icon bubble */}
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-gray-200 shadow-inner">
          {platform.icon ? (
            platform.icon
          ) : (
            <span className="text-sm font-semibold text-gray-500">{platform.name.charAt(0)}</span>
          )}
        </div>

        {/* Name + description */}
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-gray-900">{platform.name}</p>
          {platform.description && <p className="text-xs text-gray-500">{platform.description}</p>}
        </div>
      </div>

      {/* Right: iOS-style toggle */}
      <div
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isConnected ? "bg-emerald-500" : "bg-gray-300"
        }`}
        aria-hidden="true"
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-150 ${
            isConnected ? "translate-x-[20px]" : "translate-x-[2px]"
          }`}
        />
      </div>
    </button>
  );
};

export default PlatformToggle;
