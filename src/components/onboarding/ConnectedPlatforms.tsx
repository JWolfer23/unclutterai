import { platformsByCategory } from "@/config/platforms";

interface ConnectedPlatformsProps {
  connectedPlatforms: string[];
}
import { platformsByCategory } from "@/config/platforms";
import { pillTag } from "@/ui/styles";

interface ConnectedPlatformsProps {
  connectedPlatforms: string[];
}

const ConnectedPlatforms = ({ connectedPlatforms }: ConnectedPlatformsProps) => {
  if (connectedPlatforms.length === 0) return null;

  // Get all platforms from all categories
  const allPlatforms = [
    ...platformsByCategory.phone,
    ...platformsByCategory.messaging,
    ...platformsByCategory.email,
    ...platformsByCategory.social,
  ];

  // Only show the ones that are actually connected
  const connected = allPlatforms.filter((p) => connectedPlatforms.includes(p.id));

  if (connected.length === 0) return null;

  return (
    <div className="text-center space-y-3">
      <p className="text-sm font-medium text-gray-700">Connected platforms</p>

      <div className="flex flex-wrap justify-center gap-2">
        {connected.map((platform) => (
          <span key={platform.id} className={pillTag}>
            {platform.icon && <span className="w-4 h-4 flex items-center justify-center">{platform.icon}</span>}
            <span className="text-xs sm:text-sm font-medium">{platform.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default ConnectedPlatforms;
const ConnectedPlatforms = ({ connectedPlatforms }: ConnectedPlatformsProps) => {
  if (connectedPlatforms.length === 0) return null;

  // Get all platforms
  const allPlatforms = [
    ...platformsByCategory.phone,
    ...platformsByCategory.messaging,
    ...platformsByCategory.email,
    ...platformsByCategory.social,
  ];

  // Filter to show only connected ones
  const connected = allPlatforms.filter((p) => connectedPlatforms.includes(p.id));

  return (
    <div className="text-center space-y-3">
      <p className="text-sm font-medium text-gray-600">Connected Platforms</p>
      <div className="flex flex-wrap justify-center gap-2">
        {connected.map((platform) => (
          <div
            key={platform.id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm"
          >
            <div className="w-4 h-4 flex items-center justify-center">{platform.icon}</div>
            <span className="text-xs font-medium text-gray-700">{platform.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConnectedPlatforms;
