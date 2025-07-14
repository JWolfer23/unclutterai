import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Wallet, Crown, Copy, CheckCircle, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const WalletConnectPanel = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [hasOGNFT, setHasOGNFT] = useState(false);
  const [useWalletIdentity, setUseWalletIdentity] = useState(false);

  const walletProviders = [
    { name: "MetaMask", icon: "🦊", color: "bg-orange-500" },
    { name: "WalletConnect", icon: "🔗", color: "bg-blue-500" },
    { name: "Phantom", icon: "👻", color: "bg-purple-500" },
  ];

  const connectWallet = async (provider: string) => {
    // Mock wallet connection
    setTimeout(() => {
      const mockAddress = "0x742d...E8f3";
      setWalletAddress(mockAddress);
      setIsConnected(true);
      setHasOGNFT(Math.random() > 0.5); // Random OG NFT ownership
      
      toast({
        title: "Wallet Connected!",
        description: `Connected to ${provider} successfully`,
      });
    }, 1000);
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress("");
    setHasOGNFT(false);
    setUseWalletIdentity(false);
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  if (!isConnected) {
    return (
      <Card className="animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Wallet className="h-6 w-6" />
            Connect Your Wallet
          </CardTitle>
          <CardDescription>
            Connect your wallet to access blockchain features and earn UCT tokens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {walletProviders.map((provider) => (
              <Button
                key={provider.name}
                variant="outline"
                className="h-auto p-4 flex items-center justify-between"
                onClick={() => connectWallet(provider.name)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${provider.color} bg-opacity-20 text-lg`}>
                    {provider.icon}
                  </div>
                  <span className="font-medium">{provider.name}</span>
                </div>
                <ExternalLink className="h-4 w-4" />
              </Button>
            ))}
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            Don't have a wallet? Download one from the links above
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connected Wallet Info */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Wallet Connected
          </CardTitle>
          <CardDescription>Your wallet is connected and ready to use</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-full">
                <Wallet className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <div className="font-medium">Connected Address</div>
                <div className="text-sm text-muted-foreground font-mono">{walletAddress}</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={copyAddress}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {hasOGNFT && (
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
              <Crown className="h-5 w-5 text-yellow-600" />
              <div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  OG Member
                </Badge>
                <div className="text-sm text-yellow-700 mt-1">
                  You own an UnclutterAI Genesis NFT! Enjoy exclusive perks.
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="wallet-identity">Use wallet-based identity</Label>
              <div className="text-sm text-muted-foreground">
                Use your wallet address as your primary identity
              </div>
            </div>
            <Switch
              id="wallet-identity"
              checked={useWalletIdentity}
              onCheckedChange={setUseWalletIdentity}
            />
          </div>

          <Button variant="outline" onClick={disconnectWallet} className="w-full">
            Disconnect Wallet
          </Button>
        </CardContent>
      </Card>

      {/* Wallet Benefits */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Wallet Benefits</CardTitle>
          <CardDescription>What you can do with your connected wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">Earn UCT Tokens</div>
                <div className="text-sm text-muted-foreground">Receive tokens directly to your wallet</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">Verified Actions</div>
                <div className="text-sm text-muted-foreground">All AI actions are logged on-chain</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">Data Ownership</div>
                <div className="text-sm text-muted-foreground">Control your data with smart contracts</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletConnectPanel;