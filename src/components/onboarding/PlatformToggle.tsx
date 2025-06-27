
import { Switch } from "@/components/ui/switch";
import { Platform } from "@/config/platforms";

interface PlatformToggleProps {
  platform: Platform;
  isConnected: boolean;
  onToggle: (platformId: string) => void;
}

const PlatformToggle = ({ platform, isConnected, onToggle }: PlatformToggleProps) => {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-white/20 bg-white/30 backdrop-blur-sm">
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-full ${platform.color} flex items-center justify-center text-white`}>
          {platform.icon}
        </div>
        <div>
          <h3 className="font-medium text-gray-800">{platform.name}</h3>
          {platform.description && (
            <p className="text-sm text-gray-600">{platform.description}</p>
          )}
        </div>
      </div>
      <Switch 
        checked={isConnected}
        onCheckedChange={() => onToggle(platform.id)}
      />
    </div>
  );
};

export default PlatformToggle;
