
import { Switch } from "@/components/ui/switch";
import { Platform } from "@/config/platforms";

interface PlatformToggleProps {
  platform: Platform;
  isConnected: boolean;
  onToggle: (platformId: string) => void;
}

const PlatformToggle = ({ platform, isConnected, onToggle }: PlatformToggleProps) => {
  return (
    <div className="flex items-center justify-between p-4 rounded-[16px] border border-gray-200/50 bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] hover:bg-gray-50/50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className={`w-11 h-11 rounded-full ${platform.color} flex items-center justify-center text-white shadow-sm`}>
          {platform.icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-[15px]">{platform.name}</h3>
          {platform.description && (
            <p className="text-[13px] text-gray-600">{platform.description}</p>
          )}
        </div>
      </div>
      <Switch 
        checked={isConnected}
        onCheckedChange={() => onToggle(platform.id)}
        className="data-[state=checked]:bg-white data-[state=unchecked]:bg-gray-200 [&>span]:bg-[#0A0A0A] [&>span]:shadow-md"
      />
    </div>
  );
};

export default PlatformToggle;
