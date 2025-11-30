import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
            <div className="metric-icon metric-icon--tokens animate-pulse">
              <Coins className="metric-icon__glyph" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-500 bg-clip-text text-transparent">
                Crypto Integration
              </h1>
              <p className="text-slate-300 text-sm mt-1 font-medium">
                Gamify your productivity with tokenized rewards and blockchain-backed features
              </p>
            </div>
          </div>
        </div>

        {/* Premium Tabs */}
        <Tabs defaultValue="rewards" className="space-y-8">
          <div className="learning-tabs">
            <TabsList className="grid w-full grid-cols-5 bg-transparent border-0">
              <TabsTrigger 
                value="rewards" 
                className="learning-tab-trigger flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400/20 data-[state=active]:to-orange-400/20"
              >
                <Coins className="h-4 w-4" />
                <span className="hidden sm:inline">UCT Rewards</span>
              </TabsTrigger>
              <TabsTrigger 
                value="wallet" 
                className="learning-tab-trigger flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-400/20 data-[state=active]:to-blue-400/20"
              >
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Wallet</span>
              </TabsTrigger>
              <TabsTrigger 
                value="logs" 
                className="learning-tab-trigger flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-400/20 data-[state=active]:to-blue-400/20"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Blockchain Logs</span>
              </TabsTrigger>
              <TabsTrigger 
                value="vault" 
                className="learning-tab-trigger flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400/20 data-[state=active]:to-emerald-400/20"
              >
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">Data Vault</span>
              </TabsTrigger>
              <TabsTrigger 
                value="agents" 
                className="learning-tab-trigger flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-400/20 data-[state=active]:to-purple-400/20"
              >
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">Agent Network</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="rewards" className="animate-fade-in">
            <UCTRewards />
          </TabsContent>

          <TabsContent value="wallet" className="animate-fade-in">
            <WalletConnectPanel />
          </TabsContent>

          <TabsContent value="logs" className="animate-fade-in">
            <BlockchainLogs />
          </TabsContent>

          <TabsContent value="vault" className="animate-fade-in">
            <DataVaultOptIn />
          </TabsContent>

          <TabsContent value="agents" className="animate-fade-in">
            <ComingSoonAgentNetwork />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CryptoIntegration;