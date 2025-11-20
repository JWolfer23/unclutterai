import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/useWallet";
import { useTokens } from "@/hooks/useTokens";
import { Wallet, Coins, TrendingUp, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const WalletSection = () => {
  const { walletAddress, isConnected, isLoading, connectWallet, disconnectWallet, isConnecting } = useWallet();
  const { balance } = useTokens();

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Wallet className="w-5 h-5 text-blue-600" />
          <span>Wallet</span>
          {isConnected && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Connected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="text-center py-6">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
            <p className="text-sm text-gray-600 mb-4">
              Connect your wallet to view your UCT token balance and earn rewards
            </p>
            <Button 
              onClick={() => connectWallet()}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Wallet Address */}
            <div className="p-3 bg-gray-50/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Wallet Address</p>
                  <p className="font-mono text-sm text-gray-900">
                    {formatAddress(walletAddress!)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyAddress}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* UCT Balance */}
            <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-600 mb-1">UCT Balance</p>
                  <div className="flex items-center space-x-2">
                    <Coins className="w-4 h-4 text-purple-600" />
                    <span className="text-lg font-bold text-purple-900">{balance}</span>
                    <span className="text-sm text-purple-600">UCT</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-green-600">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs">Earning</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet Actions */}
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" className="flex-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                Trade
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => disconnectWallet()}
                className="flex-1"
              >
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletSection;