import { useState, useEffect } from 'react';
import { Flame, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUCTBurn } from '@/hooks/useUCTBurn';
import { useUCTBalance } from '@/hooks/useUCTBalance';
import { BURN_RATES, type BurnRateId } from '@/lib/uctTokenomics';

interface UCTBurnConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  burnType: BurnRateId;
  context?: { itemCount?: number; hours?: number; description?: string };
  onConfirm: () => void;
}

export const UCTBurnConfirmation = ({
  isOpen,
  onClose,
  burnType,
  context,
  onConfirm,
}: UCTBurnConfirmationProps) => {
  const { estimate, burn, isBurning, getLocalEstimate } = useUCTBurn();
  const { availableBalance } = useUCTBalance();
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [isEstimating, setIsEstimating] = useState(false);

  const burnRate = BURN_RATES[burnType];

  useEffect(() => {
    if (isOpen && burnType) {
      // Quick local estimate first
      setEstimatedCost(getLocalEstimate(burnType, context));
      
      // Then get server estimate for accuracy
      setIsEstimating(true);
      estimate({ burnType, context })
        .then((result) => {
          setEstimatedCost(result.estimated_cost);
        })
        .finally(() => {
          setIsEstimating(false);
        });
    }
  }, [isOpen, burnType, context]);

  const canAfford = availableBalance >= estimatedCost;

  const handleBurn = async () => {
    try {
      await burn({ burnType, context });
      onConfirm();
      onClose();
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-white/10 max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            Accelerate Action
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Burn UCT to execute faster
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Action description */}
          <div className="p-3 rounded-xl bg-slate-800/50 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-white">
                {context?.description || burnRate.description}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Speed boost: <span className="text-amber-400">{burnRate.speedBoost}</span>
            </p>
            {context?.itemCount && (
              <p className="text-xs text-slate-400 mt-1">
                Processing {context.itemCount} items
              </p>
            )}
            {context?.hours && (
              <p className="text-xs text-slate-400 mt-1">
                Duration: {context.hours} hour{context.hours > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Cost display */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">UCT to burn</span>
              <div className="text-right">
                {isEstimating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : (
                  <span className="text-2xl font-bold text-orange-400">
                    {estimatedCost.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <span className="text-xs text-slate-400">Your balance</span>
              <span className={`text-xs font-medium ${canAfford ? 'text-emerald-400' : 'text-red-400'}`}>
                {availableBalance.toFixed(2)} UCT
              </span>
            </div>
          </div>

          {/* Insufficient balance warning */}
          {!canAfford && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300">
                You need {(estimatedCost - availableBalance).toFixed(2)} more UCT
              </p>
            </div>
          )}

          {/* Info */}
          <p className="text-xs text-slate-500 text-center">
            Burned UCT is consumed for acceleration, not destroyed from supply.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-white/10 hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            onClick={handleBurn}
            disabled={!canAfford || isBurning}
            className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500"
          >
            {isBurning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Burning...
              </>
            ) : (
              <>
                <Flame className="w-4 h-4 mr-2" />
                Burn & Accelerate
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
