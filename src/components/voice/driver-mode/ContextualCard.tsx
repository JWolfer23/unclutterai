import React, { useEffect, useState } from 'react';
import type { ContextCard as ContextCardType } from '@/hooks/useDriverMode';
import { CLASSIFICATION_LABELS, CLASSIFICATION_COLORS } from '@/lib/aiDecisionHeuristics';
import { TRUST_MOMENTS } from '@/lib/assistantPersonality';

interface ContextualCardProps {
  card: ContextCardType | null;
  onDismiss: () => void;
}

// Trust Moment #2: First Interruption
// Explain WHY we're interrupting - builds trust through transparency
const getInterruptionReason = (card: ContextCardType): string | null => {
  if (card.urgency !== 'critical' && !card.breaksSomething) return null;
  
  const prefix = TRUST_MOMENTS.interruption.prefix;
  
  if (card.breaksSomething) {
    return `${prefix} ${TRUST_MOMENTS.interruption.breaks}`;
  }
  if (card.text.toLowerCase().includes('deadline') || card.text.toLowerCase().includes('due')) {
    return `${prefix} ${TRUST_MOMENTS.interruption.deadline}`;
  }
  if (card.text.toLowerCase().includes('money') || card.text.toLowerCase().includes('payment')) {
    return `${prefix} ${TRUST_MOMENTS.interruption.money}`;
  }
  if (card.text.toLowerCase().includes('waiting') || card.text.toLowerCase().includes('reply')) {
    return `${prefix} ${TRUST_MOMENTS.interruption.people}`;
  }
  return `${prefix} ${TRUST_MOMENTS.interruption.tomorrow}`;
};

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

  const classificationLabel = card.classification 
    ? CLASSIFICATION_LABELS[card.classification] 
    : null;
  const classificationColor = card.classification 
    ? CLASSIFICATION_COLORS[card.classification] 
    : 'text-white/60';

  // Trust Moment #2: Get interruption reason for critical items
  const interruptionReason = getInterruptionReason(card);

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
      {/* Trust Moment #2: Interruption reason - explains WHY */}
      {interruptionReason && (
        <p className="text-xs text-white/50 text-center mb-3 font-light">
          {interruptionReason}
        </p>
      )}

      {/* Classification badge */}
      {classificationLabel && !interruptionReason && (
        <div className="flex justify-center mb-3">
          <span className={`text-xs font-medium uppercase tracking-wider ${classificationColor}`}>
            {classificationLabel}
          </span>
        </div>
      )}

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
      {(card.urgency === 'critical' || card.breaksSomething) && (
        <div className="mt-3 flex justify-center">
          <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
};
