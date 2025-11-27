import { platformsByCategory } from "@/config/platforms";

interface ConnectedPlatformsProps {
  connectedPlatforms: string[];
}

const ConnectedPlatforms = ({ connectedPlatforms }: ConnectedPlatformsProps) => {
  if (connectedPlatforms.length === 0) return null;

  const allPlatforms = [
    ...platformsByCategory.phone,
    ...platformsByCategory.messaging,
    ...platformsByCategory.email,
    ...platformsByCategory.social,
  ];

  // Deduplicate connected platforms
  const uniqueConnected = Array.from(new Set(connectedPlatforms));
  
  const connected = allPlatforms.filter((p) =>
    uniqueConnected.includes(p.id)
  );

  if (connected.length === 0) return null;

  return (
    <div className="text-center space-y-3">
      <p className="text-sm font-medium text-slate-200">
        Connected platforms
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {connected.map((platform) => (
          <span
            key={platform.id}
            className="
              inline-flex items-center gap-2
              px-3 py-1.5
              rounded-full
              border border-emerald-400/40
              bg-emerald-500/10
              text-emerald-100 text-xs font-medium
            "
          >
            {platform.icon && (
              <span className="w-4 h-4 flex items-center justify-center">
                {platform.icon}
              </span>
            )}
            <span className="capitalize">{platform.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default ConnectedPlatforms;
