
import { CheckCircle2 } from "lucide-react";
import { platformsByCategory } from "@/config/platforms";

interface ConnectedPlatformsProps {
  connectedPlatforms: string[];
}

const ConnectedPlatforms = ({ connectedPlatforms }: ConnectedPlatformsProps) => {
  if (connectedPlatforms.length === 0) return null;

  const getPlatformName = (platformId: string) => {
    const allPlatforms = [
      ...platformsByCategory.phone,
      ...platformsByCategory.messaging,
      ...platformsByCategory.email,
      ...platformsByCategory.social
    ];
    
    const platform = allPlatforms.find(p => p.id === platformId);
    return platform?.name || platformId;
  };

  return (
    <div className="mt-6">
      <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-[20px] shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Connected Platforms</h3>
        <div className="flex flex-wrap gap-2">
          {connectedPlatforms.map(platformId => (
            <div 
              key={platformId} 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-sm font-medium text-green-700"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{getPlatformName(platformId)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConnectedPlatforms;
