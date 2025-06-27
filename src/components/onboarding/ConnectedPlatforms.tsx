
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface ConnectedPlatformsProps {
  connectedPlatforms: string[];
}

const ConnectedPlatforms = ({ connectedPlatforms }: ConnectedPlatformsProps) => {
  if (connectedPlatforms.length === 0) return null;

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'gmail': return 'Gmail';
      case 'slack': return 'Slack';
      case 'apple-mail': return 'Apple Mail';
      default: return platform;
    }
  };

  return (
    <Card className="bg-white/60 backdrop-blur-md border-white/20">
      <CardContent className="pt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Connected Platforms</h3>
        <div className="flex flex-wrap gap-2">
          {connectedPlatforms.map(platform => (
            <Badge key={platform} variant="secondary" className="bg-green-100 text-green-700">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {getPlatformName(platform)}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectedPlatforms;
