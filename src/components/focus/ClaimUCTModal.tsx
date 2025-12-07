import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTokens } from "@/hooks/useTokens";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import { useClaimUCT } from "@/hooks/useClaimUCT";
import { Coins, Wallet, AlertCircle, CheckCircle, ExternalLink, Loader2, ArrowRight, Clock } from "lucide-react";

export const ClaimUCTModal = () => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'confirming' | 'success' | 'rate-limited'>('input');
  const [rateLimitMinutes, setRateLimitMinutes] = useState(0);
  
  const { balance, isLoading: balanceLoading } = useTokens();
  const { walletAddress, isConnected, isLoading: walletLoading } = usePrivyWallet();
  const { claimUCTAsync, isClaiming, claimResult, claimHistory } = useClaimUCT();

  const availableBalance = balance || 0;
  // Ensure whole numbers only (no fractional tokens)
  const claimAmount = Math.floor(parseFloat(amount) || 0);
  const isValidAmount = claimAmount >= 1 && claimAmount <= availableBalance && Number.isInteger(claimAmount);

  const handleClaim = async () => {
    if (!isValidAmount) return;
    
    setStep('confirming');
    try {
      await claimUCTAsync(claimAmount);
      setStep('success');
    } catch (error: any) {
      // Handle rate limiting
      if (error.message?.includes('Too many') || error.message?.includes('rate')) {
        setRateLimitMinutes(60);
        setStep('rate-limited');
      } else {
        setStep('input');
      }
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setStep('input');
      setAmount('');
    }, 300);
  };

  const setMaxAmount = () => {
    setAmount(Math.floor(availableBalance).toString());
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isLoading = balanceLoading || walletLoading;

  return (
    <Dialog open={open} onOpenChange={(v) => v ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button 
          className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white border-0"
          disabled={!isConnected}
        >
          <Coins className="w-4 h-4 mr-2" />
          Claim UCT On-Chain
        </Button>
      </DialogTrigger>
      
      <DialogContent className="bg-slate-900 border border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Claim UCT Rewards
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          </div>
        ) : !isConnected ? (
          <div className="text-center py-8 space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-yellow-400" />
            <p className="text-slate-300">
              Please connect your wallet before claiming UCT.
            </p>
          </div>
        ) : step === 'rate-limited' ? (
          <div className="text-center py-8 space-y-4">
            <div className="relative mx-auto w-16 h-16">
              <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-xl" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Please Wait</h3>
              <p className="text-sm text-slate-400 mt-1">
                You've reached the maximum claims per hour.
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Try again in about {rateLimitMinutes} minutes.
              </p>
            </div>
            <Button
              onClick={handleClose}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white"
            >
              Close
            </Button>
          </div>
        ) : step === 'input' ? (
          <div className="space-y-5">
            {/* Balance Display - Avoid "value" language */}
            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
              <p className="text-xs text-slate-400 mb-1">Earned UCT Available</p>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-cyan-400" />
                <span className="text-2xl font-bold text-white">{Math.floor(availableBalance).toLocaleString()}</span>
                <span className="text-sm text-cyan-400">UCT</span>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Amount to Claim</label>
              <div className="relative">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter whole number"
                  className="bg-slate-800/50 border-white/10 text-white pr-16"
                  min="1"
                  max={availableBalance}
                  step="1"
                />
                <button
                  onClick={setMaxAmount}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded hover:bg-purple-500/30 transition-colors"
                >
                  MAX
                </button>
              </div>
              {claimAmount > availableBalance && (
                <p className="text-xs text-red-400">Exceeds available UCT</p>
              )}
              {amount && !Number.isInteger(parseFloat(amount)) && (
                <p className="text-xs text-amber-400">Only whole numbers accepted</p>
              )}
            </div>

            {/* Wallet Info */}
            <div className="p-3 rounded-lg bg-slate-800/30 border border-white/5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Wallet</span>
                <span className="text-white font-mono">{formatAddress(walletAddress!)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Network</span>
                <span className="text-emerald-400">Base Sepolia (Testnet)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Gas</span>
                <span className="text-slate-300">Sponsored ✨</span>
              </div>
            </div>

            {/* Claim Button */}
            <Button
              onClick={handleClaim}
              disabled={!isValidAmount || isClaiming}
              className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white h-12 text-base"
            >
              {isClaiming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Claim {claimAmount > 0 ? claimAmount.toLocaleString() : ''} UCT
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            {/* Disclaimer - Avoid financial language */}
            <p className="text-xs text-slate-500 text-center">
              UCT is a utility token for UnclutterAI rewards. Tokens will be sent to your connected wallet.
            </p>
          </div>
        ) : step === 'confirming' ? (
          <div className="text-center py-8 space-y-4">
            <div className="relative mx-auto w-16 h-16">
              <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-xl animate-pulse" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Sending UCT...</h3>
              <p className="text-sm text-slate-400 mt-1">
                Transferring {claimAmount.toLocaleString()} UCT to your wallet
              </p>
            </div>
          </div>
        ) : step === 'success' && claimResult ? (
          <div className="text-center py-6 space-y-5">
            <div className="relative mx-auto w-16 h-16">
              <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-xl" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white">UCT Claimed!</h3>
              <p className="text-sm text-slate-400 mt-1">
                {claimResult.amount_claimed.toLocaleString()} UCT sent to your wallet
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/30 border border-white/5 space-y-2 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Amount</span>
                <span className="text-cyan-400 font-semibold">{claimResult.amount_claimed} UCT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Remaining</span>
                <span className="text-white">{claimResult.new_offchain_balance} UCT</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-slate-400">Tx Hash</span>
                <a 
                  href={claimResult.explorer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono text-xs"
                >
                  {formatAddress(claimResult.onchain_tx_hash)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <p className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
              ⚠️ Testnet: Mock transaction. Real on-chain transfer available when UCT contract is deployed.
            </p>

            <Button
              onClick={handleClose}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white"
            >
              Done
            </Button>
          </div>
        ) : null}

        {/* Recent Claims */}
        {step === 'input' && claimHistory && claimHistory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-slate-400 mb-2">Recent Claims</p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {claimHistory.slice(0, 3).map((claim) => (
                <div key={claim.id} className="flex justify-between items-center text-xs p-2 rounded bg-slate-800/30">
                  <span className="text-slate-300">{claim.amount} UCT</span>
                  <span className="text-slate-500">
                    {new Date(claim.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
