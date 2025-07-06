
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Shield, 
  CheckCircle2, 
  Target,
  FileText,
  Bell,
  ListChecks,
  ArrowRight
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EmailProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

const emailProviders: EmailProvider[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: '/lovable-uploads/a2c8e3e8-c0d7-4037-b141-f7ff9328f6c2.png',
    color: 'bg-red-500',
    description: 'Connect your Google account'
  },
  {
    id: 'icloud',
    name: 'iCloud Mail',
    icon: '/lovable-uploads/2eb5e88c-3b6a-409e-989e-0d2494070fd2.png',
    color: 'bg-blue-500',
    description: 'Connect your Apple account'
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook',
    icon: '/lovable-uploads/2d80a266-2f5d-4b3a-99a3-c21f144f2c8f.png',
    color: 'bg-blue-600',
    description: 'Connect your Microsoft account'
  }
];

interface EmailConnectionStepProps {
  onConnect: (provider: string) => void;
  onSkip: () => void;
  connectedProviders: string[];
}

const EmailConnectionStep = ({ onConnect, onSkip, connectedProviders }: EmailConnectionStepProps) => {
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (providerId: string) => {
    setConnecting(providerId);
    
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onConnect(providerId);
    setConnecting(null);
    
    toast({
      title: "🎉 Connected!",
      description: `Successfully connected ${emailProviders.find(p => p.id === providerId)?.name}`,
    });
  };

  const benefits = [
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Import your inbox",
      description: "All emails in one place"
    },
    {
      icon: <Bell className="w-5 h-5" />,
      title: "Summarize new emails daily",
      description: "Never miss important updates"
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "Highlight priority messages",
      description: "Focus on what matters most"
    },
    {
      icon: <ListChecks className="w-5 h-5" />,
      title: "Turn tasks into checklists automatically",
      description: "Action items become trackable"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            📧 STEP 3 — Connect Your Email Accounts
          </h1>
          <p className="text-gray-600 text-lg max-w-lg mx-auto">
            Let's bring all your emails into one clean, distraction-free space. UnclutterAI supports the most popular email services and helps you stay on top of what matters most.
          </p>
        </div>

        <Card className="bg-white/80 backdrop-blur-md border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Tap to connect:</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {emailProviders.map((provider, index) => (
              <div 
                key={provider.id}
                className="flex items-center justify-between p-4 rounded-lg border border-white/20 bg-white/30 backdrop-blur-sm hover:bg-white/40 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-purple-600">{index + 1}️⃣</span>
                    <img 
                      src={provider.icon} 
                      alt={provider.name}
                      className="w-8 h-8"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{provider.name}</h3>
                    <p className="text-sm text-gray-600">{provider.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {connectedProviders.includes(provider.id) ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Button
                      onClick={() => handleConnect(provider.id)}
                      disabled={connecting === provider.id}
                      className={`${provider.color} hover:opacity-90`}
                      size="sm"
                    >
                      {connecting === provider.id ? "Connecting..." : "Connect"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md border-white/20 shadow-lg">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Once connected, we'll:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-green-600">
                    {benefit.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">✅ {benefit.title}</p>
                    <p className="text-sm text-gray-600">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-purple-600" />
              <div>
                <p className="font-medium text-purple-800">🔐 Your emails stay private</p>
                <p className="text-sm text-purple-700">Nothing is read or stored without your permission.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={onSkip}>
            Skip for now
          </Button>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800 mb-2">🎯 Skip the chaos. Sync your inboxes now.</p>
            <Badge variant="secondary">
              {connectedProviders.length} of {emailProviders.length} connected
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConnectionStep;
