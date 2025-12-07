import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClaimUCT } from "@/hooks/useClaimUCT";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import { Coins, ExternalLink, Loader2, CheckCircle2, XCircle, Wallet, AlertTriangle } from "lucide-react";

type ModalState = 'input' | 'loading' | 'success' | 'error';

export const ClaimUCTModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [modalState, setModalState] = useState<ModalState>('input');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    balance,
    totalClaimed,
    hasPendingClaim,
    balancesLoading,
    claimUCTAsync,
    isClaiming,
    claimResult,
  } = useClaimUCT();

  const { walletAddress, isConnected } = usePrivyWallet();

  // Parse amount safely
  const parsedAmount = parseInt(amount, 10) || 0;

  // Validation
  const isAmountValid = parsedAmount > 0 && parsedAmount <= balance;
  const canSubmit = isAmountValid && isConnected && !isClaiming && !hasPendingClaim;

  // Validation messages
  const getValidationMessage = () => {
    if (!isConnected) return 'Connect a wallet to claim UCT';
    if (hasPendingClaim) return 'A claim is already in progress';
    if (balance === 0) return 'No UCT available to claim';
    if (parsedAmount <= 0 && amount !== '') return 'Enter a valid amount';
    if (parsedAmount > balance) return 'Amount exceeds available balance';
    return null;
  };

  const validationMessage = getValidationMessage();

  // Format wallet address
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Handle claim max
  const handleClaimMax = () => {
    setAmount(balance.toString());
  };

  // Handle claim
  const handleClaim = async () => {
    if (!canSubmit) return;

    setModalState('loading');
    setErrorMessage('');

    try {
      await claimUCTAsync();
      setModalState('success');
    } catch (error) {
      setModalState('error');
      setErrorMessage((error as Error).message || 'An unexpected error occurred');
    }
  };

  // Handle close
  const handleClose = () => {
    setOpen(false);
    // Reset state after animation
    setTimeout(() => {
      setModalState('input');
      setAmount('');
      setErrorMessage('');
    }, 300);
  };

  // Reset modal state when opening
  useEffect(() => {
    if (open) {
      setModalState('input');
      setAmount('');
      setErrorMessage('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => isOpen ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button
          className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white border-0 gap-2"
          disabled={balancesLoading}
        >
          <Coins className="w-4 h-4" />
          Claim UCT On-Chain
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        {/* Input State */}
        {modalState === 'input' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl text-slate-50">
                <Coins className="w-6 h-6 text-amber-400" />
                Claim Your UCT Tokens
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Balance & Wallet Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">Claimable Balance</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-emerald-400">
                      {balancesLoading ? '...' : balance}
                    </span>
                    <span className="text-sm text-slate-400">UCT</span>
                  </div>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">Your Wallet</p>
                  {isConnected && walletAddress ? (
                    <div className="flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-mono text-slate-200">
                        {formatAddress(walletAddress)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-red-400">Not connected</span>
                  )}
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Amount to Claim</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      min={1}
                      max={balance}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 pr-12"
                      disabled={!isConnected || balance === 0}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      UCT
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClaimMax}
                    disabled={!isConnected || balance === 0}
                    className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200"
                  >
                    Claim Max
                  </Button>
                </div>

                {/* Validation Message */}
                {validationMessage && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {validationMessage}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/30">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Claiming UCT moves tokens from your UnclutterAI balance onto Base Sepolia. 
                  This action cannot be undone. Rate limited to 3 claims per hour.
                </p>
              </div>

              {/* Token Stats Row */}
              <div className="flex justify-between text-xs text-slate-500 px-1">
                <span>Status: <span className={hasPendingClaim ? "text-amber-400" : "text-emerald-400"}>
                  {hasPendingClaim ? 'Pending claim...' : 'Ready'}
                </span></span>
                <span>Total Claimed: <span className="text-purple-400">{totalClaimed}</span></span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleClaim}
                  disabled={!canSubmit}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white"
                >
                  <Coins className="w-4 h-4 mr-2" />
                  Claim UCT
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Loading State */}
        {modalState === 'loading' && (
          <div className="py-12 text-center space-y-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Processing Claim...</h3>
              <p className="text-sm text-slate-400 mt-2">
                Sending {parsedAmount || balance} UCT to your wallet
              </p>
              <p className="text-xs text-slate-500 mt-1">
                This may take a few moments
              </p>
            </div>
          </div>
        )}

        {/* Success State */}
        {modalState === 'success' && claimResult && (
          <div className="py-8 text-center space-y-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-xl" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white">🎉 Success!</h3>
              <p className="text-slate-300 mt-2">
                Your UCT tokens are now in your wallet.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-left space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Amount</span>
                <span className="text-sm font-medium text-emerald-400">
                  {claimResult.amount_claimed} UCT
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Wallet</span>
                <span className="text-sm font-mono text-slate-300">
                  {formatAddress(claimResult.wallet_address)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Transaction</span>
                <a
                  href={claimResult.explorer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
                >
                  View on Explorer
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <p className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
              ⚠️ Testnet: Mock transaction. Real minting available when UCT contract is deployed.
            </p>

            <Button
              onClick={handleClose}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white"
            >
              Done
            </Button>
          </div>
        )}

        {/* Error State */}
        {modalState === 'error' && (
          <div className="py-8 text-center space-y-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white">❌ Claim Failed</h3>
              <p className="text-slate-400 mt-2">
                {errorMessage || 'Please try again.'}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setModalState('input')}
                className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
