import { useEffect, useState } from 'react';
import { PROMOTION_MOMENTS } from '@/lib/assistantPersonality';

interface PromotionAcceptedProps {
  onComplete: () => void;
}

export function PromotionAccepted({ onComplete }: PromotionAcceptedProps) {
  const [showPrimary, setShowPrimary] = useState(false);
  const [showSecondary, setShowSecondary] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowPrimary(true), 400);
    const timer2 = setTimeout(() => setShowSecondary(true), 1200);
    const timer3 = setTimeout(() => onComplete(), 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen bg-black px-8 cursor-pointer"
      onClick={onComplete}
    >
      <div className="max-w-md text-center space-y-4">
        <p 
          className={`text-2xl font-light text-white/90 transition-opacity duration-700 ${
            showPrimary ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {PROMOTION_MOMENTS.accepted.primary}
        </p>
        
        <p 
          className={`text-lg text-white/60 transition-opacity duration-700 ${
            showSecondary ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {PROMOTION_MOMENTS.accepted.secondary}
        </p>
      </div>
    </div>
  );
}
