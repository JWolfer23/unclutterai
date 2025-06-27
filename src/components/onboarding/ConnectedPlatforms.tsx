
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <Card className="bg-white/60 backdrop-blur-md border-white/20">
      <CardContent className="pt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Connected Platforms</h3>
        <div className="flex flex-wrap gap-2">
          {connectedPlatforms.map(platformId => (
            <Badge key={platformId} variant="secondary" className="bg-green-100 text-green-700">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {getPlatformName(platformId)}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectedPlatforms;
