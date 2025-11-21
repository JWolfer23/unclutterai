
import { Switch } from "@/components/ui/switch";
import { Platform } from "@/config/platforms";

interface PlatformToggleProps {
  platform: Platform;
  isConnected: boolean;
  onToggle: (platformId: string) => void;
}

const PlatformToggle = ({ platform, isConnected, onToggle }: PlatformToggleProps) => {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-full ${platform.color} flex items-center justify-center text-white shadow-sm`}>
          {platform.icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{platform.name}</h3>
          {platform.description && (
            <p className="text-xs text-gray-600">{platform.description}</p>
          )}
        </div>
      </div>
      <Switch 
        checked={isConnected}
        onCheckedChange={() => onToggle(platform.id)}
        className="data-[state=checked]:bg-[#A855F7]"
      />
    </div>
  );
};

export default PlatformToggle;
