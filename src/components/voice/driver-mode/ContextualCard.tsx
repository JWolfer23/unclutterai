import React, { useEffect, useState } from 'react';
import type { ContextCard as ContextCardType } from '@/hooks/useDriverMode';

interface ContextualCardProps {
  card: ContextCardType | null;
  onDismiss: () => void;
}

export const ContextualCard: React.FC<ContextualCardProps> = ({ card, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (card) {
      setIsVisible(true);
      
      // Auto-dismiss after 5 seconds for informational cards
      if (card.urgency === 'informational') {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onDismiss, 300);
        }, 5000);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [card, onDismiss]);

  if (!card) return null;

  return (
    <div 
      className={`
        max-w-sm mx-auto px-6 py-5 
        bg-black/60 backdrop-blur-xl 
        border border-cyan-500/20 rounded-2xl
        shadow-[0_0_30px_rgba(6,182,212,0.15)]
        transition-all duration-300
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
      `}
      onClick={onDismiss}
    >
      {/* Main text - one sentence only */}
      <p className="text-lg text-white/90 font-medium text-center">
        {card.text}
      </p>
      
      {/* Subtext - optional context */}
      {card.subtext && (
        <p className="text-sm text-cyan-400/70 text-center mt-2">
          {card.subtext}
        </p>
      )}
      
      {/* Urgency indicator */}
      {card.urgency === 'critical' && (
        <div className="mt-3 flex justify-center">
          <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
};
