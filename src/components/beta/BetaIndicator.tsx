import React from 'react';
import { Sparkles } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BETA_UI, BETA_PHRASES } from '@/lib/betaMessaging';

interface BetaIndicatorProps {
  variant?: 'badge' | 'inline' | 'footer';
  className?: string;
}

/**
 * Subtle beta indicator component
 * 
 * "This assistant is in training. Your behavior teaches it."
 */
export const BetaIndicator: React.FC<BetaIndicatorProps> = ({ 
  variant = 'badge',
  className = '',
}) => {
  if (variant === 'footer') {
    return (
      <div className={`flex items-center gap-1.5 text-xs text-muted-foreground/50 ${className}`}>
        <Sparkles className="h-3 w-3" />
        <span>{BETA_UI.footer}</span>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center gap-1 text-xs text-muted-foreground/60 cursor-default ${className}`}>
              <Sparkles className="h-3 w-3" />
              <span>{BETA_PHRASES.training.primary}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="text-sm">{BETA_PHRASES.training.secondary}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Default: badge variant
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10 cursor-default ${className}`}>
            <Sparkles className="h-3 w-3 text-primary/50" />
            <span className="text-xs text-primary/60 font-medium">{BETA_UI.badge}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-sm font-medium">{BETA_PHRASES.training.primary}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{BETA_PHRASES.training.secondary}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default BetaIndicator;
