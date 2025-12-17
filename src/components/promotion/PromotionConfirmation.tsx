import { useEffect, useState } from 'react';
import { PROMOTION_MOMENTS } from '@/lib/assistantPersonality';

interface PromotionConfirmationProps {
  onComplete: () => void;
}

export function PromotionConfirmation({ onComplete }: PromotionConfirmationProps) {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowText(true), 300);
    const timer2 = setTimeout(() => onComplete(), 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen bg-black px-8 cursor-pointer"
      onClick={onComplete}
    >
      <p 
        className={`text-2xl font-light text-white/90 transition-opacity duration-700 ${
          showText ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {PROMOTION_MOMENTS.confirmation.primary}
      </p>
    </div>
  );
}
