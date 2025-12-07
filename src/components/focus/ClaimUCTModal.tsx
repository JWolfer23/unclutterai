import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useClaimUCT } from "@/hooks/useClaimUCT";
import { Coins, ExternalLink, Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const ClaimUCTModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const {
    balance,
    tokensPending,
    tokensClaimed,
    balancesLoading,
    claimUCT,
    isClaiming,
    claimResult,
    canClaim,
    claimHistory
  } = useClaimUCT();

  const handleClaim = () => {
    claimUCT();
  };

  const handleClose = () => {
    setOpen(false);
  };

  const hasNothingToClaim = balance === 0 && tokensPending === 0;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 10)}...${address.slice(-6)}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white border-0 gap-2"
                disabled={balancesLoading}
              >
                <Coins className="w-4 h-4" />
                Claim UCT On-Chain
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          {hasNothingToClaim && (
            <TooltipContent>
              <p>No earned UCT available.</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-50">
            <Coins className="w-5 h-5 text-amber-400" />
            Claim UCT Rewards
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Transfer your earned UCT to your connected wallet on Base Sepolia.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Balance Display */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Available</p>
              <p className="text-xl font-bold text-emerald-400">
                {balancesLoading ? '...' : balance}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Pending</p>
              <p className="text-xl font-bold text-amber-400">
                {balancesLoading ? '...' : tokensPending}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Claimed</p>
              <p className="text-xl font-bold text-purple-400">
                {balancesLoading ? '...' : tokensClaimed}
              </p>
            </div>
          </div>

          {/* Status Messages */}
          {tokensPending > 0 && !claimResult && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <Clock className="w-4 h-4 text-amber-400" />
              <p className="text-sm text-amber-200">
                A claim is in progress. Please wait for it to complete.
              </p>
            </div>
          )}

          {hasNothingToClaim && !claimResult && (
            <div className="flex items-center gap-2 p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-slate-400" />
              <p className="text-sm text-slate-300">
                Complete focus sessions to earn UCT rewards.
              </p>
            </div>
          )}

          {/* Success State */}
          {claimResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-emerald-200">Transaction Sent!</p>
                  <p className="text-xs text-emerald-300/70">
                    {claimResult.amount_claimed} UCT transferred to your wallet
                  </p>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1">Transaction Hash</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-slate-300 break-all">
                    {formatAddress(claimResult.tx_hash)}
                  </code>
                  <a
                    href={claimResult.explorer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="text-xs text-slate-500 text-center">
                Network: {claimResult.network}
              </div>

              <p className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-center">
                ⚠️ Testnet: Mock transaction. Real on-chain transfer available when UCT contract is deployed.
              </p>
            </div>
          )}

          {/* Claim Button */}
          {!claimResult && (
            <Button
              onClick={handleClaim}
              disabled={!canClaim || isClaiming}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isClaiming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4 mr-2" />
                  Claim {balance} UCT
                </>
              )}
            </Button>
          )}

          {/* Close button after success */}
          {claimResult && (
            <Button
              onClick={handleClose}
              variant="outline"
              className="w-full border-slate-600 text-slate-300"
            >
              Done
            </Button>
          )}

          {/* Recent Claims */}
          {!claimResult && claimHistory && claimHistory.length > 0 && (
            <div className="pt-3 border-t border-slate-700/50">
              <p className="text-xs text-slate-400 mb-2">Recent Claims</p>
              <div className="space-y-2 max-h-24 overflow-y-auto">
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

          {/* Disclaimer */}
          <p className="text-xs text-slate-500 text-center">
            UCT are utility rewards for app engagement. Rate limited to 3 claims per hour.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
