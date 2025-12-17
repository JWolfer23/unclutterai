import { useEffect, useState } from 'react';
import { PROMOTION_MOMENTS } from '@/lib/assistantPersonality';

interface PromotionDeclinedProps {
  onComplete: () => void;
}

export function PromotionDeclined({ onComplete }: PromotionDeclinedProps) {
  const [showPrimary, setShowPrimary] = useState(false);
  const [showSecondary, setShowSecondary] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowPrimary(true), 300);
    const timer2 = setTimeout(() => setShowSecondary(true), 1000);
    const timer3 = setTimeout(() => onComplete(), 2500);

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
      <div className="max-w-md text-center space-y-3">
        <p 
          className={`text-2xl font-light text-white/90 transition-opacity duration-700 ${
            showPrimary ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {PROMOTION_MOMENTS.declined.primary}
        </p>
        
        <p 
          className={`text-base text-white/50 transition-opacity duration-700 ${
            showSecondary ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {PROMOTION_MOMENTS.declined.secondary}
        </p>
      </div>
    </div>
  );
}
