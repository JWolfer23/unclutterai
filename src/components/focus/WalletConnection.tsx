import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import { useUCTBalance } from "@/hooks/useUCTBalance";
import { Wallet, Copy, Check, LogOut, Loader2, ArrowUpRight, Clock, Coins } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ClaimUCTModal } from "./ClaimUCTModal";

export const WalletConnection = () => {
  const { 
    walletAddress, 
    walletProvider,
    isConnected, 
    isLoading, 
    connectWallet, 
    disconnectWallet,
    isConnecting,
    isDisconnecting 
  } = usePrivyWallet();
  
  const {
    balance,
    availableBalance,
    pendingBalance,
    onChainBalance,
    isLoadingBalance,
    confirmPending,
    isConfirmingPending,
    requestSettlement,
    isSettling,
  } = useUCTBalance();
  
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (walletAddress) {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/80 border border-white/5">
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          <span className="text-sm text-slate-400">Loading wallet...</span>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="relative p-4 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/80 border border-white/5 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="relative text-center space-y-3">
          <div 
            className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)'
            }}
          >
            <Wallet className="w-6 h-6 text-white" />
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-white">Connect Your Wallet</h4>
            <p className="text-xs text-slate-400 mt-1">
              Link a wallet to hold UCT tokens on-chain
            </p>
          </div>
          
          <Button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative p-4 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/80 border border-white/5 overflow-hidden">
      {/* Success glow */}
      <div className="absolute top-1/2 right-0 w-20 h-20 bg-emerald-500/15 rounded-full blur-3xl" />
      
      <div className="relative space-y-3">
        <div className="flex items-start gap-3">
          <div 
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
            }}
          >
            <Wallet className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-medium">Connected Wallet</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm font-mono text-white">
                {formatAddress(walletAddress!)}
              </p>
              <button 
                onClick={copyAddress}
                className="p-1 rounded-md hover:bg-white/10 transition-colors"
                title="Copy address"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1 capitalize">
              via {walletProvider}
            </p>
          </div>
        </div>
        
        {/* UCT Balance Display */}
        {!isLoadingBalance && (
          <div className="space-y-2 py-2 border-t border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Coins className="w-3 h-3" />
                Available
              </span>
              <span className="text-white font-medium">{availableBalance.toFixed(2)} UCT</span>
            </div>
            {pendingBalance > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Pending
                </span>
                <span className="text-amber-400 font-medium">{pendingBalance.toFixed(2)} UCT</span>
              </div>
            )}
            {onChainBalance > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  On-Chain
                </span>
                <span className="text-emerald-400 font-medium">{onChainBalance.toFixed(2)} UCT</span>
              </div>
            )}
          </div>
        )}
        
        {/* Confirm Pending Button */}
        {pendingBalance > 0 && (
          <Button
            onClick={() => confirmPending()}
            disabled={isConfirmingPending}
            variant="outline"
            size="sm"
            className="w-full border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300"
          >
            {isConfirmingPending ? (
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5 mr-2" />
            )}
            Confirm {pendingBalance.toFixed(2)} UCT
          </Button>
        )}
        
        {/* Settlement Button */}
        {availableBalance >= 1 && walletAddress && (
          <Button
            onClick={() => requestSettlement({ wallet_address: walletAddress })}
            disabled={isSettling}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-0"
            size="sm"
          >
            {isSettling ? (
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
            ) : (
              <ArrowUpRight className="w-3.5 h-3.5 mr-2" />
            )}
            Settle to Wallet
          </Button>
        )}
        
        {/* Claim UCT Button */}
        <ClaimUCTModal />
        
        <Button
          onClick={() => disconnectWallet()}
          disabled={isDisconnecting}
          variant="outline"
          size="sm"
          className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
        >
          {isDisconnecting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
              Disconnecting...
            </>
          ) : (
            <>
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Disconnect Wallet
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
