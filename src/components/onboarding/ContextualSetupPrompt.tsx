
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Twitter, 
  Sparkles,
  ArrowRight 
} from "lucide-react";

interface ContextualSetupPromptProps {
  platform: string;
  feature: string;
  onConnect: (platform: string) => void;
  onDismiss: () => void;
}

const platformConfig = {
  whatsapp: {
    icon: <Phone className="w-5 h-5" />,
    name: "WhatsApp",
    color: "bg-green-500",
    description: "to summarize your voice messages and group chats"
  },
  slack: {
    icon: <MessageSquare className="w-5 h-5" />,
    name: "Slack",
    color: "bg-purple-500", 
    description: "to organize team conversations and mentions"
  },
  gmail: {
    icon: <Mail className="w-5 h-5" />,
    name: "Gmail",
    color: "bg-red-500",
    description: "to manage your inbox and find important emails"
  },
  twitter: {
    icon: <Twitter className="w-5 h-5" />,
    name: "Twitter",
    color: "bg-blue-500",
    description: "to track mentions and important updates"
  }
};

const ContextualSetupPrompt = ({ 
  platform, 
  feature, 
  onConnect, 
  onDismiss 
}: ContextualSetupPromptProps) => {
  const config = platformConfig[platform as keyof typeof platformConfig];
  
  if (!config) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-md border-white/20 shadow-2xl">
        <CardHeader className="text-center">
          <div className={`w-16 h-16 rounded-full ${config.color} flex items-center justify-center mx-auto mb-4 text-white`}>
            {config.icon}
          </div>
          <CardTitle className="text-xl">Great idea!</CardTitle>
          <p className="text-gray-600 text-sm">
            Connect {config.name} once and I'll handle the rest.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">What you'll get:</span>
            </div>
            <p className="text-sm text-purple-700">
              Connect {config.name} {config.description}, plus automatic organization and smart summaries.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => onConnect(platform)}
              className={`w-full ${config.color} hover:opacity-90`}
              size="lg"
            >
              {config.icon}
              <span className="ml-2">Connect {config.name}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onDismiss}
              className="w-full"
            >
              Maybe later
            </Button>
          </div>

          <div className="text-center">
            <Badge variant="secondary" className="text-xs">
              Setup takes less than 30 seconds
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContextualSetupPrompt;
