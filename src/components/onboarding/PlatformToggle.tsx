
import { Switch } from "@/components/ui/switch";
import { Platform } from "@/config/platforms";
import * as LucideIcons from "lucide-react";

interface PlatformToggleProps {
  platform: Platform;
  isConnected: boolean;
  onToggle: (platformId: string) => void;
}

const PlatformToggle = ({ platform, isConnected, onToggle }: PlatformToggleProps) => {
  // Get the icon component from Lucide
  const IconComponent = (LucideIcons as any)[platform.icon];
  
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-white/20 bg-white/30 backdrop-blur-sm">
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-full ${platform.color} flex items-center justify-center text-white`}>
          {IconComponent && <IconComponent className="w-5 h-5" />}
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
