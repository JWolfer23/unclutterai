import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Coins, Wallet, Shield, Database, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import UCTRewards from "@/components/crypto/UCTRewards";
import WalletConnectPanel from "@/components/crypto/WalletConnectPanel";
import BlockchainLogs from "@/components/crypto/BlockchainLogs";
import DataVaultOptIn from "@/components/crypto/DataVaultOptIn";
import ComingSoonAgentNetwork from "@/components/crypto/ComingSoonAgentNetwork";

const CryptoIntegration = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
          <div className="flex items-center gap-4">
            <div className="metric-icon metric-icon--tokens">
              <Coins className="metric-icon__glyph" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Crypto Integration</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Gamify your productivity with tokenized rewards and blockchain-backed features
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="rewards" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              <span className="hidden sm:inline">UCT Rewards</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Wallet</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Blockchain Logs</span>
            </TabsTrigger>
            <TabsTrigger value="vault" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Data Vault</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">Agent Network</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rewards">
            <UCTRewards />
          </TabsContent>

          <TabsContent value="wallet">
            <WalletConnectPanel />
          </TabsContent>

          <TabsContent value="logs">
            <BlockchainLogs />
          </TabsContent>

          <TabsContent value="vault">
            <DataVaultOptIn />
          </TabsContent>

          <TabsContent value="agents">
            <ComingSoonAgentNetwork />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CryptoIntegration;