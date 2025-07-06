
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EmailConnectionStep from "@/components/onboarding/EmailConnectionStep";
import { useOnboarding } from "@/hooks/useOnboarding";
import { toast } from "@/hooks/use-toast";

const EmailSetup = () => {
  const navigate = useNavigate();
  const { connectPlatform } = useOnboarding();
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);

  const handleConnect = (provider: string) => {
    setConnectedProviders(prev => [...prev, provider]);
    connectPlatform(provider);
    
    // Simulate successful connection
    toast({
      title: "Email Connected!",
      description: `Your ${provider} account is now connected to UnclutterAI.`,
    });
  };

  const handleSkip = () => {
    toast({
      title: "Email Setup Skipped",
      description: "You can connect your email accounts later in settings.",
    });
    navigate("/");
  };

  return (
    <EmailConnectionStep
      onConnect={handleConnect}
      onSkip={handleSkip}
      connectedProviders={connectedProviders}
    />
  );
};

export default EmailSetup;
